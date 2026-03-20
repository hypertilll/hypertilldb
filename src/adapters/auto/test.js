import { appSchema, tableSchema } from '../../Schema'
import Database from '../../Database'
import Model from '../../Model'
import LokiJSAdapter from '../lokijs'
import { date, readonly, text } from '../../decorators'
import { withDefaultMetadataColumns } from './metadata'

const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'auto_test',
      columns: [{ name: 'name', type: 'string' }],
    }),
  ],
})

const migrations = { migrations: [] }
const metadataColumnNames = [
  'created_at',
  'updated_at',
  'deleted_at',
  'created_tz',
  'updated_tz',
  'deleted_tz',
]

const getColumnNames = (schema) =>
  schema.tables.auto_test.columnArray.map((column) => column.name)

class AutoMetadataModel extends Model {
  static table = 'auto_test'

  @text('name') name

  @readonly
  @date('created_at')
  createdAt

  @readonly
  @date('updated_at')
  updatedAt

  @readonly
  @date('deleted_at')
  deletedAt
}

describe('createPlatformAdapter', () => {
  afterEach(() => {
    jest.resetModules()
  })

  it('creates sqlite adapter in default (node) implementation', () => {
    const sqliteMock = jest.fn((options) => ({ type: 'sqlite', options }))
    jest.doMock('../sqlite', () => sqliteMock)

    const { createPlatformAdapter } = require('./index')
    const adapter = createPlatformAdapter({
      schema,
      dbName: 'test-db',
      migrations,
    })

    expect(adapter.type).toBe('sqlite')
    expect(sqliteMock).toHaveBeenCalledTimes(1)
    const call = sqliteMock.mock.calls[0][0]
    expect(call).toEqual(
      expect.objectContaining({
        dbName: 'test-db',
        migrations,
      }),
    )
    expect(getColumnNames(call.schema)).toEqual(['name', ...metadataColumnNames])
  })

  it('creates sqlite adapter with jsi=true by default in native implementation', () => {
    const sqliteMock = jest.fn((options) => ({ type: 'sqlite', options }))
    jest.doMock('../sqlite', () => sqliteMock)

    const { createPlatformAdapter } = require('./index.native')
    createPlatformAdapter({
      schema,
    })

    expect(sqliteMock).toHaveBeenCalledTimes(1)
    const call = sqliteMock.mock.calls[0][0]
    expect(call).toEqual(
      expect.objectContaining({
        jsi: true,
      }),
    )
    expect(getColumnNames(call.schema)).toEqual(['name', ...metadataColumnNames])
  })

  it('creates loki adapter with web defaults in web implementation', () => {
    const lokiMock = jest.fn((options) => ({ type: 'loki', options }))
    jest.doMock('../lokijs', () => lokiMock)

    const { createPlatformAdapter } = require('./index.web')
    const adapter = createPlatformAdapter({
      schema,
      dbName: 'web-db',
      migrations,
    })

    expect(adapter.type).toBe('loki')
    expect(lokiMock).toHaveBeenCalledTimes(1)
    const call = lokiMock.mock.calls[0][0]
    expect(call).toEqual(
      expect.objectContaining({
        dbName: 'web-db',
        migrations,
        useWebWorker: false,
        useIncrementalIndexedDB: true,
      }),
    )
    expect(getColumnNames(call.schema)).toEqual(['name', ...metadataColumnNames])
  })

  it('makes timestamp metadata available without declaring those columns in the app schema', async () => {
    const normalizedSchema = withDefaultMetadataColumns(schema)
    const adapter = new LokiJSAdapter({
      dbName: 'auto-metadata-test',
      schema: normalizedSchema,
      useWebWorker: false,
      useIncrementalIndexedDB: false,
    })
    const database = new Database({
      adapter,
      modelClasses: [AutoMetadataModel],
    })

    let record
    await database.write(async () => {
      record = await database.get('auto_test').create((model) => {
        model.name = 'Library'
      })
    })

    expect(record.createdAt).toBeInstanceOf(Date)
    expect(record.updatedAt).toBeInstanceOf(Date)
    expect(+record.createdAt).toBe(+record.updatedAt)
    expect(record.deletedAt).toBe(null)
  })
})
