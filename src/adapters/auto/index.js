// @flow

import { appSchema, tableSchema, type AppSchema } from '../../Schema'
import type { SchemaMigrations } from '../../Schema/migrations'
import type { DatabaseAdapter } from '../type'
import type { SQLiteAdapterOptions } from '../sqlite/type'
import type { LokiAdapterOptions } from '../lokijs'

import SQLiteAdapter from '../sqlite'

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

const METADATA_COLUMNS = [
  { name: 'deleted_at', type: 'number', isOptional: true },
  { name: 'created_tz', type: 'string', isOptional: true },
  { name: 'updated_tz', type: 'string', isOptional: true },
  { name: 'deleted_tz', type: 'string', isOptional: true },
]

function withDefaultMetadataColumns(schema: AppSchema): AppSchema {
  const tableList = Object.keys(schema.tables).map((tableName) => {
    const table = schema.tables[tableName]
    const columns = table.columnArray.slice()
    METADATA_COLUMNS.forEach((column) => {
      if (!table.columns[column.name]) {
        columns.push(column)
      }
    })
    return tableSchema({
      name: table.name,
      columns,
      unsafeSql: table.unsafeSql,
    })
  })

  return appSchema({
    version: schema.version,
    tables: tableList,
    unsafeSql: schema.unsafeSql,
  })
}
