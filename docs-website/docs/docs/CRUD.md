# Create, Read, Update, Delete

When you have your [Schema](./Schema.md) and [Models](./Model.md) defined, learn how to manipulate them!

## Reading

#### Reactive reads with hooks (recommended)

```js
import { hooks } from '@hypertill/db/react'

const { data: books, loading } = hooks.useBooks({
  search: 'deep',
  sort: 'updated_desc',
})

const { data: book } = hooks.useBook(bookId)

const { data: chapters } = hooks.useChaptersAdvanced({
  q: (Q) => [Q.where('book_id', bookId), Q.sortBy('position', Q.asc)],
})
```

#### Get a collection

The `Collection` object is how you find, query, and create new records of a given type.

```js
const booksCollection = database.get('books')
```

Pass the [table name](./Schema.md) as the argument.

#### Find a record (by ID)

```js
const bookId = 'abcdefgh'
const book = await database.get('books').find(bookId)
```

`find()` returns a Promise. If the record cannot be found, the Promise will be rejected.

#### Query records

Find a list of records matching given conditions by making a Query and then fetching it:

```js
const allBooks = await database.get('books').query().fetch()
const numberOfFavoriteBooks = await database.get('books').query(
  Q.where('is_favorite', true)
).fetchCount()
```

**➡️ Learn more:** [Queries](./Query.md)

## Modifying the database

All modifications to the database (like creating, updating, deleting records) must be done **in a Writer**, either by wrapping your work in `database.write()`:

```js
await database.write(async () => {
  const someChapter = await database.get('chapters').find(chapterId)
  await someChapter.update((chapter) => {
    chapter.isSpam = true
  })
})
```

Or by defining a `@writer` method on a Model:

```js
import { writer } from '@hypertill/db/decorators'

class Chapter extends Model {
  // (...)
  @writer async markAsSpam() {
    await this.update(chapter => {
      chapter.isSpam = true
    })
  }
}
```

**➡️ Learn more:** [Writers](./Writers.md)

### Create a new record

```js
const newBook = await database.get('books').create(book => {
  book.title = 'New book'
  book.author = 'Unknown'
})
```

`.create()` takes a "builder function". In the example above, the builder will get a `Book` object as an argument. Use this object to set values for [fields you defined](./Model.md).

**Note:** Always `await` the Promise returned by `create` before you access the created record.

**Note:** You can only set fields inside `create()` or `update()` builder functions.

### Update a record

```js
await someBook.update(book => {
  book.title = 'Updated title'
})
```

Like creating, updating takes a builder function, where you can use field setters.

**Note:** Always `await` the Promise returned by `update` before you access the modified record.

### Delete a record

There are two ways of deleting records: syncable (mark as deleted), and permanent.

If you only use Hypertill as a local database, destroy records permanently, if you [synchronize](./Sync/Intro.md), mark as deleted instead.

```js
await someBook.markAsDeleted() // syncable
await someBook.destroyPermanently() // permanent
```

**Note:** Do not access, update, or observe records after they're deleted.

## Advanced

- `Model.observe()` - usually you only use this [when connecting records to components](./Components.md), but you can manually observe a record outside of React components. The returned [RxJS](https://github.com/reactivex/rxjs) `Observable` will emit the record immediately upon subscription, and then every time the record is updated. If the record is deleted, the Observable will complete.
- `Query.observe()`, `Relation.observe()` — analagous to the above, but for [Queries](./Query.md) and [Relations](./Relation.md)
- `Query.observeWithColumns()` - used for [sorted lists](./Components.md)
- `Collection.findAndObserve(id)` — same as using `.find(id)` and then calling `record.observe()`
- `Model.prepareUpdate()`, `Collection.prepareCreate`, `Database.batch` — used for [batch updates](./Writers.md)
- `Database.unsafeResetDatabase()` destroys the whole database - [be sure to see this comment before using it](https://github.com/helapoint/hypertill-db/blob/22188ee5b6e3af08e48e8af52d14e0d90db72925/src/Database/index.js#L131)
- To override the `record.id` during the creation, e.g. to sync with a remote database, you can do it by `record._raw` property. Be aware that the `id` must be of type `string`.
    ```js
    await database.get('books').create(book => {
      book._raw.id = serverId
    })
    ```

### Advanced: Unsafe raw execute

⚠️ Do not use this if you don't know what you're doing...

There is an escape hatch to drop down from Hypertill DB to underlying database level to execute arbitrary commands. Use as a last resort tool:

```js
await database.write(() => {
  // sqlite:
  await database.adapter.unsafeExecute({
    sqls: [
      // [sql_query, [placeholder arguments, ...]]
      ['create table temporary_test (id, foo, bar)', []],
      ['insert into temporary_test (id, foo, bar) values (?, ?, ?)', ['t1', true, 3.14]],
    ]
  })

  // lokijs:
  await database.adapter.unsafeExecute({
    loki: loki => {
      loki.addCollection('temporary_test', { unique: ['id'], indices: [], disableMeta: true })
      loki.getCollection('temporary_test').insert({ id: 't1', foo: true, bar: 3.14 })
    }
  })
})
```

* * *

## Next steps

➡️ Now that you can create and update records, [**connect them to React components**](./Components.md)
