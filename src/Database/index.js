// @flow

import { type Observable, startWith, merge as merge$ } from '../utils/rx'
import { type Unsubscribe } from '../utils/subscriptions'
import { invariant, logger } from '../utils/common'
import {
  noop,
  fromArrayOrSpread,
  // eslint-disable-next-line no-unused-vars
  type ArrayOrSpreadFn,
} from '../utils/fp'

import type { DatabaseAdapter, BatchOperation } from '../adapters/type'
import DatabaseAdapterCompat from '../adapters/compat'
import type Model from '../Model'
import type Collection, { CollectionChangeSet } from '../Collection'
import type { TableName, AppSchema } from '../Schema'

import CollectionMap from './CollectionMap'
import type LocalStorage from './LocalStorage'
import WorkQueue, { type ReaderInterface, type WriterInterface } from './WorkQueue'

type DatabaseProps = $Exact<{
  adapter: DatabaseAdapter,
  modelClasses: Array<Class<Model>>,
  recordIds?: $Exact<{
    strategy?: 'uuidv4' | 'uuidv7',
  }>,
  timestamps?: $Exact<{
    mode?: 'epoch' | 'epoch+timezone',
    timezoneSource?: 'device' | 'utc' | string,
  }>,
}>

let experimentalAllowsFatalError = false

type RecordIdStrategy = 'uuidv4' | 'uuidv7'
type TimestampMode = 'epoch' | 'epoch+timezone'
type TimezoneSource = 'device' | 'utc' | string

const BYTE_TO_HEX = Array(256)
for (let i = 0; i < 256; i += 1) {
  BYTE_TO_HEX[i] = i.toString(16).padStart(2, '0')
}

function getCrypto(): any {
  // eslint-disable-next-line no-undef
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    // eslint-disable-next-line no-undef
    return globalThis.crypto
  }

  return null
}

function fillRandomBytes(bytes: Uint8Array): void {
  const crypto = getCrypto()
  if (crypto && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
    return
  }

  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
}

function toUuid(bytes: Uint8Array): string {
  return (
    BYTE_TO_HEX[bytes[0]] +
    BYTE_TO_HEX[bytes[1]] +
    BYTE_TO_HEX[bytes[2]] +
    BYTE_TO_HEX[bytes[3]] +
    '-' +
    BYTE_TO_HEX[bytes[4]] +
    BYTE_TO_HEX[bytes[5]] +
    '-' +
    BYTE_TO_HEX[bytes[6]] +
    BYTE_TO_HEX[bytes[7]] +
    '-' +
    BYTE_TO_HEX[bytes[8]] +
    BYTE_TO_HEX[bytes[9]] +
    '-' +
    BYTE_TO_HEX[bytes[10]] +
    BYTE_TO_HEX[bytes[11]] +
    BYTE_TO_HEX[bytes[12]] +
    BYTE_TO_HEX[bytes[13]] +
    BYTE_TO_HEX[bytes[14]] +
    BYTE_TO_HEX[bytes[15]]
  )
}

function generateUuidV4(): string {
  const bytes = new Uint8Array(16)
  fillRandomBytes(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return toUuid(bytes)
}

function generateUuidV7(): string {
  const bytes = new Uint8Array(16)
  fillRandomBytes(bytes)

  const timestamp = Date.now()
  bytes[0] = Math.floor(timestamp / 1099511627776) & 0xff // 2^40
  bytes[1] = Math.floor(timestamp / 4294967296) & 0xff // 2^32
  bytes[2] = Math.floor(timestamp / 16777216) & 0xff // 2^24
  bytes[3] = Math.floor(timestamp / 65536) & 0xff // 2^16
  bytes[4] = Math.floor(timestamp / 256) & 0xff // 2^8
  bytes[5] = timestamp & 0xff

  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return toUuid(bytes)
}

function createRecordIdGenerator(strategy: RecordIdStrategy): () => string {
  return strategy === 'uuidv7' ? generateUuidV7 : generateUuidV4
}

function resolveTimezone(source: TimezoneSource): string {
  if (source === 'utc') {
    return 'UTC'
  }

  if (source && source !== 'device') {
    return source
  }

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return timezone || 'UTC'
  } catch (_error) {
    return 'UTC'
  }
}

export function setExperimentalAllowsFatalError(): void {
  experimentalAllowsFatalError = true
}

export default class Database {
  /**
   * Database's adapter - the low-level connection with the underlying database (e.g. SQLite)
   *
   * Unless you understand HypertillDB's internals, you SHOULD NOT use adapter directly.
   * Running queries, or updating/deleting records on the adapter will corrupt the in-memory cache
   * if special care is not taken
   */
  adapter: DatabaseAdapterCompat

  schema: AppSchema

  collections: CollectionMap

