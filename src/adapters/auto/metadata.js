// @flow

import {
  appSchema,
  columnName,
  tableSchema,
  type AppSchema,
  type ColumnSchema,
  type TableName,
} from '../../Schema'

const METADATA_COLUMNS: ColumnSchema[] = [
  { name: columnName('deleted_at'), type: 'number', isOptional: true },
  { name: columnName('created_tz'), type: 'string', isOptional: true },
  { name: columnName('updated_tz'), type: 'string', isOptional: true },
  { name: columnName('deleted_tz'), type: 'string', isOptional: true },
]

export function withDefaultMetadataColumns(schema: AppSchema): AppSchema {
  const tableNames: TableName<any>[] = (Object.keys(schema.tables): any)
  const tableList = tableNames.map((tableName) => {
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
