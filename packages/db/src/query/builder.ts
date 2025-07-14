import { ok, err } from '@esteban-url/core';
import type {
  QueryBuilder,
  SelectQuery,
  InsertQuery,
  UpdateQuery,
  DeleteQuery,
  RawQuery,
  WhereCondition,
  JoinCondition,
  SortDirection,
  ConflictAction,
  DbResult,
  DatabaseConnection,
  InsertResult,
  UpdateResult,
  DeleteResult,
} from '../types.js';
import { getAdapter } from '../core/operations.js';

// ========================================
// Query Builder Implementation
// ========================================

export const createQueryBuilder = <T = unknown>(table?: string): QueryBuilder<T> => {
  const select = <K extends keyof T>(columns?: readonly K[]): SelectQuery<Pick<T, K>> => {
    return createSelectQuery<Pick<T, K>>(table, columns as readonly string[]);
  };

  const insert = (data: Partial<T> | readonly Partial<T>[]): InsertQuery<T> => {
    return createInsertQuery<T>(table, data);
  };

  const update = (data: Partial<T>): UpdateQuery<T> => {
    return createUpdateQuery<T>(table, data);
  };

  const deleteQuery = (): DeleteQuery<T> => {
    return createDeleteQuery<T>(table);
  };

  const raw = (sql: string, params?: readonly unknown[]): RawQuery<T> => {
    return createRawQuery<T>(sql, params);
  };

  return {
    select,
    insert,
    update,
    delete: deleteQuery,
    raw,
  };
};

// ========================================
// Select Query Implementation
// ========================================

const createSelectQuery = <T>(
  initialTable?: string,
  initialColumns?: readonly string[]
): SelectQuery<T> => {
  let table = initialTable;
  let columns = initialColumns;
  let whereConditions: WhereCondition<any>[] = [];
  let orderByClause: { column: string; direction: SortDirection }[] = [];
  let limitClause: number | undefined;
  let offsetClause: number | undefined;
  let joinClauses: { table: string; condition: JoinCondition }[] = [];
  let groupByClause: string[] = [];
  let havingConditions: WhereCondition<any>[] = [];

  const query: SelectQuery<T> = {
    from: (tableName: string) => {
      table = tableName;
      return query;
    },

    where: (condition: WhereCondition<T>) => {
      whereConditions.push(condition);
      return query;
    },

    orderBy: (column: keyof T, direction: SortDirection = 'ASC') => {
      orderByClause.push({ column: String(column), direction });
      return query;
    },

    limit: (count: number) => {
      limitClause = count;
      return query;
    },

    offset: (count: number) => {
      offsetClause = count;
      return query;
    },

    join: (joinTable: string, condition: JoinCondition) => {
      joinClauses.push({ table: joinTable, condition });
      return query;
    },

    groupBy: (groupColumns: readonly (keyof T)[]) => {
      groupByClause = groupColumns.map(c => String(c));
      return query;
    },

    having: (condition: WhereCondition<T>) => {
      havingConditions.push(condition);
      return query;
    },

    toSQL: () => {
      let sql = 'SELECT ';
      sql += columns ? columns.join(', ') : '*';

      if (table) {
        sql += ` FROM ${table}`;
      }

      // Add JOINs
      for (const join of joinClauses) {
        sql += ` ${join.condition.type} JOIN ${join.table} ON ${join.condition.on}`;
      }

      // Add WHERE
      if (whereConditions.length > 0) {
        sql += ` WHERE ${buildWhereClause(whereConditions)}`;
      }

      // Add GROUP BY
      if (groupByClause.length > 0) {
        sql += ` GROUP BY ${groupByClause.join(', ')}`;
      }

      // Add HAVING
      if (havingConditions.length > 0) {
        sql += ` HAVING ${buildWhereClause(havingConditions)}`;
      }

      // Add ORDER BY
      if (orderByClause.length > 0) {
        const orderBy = orderByClause.map(o => `${o.column} ${o.direction}`).join(', ');
        sql += ` ORDER BY ${orderBy}`;
      }

      // Add LIMIT
      if (limitClause !== undefined) {
        sql += ` LIMIT ${limitClause}`;
      }

      // Add OFFSET
      if (offsetClause !== undefined) {
        sql += ` OFFSET ${offsetClause}`;
      }

      return { sql, params: extractParams(whereConditions.concat(havingConditions)) };
    },

    execute: async (connection: DatabaseConnection): Promise<DbResult<readonly T[]>> => {
      try {
        const { sql, params } = query.toSQL();
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
        if (result.isErr()) {
          return err(result.error);
        }

        return ok(result.value.rows as T[]);
      } catch (error) {
        return err({
          type: 'DatabaseError',
          code: 'QUERY_EXECUTION_FAILED',
          message: 'Failed to execute SELECT query',
          cause: error,
          recoverable: true,
        } as any);
      }
    },

    first: async (connection: DatabaseConnection): Promise<DbResult<T | undefined>> => {
      const limitedQuery = query.limit(1);
      const result = await limitedQuery.execute(connection);

      if (result.isErr()) {
        return err(result.error);
      }

      return ok(result.value[0]);
    },
  };

  return query;
};

