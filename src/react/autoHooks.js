// @flow
import * as React from 'react'
import useDatabase from './useDatabase'
import * as Q from '../QueryDescription'
import { invariant } from '../utils/common'

import type Database from '../Database'
import type Model from '../Model'
import type { TableSchema } from '../Schema'
import type { Clause } from '../QueryDescription'
import type { Class } from '../types'

export type Timeframe = 'all' | '24h' | '7d' | '30d'
export type SortOption = 'updated_desc' | 'updated_asc' | 'created_desc' | 'created_asc'

export type SimpleQueryOptions = {|
  search?: string,
  searchIn?: string[],
  timeframe?: Timeframe,
  sort?: SortOption,
|}

export type AdvancedQueryOptions = {|
  q?: (typeof Q) => Clause[],
|}

export type HookResult<T> = {|
  data: T,
  loading: boolean,
  error: ?Error,
  count?: number,
|}

type HookSpec = {|
  kind: 'one' | 'many' | 'manyAdvanced',
  modelClass: Class<Model>,
|}

const DEFAULT_FILTERS: SimpleQueryOptions = {
  search: '',
  timeframe: 'all',
  sort: 'updated_desc',
}

const hookCache: Map<string, Function> = new Map()
const registryCache: WeakMap<Database, Map<string, HookSpec>> = new WeakMap()

function pluralize(name: string): string {
  if (/[sxz]$/.test(name) || /(ch|sh)$/.test(name)) {
    return `${name}es`
  }
  if (/[^aeiou]y$/i.test(name)) {
    return `${name.slice(0, -1)}ies`
  }
  return `${name}s`
}

function getRegistry(database: Database): Map<string, HookSpec> {
  const existing = registryCache.get(database)
  if (existing) return existing

  const registry: Map<string, HookSpec> = new Map()
  const modelClasses = database.modelClasses || []

  modelClasses.forEach((modelClass) => {
    const singular = modelClass.name
    const plural = pluralize(singular)
    registry.set(`use${singular}`, { kind: 'one', modelClass })
    registry.set(`use${plural}`, { kind: 'many', modelClass })
    registry.set(`use${plural}Advanced`, { kind: 'manyAdvanced', modelClass })
  })

  registryCache.set(database, registry)
  return registry
}

function normalizeFilters(filters?: SimpleQueryOptions): SimpleQueryOptions {
  if (!filters) return DEFAULT_FILTERS
  return {
    search: filters.search ?? DEFAULT_FILTERS.search,
    searchIn: filters.searchIn,
    timeframe: filters.timeframe ?? DEFAULT_FILTERS.timeframe,
    sort: filters.sort ?? DEFAULT_FILTERS.sort,
  }
}

function timeframeStart(timeframe: Timeframe): number | null {
  const now = Date.now()
  if (timeframe === '24h') return now - 24 * 60 * 60 * 1000
  if (timeframe === '7d') return now - 7 * 24 * 60 * 60 * 1000
  if (timeframe === '30d') return now - 30 * 24 * 60 * 60 * 1000
  return null
}

function toLikePattern(value: string): string {
  const escaped = value.trim().replace(/[%_]/g, (char) => `\\${char}`)
  return `%${escaped}%`
}

function columnExists(tableSchema: TableSchema, columnName: string): boolean {
  return Boolean(tableSchema.columns && tableSchema.columns[columnName])
}

function getStringColumns(tableSchema: TableSchema): string[] {
  return tableSchema.columnArray
    .filter((column) => column.type === 'string')
    .map((column) => column.name)
}

function resolveTimeframeColumn(tableSchema: TableSchema): string | null {
  if (columnExists(tableSchema, 'updated_at')) return 'updated_at'
  if (columnExists(tableSchema, 'created_at')) return 'created_at'
  return null
}

function resolveSortColumn(tableSchema: TableSchema, sort: SortOption): { column: string, order: any } | null {
  if (sort === 'updated_asc' && columnExists(tableSchema, 'updated_at')) {
    return { column: 'updated_at', order: Q.asc }
  }
  if (sort === 'updated_desc' && columnExists(tableSchema, 'updated_at')) {
    return { column: 'updated_at', order: Q.desc }
  }
  if (sort === 'created_asc' && columnExists(tableSchema, 'created_at')) {
    return { column: 'created_at', order: Q.asc }
  }
  if (sort === 'created_desc' && columnExists(tableSchema, 'created_at')) {
    return { column: 'created_at', order: Q.desc }
  }
  if (columnExists(tableSchema, 'updated_at')) {
    return { column: 'updated_at', order: Q.desc }
  }
  if (columnExists(tableSchema, 'created_at')) {
    return { column: 'created_at', order: Q.desc }
  }
  return null
}

