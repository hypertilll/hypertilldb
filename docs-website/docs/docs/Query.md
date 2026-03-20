---
title: Querying
hide_title: true
---

# Query API

Queries are how you ask the database for exactly the records you want.

In the library example that means things like:

- all chapters for one book
- all books currently marked as `reading`
- all chapters whose title contains `Intro`

Because the filtering happens in the database, Hypertill DB stays fast even when the app has a lot of local data.

## Defining queries

### `@children`

The simplest query is a `@children` relation:

```ts
import { Query } from '@hypertill/db'
import { children } from '@hypertill/db/decorators'

class Book extends Model {
  @children('chapters') chapters!: Query<Chapter>
}
```

That gives you a query for all chapters belonging to the current book.

### Extend a query

Use `.extend()` to narrow an existing query:

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

Use `@lazy` for derived queries so they are not recreated on every access.

### Custom collection queries

You can build a query directly from any collection:

```ts
import { Q } from '@hypertill/db'

const books = await database.get('books').query(
  Q.on('chapters', 'title', Q.like('%Intro%')),
).fetch()
```

That returns all books that have a chapter with `Intro` in the title.

## Executing queries

### React hooks (default path)

The current default path in React is to use the auto-generated hooks:

```tsx
import { hooks } from '@hypertill/db/react'

const { data: book } = hooks.useBook(bookId)

const { data: chapters } = hooks.useChaptersAdvanced({
  inputs: [bookId],
  q: (Q) => [
    Q.where('book_id', bookId),
    Q.sortBy('position', Q.asc),
  ],
})
```

If you build the advanced query inline, pass `inputs` so the hook reacts to the values you care about instead of function identity.

### Fetch once

If you only need the current result:

```ts
const chapters = await book.chapters.fetch()
const introCount = await book.introChapters.fetchCount()
```

Queries are also thenable, and counts have a convenience getter:

```ts
const chapters = await book.chapters
const introCount = await book.introChapters.count
```

### Observe a count

For a live count:

```ts
const introCount$ = book.introChapters.observeCount()
```

If you need that inside a React component, wire it through `withObservables` as shown in [Components](./Components).

## Query conditions

```ts
import { Q } from '@hypertill/db'

database.get('chapters').query(
  Q.where('position', Q.gt(3)),
)
```

The first argument is always a column name from the schema. Queries work with raw database columns, so you use `snake_case` names such as `updated_at`, not model property names like `updatedAt`.

### Empty query

```ts
const allBooks = await database.get('books').query().fetch()
```

A query with no clauses returns every record in the collection.

### Multiple conditions

```ts
database.get('books').query(
  Q.where('status', 'reading'),
  Q.where('author', Q.notEq('Unknown')),
)
```

This returns books that match both conditions.

## Condition operators

| Query | JavaScript equivalent |
| ------------- | ------------- |
| `Q.where('status', 'reading')` | `status === 'reading'` |
| `Q.where('status', Q.eq('reading'))` | `status === 'reading'` |
| `Q.where('archived_at', Q.notEq(null))` | `archived_at !== null` |
| `Q.where('position', Q.gt(0))` | `position > 0` |
| `Q.where('position', Q.gte(1))` | `position >= 1` |
| `Q.where('position', Q.lt(10))` | `position < 10` |
| `Q.where('position', Q.lte(10))` | `position <= 10` |
| `Q.where('position', Q.between(1, 5))` | `position >= 1 && position <= 5` |
| `Q.where('status', Q.oneOf(['reading', 'finished']))` | `['reading', 'finished'].includes(status)` |
| `Q.where('status', Q.notIn(['archived', 'deleted']))` | `status !== 'archived' && status !== 'deleted'` |
| `Q.where('title', Q.like('%intro%'))` | case-insensitive SQL `LIKE` |
| `Q.where('title', Q.notLike('%intro%'))` | inverse `LIKE` |
| `Q.where('title', Q.includes('Intro'))` | `title.includes('Intro')` |

## LIKE and user input

Always sanitize user input before passing it to `Q.like()` or `Q.notLike()`:

```ts
Q.like(`%${Q.sanitizeLikeString(userInput)}%`)
Q.notLike(`%${Q.sanitizeLikeString(userInput)}%`)
```

That prevents `%` and `_` from being treated as wildcards unexpectedly.

## AND and OR nesting

```ts
database.get('chapters').query(
  Q.where('book_id', bookId),
  Q.or(
    Q.where('title', Q.like('%Intro%')),
    Q.and(
      Q.where('position', Q.gte(10)),
      Q.where('position', Q.lte(12)),
    ),
  ),
)
```

## Conditions on related tables

You can query one table using conditions from an associated table:

```ts
database.get('chapters').query(
  Q.on('books', 'author', 'Cal Newport'),
)
```

That returns chapters whose parent book matches the condition.

### Multiple conditions on a related table

```ts
database.get('chapters').query(
  Q.on('books', [
    Q.where('author', 'Cal Newport'),
    Q.or(
      Q.where('status', 'reading'),
      Q.where('status', 'finished'),
    ),
  ]),
)
```

You can pass an array of clauses, or a `Q.and(...)` / `Q.or(...)` expression, as the second argument to `Q.on(...)`.

### Nesting `Q.on` inside `Q.and` and `Q.or`

If you nest `Q.on(...)` inside larger boolean expressions, explicitly declare the join tables first:

```ts
database.get('chapters').query(
  Q.experimentalJoinTables(['books']),
  Q.or(
    Q.where('title', Q.like('%Intro%')),
    Q.on('books', 'status', 'reading'),
  ),
)
```

## Next steps

Once queries make sense, move on to [Relation](./Relation) and [Components](./Components).
