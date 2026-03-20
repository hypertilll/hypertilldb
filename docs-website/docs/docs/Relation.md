# Relations

A `Relation` represents one record pointing to another record.

In the library example:

- each `Chapter` belongs to one `Book`
- `chapter.book` is a `Relation<Book>`

## Defining a relation

There are two parts to every relation.

### 1. Add the foreign key column

```ts
tableSchema({
  name: 'chapters',
  columns: [
    { name: 'book_id', type: 'string', isIndexed: true },
  ],
})
```

### 2. Add the relation field on the model

```ts
import type { Relation } from '@hypertill/db'
import { relation } from '@hypertill/db/decorators'

class Chapter extends Model {
  @relation('books', 'book_id') book!: Relation<Book>
}
```

The first argument is the related table name. The second is the foreign key column on the current model.

## `immutableRelation`

If a relation should never change after creation, use `@immutableRelation`:

```ts
import type { Relation } from '@hypertill/db'
import { immutableRelation } from '@hypertill/db/decorators'

class Chapter extends Model {
  @immutableRelation('books', 'book_id') book!: Relation<Book>
}
```

That gives you a little extra safety and avoids treating the relation as mutable.

## Relation API

`chapter.book` does not return a `Book` immediately. It returns a `Relation<Book>` object that can:

- expose the related id
- fetch the related record
- observe the related record
- set the relation during create or update

### Read only the related id

If you only need the id, use `relation.id`:

```ts
const bookId = chapter.book.id
```

This does not fetch the related record.

### Fetch the related record

```ts
const book = await chapter.book.fetch()
```

If the relation column is optional, `fetch()` may return `null`.

### Observe the relation in React

With hooks, the common pattern is:

```tsx
import { hooks } from '@hypertill/db/react'

const { data: chapter } = hooks.useChapter(chapterId)
const { data: book } = hooks.useBook(chapter?.book.id)
```

That keeps the UI live as the chapter or its related book changes.

If you want custom reactive composition, `withObservables` still works well:

```tsx
import { withObservables } from '@hypertill/db/react'

const enhance = withObservables(['chapter'], ({ chapter }) => ({
  chapter,
  book: chapter.book,
}))
```

## Assign a relation

Set relations inside `create()` or `update()` builders:

```ts
await database.write(async () => {
  await database.get('chapters').create((chapter) => {
    chapter.book.set(book)
    chapter.title = 'Introduction'
    chapter.position = 1
  })
})
```

If you only have the id:

```ts
await database.write(async () => {
  const chapter = await database.get('chapters').find(chapterId)

  await chapter.update((record) => {
    record.book.id = bookId
  })
})
```

## Many-to-many pattern

For many-to-many relationships, introduce a pivot table.

Example:

- `Book`
- `Author`
- pivot table `book_authors`

```ts
import type { Relation } from '@hypertill/db'

class BookAuthor extends Model {
  static table = 'book_authors'
  static associations = {
    books: { type: 'belongs_to', key: 'book_id' },
    authors: { type: 'belongs_to', key: 'author_id' },
  } as const

  @immutableRelation('books', 'book_id') book!: Relation<Book>
  @immutableRelation('authors', 'author_id') author!: Relation<Author>
}
```

Then define model-level queries that hop through the pivot table:

```ts
import { Q } from '@hypertill/db'
import { lazy } from '@hypertill/db/decorators'

class Author extends Model {
  static table = 'authors'
  static associations = {
    book_authors: { type: 'has_many', foreignKey: 'author_id' },
  } as const

  @lazy books = this.collections.get('books').query(
    Q.on('book_authors', 'author_id', this.id),
  )
}
```

## Next steps

Once relations are clear, the next practical topic is [Writers](./Writers).
