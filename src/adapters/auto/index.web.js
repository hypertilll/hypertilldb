// @flow

import type { AppSchema } from '../../Schema'
import type { SchemaMigrations } from '../../Schema/migrations'
import type { DatabaseAdapter } from '../type'
import type { SQLiteAdapterOptions } from '../sqlite/type'
import type { LokiAdapterOptions } from '../lokijs'

import LokiJSAdapter from '../lokijs'
import { withDefaultMetadataColumns } from './metadata'

export type PlatformAdapterOptions = $Exact<{
  schema: AppSchema,
  migrations?: SchemaMigrations,
  dbName?: string,
  sqlite?: $Shape<SQLiteAdapterOptions>,
  loki?: $Shape<LokiAdapterOptions>,
}>

export function createPlatformAdapter(options: PlatformAdapterOptions): DatabaseAdapter {
  const { schema, migrations, dbName, loki = {} } = options
  const normalizedSchema = withDefaultMetadataColumns(schema)
  const lokiOptions: $Shape<LokiAdapterOptions> = {
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    ...loki,
    schema: normalizedSchema,
  }

  if (migrations && !lokiOptions.migrations) {
    lokiOptions.migrations = migrations
  }
  if (dbName && !lokiOptions.dbName) {
    lokiOptions.dbName = dbName
  }

  return new LokiJSAdapter((lokiOptions: any))
}

export default createPlatformAdapter
