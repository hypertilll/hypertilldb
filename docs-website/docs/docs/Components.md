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
- use `withObservables` when you need custom reactive composition

## Start with the provider

Wrap your app once:

```tsx
import { DatabaseProvider } from '@hypertill/db/react'
import { database } from './db/database'
import { LibraryScreen } from './LibraryScreen'

export default function App() {
  return (
    <DatabaseProvider database={database}>
      <LibraryScreen />
    </DatabaseProvider>
  )
}
```

Every reactive component or screen action then works off the same database instance.

## Reactive reads with `hooks`

Auto-generated hooks are now available in `0.0.3`. For each model, you get:

- `hooks.use<Model>(id)` for a single record
- `hooks.use<Models>(filters?)` for lists
- `hooks.use<Models>Advanced({ q })` for direct `Q` clauses

Example usage:

```tsx
import { hooks } from '@hypertill/db/react'

const { data: books, loading } = hooks.useBooks({
  search: 'deep',
  timeframe: '30d',
  sort: 'updated_desc',
})

const { data: book } = hooks.useBook(bookId)

const { data: advanced } = hooks.useBooksAdvanced({
  q: (Q) => [Q.where('status', Q.eq('reading'))],
})
```

Generic variants are also available:

```tsx
import { hooks } from '@hypertill/db/react'

const { data: notes } = hooks.useModels(Note, { search: 'hello' })
const { data: note } = hooks.useModel(Note, noteId)
```

### How filters work

- `search` automatically scans all string columns (or `searchIn` if provided)
- `timeframe` uses `updated_at` when available, otherwise `created_at`
- `sort` picks the relevant timestamp column and order

## Advanced reactive reads with `withObservables`

Use `withObservables` when you need custom reactive composition, counts, or nested queries that exceed the hook defaults.

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
    const books = database.collections.get<Book>('books')
    const chapters = database.collections.get<Chapter>('chapters').query(
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

- `findAndObserve()` is the cleanest way to keep a single record live
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
      await database.collections.get<Book>('books').create((record) => {
        record.title = 'Deep Work'
        record.author = 'Cal Newport'
        record.status = 'reading'
        record.updatedAt = Date.now()
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

That way the UI updates when the sort order changes, not just when rows are inserted or deleted.

## When to use which

- `hooks` for the default live read path
- `withObservables` for complex composition or custom reactive graphs
- `useDatabase` for writes and imperative logic

## Next steps

- [Expo Book Demo](./ExpoDemo)
- [Query](./Query)
- [Relation](./Relation)
- [CRUD](./CRUD)
