# Schema

Hypertill DB works with `Model`s and `Collection`s in application code, but underneath that it still stores data in database tables and columns. Your schema is where you define that structure.

## Defining a schema

Here is the same small library example used across the docs:

```ts
// src/db/schema.ts
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
      ],
    }),
    tableSchema({
      name: 'chapters',
      columns: [
        { name: 'book_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'position', type: 'number' },
      ],
    }),
  ],
})
```

## Naming conventions

Hypertill DB follows database naming conventions:

- table names are plural and `snake_case`
- column names are also `snake_case`
- model class names stay in JavaScript or TypeScript style

That means:

- `Book` maps to `books`
- `createdAt` maps to `created_at`

## Column types

Columns can be:

- `string`
- `number`
- `boolean`

If you want a field to allow `null`, mark the column as `isOptional: true`.

## Relation columns

To point one table at another, add a string column ending in `_id`:

```ts
{ name: 'book_id', type: 'string' }
{ name: 'author_id', type: 'string' }
```

That column is what `@relation()` or `@immutableRelation()` will use on the model side.

## Timestamp columns

If `created_at` and `updated_at` exist on the table, Hypertill DB keeps them current during create and update operations.

They also make the default React query helpers more useful:

- list hooks use `updated_at` first for sorting and timeframe filtering
- if `updated_at` is missing, they fall back to `created_at`

## Metadata columns

When you bootstrap with `createPlatformAdapter()`, Hypertill DB automatically injects these metadata columns:

- `created_at`
- `updated_at`
- `deleted_at`
- `created_tz`
- `updated_tz`
- `deleted_tz`

You do not need to declare those manually.

## Special columns

Every table automatically has:

- `id`
- `_status`
- `_changed`

Do not declare those yourself.

`id` is the record identifier. `_status` and `_changed` are used internally for sync.

## Modifying schema

Whenever you change your schema, increase its `version`.

During early development that is often enough, because a version change can reset the local database on reload. Once your app is shipped, use [Migrations](./Advanced/Migrations.md) instead.

## Indexing

Use `isIndexed: true` when you query a column frequently.

Good candidates:

- foreign keys like `book_id`
- a few selective boolean flags

Usually poor candidates:

- large free-text fields
- most timestamp fields
- every column "just in case"

Indexing improves reads for specific queries, but it also costs write performance and disk space.

## Advanced: unsafe SQL

If you need to customize the generated SQLite schema, `appSchema()` and `tableSchema()` both support `unsafeSql`.

Use it carefully. It is an escape hatch, not the normal path.

```ts
appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'books',
      columns: [...],
      unsafeSql: (sql) => sql.replace(/create table [^)]+\)/, '$& without rowid'),
    }),
  ],
})
```

## Next steps

After the schema is in place, define your [Model](./Model) classes.
