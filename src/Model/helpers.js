// @flow

import { allPromises, unnest } from '../utils/fp'

import * as Q from '../QueryDescription'
import type Model from './index'
import type Query from '../Query/index'
import type Database from '../Database'
import { columnName, type TableSchema } from '../Schema'

type TimestampsObj = $Exact<{
  created_at?: number,
  updated_at?: number,
  deleted_at?: ?number,
  created_tz?: string,
  updated_tz?: string,
  deleted_tz?: ?string,
}>

function hasColumn(tableSchema: TableSchema, name: string): boolean {
  return Boolean(tableSchema.columns[columnName(name)])
}

export const createTimestampsFor = (database: Database, tableSchema: TableSchema): TimestampsObj => {
  const { epochMs, timezone } = database._nextTimestamp()
  const timestamps: $Shape<TimestampsObj> = {}
  const includeTimezone = database._timestampsMode() === 'epoch+timezone'

  if (hasColumn(tableSchema, 'created_at')) {
    timestamps.created_at = epochMs
  }

  if (hasColumn(tableSchema, 'updated_at')) {
    timestamps.updated_at = epochMs
  }

  if (hasColumn(tableSchema, 'deleted_at')) {
    timestamps.deleted_at = null
  }

  if (includeTimezone && hasColumn(tableSchema, 'created_tz')) {
    timestamps.created_tz = timezone
  }

  if (includeTimezone && hasColumn(tableSchema, 'updated_tz')) {
    timestamps.updated_tz = timezone
  }

  if (includeTimezone && hasColumn(tableSchema, 'deleted_tz')) {
    timestamps.deleted_tz = null
  }

  return (timestamps: any)
}

function getChildrenQueries(model: Model): Query<Model>[] {
  const associationsList: Array<[any, any]> = Object.entries(model.constructor.associations)
  const hasManyAssociations = associationsList.filter(([, value]) => value.type === 'has_many')
  const childrenQueries = hasManyAssociations.map(([key, value]) => {
    const childCollection = model.collections.get(key)
    return childCollection.query(Q.where(value.foreignKey, model.id))
  })
  return childrenQueries
}

async function fetchDescendantsInner(model: Model): Promise<Model[]> {
  const childPromise = async (query: Query<Model>) => {
    const children = await query.fetch()
    const grandchildren = await allPromises(fetchDescendantsInner, children)
    return unnest(grandchildren).concat(children)
  }
  const childrenQueries = getChildrenQueries(model)
  const results = await allPromises(childPromise, childrenQueries)
  return unnest(results)
}

export async function fetchDescendants(model: Model): Promise<Model[]> {
  const descendants = await fetchDescendantsInner(model)
  // We need to deduplicate because we can have a child accessible through multiple parents
  // TODO: Use fp/unique after updating it not to suck
  return Array.from(new Set(descendants))
}