  modelClasses: Class<Model>[]

  _workQueue: WorkQueue = new WorkQueue(this)

  // (experimental) if true, Database is in a broken state and should not be used anymore
  _isBroken: boolean = false

  _localStorage: LocalStorage

  _recordIdStrategy: RecordIdStrategy = 'uuidv4'

  _recordIdGenerator: () => string = createRecordIdGenerator('uuidv4')

  _timestampsConfig: {| mode: TimestampMode, timezoneSource: TimezoneSource |} = {
    mode: 'epoch+timezone',
    timezoneSource: 'device',
  }

  constructor(options: DatabaseProps): void {
    const { adapter, modelClasses, recordIds = {}, timestamps = {} } = options
    if (process.env.NODE_ENV !== 'production') {
      invariant(adapter, `Missing adapter parameter for new Database()`)
      invariant(
        modelClasses && Array.isArray(modelClasses),
        `Missing modelClasses parameter for new Database()`,
      )
      invariant(
        !recordIds.strategy || ['uuidv4', 'uuidv7'].includes(recordIds.strategy),
        `Invalid recordIds.strategy '${String(recordIds.strategy)}'. Valid values: uuidv4, uuidv7`,
      )
      invariant(
        !timestamps.mode || ['epoch', 'epoch+timezone'].includes(timestamps.mode),
        `Invalid timestamps.mode '${String(
          timestamps.mode,
        )}'. Valid values: epoch, epoch+timezone`,
      )
    }

    this._recordIdStrategy = recordIds.strategy || 'uuidv4'
    this._recordIdGenerator = createRecordIdGenerator(this._recordIdStrategy)
    this._timestampsConfig = {
      mode: timestamps.mode || 'epoch+timezone',
      timezoneSource: timestamps.timezoneSource || 'device',
    }

    this.adapter = new DatabaseAdapterCompat(adapter)
    this.schema = adapter.schema
    this.collections = new CollectionMap(this, modelClasses)
    // Expose model classes for auto-hook generation in react layer
    this.modelClasses = modelClasses
  }

  /**
   * Returns a `Collection` for a given table name
   */
  get<T: Model>(tableName: TableName<T>): Collection<T> {
    return this.collections.get(tableName)
  }

  /**
   * Returns a `LocalStorage` (HypertillDB-based localStorage/AsyncStorage alternative)
   */
  get localStorage(): LocalStorage {
    if (!this._localStorage) {
      const LocalStorageClass = require('./LocalStorage').default
      this._localStorage = new LocalStorageClass(this)
    }
    return this._localStorage
  }

  _generateRecordId(): string {
    return this._recordIdGenerator()
  }

  _nextTimestamp(): {| epochMs: number, timezone: string |} {
    return {
      epochMs: Date.now(),
      timezone: resolveTimezone(this._timestampsConfig.timezoneSource),
    }
  }

  _timestampsMode(): TimestampMode {
    return this._timestampsConfig.mode
  }

  /*:: batch: ArrayOrSpreadFn<?Model | false, Promise<void>>  */
  /**
   * Executes multiple prepared operations
   *
   * Pass a list (or array) of operations like so:
   * - `collection.prepareCreate(...)`
   * - `record.prepareUpdate(...)`
   * - `record.prepareMarkAsDeleted()` (or `record.prepareDestroyPermanently()`)
   *
   * Note that falsy values (null, undefined, false) passed to batch are simply ignored
   * so you can use patterns like `.batch(condition && record.prepareUpdate(...))` for convenience.
   *
   * Note: This method must be called within a Writer {@link Database#write}.
   */
  // $FlowFixMe
  async batch(...records: Array<?Model | false>): Promise<void> {
    const actualRecords: Array<?Model> = fromArrayOrSpread(records, 'Database.batch', 'Model')

    this._ensureInWriter(`Database.batch()`)

    // performance critical - using mutations
    const batchOperations: BatchOperation[] = []
    const changeNotifications: { [TableName<any>]: CollectionChangeSet<Model> } = {}
    actualRecords.forEach((record) => {
      if (!record) {
        return
      }

      const preparedState = record._preparedState
      if (!preparedState) {
        invariant(record._raw._status !== 'disposable', `Cannot batch a disposable record`)
        throw new Error(`Cannot batch a record that doesn't have a prepared create/update/delete`)
      }

      const raw = record._raw
      const { id } = raw // faster than Model.id
      const { table } = record.constructor // faster than Model.table

      let changeType

      if (preparedState === 'update') {
        batchOperations.push(['update', table, raw])
        changeType = 'updated'
      } else if (preparedState === 'create') {
        batchOperations.push(['create', table, raw])
        changeType = 'created'
      } else if (preparedState === 'markAsDeleted') {
        const tableSchema = this.schema.tables[table]
        if (tableSchema && (tableSchema.columns.deleted_at || tableSchema.columns.deleted_tz)) {
          batchOperations.push(['update', table, raw])
        } else {
          batchOperations.push(['markAsDeleted', table, id])
        }
        changeType = 'destroyed'
      } else if (preparedState === 'destroyPermanently') {
        batchOperations.push(['destroyPermanently', table, id])
        changeType = 'destroyed'
      } else {
        invariant(false, 'bad preparedState')
      }

      if (preparedState !== 'create') {
        // We're (unsafely) assuming that batch will succeed and removing the "pending" state so that
        // subsequent changes to the record don't trip up the invariant
        // TODO: What if this fails?
        record._preparedState = null
      }

      if (!changeNotifications[table]) {
        changeNotifications[table] = []
      }
      changeNotifications[table].push({ record, type: changeType })
    })

    await this.adapter.batch(batchOperations)

    // Debug info
    if (this.experimentalIsVerbose) {
      const debugInfo = batchOperations
        .map(([type, table, rawOrId]) => {
          switch (type) {
            case 'create':
            case 'update':
              return `${type} ${table}#${(rawOrId: any).id}`
            case 'markAsDeleted':
            case 'destroyPermanently':
              return `${type} ${table}#${(rawOrId: any)}`
            default:
              return `${type}???`
          }
        })
        .join(', ')
      logger.debug(`batch: ${debugInfo}`)
    }

    // NOTE: We must make two passes to ensure all changes to caches are applied before subscribers are called
    const changes: [TableName<any>, CollectionChangeSet<any>][] = (Object.entries(
      changeNotifications,
    ): any)

    changes.forEach(([table, changeSet]) => {
      this.collections.get(table)._applyChangesToCache(changeSet)
    })

    this._notify(changes)

    return undefined // shuts up flow
  }

