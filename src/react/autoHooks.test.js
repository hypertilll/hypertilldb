const Q = require('../QueryDescription')
const { appSchema, tableSchema } = require('../Schema')
const { _internal } = require('./autoHooks')

describe('autoHooks simple query builder', () => {
  const Note = class Note {}
  Note.table = 'notes'

  const makeDatabase = (columns) => {
    const schema = appSchema({
      version: 1,
      tables: [
        tableSchema({
          name: 'notes',
          columns,
        }),
      ],
    })
    return { schema }
  }

  const fixedNow = 1_700_000_000_000
  const oneDay = 24 * 60 * 60 * 1000

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('builds search, timeframe, and sort clauses using schema columns', () => {
    const database = makeDatabase([
      { name: 'title', type: 'string' },
      { name: 'body', type: 'string' },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ])

    const clauses = _internal.buildSimpleClauses(database, Note, {
      search: 'hello',
      timeframe: '7d',
      sort: 'created_asc',
    })

    expect(clauses).toEqual([
      Q.or(Q.where('title', Q.like('%hello%')), Q.where('body', Q.like('%hello%'))),
      Q.where('updated_at', Q.gte(fixedNow - 7 * oneDay)),
      Q.sortBy('created_at', Q.asc),
    ])
  })

  it('respects searchIn and falls back to created_at for timeframe when updated_at is missing', () => {
    const database = makeDatabase([
      { name: 'title', type: 'string' },
      { name: 'body', type: 'string' },
      { name: 'created_at', type: 'number' },
    ])

    const clauses = _internal.buildSimpleClauses(database, Note, {
      search: 'note',
      searchIn: ['title'],
      timeframe: '24h',
      sort: 'updated_desc',
    })

    expect(clauses).toEqual([
      Q.where('title', Q.like('%note%')),
      Q.where('created_at', Q.gte(fixedNow - oneDay)),
      Q.sortBy('created_at', Q.desc),
    ])
  })
})

describe('autoHooks registry', () => {
  it('registers singular, plural, and advanced hooks for models', () => {
    class Book {}
    Book.table = 'books'
    class Category {}
    Category.table = 'categories'

    const registry = _internal.getRegistry({ modelClasses: [Book, Category] })
    const keys = Array.from(registry.keys()).sort()

    expect(keys).toEqual([
      'useBook',
      'useBooks',
      'useBooksAdvanced',
      'useCategories',
      'useCategoriesAdvanced',
      'useCategory',
    ])
  })
})

describe('autoHooks advanced query helpers', () => {
  it('builds advanced clauses from both static clauses and a q builder', () => {
    const clauses = _internal.buildAdvancedClauses({
      clauses: [Q.where('status', 'pending')],
      q: (queryQ) => [queryQ.sortBy('updated_at', queryQ.desc)],
    })

    expect(clauses).toEqual([
      Q.where('status', 'pending'),
      Q.sortBy('updated_at', Q.desc),
    ])
  })

  it('uses explicit inputs instead of function identity when provided', () => {
    const q = () => [Q.where('status', 'pending')]
    const inputs = ['pending', 123]

    expect(_internal.resolveAdvancedInputs({ q, inputs })).toEqual(inputs)
  })

  it('falls back to q and clauses identity when explicit inputs are omitted', () => {
    const clauses = [Q.where('status', 'pending')]
    const q = () => [Q.sortBy('updated_at', Q.desc)]

    expect(_internal.resolveAdvancedInputs({ clauses, q })).toEqual([clauses, q])
  })
})
