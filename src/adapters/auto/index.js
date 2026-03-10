// @flow

import type { AppSchema } from '../../Schema'
import type { SchemaMigrations } from '../../Schema/migrations'
import type { DatabaseAdapter } from '../type'
import type { SQLiteAdapterOptions } from '../sqlite/type'
import type { LokiAdapterOptions } from '../lokijs'

import SQLiteAdapter from '../sqlite'
import { withDefaultMetadataColumns } from './metadata'

export type PlatformAdapterOptions = $Exact<{
  schema: AppSchema,
  migrations?: SchemaMigrations,
  dbName?: string,
  sqlite?: $Shape<SQLiteAdapterOptions>,
  loki?: $Shape<LokiAdapterOptions>,
}>

export function createPlatformAdapter(options: PlatformAdapterOptions): DatabaseAdapter {
  const { schema, migrations, dbName, sqlite = {} } = options
  const normalizedSchema = withDefaultMetadataColumns(schema)
  const sqliteOptions: $Shape<SQLiteAdapterOptions> = {
    ...sqlite,
    schema: normalizedSchema,
  }

  if (migrations && !sqliteOptions.migrations) {
    sqliteOptions.migrations = migrations
  }
  if (dbName && !sqliteOptions.dbName) {
    sqliteOptions.dbName = dbName
  }

  return new SQLiteAdapter((sqliteOptions: any))
}

export default createPlatformAdapter
