import { ok, err } from '@trailhead/core';
import type {
  DatabaseAdapter,
  DatabaseConnection,
  ConnectionOptions,
  DbResult,
  QueryResult,
  Migration,
  TransactionOptions,
} from '../types.js';

// ========================================
// Memory Database Adapter
// ========================================

export const createMemoryAdapter = (): DatabaseAdapter => {
  const databases = new Map<string, MemoryDatabase>();

  const connect = async (
    url: string,
    options: ConnectionOptions
  ): Promise<DbResult<DatabaseConnection>> => {
    try {
      const dbName = extractDatabaseName(url);

      if (!databases.has(dbName)) {
        databases.set(dbName, createMemoryDatabase());
      }

      const connection: DatabaseConnection = {
        id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url,
        options,
        isConnected: true,
        metadata: {
          driver: 'memory',
          version: '1.0.0',
          connectedAt: new Date(),
          lastActivity: new Date(),
          queryCount: 0,
          errorCount: 0,
        },
      };

      return ok(connection);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        code: 'CONNECTION_FAILED',
        message: 'Failed to create memory database connection',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const disconnect = async (connection: DatabaseConnection): Promise<DbResult<void>> => {
    try {
      // For memory databases, we don't need to do anything special
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        code: 'DISCONNECT_FAILED',
        message: 'Failed to disconnect from memory database',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const execute = async (
    connection: DatabaseConnection,
    sql: string,
    params: readonly unknown[] = []
  ): Promise<DbResult<QueryResult>> => {
    try {
      const startTime = Date.now();
      const dbName = extractDatabaseName(connection.url);
      const db = databases.get(dbName);

      if (!db) {
        return err({
          type: 'DatabaseError',
          code: 'DATABASE_NOT_FOUND',
          message: `Memory database ${dbName} not found`,
          recoverable: false,
        } as any);
      }

      // Simple SQL parsing for memory database
      const result = await executeQuery(db, sql, params);

      const queryResult: QueryResult = {
        rows: result.rows,
        rowCount: result.rows.length,
        insertId: result.insertId,
        metadata: {
          sql,
          params,
          duration: Date.now() - startTime,
          rowCount: result.rows.length,
          timestamp: new Date(),
        },
      };

      return ok(queryResult);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        code: 'QUERY_FAILED',
        message: 'Query execution failed',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const transaction = async (
    connection: DatabaseConnection,
    fn: (connection: DatabaseConnection) => Promise<DbResult<unknown>>,
    options: TransactionOptions = {}
  ): Promise<DbResult<unknown>> => {
    try {
      // For memory database, transactions are simplified
      // In a real implementation, this would handle rollback/commit
      return await fn(connection);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        code: 'TRANSACTION_FAILED',
        message: 'Transaction failed',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const migrate = async (
    connection: DatabaseConnection,
    migration: Migration
  ): Promise<DbResult<void>> => {
    try {
      // Simple migration execution
      const schemaBuilder = createSchemaBuilder();
      const result = await migration.up(schemaBuilder);

      if (result.isErr()) {
        return result;
      }

      return ok(undefined);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        code: 'MIGRATION_FAILED',
        message: `Migration ${migration.name} failed`,
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  return {
    driver: 'memory',
    connect,
    disconnect,
    execute,
    transaction,
    migrate,
  };
};

// ========================================
// Memory Database Implementation
// ========================================

interface MemoryDatabase {
  tables: Map<string, MemoryTable>;
  autoIncrement: number;
}

interface MemoryTable {
  name: string;
  columns: readonly string[];
  rows: Record<string, unknown>[];
  primaryKey?: string;
}

const createMemoryDatabase = (): MemoryDatabase => ({
  tables: new Map(),
  autoIncrement: 1,
});

const extractDatabaseName = (url: string): string => {
  // Extract database name from URL (e.g., "memory://test" -> "test")
  const match = url.match(/memory:\/\/(.+)/);
  return match ? match[1] : 'default';
};

const executeQuery = async (
  db: MemoryDatabase,
  sql: string,
  params: readonly unknown[]
): Promise<{ rows: Record<string, unknown>[]; insertId?: number }> => {
  const normalizedSql = sql.trim().toLowerCase();

  if (normalizedSql.startsWith('select')) {
    return executeSelect(db, sql, params);
  } else if (normalizedSql.startsWith('insert')) {
    return executeInsert(db, sql, params);
  } else if (normalizedSql.startsWith('update')) {
    return executeUpdate(db, sql, params);
  } else if (normalizedSql.startsWith('delete')) {
    return executeDelete(db, sql, params);
  } else if (normalizedSql.startsWith('create table')) {
    return executeCreateTable(db, sql, params);
  } else {
    // For other queries, return empty result
    return { rows: [] };
  }
};

const executeSelect = async (
  db: MemoryDatabase,
  sql: string,
  params: readonly unknown[]
): Promise<{ rows: Record<string, unknown>[] }> => {
  // Simple SELECT implementation
  // In a real implementation, this would parse the SQL properly
  const match = sql.match(/FROM\s+(\w+)/i);
  if (!match) {
    return { rows: [] };
  }

  const tableName = match[1];
  const table = db.tables.get(tableName);

  if (!table) {
    return { rows: [] };
  }

  return { rows: [...table.rows] };
};

const executeInsert = async (
  db: MemoryDatabase,
  sql: string,
  params: readonly unknown[]
): Promise<{ rows: Record<string, unknown>[]; insertId: number }> => {
  // Simple INSERT implementation
  const match = sql.match(/INSERT INTO\s+(\w+)/i);
  if (!match) {
    return { rows: [], insertId: 0 };
  }

  const tableName = match[1];
  const table = db.tables.get(tableName);

  if (!table) {
    return { rows: [], insertId: 0 };
  }

  const insertId = db.autoIncrement++;
  const row = { id: insertId, ...Object.fromEntries(params.map((p, i) => [`col${i}`, p])) };

  table.rows.push(row);

  return { rows: [row], insertId };
};

const executeUpdate = async (
  db: MemoryDatabase,
  sql: string,
  params: readonly unknown[]
): Promise<{ rows: Record<string, unknown>[] }> => {
  // Simple UPDATE implementation
  return { rows: [] };
};

const executeDelete = async (
  db: MemoryDatabase,
  sql: string,
  params: readonly unknown[]
): Promise<{ rows: Record<string, unknown>[] }> => {
  // Simple DELETE implementation
  return { rows: [] };
};

const executeCreateTable = async (
  db: MemoryDatabase,
  sql: string,
  params: readonly unknown[]
): Promise<{ rows: Record<string, unknown>[] }> => {
  // Simple CREATE TABLE implementation
  const match = sql.match(/CREATE TABLE\s+(\w+)/i);
  if (!match) {
    return { rows: [] };
  }

  const tableName = match[1];
  const table: MemoryTable = {
    name: tableName,
    columns: ['id'], // Simplified
    rows: [],
    primaryKey: 'id',
  };

  db.tables.set(tableName, table);

  return { rows: [] };
};

const createSchemaBuilder = () => {
  return {
    createTable: () => ok(undefined),
    dropTable: () => ok(undefined),
    alterTable: () => ok(undefined),
    createIndex: () => ok(undefined),
    dropIndex: () => ok(undefined),
    raw: () => ok(undefined),
    toSQL: () => [],
    execute: async () => ok(undefined),
  };
};