  _pendingNotificationBatches: number = 0
  _pendingNotificationChanges: [TableName<any>, CollectionChangeSet<any>][][] = []

  _notify(changes: [TableName<any>, CollectionChangeSet<any>][]): void {
    if (this._pendingNotificationBatches > 0) {
      this._pendingNotificationChanges.push(changes)
      return
    }

    const affectedTables = new Set(changes.map(([table]) => table))

    const databaseChangeNotifySubscribers = ([tables, subscriber]: [
      Array<TableName<any>>,
      () => void,
      any,
    ]): void => {
      if (tables.some((table) => affectedTables.has(table))) {
        subscriber()
      }
    }
    this._subscribers.forEach(databaseChangeNotifySubscribers)

    changes.forEach(([table, changeSet]) => {
      this.collections.get(table)._notify(changeSet)
    })
  }

  async experimentalBatchNotifications<T>(work: () => Promise<T>): Promise<T> {
    // TODO: Document & add tests if this proves useful
    try {
      this._pendingNotificationBatches += 1
      const result = await work()
      return result
    } finally {
      this._pendingNotificationBatches -= 1
      if (this._pendingNotificationBatches === 0) {
        const changes = this._pendingNotificationChanges
        this._pendingNotificationChanges = []
        changes.forEach((_changes) => this._notify(_changes))
      }
    }
  }

  /**
   * Schedules a Writer
   *
   * Writer is a block of code, inside of which you can modify the database
   * (call `Collection.create`, `Model.update`, `Database.batch` and so on).
   *
   * In a Writer, you're guaranteed that no other Writer is simultaneously executing. Therefore, you
   * can rely on the results of queries and other asynchronous operations - they won't change for
   * the duration of this Writer (except if changed by it).
   *
   * To call another Writer (or Reader) from this one without deadlocking, use `callWriter`
   * (or `callReader`).
   *
   * See docs for more details and a practical guide.
   *
   * @param work - Block of code to execute
   * @param [description] - Debug description of this Writer
   */
  write<T>(work: (WriterInterface) => Promise<T>, description?: string): Promise<T> {
    return this._workQueue.enqueue(work, description, true)
  }

  /**
   * Schedules a Reader
   *
   * In a Reader, you're guaranteed that no Writer is running at the same time. Therefore, you can
   * run many queries or other asynchronous operations, and you can rely on their results - they
   * won't change for the duration of this Reader. However, other Readers might run concurrently.
   *
   * To call another Reader from this one, use `callReader`
   *
   * See docs for more details and a practical guide.
   *
   * @param work - Block of code to execute
   * @param [description] - Debug description of this Reader
   */
  read<T>(work: (ReaderInterface) => Promise<T>, description?: string): Promise<T> {
    return this._workQueue.enqueue(work, description, false)
  }

