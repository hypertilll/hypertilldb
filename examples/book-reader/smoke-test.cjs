'use strict'

const assert = require('node:assert/strict')

const { Database, Model, Q, appSchema, tableSchema } = require('../../dist')
const LokiJSAdapter = require('../../dist/adapters/lokijs').default
const { children, field, relation, text } = require('../../dist/decorators')
const { hasUnsyncedChanges, synchronize } = require('../../dist/sync')

const TableName = {
  READERS: 'readers',
  BOOKS: 'books',
  READING_SESSIONS: 'reading_sessions',
}

const applyDecorator = (prototype, key, decorator) => {
  Object.defineProperty(prototype, key, decorator(prototype, key))
}

const emptyChanges = () => ({
  [TableName.READERS]: { created: [], updated: [], deleted: [] },
  [TableName.BOOKS]: { created: [], updated: [], deleted: [] },
  [TableName.READING_SESSIONS]: { created: [], updated: [], deleted: [] },
})

class Reader extends Model {}
Reader.table = TableName.READERS
Reader.associations = {
  [TableName.BOOKS]: { type: 'has_many', foreignKey: 'reader_id' },
}
applyDecorator(Reader.prototype, 'name', text('name'))
applyDecorator(Reader.prototype, 'favoriteGenre', text('favorite_genre'))
applyDecorator(Reader.prototype, 'membershipTier', text('membership_tier'))
applyDecorator(Reader.prototype, 'books', children(TableName.BOOKS))

class Book extends Model {}
Book.table = TableName.BOOKS
Book.associations = {
  [TableName.READERS]: { type: 'belongs_to', key: 'reader_id' },
  [TableName.READING_SESSIONS]: { type: 'has_many', foreignKey: 'book_id' },
}
applyDecorator(Book.prototype, 'readerId', field('reader_id'))
applyDecorator(Book.prototype, 'title', text('title'))
applyDecorator(Book.prototype, 'author', text('author'))
applyDecorator(Book.prototype, 'pages', field('pages'))
applyDecorator(Book.prototype, 'progressPercent', field('progress_percent'))
applyDecorator(Book.prototype, 'isFinished', field('is_finished'))
applyDecorator(Book.prototype, 'reader', relation(TableName.READERS, 'reader_id'))
applyDecorator(Book.prototype, 'sessions', children(TableName.READING_SESSIONS))

class ReadingSession extends Model {}
ReadingSession.table = TableName.READING_SESSIONS
ReadingSession.associations = {
  [TableName.BOOKS]: { type: 'belongs_to', key: 'book_id' },
}
applyDecorator(ReadingSession.prototype, 'bookId', field('book_id'))
applyDecorator(ReadingSession.prototype, 'minutesRead', field('minutes_read'))
applyDecorator(ReadingSession.prototype, 'notes', text('notes'))
applyDecorator(ReadingSession.prototype, 'book', relation(TableName.BOOKS, 'book_id'))

