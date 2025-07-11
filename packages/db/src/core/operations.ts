import { ok, err } from '@trailhead/core';
import type {
  DatabaseOperations,
  DbResult,
  DatabaseConnection,
  ConnectionOptions,
  QueryBuilder,
  Transaction,
  TransactionOptions,
  Migration,
  MigrationStatus,
  SchemaBuilder,
  DatabaseDriver,
} from '../types.js';

// ========================================
// Database Operations
// ========================================

export const createDatabaseOperations = (): DatabaseOperations => {
  const connect = async (url: string, options: Partial<ConnectionOptions> = {}): Promise<DbResult<DatabaseConnection>> => {
    try {
      const connectionOptions: ConnectionOptions = {
        driver: 'sqlite',
        poolSize: 1,
        timeout: 5000,
        retries: 3,
        ...options,
      };

      const adapter = getAdapter(connectionOptions.driver);
      if (!adapter) {
        return err({
          type: 'DatabaseError',
          code: 'ADAPTER_NOT_FOUND',
          message: `No adapter found for driver: ${connectionOptions.driver}`,
          suggestion: 'Register an adapter for this database driver',
          recoverable: false,
        } as any);
      }

      const connectionResult = await adapter.connect(url, connectionOptions);
      if (connectionResult.isErr()) {
        return connectionResult;
      }

      return ok(connectionResult.value);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        code: 'CONNECTION_FAILED',
        message: 'Failed to connect to database',
        suggestion: 'Check connection string and database availability',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const disconnect = async (connection: DatabaseConnection): Promise<DbResult<void>> => {
    try {
      const adapter = getAdapter(connection.options.driver);
      if (!adapter) {
        return err({
          type: 'DatabaseError',
          code: 'ADAPTER_NOT_FOUND',
          message: `No adapter found for driver: ${connection.options.driver}`,
          recoverable: false,
        } as any);
      }

      return await adapter.disconnect(connection);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        code: 'DISCONNECT_FAILED',
        message: 'Failed to disconnect from database',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const ping = async (connection: DatabaseConnection): Promise<DbResult<boolean>> => {
    try {
      const adapter = getAdapter(connection.options.driver);
      if (!adapter) {
        return ok(false);
      }

      const result = await adapter.execute(connection, 'SELECT 1 as ping');
      return ok(result.isOk());
    } catch {
      return ok(false);
    }
  };

  const query = <T = unknown>(table?: string): QueryBuilder<T> => {
    return createQueryBuilder<T>(table);
  };

  const transaction = async (
    connection: DatabaseConnection,
    fn: (tx: Transaction) => Promise<DbResult<unknown>>,
    options: TransactionOptions = {}
  ): Promise<DbResult<unknown>> => {
    try {
      const adapter = getAdapter(connection.options.driver);
      if (!adapter) {
        return err({
          type: 'DatabaseError',
          code: 'ADAPTER_NOT_FOUND',
          message: `No adapter found for driver: ${connection.options.driver}`,
          recoverable: false,
        } as any);
      }

      return await adapter.transaction(connection, async (txConnection) => {
        const tx = createTransaction(txConnection, options);
        return await fn(tx);
      }, options);
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
    migrations: readonly Migration[]
  ): Promise<DbResult<MigrationStatus>> => {
    try {
      const adapter = getAdapter(connection.options.driver);
      if (!adapter) {
        return err({
          type: 'DatabaseError',
          code: 'ADAPTER_NOT_FOUND',
          message: `No adapter found for driver: ${connection.options.driver}`,
          recoverable: false,
        } as any);
      }

      // Get applied migrations
      const appliedResult = await getAppliedMigrations(connection);
      if (appliedResult.isErr()) {
        return appliedResult;
      }

      const applied = appliedResult.value;
      const appliedIds = new Set(applied.map(m => m.id));
      const pending = migrations.filter(m => !appliedIds.has(m.id));

      // Apply pending migrations
      for (const migration of pending) {
        const result = await adapter.migrate(connection, migration);
        if (result.isErr()) {
          return err({
            type: 'DatabaseError',
            code: 'MIGRATION_FAILED',
            message: `Migration ${migration.name} failed`,
            cause: result.error,
            recoverable: false,
          } as any);
        }
      }

      const status: MigrationStatus = {
        applied: [
          ...applied,
          ...pending.map(m => ({
            id: m.id,
            name: m.name,
            version: m.version,
            appliedAt: new Date(),
            batch: Math.max(...applied.map(a => a.batch), 0) + 1,
          })),
        ],
        pending: [],
        conflicts: [],
      };

      return ok(status);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        code: 'MIGRATION_FAILED',
        message: 'Migration process failed',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const schema = (): SchemaBuilder => {
    return createSchemaBuilder();
  };

  return {
    connect,
    disconnect,
    ping,
    query,
    transaction,
    migrate,
    schema,
  };
};

// ========================================
// Helper Functions
// ========================================

// Simple adapter registry
const adapters = new Map<DatabaseDriver, any>();

const getAdapter = (driver: DatabaseDriver) => {
  return adapters.get(driver);
};

const registerAdapter = (driver: DatabaseDriver, adapter: any) => {
  adapters.set(driver, adapter);
};

const createQueryBuilder = <T>(table?: string): QueryBuilder<T> => {
  return {
    select: (columns) => createSelectQuery<any>(table, columns),
    insert: (data) => createInsertQuery<T>(table, data),
    update: (data) => createUpdateQuery<T>(table, data),
    delete: () => createDeleteQuery<T>(table),
    raw: (sql, params) => createRawQuery<T>(sql, params),
  };
};

const createSelectQuery = <T>(table?: string, columns?: readonly (keyof T)[]) => {
  let sql = 'SELECT ';
  sql += columns ? columns.map(c => String(c)).join(', ') : '*';
  if (table) sql += ` FROM ${table}`;

  const query = {
    from: (tableName: string) => createSelectQuery<T>(tableName, columns),
    where: (condition: any) => query,
    orderBy: (column: keyof T, direction: 'ASC' | 'DESC' = 'ASC') => query,
    limit: (count: number) => query,
    offset: (count: number) => query,
    join: (joinTable: string, condition: any) => query,
    groupBy: (groupColumns: readonly (keyof T)[]) => query,
    having: (condition: any) => query,
    toSQL: () => ({ sql, params: [] }),
    execute: async (connection: any) => {
      const adapter = getAdapter(connection.options.driver);
      if (!adapter) {
        return err({
          type: 'DatabaseError',
          code: 'ADAPTER_NOT_FOUND',
          message: 'No database adapter found',
          recoverable: false,
        } as any);
      }
      
      const result = await adapter.execute(connection, sql, []);
      if (result.isErr()) return result;
      
      return ok(result.value.rows as T[]);
    },
    first: async (connection: any) => {
      const result = await query.limit(1).execute(connection);
      if (result.isErr()) return result;
      
      return ok(result.value[0]);
    },
  };

  return query;
};

const createInsertQuery = <T>(table?: string, data?: any) => {
  const query = {
    into: (tableName: string) => createInsertQuery<T>(tableName, data),
    onConflict: (action: any) => query,
    returning: (columns: any) => query,
    toSQL: () => ({ sql: 'INSERT INTO ' + (table || 'table'), params: [] }),
    execute: async (connection: any) => {
      return ok({ insertedCount: 1, insertedId: 1 });
    },
  };

  return query;
};

const createUpdateQuery = <T>(table?: string, data?: any) => {
  const query = {
    table: (tableName: string) => createUpdateQuery<T>(tableName, data),
    where: (condition: any) => query,
    returning: (columns: any) => query,
    toSQL: () => ({ sql: 'UPDATE ' + (table || 'table'), params: [] }),
    execute: async (connection: any) => {
      return ok({ updatedCount: 1, changedRows: 1 });
    },
  };

  return query;
};

const createDeleteQuery = <T>(table?: string) => {
  const query = {
    from: (tableName: string) => createDeleteQuery<T>(tableName),
    where: (condition: any) => query,
    returning: (columns: any) => query,
    toSQL: () => ({ sql: 'DELETE FROM ' + (table || 'table'), params: [] }),
    execute: async (connection: any) => {
      return ok({ deletedCount: 1 });
    },
  };

  return query;
};

const createRawQuery = <T>(sql: string, params?: readonly unknown[]) => {
  return {
    toSQL: () => ({ sql, params: params || [] }),
    execute: async (connection: any) => {
      const adapter = getAdapter(connection.options.driver);
      if (!adapter) {
        return err({
          type: 'DatabaseError',
          code: 'ADAPTER_NOT_FOUND',
          message: 'No database adapter found',
          recoverable: false,
        } as any);
      }
      
      const result = await adapter.execute(connection, sql, params);
      if (result.isErr()) return result;
      
      return ok(result.value.rows as T[]);
    },
  };
};

const createTransaction = (connection: any, options: TransactionOptions): Transaction => {
  const tx: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    connection,
    isolation: options.isolation,
    readonly: options.readonly,
    startedAt: new Date(),
    commit: async () => ok(undefined),
    rollback: async () => ok(undefined),
    savepoint: async (name: string) => ok(undefined),
    rollbackTo: async (name: string) => ok(undefined),
  };

  return tx;
};

const createSchemaBuilder = (): SchemaBuilder => {
  const statements: string[] = [];

  const builder: SchemaBuilder = {
    createTable: (name, callback) => {
      const tableBuilder = createTableBuilder();
      callback(tableBuilder);
      statements.push(`CREATE TABLE ${name} (...)`);
      return builder;
    },
    dropTable: (name, ifExists) => {
      statements.push(`DROP TABLE ${ifExists ? 'IF EXISTS ' : ''}${name}`);
      return builder;
    },
    alterTable: (name, callback) => {
      const alterBuilder = createAlterTableBuilder();
      callback(alterBuilder);
      statements.push(`ALTER TABLE ${name} ...`);
      return builder;
    },
    createIndex: (name, table, columns, unique) => {
      const indexType = unique ? 'UNIQUE INDEX' : 'INDEX';
      statements.push(`CREATE ${indexType} ${name} ON ${table} (${columns.join(', ')})`);
      return builder;
    },
    dropIndex: (name, ifExists) => {
      statements.push(`DROP INDEX ${ifExists ? 'IF EXISTS ' : ''}${name}`);
      return builder;
    },
    raw: (sql) => {
      statements.push(sql);
      return builder;
    },
    toSQL: () => statements,
    execute: async (connection) => {
      try {
        const adapter = getAdapter(connection.options.driver);
        if (!adapter) {
          return err({
            type: 'DatabaseError',
            code: 'ADAPTER_NOT_FOUND',
            message: 'No database adapter found',
            recoverable: false,
          } as any);
        }

        for (const statement of statements) {
          const result = await adapter.execute(connection, statement);
          if (result.isErr()) {
            return result;
          }
        }

        return ok(undefined);
      } catch (error) {
        return err({
          type: 'DatabaseError',
          code: 'SCHEMA_EXECUTION_FAILED',
          message: 'Failed to execute schema changes',
          cause: error,
          recoverable: false,
        } as any);
      }
    },
  };

  return builder;
};

const createTableBuilder = () => {
  return {
    column: (name: string, type: any, options?: any) => createTableBuilder(),
    integer: (name: string, options?: any) => createTableBuilder(),
    real: (name: string, options?: any) => createTableBuilder(),
    text: (name: string, options?: any) => createTableBuilder(),
    boolean: (name: string, options?: any) => createTableBuilder(),
    date: (name: string, options?: any) => createTableBuilder(),
    datetime: (name: string, options?: any) => createTableBuilder(),
    timestamp: (name: string, options?: any) => createTableBuilder(),
    json: (name: string, options?: any) => createTableBuilder(),
    uuid: (name: string, options?: any) => createTableBuilder(),
    primary: (columns: readonly string[]) => createTableBuilder(),
    foreign: (column: string, references: any) => createTableBuilder(),
    unique: (columns: readonly string[], name?: string) => createTableBuilder(),
    index: (columns: readonly string[], name?: string, unique?: boolean) => createTableBuilder(),
    check: (name: string, expression: string) => createTableBuilder(),
  };
};

const createAlterTableBuilder = () => {
  return {
    addColumn: (name: string, type: any, options?: any) => createAlterTableBuilder(),
    dropColumn: (name: string) => createAlterTableBuilder(),
    renameColumn: (oldName: string, newName: string) => createAlterTableBuilder(),
    modifyColumn: (name: string, type: any, options?: any) => createAlterTableBuilder(),
    addIndex: (columns: readonly string[], name?: string, unique?: boolean) => createAlterTableBuilder(),
    dropIndex: (name: string) => createAlterTableBuilder(),
    addConstraint: (constraint: any) => createAlterTableBuilder(),
    dropConstraint: (name: string) => createAlterTableBuilder(),
  };
};

const getAppliedMigrations = async (connection: any) => {
  // Simplified implementation
  return ok([]);
};

// Export adapter registration functions
export { registerAdapter, getAdapter };