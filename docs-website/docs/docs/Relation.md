# Relations

A `Relation` object represents one record pointing to another — such as the `Book` a `Chapter` belongs to.

### Defining Relations

There's two steps to defining a relation:

1. A [**table column**](./Schema.md) for the related record's ID

   ```js
   tableSchema({
     name: 'chapters',
     columns: [
       // ...
       { name: 'book_id', type: 'string' },
     ]
   }),
   ```
2. A `@relation` field [defined on a `Model`](./Model.md) class:

   ```js
   import { relation } from '@hypertill/db/decorators'

   class Chapter extends Model {
     // ...
     @relation('books', 'book_id') book
   }
   ```

   The first argument is the _table name_ of the related record, and the second is the _column name_ with an ID for the related record.

### immutableRelation

If you have a relation that cannot change (for example, a chapter can't change its book), use `@immutableRelation` for extra protection and performance:

```js
import { immutableRelation } from '@hypertill/db/decorators'

class Chapter extends Model {
  // ...
  @immutableRelation('books', 'book_id') book
  @immutableRelation('libraries', 'library_id') library
}
```

## Relation API

In the example above, `chapter.book` returns a `Relation` object.

> Remember, Hypertill DB is a lazily-loaded database, so you don't get the related `Book` record immediately, only when you explicitly fetch it

### Observing

Most of the time, you connect relations to React using hooks by reading the related id and then using the matching hook:

```js
import { hooks } from '@hypertill/db/react'

const { data: chapter } = hooks.useChapter(chapterId)
const { data: book } = hooks.useBook(chapter?.book?.id)
```

The component will now have a `book` value containing the related `Book`, and will re-render when either the chapter or its book changes.

If you need custom reactive composition, you can still use `withObservables` as described in [Connecting Components](./Components.md).

### Fetching

To simply get the related record, use `fetch`. You might need it [in a Writer](./Writers.md)

```js
const book = await chapter.book.fetch()

// Shortcut syntax:
const book = await chapter.book
```

**Note**: If the relation column (in this example, `book_id`) is marked as `isOptional: true`, `fetch()` might return `null`.

### ID

If you only need the ID of a related record (e.g. to use in an URL or for the `key=` React prop), use `id`.

```js
const bookId = chapter.book.id
```

### Assigning

Use `set()` to assign a new record to the relation

```js
await database.get('chapters').create(chapter => {
  chapter.book.set(someBook)
  // ...
})
```

**Note**: you can only do this in the `.create()` or `.update()` block.

You can also use `set id` if you only have the ID for the record to assign

```js
await chapter.update(() => {
  chapter.book.id = bookId
})
```

## Advanced relations

### Many-To-Many Relation

If for instance, our app `Book`s can be authored by many `Author`s and an author can write many `Book`s. We would create such a relation following these steps:-

1. Create a pivot schema and model that both the `Author` model and `Book` model has association to; say `BookAuthor`
2. Create has_many association on both `Author` and `Book` pointing to `BookAuthor`
3. Create belongs_to association on `BookAuthor` pointing to both `Author` and `Book`
4. Retrieve all `Books` for an author by defining a query that uses the pivot `BookAuthor` to infer the `Book`s authored by the Author.

```js
import { lazy } from '@hypertill/db/decorators'

class Book extends Model {
  static table = 'books'
  static associations = {
    book_authors: { type: 'has_many', foreignKey: 'book_id' },
  }

  @lazy
  authors = this.collections
    .get('authors')
    .query(Q.on('book_authors', 'book_id', this.id));
}
```

```js
import { immutableRelation } from '@hypertill/db/decorators'

class BookAuthor extends Model {
  static table = 'book_authors'
  static associations = {
    books: { type: 'belongs_to', key: 'book_id' },
    authors: { type: 'belongs_to', key: 'author_id' },
  }
  @immutableRelation('books', 'book_id') book
  @immutableRelation('authors', 'author_id') author
}

```

```js
import { lazy } from '@hypertill/db/decorators'

class Author extends Model {
  static table = 'authors'
  static associations = {
    book_authors: { type: 'has_many', foreignKey: 'author_id' },
  }

  @lazy
  books = this.collections
    .get('books')
    .query(Q.on('book_authors', 'author_id', this.id));

}
```

```js
withObservables(['book'], ({ book }) => ({
  authors: book.authors,
}))
```

* * *

## Next steps

➡️ Now the last step of this guide: [**understand Writers (and Readers)**](./Writers.md)
