# Model

A `Model` class is the application-facing shape of one table in your database.

In the library example used throughout the docs:

- `Book` maps to the `books` table
- `Chapter` maps to the `chapters` table

Before defining a model, make sure the matching table already exists in your [Schema](./Schema.md).

## Start with the table name

```ts
import { Model } from '@hypertill/db'

export class Book extends Model {
  static table = 'books'
}
```

Then include that model when you create the database:

```ts
const database = new Database({
  adapter,
  modelClasses: [Book],
})
```

## Add associations

Relations are always defined on both sides.

```ts
export class Book extends Model {
  static table = 'books'
  static associations = {
    chapters: { type: 'has_many', foreignKey: 'book_id' },
  } as const
}

export class Chapter extends Model {
  static table = 'chapters'
  static associations = {
    books: { type: 'belongs_to', key: 'book_id' },
  } as const
}
```

- use `has_many` on the parent model
- use `belongs_to` on the child model
- both sides point at the same foreign key column

## Add fields

Fields map model properties to schema columns:

```ts
import { field, text } from '@hypertill/db/decorators'

export class Book extends Model {
  static table = 'books'

  @text('title') title!: string
  @text('author') author!: string
  @text('status') status!: string
}
```

### `@text` vs `@field`

- use `@text` for user-entered strings like titles and names
- use `@field` for numbers, booleans, ids, and plain scalar values

The column name stays explicit on purpose, because database columns are usually `snake_case` while application properties are usually camelCase.

## Date fields

If you store timestamps and want a JavaScript `Date` in the model, use `@date`:

```ts
import { date } from '@hypertill/db/decorators'

class Book extends Model {
  @date('last_opened_at') lastOpenedAt!: Date | null
}
```

That assumes your schema contains:

```ts
{ name: 'last_opened_at', type: 'number', isOptional: true }
```

## Built-in timestamps

Every persisted `Model` reserves these getters:

- `createdAt`
- `updatedAt`
- `deletedAt`

When the matching metadata columns exist, they return `Date | null`. With `createPlatformAdapter()` and the built-in SQLite/Loki adapters, those columns are normalized for you automatically, so you do not declare timestamp fields on each model.

```ts
const created = book.createdAt
const updated = book.updatedAt
const deleted = book.deletedAt
```

Avoid reusing those property names for unrelated fields.

## To-one relations

Use `@relation` or `@immutableRelation` when a record belongs to another record:

```ts
import type { Relation } from '@hypertill/db'
import { relation, immutableRelation } from '@hypertill/db/decorators'

class Chapter extends Model {
  @relation('books', 'book_id') book!: Relation<Book>
}

class ShelfEntry extends Model {
  @immutableRelation('books', 'book_id') book!: Relation<Book>
}
```

Use `@immutableRelation` when the foreign key should never change after creation.

## To-many relations with `@children`

Use `@children` to expose a query for related rows:

```ts
import { Query } from '@hypertill/db'
import { children } from '@hypertill/db/decorators'

class Book extends Model {
  static associations = {
    chapters: { type: 'has_many', foreignKey: 'book_id' },
  } as const

  @children('chapters') chapters!: Query<Chapter>
}
```

`@children('chapters')` does not load rows immediately. It gives you a `Query`, which you can fetch, observe, extend, or count.

## Custom queries

You can build model-level queries with `@lazy`:

```ts
import { Q } from '@hypertill/db'
import { children, lazy } from '@hypertill/db/decorators'

class Book extends Model {
  @children('chapters') chapters!: Query<Chapter>

  @lazy introChapters = this.chapters.extend(
    Q.where('title', Q.like('%Intro%')),
    Q.sortBy('position', Q.asc),
  )
}
```

Use `@lazy` for derived queries so they are created once and reused.

## Writer methods

Put repeated mutations on the model itself:

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

Methods that change the database should be marked `@writer`.

## A complete small example

```ts
import { Model, Query, Relation } from '@hypertill/db'
import { children, field, relation, text } from '@hypertill/db/decorators'

export class Book extends Model {
  static table = 'books'
  static associations = {
    chapters: { type: 'has_many', foreignKey: 'book_id' },
  } as const

  @text('title') title!: string
  @text('author') author!: string
  @text('status') status!: string
  @children('chapters') chapters!: Query<Chapter>
}

export class Chapter extends Model {
  static table = 'chapters'
  static associations = {
    books: { type: 'belongs_to', key: 'book_id' },
  } as const

  @field('book_id') bookId!: string
  @text('title') title!: string
  @field('position') position!: number
  @relation('books', 'book_id') book!: Relation<Book>
}

export const modelClasses = [Book, Chapter]
```

## Next steps

After defining your models, move on to [CRUD](./CRUD) and [Query](./Query).
