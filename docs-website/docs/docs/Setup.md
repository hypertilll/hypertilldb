---
title: Setup
hide_title: true
---

# Set up your app for Hypertill DB

The cleanest structure is still the best one: keep database code in a dedicated `db/` folder and keep UI code out of it.

```text
src/
  db/
    schema.ts
    models.ts
    migrations.ts
    index.ts
  App.tsx
```

The examples below use a small library app with `Book` and `Chapter` models. The rest of the docs reuse that same example so the API stays easy to follow.

## 1. Define your schema

Create `src/db/schema.ts`:

```ts
import { appSchema, tableSchema } from '@hypertill/db'

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'books',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'author', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'chapters',
      columns: [
        { name: 'book_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'position', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
})
```

If you need migrations, keep them in `src/db/migrations.ts` and pass them to the adapter in the next step.

## 2. Define your models

Create `src/db/models.ts`:

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
  @field('created_at') createdAt!: number
  @field('updated_at') updatedAt!: number
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
  @field('created_at') createdAt!: number
  @field('updated_at') updatedAt!: number
  @relation('books', 'book_id') book!: Relation<Book>
}

export const modelClasses = [Book, Chapter]
```

## 3. Create the database

Create `src/db/index.ts`:

```ts
import { createPlatformAdapter, Database } from '@hypertill/db'
import { modelClasses } from './models'
import { schema } from './schema'

const adapter = createPlatformAdapter({
  schema,
  dbName: 'library',
})

export const database = new Database({
  adapter,
  modelClasses,
})
```

`createPlatformAdapter()` is the current recommended bootstrap:

- native and Node.js targets use SQLite
- web targets use LokiJS
- default metadata columns are injected for you

If you need lower-level adapter options, pass them through `sqlite` or `loki` inside `createPlatformAdapter(...)`.
If you have a `migrations.ts` file, pass it as `migrations` in the same object.

## 4. Provide the database to React

Wrap your app once in `DatabaseProvider`:

```tsx
import { DatabaseProvider } from '@hypertill/db/react'
import { database } from './src/db'
import { LibraryScreen } from './src/LibraryScreen'

export default function App() {
  return (
    <DatabaseProvider database={database}>
      <LibraryScreen />
    </DatabaseProvider>
  )
}
```

## 5. Use the current React split

At this point your app is ready for the package's current React pattern:

- reactive reads with `hooks`
- writes and imperative work with `useDatabase`
- custom reactive composition with `withObservables` when the hooks are not enough

Hook names are generated from your model class names:

- `Book` gives you `hooks.useBook()` and `hooks.useBooks()`
- `Chapter` gives you `hooks.useChapter()` and `hooks.useChapters()`

Continue with [Connecting Components](./Components) for the React side.

## Related guides

- [Installation](./Installation)
- [Schema](./Schema)
- [Model](./Model)
- [Connecting Components](./Components)
