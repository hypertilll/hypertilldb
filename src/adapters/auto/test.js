import { appSchema, tableSchema } from '../../Schema'

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
    expect(sqliteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        schema,
        dbName: 'test-db',
        migrations,
      }),
    )
  })

  it('creates sqlite adapter with jsi=true by default in native implementation', () => {
    const sqliteMock = jest.fn((options) => ({ type: 'sqlite', options }))
    jest.doMock('../sqlite', () => sqliteMock)

    const { createPlatformAdapter } = require('./index.native')
    createPlatformAdapter({
      schema,
    })

    expect(sqliteMock).toHaveBeenCalledTimes(1)
    expect(sqliteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        schema,
        jsi: true,
      }),
    )
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
    expect(lokiMock).toHaveBeenCalledWith(
      expect.objectContaining({
        schema,
        dbName: 'web-db',
        migrations,
        useWebWorker: false,
        useIncrementalIndexedDB: true,
      }),
    )
  })
})
