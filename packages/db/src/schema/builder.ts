import { ok, err } from '@trailhead/core';
import type {
  SchemaBuilder,
  TableBuilder,
  AlterTableBuilder,
  ColumnOptions,
  ColumnType,
  ForeignKeyReference,
  ConstraintDefinition,
  DatabaseConnection,
  DbResult,
} from '../types.js';

// ========================================
// Schema Builder Implementation
// ========================================

export const createSchemaBuilder = (): SchemaBuilder => {
  const statements: string[] = [];

  const builder: SchemaBuilder = {
    createTable: (name: string, callback: (table: TableBuilder) => void) => {
      const tableBuilder = createTableBuilder();
      callback(tableBuilder);
      const sql = generateCreateTableSQL(name, tableBuilder);
      statements.push(sql);
      return builder;
    },

    dropTable: (name: string, ifExists = false) => {
      const sql = `DROP TABLE ${ifExists ? 'IF EXISTS ' : ''}${name}`;
      statements.push(sql);
      return builder;
    },

    alterTable: (name: string, callback: (table: AlterTableBuilder) => void) => {
      const alterBuilder = createAlterTableBuilder(name);
      callback(alterBuilder);
      const sqls = generateAlterTableSQL(alterBuilder);
      statements.push(...sqls);
      return builder;
    },

    createIndex: (name: string, table: string, columns: readonly string[], unique = false) => {
      const indexType = unique ? 'UNIQUE INDEX' : 'INDEX';
      const sql = `CREATE ${indexType} ${name} ON ${table} (${columns.join(', ')})`;
      statements.push(sql);
      return builder;
    },

    dropIndex: (name: string, ifExists = false) => {
      const sql = `DROP INDEX ${ifExists ? 'IF EXISTS ' : ''}${name}`;
      statements.push(sql);
      return builder;
    },

    raw: (sql: string) => {
      statements.push(sql);
      return builder;
    },

    toSQL: () => [...statements],

    execute: async (connection: DatabaseConnection): Promise<DbResult<void>> => {
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
            return err({
              type: 'DatabaseError',
              code: 'SCHEMA_EXECUTION_FAILED',
              message: `Failed to execute schema statement: ${statement}`,
              cause: result.error,
              recoverable: false,
            } as any);
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

// ========================================
// Table Builder Implementation
// ========================================

interface TableBuilderState {
  columns: ColumnDefinition[];
  primaryKeys: string[];
  foreignKeys: ForeignKeyDefinition[];
  uniqueConstraints: UniqueConstraint[];
  indexes: IndexDefinition[];
  checks: CheckConstraint[];
}

interface ColumnDefinition {
  name: string;
  type: ColumnType;
  options: ColumnOptions;
}

interface ForeignKeyDefinition {
  column: string;
  references: ForeignKeyReference;
}

interface UniqueConstraint {
  columns: string[];
  name?: string;
}

interface IndexDefinition {
  columns: string[];
  name?: string;
  unique: boolean;
}

interface CheckConstraint {
  name: string;
  expression: string;
}

const createTableBuilder = (): TableBuilder & { _getState: () => TableBuilderState } => {
  const state: TableBuilderState = {
    columns: [],
    primaryKeys: [],
    foreignKeys: [],
    uniqueConstraints: [],
    indexes: [],
    checks: [],
  };

  const builder = {
    column: (name: string, type: ColumnType, options: ColumnOptions = {}) => {
      state.columns.push({ name, type, options });
      return builder;
    },

    integer: (name: string, options: ColumnOptions = {}) => {
      return builder.column(name, 'INTEGER', options);
    },

    real: (name: string, options: ColumnOptions = {}) => {
      return builder.column(name, 'REAL', options);
    },

    text: (name: string, options: ColumnOptions = {}) => {
      return builder.column(name, 'TEXT', options);
    },

    boolean: (name: string, options: ColumnOptions = {}) => {
      return builder.column(name, 'BOOLEAN', options);
    },

    date: (name: string, options: ColumnOptions = {}) => {
      return builder.column(name, 'DATE', options);
    },

    datetime: (name: string, options: ColumnOptions = {}) => {
      return builder.column(name, 'DATETIME', options);
    },

    timestamp: (name: string, options: ColumnOptions = {}) => {
      return builder.column(name, 'TIMESTAMP', options);
    },

    json: (name: string, options: ColumnOptions = {}) => {
      return builder.column(name, 'JSON', options);
    },

    uuid: (name: string, options: ColumnOptions = {}) => {
      return builder.column(name, 'UUID', options);
    },

    primary: (columns: readonly string[]) => {
      state.primaryKeys.push(...columns);
      return builder;
    },

    foreign: (column: string, references: ForeignKeyReference) => {
      state.foreignKeys.push({ column, references });
      return builder;
    },

    unique: (columns: readonly string[], name?: string) => {
      state.uniqueConstraints.push({ columns: [...columns], name });
      return builder;
    },

    index: (columns: readonly string[], name?: string, unique = false) => {
      state.indexes.push({ columns: [...columns], name, unique });
      return builder;
    },

    check: (name: string, expression: string) => {
      state.checks.push({ name, expression });
      return builder;
    },

    _getState: () => state,
  };

  return builder;
};

// ========================================
// Alter Table Builder Implementation
// ========================================

interface AlterTableBuilderState {
  tableName: string;
  addColumns: ColumnDefinition[];
  dropColumns: string[];
  renameColumns: { oldName: string; newName: string }[];
  modifyColumns: ColumnDefinition[];
  addIndexes: IndexDefinition[];
  dropIndexes: string[];
  addConstraints: ConstraintDefinition[];
  dropConstraints: string[];
}

const createAlterTableBuilder = (tableName: string): AlterTableBuilder & { _getState: () => AlterTableBuilderState } => {
  const state: AlterTableBuilderState = {
    tableName,
    addColumns: [],
    dropColumns: [],
    renameColumns: [],
    modifyColumns: [],
    addIndexes: [],
    dropIndexes: [],
    addConstraints: [],
    dropConstraints: [],
  };

  const builder = {
    addColumn: (name: string, type: ColumnType, options: ColumnOptions = {}) => {
      state.addColumns.push({ name, type, options });
      return builder;
    },

    dropColumn: (name: string) => {
      state.dropColumns.push(name);
      return builder;
    },

    renameColumn: (oldName: string, newName: string) => {
      state.renameColumns.push({ oldName, newName });
      return builder;
    },

    modifyColumn: (name: string, type: ColumnType, options: ColumnOptions = {}) => {
      state.modifyColumns.push({ name, type, options });
      return builder;
    },

    addIndex: (columns: readonly string[], name?: string, unique = false) => {
      state.addIndexes.push({ columns: [...columns], name, unique });
      return builder;
    },

    dropIndex: (name: string) => {
      state.dropIndexes.push(name);
      return builder;
    },

    addConstraint: (constraint: ConstraintDefinition) => {
      state.addConstraints.push(constraint);
      return builder;
    },

    dropConstraint: (name: string) => {
      state.dropConstraints.push(name);
      return builder;
    },

    _getState: () => state,
  };

  return builder;
};

// ========================================
// SQL Generation Functions
// ========================================

const generateCreateTableSQL = (tableName: string, builder: TableBuilder & { _getState: () => TableBuilderState }): string => {
  const state = builder._getState();
  let sql = `CREATE TABLE ${tableName} (\n`;

  // Add columns
  const columnDefinitions = state.columns.map(col => {
    let def = `  ${col.name} ${col.type}`;
    
    if (col.options.primary) {
      def += ' PRIMARY KEY';
    }
    
    if (col.options.autoIncrement) {
      def += ' AUTOINCREMENT';
    }
    
    if (!col.options.nullable && !col.options.primary) {
      def += ' NOT NULL';
    }
    
    if (col.options.unique) {
      def += ' UNIQUE';
    }
    
    if (col.options.defaultValue !== undefined) {
      def += ` DEFAULT ${formatValue(col.options.defaultValue)}`;
    }

    return def;
  });

  sql += columnDefinitions.join(',\n');

  // Add primary key constraint if multiple columns
  if (state.primaryKeys.length > 1) {
    sql += `,\n  PRIMARY KEY (${state.primaryKeys.join(', ')})`;
  }

  // Add foreign key constraints
  for (const fk of state.foreignKeys) {
    sql += `,\n  FOREIGN KEY (${fk.column}) REFERENCES ${fk.references.table}(${fk.references.column})`;
    
    if (fk.references.onDelete) {
      sql += ` ON DELETE ${fk.references.onDelete}`;
    }
    
    if (fk.references.onUpdate) {
      sql += ` ON UPDATE ${fk.references.onUpdate}`;
    }
  }

  // Add unique constraints
  for (const unique of state.uniqueConstraints) {
    const constraintName = unique.name || `uk_${unique.columns.join('_')}`;
    sql += `,\n  CONSTRAINT ${constraintName} UNIQUE (${unique.columns.join(', ')})`;
  }

  // Add check constraints
  for (const check of state.checks) {
    sql += `,\n  CONSTRAINT ${check.name} CHECK (${check.expression})`;
  }

  sql += '\n)';

  return sql;
};

const generateAlterTableSQL = (builder: AlterTableBuilder & { _getState: () => AlterTableBuilderState }): string[] => {
  const state = builder._getState();
  const statements: string[] = [];

  // Add columns
  for (const col of state.addColumns) {
    let sql = `ALTER TABLE ${state.tableName} ADD COLUMN ${col.name} ${col.type}`;
    
    if (!col.options.nullable) {
      sql += ' NOT NULL';
    }
    
    if (col.options.defaultValue !== undefined) {
      sql += ` DEFAULT ${formatValue(col.options.defaultValue)}`;
    }
    
    statements.push(sql);
  }

  // Drop columns
  for (const colName of state.dropColumns) {
    statements.push(`ALTER TABLE ${state.tableName} DROP COLUMN ${colName}`);
  }

  // Rename columns
  for (const rename of state.renameColumns) {
    statements.push(`ALTER TABLE ${state.tableName} RENAME COLUMN ${rename.oldName} TO ${rename.newName}`);
  }

  // Modify columns (simplified - actual implementation would vary by database)
  for (const col of state.modifyColumns) {
    statements.push(`ALTER TABLE ${state.tableName} ALTER COLUMN ${col.name} TYPE ${col.type}`);
  }

  // Add indexes
  for (const idx of state.addIndexes) {
    const indexName = idx.name || `idx_${state.tableName}_${idx.columns.join('_')}`;
    const indexType = idx.unique ? 'UNIQUE INDEX' : 'INDEX';
    statements.push(`CREATE ${indexType} ${indexName} ON ${state.tableName} (${idx.columns.join(', ')})`);
  }

  // Drop indexes
  for (const indexName of state.dropIndexes) {
    statements.push(`DROP INDEX ${indexName}`);
  }

  // Add constraints
  for (const constraint of state.addConstraints) {
    let sql = `ALTER TABLE ${state.tableName} ADD CONSTRAINT ${constraint.name} `;
    
    switch (constraint.type) {
      case 'PRIMARY':
        sql += `PRIMARY KEY (${constraint.columns.join(', ')})`;
        break;
      case 'FOREIGN':
        if (constraint.references) {
          sql += `FOREIGN KEY (${constraint.columns.join(', ')}) REFERENCES ${constraint.references.table}(${constraint.references.column})`;
        }
        break;
      case 'UNIQUE':
        sql += `UNIQUE (${constraint.columns.join(', ')})`;
        break;
      case 'CHECK':
        sql += `CHECK (${constraint.check})`;
        break;
    }
    
    statements.push(sql);
  }

  // Drop constraints
  for (const constraintName of state.dropConstraints) {
    statements.push(`ALTER TABLE ${state.tableName} DROP CONSTRAINT ${constraintName}`);
  }

  return statements;
};

// ========================================
// Helper Functions
// ========================================

const formatValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  } else if (typeof value === 'number') {
    return String(value);
  } else if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  } else if (value === null) {
    return 'NULL';
  } else {
    return `'${String(value)}'`;
  }
};

// Simple adapter getter (should be imported from core)
const getAdapter = (driver: string) => {
  // This should import from core operations
  return null;
};