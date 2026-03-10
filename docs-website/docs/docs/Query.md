---
title: Querying
hide_title: true
---

# Query API

**Querying** is how you find records that match certain conditions, for example:

- Find all chapters that belong to a certain book
- Find all _reviewed_ notes made by John
- Count all reviewed notes made by John or Lucy created in the last two weeks

Because queries are executed on the database, and not in JavaScript, they're really fast. It's also how Hypertill can be fast even at large scales, because even with tens of thousands of records _total_, you rarely need to load more than a few dozen records at app launch.

## Defining Queries

### @children

The simplest query is made using `@children`. This defines a `Query` for all chapters that belong to a `Book`:

```js
class Book extends Model {
  // ...
  @children('chapters') chapters
}
```

**➡️ Learn more:** [Defining Models](./Model.md)

### Extended Query

To **narrow down** a `Query` (add [extra conditions](#query-conditions) to an existing Query), use `.extend()`:

```js
import { Q } from '@hypertill/db'
import { children, lazy } from '@hypertill/db/decorators'

class Book extends Model {
  // ...
  @children('chapters') chapters

  @lazy reviewedChapters = this.chapters.extend(
    Q.where('is_reviewed', true)
  )

  @lazy reviewedFavoriteChapters = this.reviewedChapters.extend(
    Q.where('is_favorite', true)
  )
}
```

**Note:** Use `@lazy` when extending or defining new Queries for performance

### Custom Queries

You can query any table like so:

```js
import { Q } from '@hypertill/db'

const books = await database.get('books').query(
  // conditions that a book must match:
  Q.on('chapters', 'title', Q.like('%Intro%'))
).fetch()
```

This fetches all books that have a chapter with "Intro" in the title.

You can define custom queries on a Model like so:

```js
class Book extends Model {
  // ...
  @lazy introChapters = this.collections.get('chapters').query(
    Q.where('book_id', this.id),
    Q.where('title', Q.like('%Intro%'))
  )
}
```

## Executing Queries

Most of the time, you execute Queries by connecting them to React Components. The default path in `0.0.3` is to use auto-generated hooks:

```js
import { hooks } from '@hypertill/db/react'

const { data: book } = hooks.useBook(bookId)
const { data: chapters, count } = hooks.useChaptersAdvanced({
  q: (Q) => [Q.where('book_id', bookId), Q.sortBy('position', Q.asc)],
})
```

**➡️ Learn more:** [Connecting to Components](./Components.md)

#### Fetch

To simply get the current list or current count (without observing future changes), use `fetch` / `fetchCount`.

```js
const chapters = await book.chapters.fetch()
const reviewedCount = await book.reviewedChapters.fetchCount()

// Shortcut syntax:
const chapters = await book.chapters
const reviewedCount = await book.reviewedChapters.count
```

## Query conditions

```js
import { Q } from '@hypertill/db'
// ...
database.get('chapters').query(
  Q.where('is_reviewed', true)
)
```

This will query **all** chapters that are reviewed (all chapters with one condition: the `is_reviewed` column of a chapter must be `true`).

When making conditions, you refer to [**column names**](./Schema.md) of a table (i.e. `is_verified`, not `isVerified`). This is because queries are executed directly on the underlying database.

The second argument is the value we want to query for. Note that the passed argument must be the same type as the column (`string`, `number`, or `boolean`; `null` is allowed only if the column is marked as `isOptional: true` in the schema).

#### Empty query

```js
const allChapters = await database.get('chapters').query().fetch()
```

A Query with no conditions will find **all** records in the collection.

**Note:** Don't do this unless necessary. It's generally more efficient to only query the exact records you need.

#### Multiple conditions

```js
database.get('chapters').query(
  Q.where('is_reviewed', true),
  Q.where('is_favorite', true)
)
```

This queries all chapters that are **both** reviewed **and** favorite.

### Conditions with other operators

| Query | JavaScript equivalent |
| ------------- | ------------- |
| `Q.where('is_verified', true)` | `is_verified === true` (shortcut syntax) |
| `Q.where('is_verified', Q.eq(true))` | `is_verified === true` |
| `Q.where('archived_at', Q.notEq(null))` | `archived_at !== null` |
| `Q.where('likes', Q.gt(0))` | `likes > 0`  |
| `Q.where('likes', Q.weakGt(0))` | `likes > 0` (slightly different semantics — [see "null behavior"](#null-behavior) for details) |
| `Q.where('likes', Q.gte(100))` | `likes >= 100` |
| `Q.where('dislikes', Q.lt(100))` | `dislikes < 100` |
| `Q.where('dislikes', Q.lte(100))` | `dislikes <= 100` |
| `Q.where('likes', Q.between(10, 100))` | `likes >= 10 && likes <= 100` |
| `Q.where('status', Q.oneOf(['published', 'draft']))` | `['published', 'draft'].includes(status)` |
| `Q.where('status', Q.notIn(['archived', 'deleted']))` | `status !== 'archived' && status !== 'deleted'` |
| `Q.where('status', Q.like('%bl_sh%'))` | `/.*bl.sh.*/i` (See note below!) |
| `Q.where('status', Q.notLike('%bl_sh%'))` | `/^((!?.*bl.sh.*).)*$/i` (Inverse regex match) (See note below!) |
| `Q.where('status', Q.includes('promoted'))` | `status.includes('promoted')` |

### LIKE / NOT LIKE

You can use `Q.like` for search-related tasks. For example, to find all users whose username start with "jas" (case-insensitive) you can write

```js
usersCollection.query(
  Q.where("username", Q.like(`${Q.sanitizeLikeString("jas")}%`)
)
```

where `"jas"` can be changed dynamically with user input.

Note that the behavior of `Q.like` is not exact and can differ somewhat between implementations (SQLite vs LokiJS). For instance, while the comparison is case-insensitive, SQLite cannot by default compare non-ASCII characters case-insensitively (unless you install ICU extension). Use `Q.like` for user input search, but not for tasks that require a precise matching behavior.

**Note:** It's NOT SAFE to use `Q.like` and `Q.notLike` with user input directly, because special characters like `%` or `_` are not escaped. Always sanitize user input like so:
```js
Q.like(`%${Q.sanitizeLikeString(userInput)}%`)
Q.notLike(`%${Q.sanitizeLikeString(userInput)}%`)
```

### AND/OR nesting

You can nest multiple conditions using `Q.and` and `Q.or`:

```js
database.get('chapters').query(
  Q.where('archived_at', Q.notEq(null)),
  Q.or(
    Q.where('is_reviewed', true),
    Q.and(
      Q.where('likes', Q.gt(10)),
      Q.where('dislikes', Q.lt(5))
    )
  )
)
```

This is equivalent to `archivedAt !== null && (isVerified || (likes > 10 && dislikes < 5))`.

### Conditions on related tables ("JOIN queries")

For example: query all chapters under books published by John:

```js
// Shortcut syntax:
database.get('chapters').query(
  Q.on('books', 'author_id', john.id),
)

// Full syntax:
database.get('chapters').query(
  Q.on('books', Q.where('author_id', Q.eq(john.id))),
)
```

Normally you set conditions on the table you're querying. Here we're querying **chapters**, but we have a condition on the **book** the chapter belongs to.

The first argument for `Q.on` is the table name you're making a condition on. The other two arguments are same as for `Q.where`.

**Note:** The two tables [must be associated](./Model.md) before you can use `Q.on`.

#### Multiple conditions on a related table

For example: query all chapters under books that are written by John *and* are either published or belong to `draftBlog`

```js
database.get('chapters').query(
  Q.on('books', [
    Q.where('author_id', john.id)
    Q.or(
      Q.where('published', true),
      Q.where('blog_id', draftBlog.id),
    )
  ]),
)
```

Instead of an array of conditions, you can also pass `Q.and`, `Q.or`, `Q.where`, or `Q.on` as the second argument to `Q.on`.

#### Nesting `Q.on` within AND/OR

If you want to place `Q.on` nested within `Q.and` and `Q.or`, you must explicitly define all tables you're joining on. (NOTE: The `Q.experimentalJoinTables` API is subject to change)

```js
tasksCollection.query(
  Q.experimentalJoinTables(['projects']),
  Q.or(
    Q.where('is_followed', true),
    Q.on('projects', 'is_followed', true),
  ),
)
```

#### Deep `Q.on`s

You can also nest `Q.on` within `Q.on`, e.g. to make a condition on a grandparent. You must explicitly define the tables you're joining on. (NOTE: The `Q.experimentalNestedJoin` API is subject to change). Multiple levels of nesting are allowed.

```js
// this queries tasks that are inside projects that are inside teams where team.foo == 'bar'
tasksCollection.query(
  Q.experimentalNestedJoin('projects', 'teams'),
  Q.on('projects', Q.on('teams', 'foo', 'bar')),
)
```

## Advanced Queries

### Advanced observing

Call `query.observeWithColumns(['foo', 'bar'])` to create an Observable that emits a value not only when the list of matching records changes (new records/deleted records), but also when any of the matched records changes its `foo` or `bar` column. [Use this for observing sorted lists](./Components.md)

#### Count throttling

By default, calling `query.observeCount()` returns an Observable that is throttled to emit at most once every 250ms. You can disable throttling using `query.observeCount(false)`.

### Column comparisons

This queries chapters that have more likes than dislikes. Note that we're comparing `likes` column to another column instead of a value.

```js
database.get('chapters').query(
  Q.where('likes', Q.gt(Q.column('dislikes')))
)
```

### sortBy, take, skip

You can use these clauses to sort the query by one or more columns. Note that only simple ascending/descending criteria for columns are supported.

```js
database.get('chapters').query(
  // sorts by number of likes from the most likes to the fewest
  Q.sortBy('likes', Q.desc),
  // if two chapters have the same number of likes, the one with fewest dislikes will be at the top
  Q.sortBy('dislikes', Q.asc),
  // limit number of chapters to 100, skipping the first 50
  Q.skip(50),
  Q.take(100),
)
```

It isn't _necessarily_ better or more efficient to sort on query level instead of in JavaScript, **however** the most important use case for `Q.sortBy` is when used alongside `Q.skip` and `Q.take` to implement paging - to limit the number of records loaded from database to memory on very long lists

### Fetch IDs

If you only need IDs of records matching a query, you can optimize the query by calling `await query.fetchIds()` instead of `await query.fetch()`

### Security

Remember that Queries are a sensitive subject, security-wise. Never trust user input and pass it directly into queries. In particular:

- Never pass into queries values you don't know for sure are the right type (e.g. value passed to `Q.eq()` should be a string, number, boolean, or null -- but not an Object. If the value comes from JSON, you must validate it before passing it!)
- Never pass column names (without whitelisting) from user input
- Values passed to `oneOf`, `notIn` should be arrays of simple types - be careful they don't contain objects
- Do not use `Q.like` / `Q.notLike` without `Q.sanitizeLikeString`
- Do not use `unsafe raw queries` without knowing what you're doing and sanitizing all user input

### Unsafe SQL queries

```js
const records = await database.get('chapters').query(
  Q.unsafeSqlQuery(`select * from chapters where foo is not ? and _status is not 'deleted'`, ['bar'])
).fetch()

const recordCount = await database.get('chapters').query(
  Q.unsafeSqlQuery(`select count(*) as count from chapters where foo is not ? and _status is not 'deleted'`, ['bar'])
).fetchCount()
```

You can also observe unsafe raw SQL queries, however, if it contains `JOIN` statements, you must explicitly specify all other tables using `Q.experimentalJoinTables` and/or `Q.experimentalNestedJoin`, like so:

```js
const records = await database.get('chapters').query(
  Q.experimentalJoinTables(['books']),
  Q.experimentalNestedJoin('books', 'blogs'),
  Q.unsafeSqlQuery(
    'select chapters.* from chapters ' +
      'left join books on chapters.book_id is books.id ' +
      'left join blogs on books.blog_id is blogs.id' +
      'where ...',
  ),
).observe()
```

⚠️ Please note:

- Do not use this if you don't know what you're doing
- Do not pass user input directly to avoid SQL Injection - use `?` placeholders and pass array of placeholder values
- You must filter out deleted record using `where _status is not 'deleted'` clause
- If you're going to fetch count of the query, use `count(*) as count` as the select result

### Unsafe fetch raw

In addition to `.fetch()` and `.fetchIds()`, there is also `.unsafeFetchRaw()`. Instead of returning an array of `Model` class instances, it returns an array of raw objects.

You can use it as an unsafe optimization, or alongside `Q.unsafeSqlQuery`/`Q.unsafeLokiTransform` to create an advanced query that either skips fetching unnecessary columns or includes extra computed columns. For example:

```js
const rawData = await database.get('books').query(
  Q.unsafeSqlQuery(
    'select books.text1, count(tag_assignments.id) as tag_count, sum(tag_assignments.rank) as tag_rank from books' +
      ' left join tag_assignments on books.id = tag_assignments.book_id' +
      ' group by books.id' +
      ' order by books.position desc',
  )
).unsafeFetchRaw()
```

⚠️ You MUST NOT mutate returned objects. Doing so will corrupt the database.

### Unsafe SQL/Loki expressions

You can also include smaller bits of SQL and Loki expressions so that you can still use as much of Hypertill query builder as possible:

```js
// SQL example:
booksCollection.query(
  Q.where('is_published', true),
  Q.unsafeSqlExpr('tasks.num1 not between 1 and 5'),
)

// LokiJS example:
booksCollection.query(
  Q.where('is_published', true),
  Q.unsafeLokiExpr({ text1: { $contains: 'hey' } })
)
```

For SQL, be sure to prefix column names with table name when joining with other tables.

⚠️ Please do not use this if you don't know what you're doing. Do not pass user input directly to avoid SQL injection.

### Multi-table column comparisons and `Q.unsafeLokiTransform`

Example: we want to query chapters created more than 14 days after the book it belongs to was published.

There's sadly no built-in syntax for this, but can be worked around using unsafe expressions like so:

```js
// SQL example:
chaptersCollection.query(
  Q.on('books', 'published_at', Q.notEq(null)),
  Q.unsafeSqlExpr(`chapters.created_at > books.published_at + ${14 * 24 * 3600 * 1000}`)
)

// LokiJS example:
chaptersCollection.query(
  Q.on('books', 'published_at', Q.notEq(null)),
  Q.unsafeLokiTransform((rawRecords, loki) => {
    return rawRecords.filter(rawRecord => {
      const book = loki.getCollection('books').by('id', rawRecord.book_id)
      return book && rawRecord.created_at > book.published_at + 14 * 24 * 3600 * 1000
    })
  }),
)
```

For LokiJS, remember that `rawRecord` is an unsanitized, unsafe object and must not be mutated. `Q.unsafeLokiTransform` only works when using `LokiJSAdapter` with `useWebWorkers: false`. There can only be one `Q.unsafeLokiTransform` clause per query.

### `null` behavior

There are some gotchas you should be aware of. The `Q.gt`, `gte`, `lt`, `lte`, `oneOf`, `notIn`, `like` operators match the semantics of SQLite in terms of how they treat `null`. Those are different from JavaScript.

**Rule of thumb:** No null comparisons are allowed.

For example, if you query `chapters` for `Q.where('likes', Q.lt(10))`, a chapter with 8 likes and 0 likes will be included, but a chapter with `null` likes will not! In Hypertill queries, `null` is not less than any number. That's why you should avoid [making table columns optional](./Schema.md) unless you actually need it.

Similarly, if you query with a column comparison, like `Q.where('likes', Q.gt(Q.column('dislikes')))`, only chapters where both `likes` and `dislikes` are not null will be compared. A chapter with 5 likes and `null` dislikes will NOT be included. 5 is not greater than `null` here.

**`Q.oneOf` operator**: It is not allowed to pass `null` as an argument to `Q.oneOf`. Instead of `Q.oneOf([null, 'published', 'draft'])` you need to explicitly allow `null` as a value like so:

```js
booksCollection.query(
  Q.or(
    Q.where('status', Q.oneOf(['published', 'draft'])),
    Q.where('status', null)
  )
)
```

**`Q.notIn` operator**: If you query, say, books with `Q.where('status', Q.notIn(['published', 'draft']))`, it will match books with a status different than `published` or `draft`, however, it will NOT match books with `status == null`. If you want to include such books, query for that explicitly like with the example above.

**`Q.weakGt` operator**: This is weakly typed version of `Q.gt` — one that allows null comparisons. So if you query `chapters` with `Q.where('likes', Q.weakGt(Q.column('dislikes')))`, it WILL match chapters with 5 likes and `null` dislikes. (For `weakGt`, unlike standard operators, any number is greater than `null`).

## Contributing improvements to Hypertill query language

Here are files that are relevant. This list may look daunting, but adding new matchers is actually quite simple and multiple first-time contributors made these improvements (including like, sort, take, skip). The implementation is just split into multiple files (and their test files), but when you look at them, it'll be easy to add matchers by analogy.

We recommend starting from writing tests first to check expected behavior, then implement the actual behavior.

- `src/QueryDescription/test.js` - Test clause builder (`Q.myThing`) output and test that it rejects bad/unsafe parameters
- `src/QueryDescription/index.js` - Add clause builder and type definition
- `src/__tests__/databaseTests.js` - Add test ("join" if it requires conditions on related tables; "match" otherwise) that checks that the new clause matches expected records. From this, tests running against SQLite, LokiJS, and Matcher are generated. (If one of those is not supported, add `skip{Loki,Sql,Count,Matcher}: true` to your test)
- `src/adapters/sqlite/encodeQuery/test.js` - Test that your query generates SQL you expect. (If your clause is Loki-only, test that error is thrown)
- `src/adapters/sqlite/encodeQuery/index.js` - Generate SQL
- `src/adapters/lokijs/worker/encodeQuery/test.js` - Test that your query generates the Loki query you expect (If your clause is SQLite-only, test that an error is thrown)
- `src/adapters/lokijs/worker/encodeQuery/index.js` - Generate Loki query
- `src/adapters/lokijs/worker/{performJoins/*.js,executeQuery.js}` - May be relevant for some Loki queries, but most likely you don't need to look here.
- `src/observation/encodeMatcher/` - If your query can be checked against a record in JavaScript (e.g. you're adding new "by regex" matcher), implement this behavior here (`index.js`, `operators.js`). This is used for efficient "simple observation". You don't need to write tests - `databaseTests` are used automatically. If you can't or won't implement encodeMatcher for your query, add a check to `canEncode.js` so that it returns `false` for your query (Less efficient "reloading observation" will be used then). Add your query to `test.js`'s "unencodable queries" then.

* * *

## Next steps

➡️ Now that you've mastered Queries, [**make more Relations**](./Relation.md)