function buildSimpleClauses(
  database: Database,
  modelClass: Class<Model>,
  filters?: SimpleQueryOptions,
): Clause[] {
  const normalized = normalizeFilters(filters)
  const tableSchema = database.schema.tables[modelClass.table]
  const clauses: Clause[] = []

  if (!tableSchema) return clauses

  const search = normalized.search || ''
  const trimmedSearch = search.trim()
  const searchColumns =
    normalized.searchIn && normalized.searchIn.length > 0
      ? normalized.searchIn
      : getStringColumns(tableSchema)

  if (trimmedSearch.length > 0 && searchColumns.length > 0) {
    const like = toLikePattern(trimmedSearch)
    const whereClauses = searchColumns.map((column) => Q.where(column, Q.like(like)))
    clauses.push(whereClauses.length === 1 ? whereClauses[0] : Q.or(...whereClauses))
  }

  const timeframeColumn = resolveTimeframeColumn(tableSchema)
  const from = normalized.timeframe ? timeframeStart(normalized.timeframe) : null
  if (timeframeColumn && from !== null) {
    clauses.push(Q.where(timeframeColumn, Q.gte(from)))
  }

  const sortClause = resolveSortColumn(tableSchema, normalized.sort || DEFAULT_FILTERS.sort || 'updated_desc')
  if (sortClause) {
    clauses.push(Q.sortBy(sortClause.column, sortClause.order))
  }

  return clauses
}

function useObservableState<T>(
  createObservable: () => any,
  deps: any[],
  initialValue: T,
  options?: { skip?: boolean },
): { data: T, loading: boolean, error: ?Error } {
  const skip = Boolean(options && options.skip)
  const [data, setData] = React.useState<T>(initialValue)
  const [loading, setLoading] = React.useState<boolean>(!skip)
  const [error, setError] = React.useState<?Error>(null)

  React.useEffect(() => {
    if (skip) {
      setLoading(false)
      setError(null)
      setData(initialValue)
      return undefined
    }

    setLoading(true)
    setError(null)
    const subscription = createObservable().subscribe({
      next: (value) => {
        setData(value)
        setLoading(false)
      },
      error: (err) => {
        setError(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      },
      complete: () => {
        setLoading(false)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  }, deps)

  return { data, loading, error }
}

function useModelHook<Record: Model>(
  database: Database,
  modelClass: Class<Record>,
  id: ?string,
): HookResult<?Record> {
  const collection = database.collections.get(modelClass.table)
  const { data, loading, error } = useObservableState(
    () => collection.findAndObserve(id || ''),
    [database, modelClass, id],
    null,
    { skip: !id },
  )

  return { data, loading, error }
}

function useModelsHook<Record: Model>(
  database: Database,
  modelClass: Class<Record>,
  filters?: SimpleQueryOptions,
): HookResult<Record[]> {
  const normalized = normalizeFilters(filters)
  const searchInKey =
    normalized.searchIn && normalized.searchIn.length > 0 ? normalized.searchIn.join('|') : ''
  const { data, loading, error } = useObservableState(
    () =>
      database.collections
        .get(modelClass.table)
        .query(...buildSimpleClauses(database, modelClass, normalized))
        .observe(),
    [database, modelClass, normalized.search, normalized.timeframe, normalized.sort, searchInKey],
    [],
  )

  return { data, loading, error, count: data.length }
}

function useModelsAdvancedHook<Record: Model>(
  database: Database,
  modelClass: Class<Record>,
  options?: AdvancedQueryOptions,
): HookResult<Record[]> {
  const clauseBuilder = options && options.q
  const { data, loading, error } = useObservableState(
    () =>
      database.collections
        .get(modelClass.table)
        .query(...(clauseBuilder ? clauseBuilder(Q) : []))
        .observe(),
    [database, modelClass, clauseBuilder],
    [],
  )

  return { data, loading, error, count: data.length }
}

function resolveHookByName(database: Database, hookName: string): HookSpec {
  const registry = getRegistry(database)
  const spec = registry.get(hookName)
  if (spec) return spec

  const known = Array.from(registry.keys()).sort()
  invariant(
    false,
    `Unknown hook '${hookName}'. Known hooks: ${known.length ? known.join(', ') : '(none)'}`,
  )
  // Flow: unreachable
  throw new Error('Unknown hook')
}

const baseHooks: { [string]: any } = {
  useModel: <Record: Model>(modelClass: Class<Record>, id: ?string): HookResult<?Record> => {
    const database = useDatabase()
    return useModelHook(database, modelClass, id)
  },
  useModels: <Record: Model>(
    modelClass: Class<Record>,
    filters?: SimpleQueryOptions,
  ): HookResult<Record[]> => {
    const database = useDatabase()
    return useModelsHook(database, modelClass, filters)
  },
  useModelsAdvanced: <Record: Model>(
    modelClass: Class<Record>,
    options?: AdvancedQueryOptions,
  ): HookResult<Record[]> => {
    const database = useDatabase()
    return useModelsAdvancedHook(database, modelClass, options)
  },
}

export const hooks: { [string]: any } = new Proxy(baseHooks, {
  get(target, prop) {
    if (typeof prop !== 'string') return target[prop]
    if (prop in target) return target[prop]

    const cached = hookCache.get(prop)
    if (cached) return cached

    const hookFn = (...args) => {
      const database = useDatabase()
      const spec = resolveHookByName(database, prop)
      if (spec.kind === 'one') {
        return useModelHook(database, spec.modelClass, args[0])
      }
      if (spec.kind === 'many') {
        return useModelsHook(database, spec.modelClass, args[0])
      }
      return useModelsAdvancedHook(database, spec.modelClass, args[0])
    }

    hookCache.set(prop, hookFn)
    return hookFn
  },
})

// Expose selected internals for tests only
export const _internal = {
  buildSimpleClauses,
  getRegistry,
  normalizeFilters,
  pluralize,
}
