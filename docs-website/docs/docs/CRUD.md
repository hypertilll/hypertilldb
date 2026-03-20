# Create, Read, Update, Delete

Once your [Schema](./Schema.md) and [Model](./Model.md) classes are in place, the next step is working with records.

The examples below keep using the same `Book` and `Chapter` library app.

## Reading

### Reactive reads with hooks (recommended)

```tsx
import { hooks } from '@hypertill/db/react'

const { data: books, loading } = hooks.useBooks({
  search: 'deep',
  sort: 'updated_desc',
})

const { data: book } = hooks.useBook(bookId)

const { data: chapters } = hooks.useChaptersAdvanced({
  inputs: [bookId],
  q: (Q) => [Q.where('book_id', bookId), Q.sortBy('position', Q.asc)],
})
```

Use `inputs` whenever the advanced query is built inline. That keeps the hook reactive without forcing every caller to wrap `q` in `useMemo()` or `useCallback()`.

### Get a collection

The `Collection` object is how you query, find, and create records of one model type.

```ts
const booksCollection = database.get('books')
```

`database.get(tableName)` is shorthand for `database.collections.get(tableName)`.

### Find a record by id

```ts
const book = await database.get('books').find(bookId)
```

`find()` rejects if the record does not exist.

### Query records imperatively

```ts
import { Q } from '@hypertill/db'

const readingBooks = await database.get('books').query(
  Q.where('status', 'reading'),
  Q.sortBy('updated_at', Q.desc),
).fetch()

const chapterCount = await database.get('chapters').query(
  Q.where('book_id', bookId),
).fetchCount()
```

See [Query](./Query) for the full query API.

## Modifying the database

All creates, updates, and deletes must run inside a writer.

The two normal choices are:

- wrap work in `database.write(...)`
- define `@writer` methods on models

### Inline writer

```ts
await database.write(async () => {
  const chapter = await database.get('chapters').find(chapterId)

  await chapter.update((record) => {
    record.title = 'New chapter title'
  })
})
```

### Model writer

```ts
import { writer } from '@hypertill/db/decorators'

class Book extends Model {
  @writer async rename(title: string) {
    await this.update((book) => {
      book.title = title
    })
  }
}
```

See [Writers](./Writers) for batching and reader/writer details.

## Create

```ts
const newBook = await database.write(async () => {
  return database.get('books').create((book) => {
    book.title = 'Deep Work'
    book.author = 'Cal Newport'
    book.status = 'reading'
  })
})
```

Only set model fields inside the `create()` builder.

## Update

```ts
await database.write(async () => {
  const book = await database.get('books').find(bookId)

  await book.update((record) => {
    record.status = 'finished'
  })
})
```

## Delete

If you use sync, prefer soft deletes:

```ts
await database.write(async () => {
  const book = await database.get('books').find(bookId)
  await book.markAsDeleted()
})
```

If the record should be removed immediately and permanently:

```ts
await database.write(async () => {
  const book = await database.get('books').find(bookId)
  await book.destroyPermanently()
})
```

Do not keep using a record after it has been deleted.

## Counts and observation

When you need a live count, use `Query.observeCount()` instead of loading a whole list only to count it in memory:

```ts
const chapterCount$ = database.get('chapters').query(
  Q.where('book_id', bookId),
).observeCount()
```

For React-specific count patterns, [Components](./Components) shows the `withObservables` version.

## Advanced

- `Model.observe()` observes one record
- `Query.observe()` observes a list
- `Query.observeWithColumns()` keeps sorted lists reactive when sort columns change
- `Collection.findAndObserve(id)` is a convenient single-record observable
- `Collection.prepareCreate()`, `Model.prepareUpdate()`, and `Database.batch()` are the building blocks for batched writes
- `Database.unsafeResetDatabase()` clears the whole database and should be treated as an escape hatch

If you need to set a server-provided id during creation, use `_raw.id` inside the create builder:

```ts
await database.write(async () => {
  await database.get('books').create((book) => {
    book._raw.id = serverId
    book.title = 'Imported title'
    book.author = 'Server author'
    book.status = 'reading'
  })
})
```

## Unsafe raw execute

There is also an escape hatch to drop down to the underlying adapter:

```ts
await database.write(async () => {
  await database.adapter.unsafeExecute({
    sqls: [
      ['create table temporary_test (id, foo, bar)', []],
      ['insert into temporary_test (id, foo, bar) values (?, ?, ?)', ['t1', true, 3.14]],
    ],
  })
})
```

Use this only when the standard model and query APIs genuinely cannot express what you need.

## Next steps

Once you can create and update records, connect them to React in [Components](./Components).
