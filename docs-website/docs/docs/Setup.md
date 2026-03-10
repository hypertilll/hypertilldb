---
title: Setup
hide_title: true
---

# Set up your app for Hypertill DB

The current recommendation is to keep your database code in a dedicated `db/` folder and make the file layout obvious:

```text
src/
  db/
    schema.ts
    models.ts
    database.ts
  App.tsx
```

The examples below use TypeScript and a simple book-reader domain because that matches the shipped Expo reference app.

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
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'chapters',
      columns: [
        { name: 'book_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'position', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
})
```

If you need migrations, add them in a separate `migrations.ts` file and pass them to the adapter later.

## 2. Define models

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
  @field('updated_at') updatedAt!: number
  @relation('books', 'book_id') book!: Relation<Book>
}

export const modelClasses = [Book, Chapter]
```

## 3. Create the database

Create `src/db/database.ts`:

```ts
import { Database } from '@hypertill/db'
import SQLiteAdapter from '@hypertill/db/adapters/sqlite'
import { modelClasses } from './models'
import { schema } from './schema'

const adapter = new SQLiteAdapter({
  schema,
  jsi: true,
  onSetUpError: (error) => {
    console.error('Hypertill DB setup failed', error)
  },
})

export const database = new Database({
  adapter,
  modelClasses,
})
```

For web targets, swap `SQLiteAdapter` for `LokiJSAdapter` and keep the rest of the bootstrap pattern the same.

## 4. Provide the database to React

Wrap your app once in `DatabaseProvider`:

```tsx
import { DatabaseProvider } from '@hypertill/db/react'
import { database } from './src/db/database'
import { BookReaderScreen } from './src/BookReaderScreen'

export default function App() {
  return (
    <DatabaseProvider database={database}>
      <BookReaderScreen />
    </DatabaseProvider>
  )
}
```

## 5. Keep reads and writes separate

At this point, your app is ready for:

- reactive reads via `hooks` (`hooks.use<Model>`, `hooks.use<Models>`, `hooks.use<Models>Advanced`)
- writes and imperative lookups via `useDatabase`
- advanced compositions via `withObservables` when needed

That split is the current recommended React pattern for `0.0.3`. Continue with [Connecting Components](./Components).

## Related guides

- [Installation](./Installation)
- [Schema](./Schema)
- [Model](./Model)
- [Connecting Components](./Components)