  /**
   * Returns an `Observable` that emits a signal (`null`) immediately, and on every change in
   * any of the passed tables.
   *
   * A set of changes made is passed with the signal, with an array of changes per-table
   * (Currently, if changes are made to multiple different tables, multiple signals will be emitted,
   * even if they're made with a batch. However, this behavior might change. Use Rx to debounce,
   * throttle, merge as appropriate for your use case.)
   *
   * Warning: You can easily introduce performance bugs in your application by using this method
   * inappropriately.
   */
  withChangesForTables(tables: TableName<any>[]): Observable<CollectionChangeSet<any> | null> {
    const changesSignals = tables.map((table) => this.collections.get(table).changes)

    return merge$(...changesSignals).pipe(startWith(null))
  }

  _subscribers: [TableName<any>[], () => void, any][] = []

  /**
   * Notifies `subscriber` on change in any of the passed tables.
   *
   * A single notification will be sent per `database.batch()` call.
   * (Currently, no details about the changes made are provided, only a signal, but this behavior
   * might change. Currently, subscribers are called before `withChangesForTables`).
   *
   * Warning: You can easily introduce performance bugs in your application by using this method
   * inappropriately.
   */
  experimentalSubscribe(
    tables: TableName<any>[],
    subscriber: () => void,
    debugInfo?: any,
  ): Unsubscribe {
    if (!tables.length) {
      return noop
    }

    const entry = [tables, subscriber, debugInfo]
    this._subscribers.push(entry)

    return () => {
      const idx = this._subscribers.indexOf(entry)
      idx !== -1 && this._subscribers.splice(idx, 1)
    }
  }

  _resetCount: number = 0

  _isBeingReset: boolean = false

  /**
   * Resets the database
   *
   * This permanently deletes the database (all records, metadata, and `LocalStorage`) and sets
   * up an empty database.
   *
   * Special care must be taken to safely reset the database. Ideally, you should reset your app
   * to an empty / "logging out" state while doing this. Specifically:
   *
   * - You MUST NOT hold onto Hypertill records other than this `Database`. Do not keep references
   *   to records, collections, or any other objects from before database reset
   * - You MUST NOT observe any Hypertill state. All Database, Collection, Query, and Model
   *   observers/subscribers should be disposed of before resetting
   * - You SHOULD NOT have any pending (queued) Readers or Writers. Pending work will be aborted
   *   (rejected with an error)
   */
  async unsafeResetDatabase(): Promise<void> {
    this._ensureInWriter(`Database.unsafeResetDatabase()`)
    try {
      this._isBeingReset = true
      // First kill actions, to ensure no more traffic to adapter happens
      this._workQueue._abortPendingWork()

      // Kill ability to call adapter methods during reset (to catch bugs if someone does this)
      const { adapter } = this
      const ErrorAdapter = require('../adapters/error').default
      this.adapter = (new ErrorAdapter(): any)

      // Check for illegal subscribers
      if (this._subscribers.length) {
        // TODO: This should be an error, not a console.log, but actually useful diagnostics are necessary for this to work, otherwise people will be confused
        // eslint-disable-next-line no-console
        console.log(
          `Application error! Unexpected ${this._subscribers.length} Database subscribers were detected during database.unsafeResetDatabase() call. App should not hold onto subscriptions or Hypertill objects while resetting database.`,
        )
        // eslint-disable-next-line no-console
        console.log(this._subscribers)
        this._subscribers = []
      }

      // Clear the database
      await adapter.unsafeResetDatabase()

      // Only now clear caches, since there may have been queued fetches from DB still bringing in items to cache
      Object.values(this.collections.map).forEach((collection) => {
        // $FlowFixMe
        collection._cache.unsafeClear()
      })

      // Restore working Database
      this._resetCount += 1
      this.adapter = adapter
    } finally {
      this._isBeingReset = false
    }
  }

  // (experimental) if true, Models will print to console diagnostic information on every
  // prepareCreate/Update/Delete call, as well as on commit (Database.batch() call). Note that this
  // has a significant performance impact so should only be enabled when debugging.
  experimentalIsVerbose: boolean = false

  _ensureInWriter(debugName: string): void {
    invariant(
      this._workQueue.isWriterRunning,
      `${debugName} can only be called from inside of a Writer. See docs for more details.`,
    )
  }

  // (experimental) puts Database in a broken state
  // TODO: Not used anywhere yet
  _fatalError(error: Error): void {
    if (!experimentalAllowsFatalError) {
      logger.warn(
        'Database is now broken, but experimentalAllowsFatalError has not been enabled to do anything about it...',
      )
      return
    }

    this._isBroken = true
    logger.error('Database is broken. App must be reloaded before continuing.')

    // TODO: Passing this to an adapter feels wrong, but it's tricky.
    // $FlowFixMe
    if (this.adapter.underlyingAdapter._fatalError) {
      // $FlowFixMe
      this.adapter.underlyingAdapter._fatalError(error)
    }
  }
}
