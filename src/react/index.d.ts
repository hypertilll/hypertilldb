import type Model from '../Model'
import type { RecordId } from '../Model'
import type { Clause } from '../QueryDescription'
import type { Class } from '../types'

export { default as DatabaseContext } from './DatabaseContext'
export { default as withDatabase } from './withDatabase'
export { default as DatabaseProvider } from './DatabaseProvider'
export { default as useDatabase } from './useDatabase'
// export { default as withHooks } from './withHooks' // TODO: Add TS types
export { default as compose } from './compose'
export { default as withObservables, ExtractedObservables } from './withObservables'
// export { default as WithObservables } from './WithObservablesComponent' // TODO: Add TS types

export type Timeframe = 'all' | '24h' | '7d' | '30d'
export type SortOption = 'updated_desc' | 'updated_asc' | 'created_desc' | 'created_asc'

export type SimpleQueryOptions = {
  search?: string
  searchIn?: string[]
  timeframe?: Timeframe
  sort?: SortOption
}

export type AdvancedQueryOptions = {
  clauses?: Clause[]
  inputs?: unknown[]
  observeWithColumns?: string[]
  q?: (Q: typeof import('../QueryDescription')) => Clause[]
}

export type HookResult<T> = {
  data: T
  loading: boolean
  error: Error | null
  count?: number
}

export interface Hooks {
  useModel<T extends Model>(modelClass: Class<T>, id: RecordId | null | undefined): HookResult<T | null>
  useModels<T extends Model>(modelClass: Class<T>, options?: SimpleQueryOptions): HookResult<T[]>
  useModelsAdvanced<T extends Model>(modelClass: Class<T>, options?: AdvancedQueryOptions): HookResult<T[]>
  [key: string]: any
}

export const hooks: Hooks
