// @flow

import { appSchema, tableSchema, type AppSchema } from '../../Schema'

const METADATA_COLUMNS = [
  { name: 'deleted_at', type: 'number', isOptional: true },
  { name: 'created_tz', type: 'string', isOptional: true },
  { name: 'updated_tz', type: 'string', isOptional: true },
  { name: 'deleted_tz', type: 'string', isOptional: true },
]

export function withDefaultMetadataColumns(schema: AppSchema): AppSchema {
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
