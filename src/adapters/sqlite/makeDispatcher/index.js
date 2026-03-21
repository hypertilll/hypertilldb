// @flow
/* eslint-disable global-require */

import DatabaseBridge from '../sqlite-node/DatabaseBridge'
import { type ConnectionTag } from '../../../utils/common'
import { type ResultCallback } from '../../../utils/fp/Result'
import type {
  DispatcherType,
  SQLiteAdapterOptions,
  SqliteDispatcher,
  SqliteDispatcherMethod,
  SqliteDispatcherOptions,
} from '../type'

class SqliteNodeDispatcher implements SqliteDispatcher {
  _tag: ConnectionTag

  constructor(tag: ConnectionTag): void {
    this._tag = tag
  }

  call(methodName: SqliteDispatcherMethod, args: any[], callback: ResultCallback<any>): void {
    // $FlowFixMe
    const method = DatabaseBridge[methodName].bind(DatabaseBridge)
    method(
      this._tag,
      ...args,
      (value) => callback({ value }),
      (_code, message, error) => callback({ error: normalizeError(error, message) }),
    )
  }
}

function normalizeError(error: any, fallbackMessage?: string): Error {
  if (error instanceof Error) {
    return error
  }

  const message =
    (error && typeof error.message === 'string' && error.message) ||
    fallbackMessage ||
    'Unknown SQLite error'
  const normalizedError: any = new Error(message)

  if (error && typeof error === 'object') {
    if (typeof error.name === 'string') {
      normalizedError.name = error.name
    } else if (error.constructor && typeof error.constructor.name === 'string') {
      normalizedError.name = error.constructor.name
    }

    Object.keys(error).forEach((key) => {
      normalizedError[key] = error[key]
    })
  }

  return normalizedError
}

export const makeDispatcher = (
  _type: DispatcherType,
  tag: ConnectionTag,
  _dbName: string,
  _options: SqliteDispatcherOptions,
): SqliteDispatcher => {
  return new SqliteNodeDispatcher(tag)
}

export function getDispatcherType(_options: SQLiteAdapterOptions): DispatcherType {
  return 'asynchronous'
}
