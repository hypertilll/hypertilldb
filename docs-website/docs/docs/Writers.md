---
title: Writers, Readers, Batching
hide_title: true
---

# Writers, readers, and batching

Hypertill DB requires writes to happen inside controlled writer blocks. That keeps async work consistent and prevents overlapping database mutations from stepping on each other.

There are two normal ways to write:

- inline with `database.write(...)`
- model methods marked with `@writer`

## Inline writers

```ts
const newBook = await database.write(async () => {
  const book = await database.get('books').create((record) => {
    record.title = 'Deep Work'
    record.author = 'Cal Newport'
    record.status = 'reading'
  })

  await database.get('chapters').create((chapter) => {
    chapter.book.set(book)
    chapter.title = 'Introduction'
    chapter.position = 1
  })

  return book
})
```

The value returned from the callback is returned by `database.write(...)`.

## Writer methods

For repeated business actions, put the mutation on the model:

```ts
import { writer } from '@hypertill/db/decorators'

class Book extends Model {
  @writer async addChapter(title: string, position: number) {
    return this.collections.get('chapters').create((chapter) => {
      chapter.book.set(this)
      chapter.title = title
      chapter.position = position
    })
  }
}
```

This keeps write logic close to the model it changes.

Another simple example:

```ts
class Book extends Model {
  @writer async rename(title: string) {
    await this.update((book) => {
      book.title = title
    })
  }
}
```

## Batch updates

When one action performs multiple writes, batching is usually better.

Without batching:

```ts
class Book extends Model {
  @writer async createStarterContent() {
    await this.update((book) => {
      book.status = 'reading'
    })

    await this.collections.get('chapters').create((chapter) => {
      chapter.book.set(this)
      chapter.title = 'Chapter 1'
      chapter.position = 1
    })
  }
}
```

With batching:

```ts
class Book extends Model {
  @writer async createStarterContent() {
    await this.batch(
      this.prepareUpdate((book) => {
        book.status = 'reading'
      }),
      this.collections.get('chapters').prepareCreate((chapter) => {
        chapter.book.set(this)
        chapter.title = 'Chapter 1'
        chapter.position = 1
      }),
    )
  }
}
```

Batching reduces round-trips and keeps the mutation grouped as one logical unit.

### What can go into a batch

- `record.prepareUpdate(...)`
- `collection.prepareCreate(...)`
- `record.prepareMarkAsDeleted()`
- `record.prepareDestroyPermanently()`

Falsy values are ignored, so conditional batching is fine.

## Cascading deletes

If deleting a parent should also delete its children, make that explicit.

For syncable soft deletes:

```ts
import { Query } from '@hypertill/db'
import { children, writer } from '@hypertill/db/decorators'

class Book extends Model {
  static associations = {
    chapters: { type: 'has_many', foreignKey: 'book_id' },
  } as const

  @children('chapters') chapters!: Query<Chapter>

  @writer async markAsDeleted() {
    await this.chapters.markAllAsDeleted()
    await super.markAsDeleted()
  }
}
```

For permanent deletes:

```ts
class Book extends Model {
  @writer async destroyPermanently() {
    await this.chapters.destroyAllPermanently()
    await super.destroyPermanently()
  }
}
```

## Readers

Readers are the read-side equivalent of writers. Most apps do not need them often, but they are useful when multiple reads must see a consistent snapshot.

```ts
await database.read(async () => {
  const books = await database.get('books').query().fetch()
  const chapters = await database.get('chapters').query().fetch()
  return { books, chapters }
})
```

You can also define reader methods on models:

```ts
import { reader } from '@hypertill/db/decorators'

class Book extends Model {
  @reader async exportSummary() {
    const chapters = await this.chapters.fetch()
    return {
      id: this.id,
      title: this.title,
      chapterCount: chapters.length,
    }
  }
}
```

## Why this exists

Hypertill DB is asynchronous. Without writers and readers, separate reads and writes could interleave and leave an operation working on inconsistent state.

The writer and reader APIs keep that coordination explicit.

## Next steps

After writers, the next practical guide is usually [Components](./Components) or [Query](./Query).
