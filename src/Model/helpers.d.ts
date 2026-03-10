import type Database from '../Database'
import type { TableSchema } from '../Schema'
import type Model from './index'
import { $Exact } from '../types'

type TimestampsObj = $Exact<{
  created_at?: number
  updated_at?: number
  deleted_at?: number | null
  created_tz?: string
  updated_tz?: string
  deleted_tz?: string | null
}>
export function createTimestampsFor(database: Database, tableSchema: TableSchema): TimestampsObj

export function fetchDescendants(model: Model): Promise<Model[]>
