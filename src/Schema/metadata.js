// @flow

import {
  appSchema,
  columnName,
  tableSchema,
  type AppSchema,
  type ColumnSchema,
  type TableName,
  type TableSchema,
  type TableSchemaSpec,
} from './index'

export const DEFAULT_METADATA_COLUMNS: ColumnSchema[] = [
  { name: columnName('created_at'), type: 'number' },
  { name: columnName('updated_at'), type: 'number' },
  { name: columnName('deleted_at'), type: 'number', isOptional: true },
  { name: columnName('created_tz'), type: 'string', isOptional: true },
  { name: columnName('updated_tz'), type: 'string', isOptional: true },
  { name: columnName('deleted_tz'), type: 'string', isOptional: true },
]

export function tableSchemaWithDefaultMetadata(schemaSpec: TableSchemaSpec): TableSchema {
  const table = tableSchema(schemaSpec)
  const columns = table.columnArray.slice()

  DEFAULT_METADATA_COLUMNS.forEach((column) => {
    if (!table.columns[column.name]) {
      columns.push(column)
    }
  })

  return tableSchema({
    name: table.name,
    columns,
    unsafeSql: table.unsafeSql,
  })
}

export function withDefaultMetadataColumns(schema: AppSchema): AppSchema {
  const tableNames: TableName<any>[] = (Object.keys(schema.tables): any)
  const tableList = tableNames.map((tableName) =>
    tableSchemaWithDefaultMetadata({
      name: schema.tables[tableName].name,
      columns: schema.tables[tableName].columnArray,
      unsafeSql: schema.tables[tableName].unsafeSql,
    }),
  )

  return appSchema({
    version: schema.version,
    tables: tableList,
    unsafeSql: schema.unsafeSql,
  })
}
