# Connecting Components

Hypertill DB `0.0.1` ships three React helpers that matter for day-to-day app work:

- `DatabaseProvider`
- `useDatabase`
- `withObservables`

The current recommended split is simple:

- use `DatabaseProvider` once at the app root
- use `withObservables` for reactive records, relations, lists, and counts
- use `useDatabase` for writes, screen actions, and imperative work

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

## Reactive reads with `withObservables`

The package does not yet ship first-party query hooks in `0.0.1`. The supported reactive read path today is `withObservables`.

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

## Current note on hooks

If you are expecting a package-level `useBooks()` or `useQuery()` API, that is not part of `0.0.1`. The current production-safe guidance is:

- `withObservables` for live reads
- `useDatabase` for writes and imperative logic
- app-local abstractions on top if your project wants cleaner domain hooks

The shipped Expo demo follows that same reality, and it is the best reference for how the package behaves right now.

## Next steps

- [Expo Book Demo](./ExpoDemo)
- [Query](./Query)
- [Relation](./Relation)
- [CRUD](./CRUD)