const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: TableName.READERS,
      columns: [
        { name: 'name', type: 'string' },
        { name: 'favorite_genre', type: 'string' },
        { name: 'membership_tier', type: 'string' },
      ],
    }),
    tableSchema({
      name: TableName.BOOKS,
      columns: [
        { name: 'reader_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'author', type: 'string' },
        { name: 'pages', type: 'number' },
        { name: 'progress_percent', type: 'number' },
        { name: 'is_finished', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: TableName.READING_SESSIONS,
      columns: [
        { name: 'book_id', type: 'string', isIndexed: true },
        { name: 'minutes_read', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
      ],
    }),
  ],
})

async function main() {
  const adapter = new LokiJSAdapter({
    dbName: 'book-reader-smoke-test',
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
    onSetUpError: (error) => {
      throw error
    },
  })

  const database = new Database({
    adapter,
    modelClasses: [Reader, Book, ReadingSession],
  })

  const readers = database.get(TableName.READERS)
  const books = database.get(TableName.BOOKS)
  const readingSessions = database.get(TableName.READING_SESSIONS)

  let reader
  let dune
  let leftHand

  await database.write(async () => {
    reader = await readers.create((record) => {
      record.name = '  Amina Noor  '
      record.favoriteGenre = '  science fiction  '
      record.membershipTier = 'annual'
    })

    dune = await books.create((record) => {
      record.readerId = reader.id
      record.title = '  Dune  '
      record.author = 'Frank Herbert'
      record.pages = 688
      record.progressPercent = 72
      record.isFinished = false
    })

    leftHand = await books.create((record) => {
      record.readerId = reader.id
      record.title = 'The Left Hand of Darkness'
      record.author = 'Ursula K. Le Guin'
      record.pages = 304
      record.progressPercent = 35
      record.isFinished = false
    })

    await readingSessions.create((record) => {
      record.bookId = dune.id
      record.minutesRead = 45
      record.notes = '  Focused train ride reading session  '
    })
  })

  assert.equal(reader.name, 'Amina Noor')
  assert.equal(reader.favoriteGenre, 'science fiction')
  assert.equal(await hasUnsyncedChanges({ database }), true)

  const sortedOpenBooks = await books
    .query(Q.where('is_finished', false), Q.sortBy('title', Q.asc))
    .fetch()
  assert.deepEqual(
    sortedOpenBooks.map((book) => book.title),
    ['Dune', 'The Left Hand of Darkness'],
  )

  const relatedReader = await dune.reader.fetch()
  assert.equal(relatedReader.id, reader.id)

  const readerBooks = await reader.books.fetch()
  assert.equal(readerBooks.length, 2)
  assert.equal(await dune.sessions.fetchCount(), 1)

  const pushedChanges = []
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      assert.equal(lastPulledAt, null)
      assert.equal(schemaVersion, 1)
      assert.equal(migration, null)

      return {
        changes: emptyChanges(),
        timestamp: 1000,
      }
    },
    pushChanges: async (payload) => {
      pushedChanges.push(payload)
    },
  })

  assert.equal(pushedChanges.length, 1)
  assert.equal(pushedChanges[0].lastPulledAt, 1000)
  assert.equal(pushedChanges[0].changes.readers.created.length, 1)
  assert.equal(pushedChanges[0].changes.books.created.length, 2)
  assert.equal(pushedChanges[0].changes.reading_sessions.created.length, 1)
  assert.equal(await hasUnsyncedChanges({ database }), false)

  let secondPushCalled = false
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      assert.equal(lastPulledAt, 1000)
      assert.equal(schemaVersion, 1)
      assert.equal(migration, null)

      const changes = emptyChanges()
      changes.readers.updated.push({
        id: reader.id,
        name: 'Amina Noor',
        favorite_genre: 'science fiction',
        membership_tier: 'lifetime',
      })
      changes.books.created.push({
        id: 'remote-book-1',
        reader_id: reader.id,
        title: 'Children of Time',
        author: 'Adrian Tchaikovsky',
        pages: 608,
        progress_percent: 0,
        is_finished: false,
      })

      return {
        changes,
        timestamp: 2000,
      }
    },
    pushChanges: async () => {
      secondPushCalled = true
    },
  })

  assert.equal(secondPushCalled, false)
  const syncedReader = await readers.find(reader.id)
  assert.equal(syncedReader.membershipTier, 'lifetime')

  const syncedBooks = await books.query(Q.sortBy('title', Q.asc)).fetch()
  assert.deepEqual(
    syncedBooks.map((book) => book.title),
    ['Children of Time', 'Dune', 'The Left Hand of Darkness'],
  )

  const remoteBook = await books.find('remote-book-1')
  assert.equal((await remoteBook.reader.fetch()).id, reader.id)

  await database.write(async () => {
    await dune.update((record) => {
      record.progressPercent = 100
      record.isFinished = true
    })
  })

  assert.equal(await hasUnsyncedChanges({ database }), true)

  let updatePayload
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      assert.equal(lastPulledAt, 2000)
      return {
        changes: emptyChanges(),
        timestamp: 3000,
      }
    },
    pushChanges: async (payload) => {
      updatePayload = payload
    },
  })

  assert.ok(updatePayload)
  assert.equal(updatePayload.lastPulledAt, 3000)
  assert.equal(updatePayload.changes.books.updated.length, 1)
  assert.equal(updatePayload.changes.books.updated[0].id, dune.id)
  assert.equal(updatePayload.changes.books.updated[0].progress_percent, 100)
  assert.equal(updatePayload.changes.books.updated[0].is_finished, true)
  assert.equal(await hasUnsyncedChanges({ database }), false)

  console.log('Book reader example completed successfully.')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
