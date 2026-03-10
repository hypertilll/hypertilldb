import type { AppSchema } from '../../Schema'
import type { SchemaMigrations } from '../../Schema/migrations'
import type { DatabaseAdapter } from '../type'
import type { SQLiteAdapterOptions } from '../sqlite/type'
import type { LokiAdapterOptions } from '../lokijs'

import { $Exact, $Shape } from '../../types'

export type PlatformAdapterOptions = $Exact<{
  schema: AppSchema
  migrations?: SchemaMigrations
  dbName?: string
  sqlite?: $Shape<SQLiteAdapterOptions>
  loki?: $Shape<LokiAdapterOptions>
}>

export function createPlatformAdapter(options: PlatformAdapterOptions): DatabaseAdapter

export default createPlatformAdapter
