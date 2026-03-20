# Connecting Components

Hypertill DB `0.0.3` ships the React helpers you need for day-to-day app work:

- `DatabaseProvider`
- `useDatabase`
- `hooks` (auto-generated query hooks)
- `withObservables`

The current recommended split is simple:

- use `DatabaseProvider` once at the app root
- use `hooks` for reactive reads
- use `useDatabase` for writes, screen actions, and imperative work
- use `withObservables` when you need custom reactive composition or live counts

## Start with the provider

Wrap your app once:

```tsx
import { DatabaseProvider } from '@hypertill/db/react'
import { database } from './db'
import { LibraryScreen } from './LibraryScreen'

export default function App() {
  return (
    <DatabaseProvider database={database}>
      <LibraryScreen />
    </DatabaseProvider>
  )
}
```

Every reactive component and screen action then works off the same database instance.

## Reactive reads with `hooks`

For each model, you get:

- `hooks.use<Model>(id)` for a single record
- `hooks.use<Models>(filters?)` for lists
- `hooks.use<Models>Advanced({ q, clauses, inputs, observeWithColumns })` for direct `Q` clauses and advanced observation control

Hook names come from your model class names, so `Book` becomes `hooks.useBook()` and `hooks.useBooks()`.

Example usage:

```tsx
import { hooks } from '@hypertill/db/react'

const { data: books, loading } = hooks.useBooks({
  search: 'deep',
  timeframe: '30d',
  sort: 'updated_desc',
})

const { data: book } = hooks.useBook(bookId)

const { data: readingBooks } = hooks.useBooksAdvanced({
  inputs: ['reading'],
  q: (Q) => [Q.where('status', 'reading')],
})

const { data: orderedChapters } = hooks.useChaptersAdvanced({
  inputs: [bookId],
  q: (Q) => [Q.where('book_id', bookId), Q.sortBy('position', Q.asc)],
  observeWithColumns: ['position'],
})
```

When you build advanced queries inline, pass `inputs` to describe the values that should trigger a resubscribe. This avoids tying updates to function identity and removes the need to wrap every advanced query in `useMemo()` or `useCallback()`.

### How list filters work

- `search` scans all string columns by default
- `searchIn` limits search to specific string columns
- `timeframe` uses `updated_at` when available, otherwise `created_at`
- `sort` prefers `updated_at`, then falls back to `created_at`

### Generic variants

Generic variants are also available:

```tsx
import { hooks } from '@hypertill/db/react'

const { data: notes } = hooks.useModels(Note, { search: 'hello' })
const { data: note } = hooks.useModel(Note, noteId)
```

## Advanced reactive reads with `withObservables`

Use `withObservables` when you need custom reactive composition, counts, nested queries, or a graph of observables that goes beyond the default hooks.

Here is a practical TypeScript example that loads one book, its chapters, and a live count:

```tsx
import { Q } from '@hypertill/db'
import { compose, withDatabase, withObservables } from '@hypertill/db/react'

type OuterProps = {
  bookId: string
}

type InjectedProps = {
  book: Book
  chapters: Chapter[]
  chapterCount: number
}

function BookDetail({ book, chapters, chapterCount }: InjectedProps) {
  return (
    <>
      <h1>{book.title}</h1>
      <p>{book.author}</p>
      <p>{chapterCount} chapters</p>
      <ul>
        {chapters.map((chapter) => (
          <li key={chapter.id}>{chapter.title}</li>
        ))}
      </ul>
    </>
  )
}

export default compose(
  withDatabase,
  withObservables(['bookId'], ({ database, bookId }) => {
    const books = database.get<Book>('books')
    const chapters = database.get<Chapter>('chapters').query(
      Q.where('book_id', bookId),
      Q.sortBy('position', Q.asc),
    )

    return {
      book: books.findAndObserve(bookId),
      chapters,
      chapterCount: chapters.observeCount(),
    }
  }),
)(BookDetail)
```

### Why this split works

- `findAndObserve()` is the cleanest way to keep one record live
- passing the `chapters` query directly is enough because `withObservables` will observe it
- `observeCount()` gives you a cheap reactive count without loading another list into memory

## Relations stay reactive too

If a model has a relation, you can observe it the same way:

```tsx
const enhance = withObservables(['chapter'], ({ chapter }) => ({
  chapter,
  book: chapter.book,
}))
```

That keeps the component updated if the related record changes.

## Use `useDatabase` for writes

`useDatabase` is the right tool for buttons, forms, screen actions, and command-style mutations:

```tsx
import { useDatabase } from '@hypertill/db/react'

export function AddBookButton() {
  const database = useDatabase()

  const onPress = async () => {
    await database.write(async () => {
      await database.get<Book>('books').create((record) => {
        record.title = 'Deep Work'
        record.author = 'Cal Newport'
        record.status = 'reading'
      })
    })
  }

  return <button onClick={() => void onPress()}>Add book</button>
}
```

This keeps writes explicit and easy to test.

## Sorted lists and derived list updates

If your list ordering depends on mutable columns, use `observeWithColumns()` instead of plain `observe()`:

```tsx
const enhance = withObservables(['book'], ({ book }) => ({
  chapters: book.chapters.observeWithColumns(['position']),
}))
```

You can also do this through advanced hooks:

```tsx
const { data: chapters } = hooks.useChaptersAdvanced({
  inputs: [bookId],
  q: (Q) => [Q.where('book_id', bookId), Q.sortBy('position', Q.asc)],
  observeWithColumns: ['position'],
})
```

That way the UI updates when the sort order changes, not just when rows are inserted or deleted.

## When to use which

- `hooks` for the default live read path
- `withObservables` for complex composition, counts, or custom reactive graphs
- `useDatabase` for writes and imperative logic

## Next steps

- [Expo Book Demo](./ExpoDemo)
- [Query](./Query)
- [Relation](./Relation)
- [CRUD](./CRUD)