// ========================================
// Insert Query Implementation
// ========================================

const createInsertQuery = <T>(
  initialTable?: string,
  initialData?: Partial<T> | readonly Partial<T>[]
): InsertQuery<T> => {
  let table = initialTable;
  let data = initialData;
  let conflictAction: ConflictAction | undefined;
  let returningColumns: string[] | undefined;

  const query: InsertQuery<T> = {
    into: (tableName: string) => {
      table = tableName;
      return query;
    },

    onConflict: (action: ConflictAction) => {
      conflictAction = action;
      return query;
    },

    returning: <K extends keyof T>(columns: readonly K[]) => {
      returningColumns = columns.map(c => String(c));
      return query as any;
    },

    toSQL: () => {
      if (!table || !data) {
        return { sql: '', params: [] };
      }

      const isArray = Array.isArray(data);
      const records = isArray ? (data as readonly Partial<T>[]) : [data as Partial<T>];

      if (records.length === 0) {
        return { sql: '', params: [] };
      }

      const columns = Object.keys(records[0] as object);
      let sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES `;

      const valuePlaceholders = records
        .map(() => `(${columns.map(() => '?').join(', ')})`)
        .join(', ');

      sql += valuePlaceholders;

      if (conflictAction) {
        switch (conflictAction) {
          case 'IGNORE':
            sql += ' ON CONFLICT DO NOTHING';
            break;
          case 'REPLACE':
            sql += ' ON DUPLICATE KEY UPDATE ';
            sql += columns.map(col => `${col} = VALUES(${col})`).join(', ');
            break;
          case 'UPDATE':
            sql += ' ON CONFLICT DO UPDATE SET ';
            sql += columns.map(col => `${col} = EXCLUDED.${col}`).join(', ');
            break;
        }
      }

      if (returningColumns && returningColumns.length > 0) {
        sql += ` RETURNING ${returningColumns.join(', ')}`;
      }

      const params = records.flatMap(record => columns.map(col => (record as any)[col]));

      return { sql, params };
    },

    execute: async (connection: DatabaseConnection): Promise<DbResult<InsertResult>> => {
      try {
        const { sql, params } = query.toSQL();
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
        if (result.isErr()) {
          return err(result.error);
        }

        const insertResult: InsertResult = {
          insertedCount: result.value.rowCount,
          insertedId: result.value.insertId,
        };

        return ok(insertResult);
      } catch (error) {
        return err({
          type: 'DatabaseError',
          code: 'QUERY_EXECUTION_FAILED',
          message: 'Failed to execute INSERT query',
          cause: error,
          recoverable: true,
        } as any);
      }
    },
  };

  return query;
};

// ========================================
// Update Query Implementation
// ========================================

const createUpdateQuery = <T>(initialTable?: string, initialData?: Partial<T>): UpdateQuery<T> => {
  let table = initialTable;
  let data = initialData;
  let whereConditions: WhereCondition<T>[] = [];
  let returningColumns: string[] | undefined;

  const query: UpdateQuery<T> = {
    table: (tableName: string) => {
      table = tableName;
      return query;
    },

    where: (condition: WhereCondition<T>) => {
      whereConditions.push(condition);
      return query;
    },

    returning: <K extends keyof T>(columns: readonly K[]) => {
      returningColumns = columns.map(c => String(c));
      return query as any;
    },

    toSQL: () => {
      if (!table || !data) {
        return { sql: '', params: [] };
      }

      const columns = Object.keys(data as object);
      let sql = `UPDATE ${table} SET `;
      sql += columns.map(col => `${col} = ?`).join(', ');

      if (whereConditions.length > 0) {
        sql += ` WHERE ${buildWhereClause(whereConditions)}`;
      }

      if (returningColumns && returningColumns.length > 0) {
        sql += ` RETURNING ${returningColumns.join(', ')}`;
      }

      const params = [...columns.map(col => (data as any)[col]), ...extractParams(whereConditions)];

      return { sql, params };
    },

    execute: async (connection: DatabaseConnection): Promise<DbResult<UpdateResult>> => {
      try {
        const { sql, params } = query.toSQL();
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
        if (result.isErr()) {
          return err(result.error);
        }

        const updateResult: UpdateResult = {
          updatedCount: result.value.rowCount,
          changedRows: result.value.rowCount,
        };

        return ok(updateResult);
      } catch (error) {
        return err({
          type: 'DatabaseError',
          code: 'QUERY_EXECUTION_FAILED',
          message: 'Failed to execute UPDATE query',
          cause: error,
          recoverable: true,
        } as any);
      }
    },
  };

  return query;
};

// ========================================
// Delete Query Implementation
// ========================================

const createDeleteQuery = <T>(initialTable?: string): DeleteQuery<T> => {
  let table = initialTable;
  let whereConditions: WhereCondition<T>[] = [];
  let returningColumns: string[] | undefined;

  const query: DeleteQuery<T> = {
    from: (tableName: string) => {
      table = tableName;
      return query;
    },

    where: (condition: WhereCondition<T>) => {
      whereConditions.push(condition);
      return query;
    },

    returning: <K extends keyof T>(columns: readonly K[]) => {
      returningColumns = columns.map(c => String(c));
      return query as any;
    },

    toSQL: () => {
      if (!table) {
        return { sql: '', params: [] };
      }

      let sql = `DELETE FROM ${table}`;

      if (whereConditions.length > 0) {
        sql += ` WHERE ${buildWhereClause(whereConditions)}`;
      }

      if (returningColumns && returningColumns.length > 0) {
        sql += ` RETURNING ${returningColumns.join(', ')}`;
      }

      const params = extractParams(whereConditions);

      return { sql, params };
    },

    execute: async (connection: DatabaseConnection): Promise<DbResult<DeleteResult>> => {
      try {
        const { sql, params } = query.toSQL();
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
        if (result.isErr()) {
          return err(result.error);
        }

        const deleteResult: DeleteResult = {
          deletedCount: result.value.rowCount,
        };

        return ok(deleteResult);
      } catch (error) {
        return err({
          type: 'DatabaseError',
          code: 'QUERY_EXECUTION_FAILED',
          message: 'Failed to execute DELETE query',
          cause: error,
          recoverable: true,
        } as any);
      }
    },
  };

  return query;
};

// ========================================
// Raw Query Implementation
// ========================================

const createRawQuery = <T>(sql: string, params?: readonly unknown[]): RawQuery<T> => {
  return {
    toSQL: () => ({ sql, params: params || [] }),

    execute: async (connection: DatabaseConnection): Promise<DbResult<readonly T[]>> => {
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

        const result = await adapter.execute(connection, sql, params);
        if (result.isErr()) {
          return err(result.error);
        }

        return ok(result.value.rows as T[]);
      } catch (error) {
        return err({
          type: 'DatabaseError',
          code: 'QUERY_EXECUTION_FAILED',
          message: 'Failed to execute raw query',
          cause: error,
          recoverable: true,
        } as any);
      }
    },
  };
};

// ========================================
// Helper Functions
// ========================================

const buildWhereClause = (conditions: WhereCondition<any>[]): string => {
  if (conditions.length === 0) return '';

  return conditions
    .map(condition => {
      if ('operator' in condition && condition.operator === 'AND') {
        return `(${buildWhereClause((condition as any).conditions)})`;
      } else if ('operator' in condition && condition.operator === 'OR') {
        return `(${buildWhereClause((condition as any).conditions)})`;
      } else if ('values' in condition) {
        const placeholders = condition.values.map(() => '?').join(', ');
        return `${String((condition as any).column)} ${condition.operator} (${placeholders})`;
      } else {
        return `${String((condition as any).column)} ${(condition as any).operator} ?`;
      }
    })
    .join(' AND ');
};

const extractParams = (conditions: WhereCondition<any>[]): unknown[] => {
  const params: unknown[] = [];

  for (const condition of conditions) {
    if ('operator' in condition && (condition.operator === 'AND' || condition.operator === 'OR')) {
      params.push(...extractParams((condition as any).conditions));
    } else if ('values' in condition) {
      params.push(...condition.values);
    } else if ('value' in condition) {
      params.push(condition.value);
    }
  }

  return params;
};
