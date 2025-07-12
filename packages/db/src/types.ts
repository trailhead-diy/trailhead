import type { Result, CoreError } from '@trailhead/core';

// ========================================
// Result Type Alias
// ========================================

export type DbResult<T> = Result<T, CoreError>;

// ========================================
// Database Connection Types
// ========================================

export interface DatabaseConnection {
  readonly id: string;
  readonly url: string;
  readonly options: ConnectionOptions;
  readonly isConnected: boolean;
  readonly metadata: ConnectionMetadata;
}

export interface ConnectionOptions {
  readonly driver: DatabaseDriver;
  readonly host?: string;
  readonly port?: number;
  readonly database?: string;
  readonly username?: string;
  readonly password?: string;
  readonly ssl?: boolean;
  readonly poolSize?: number;
  readonly timeout?: number;
  readonly retries?: number;
  readonly migrations?: MigrationConfig;
}

export type DatabaseDriver = 'sqlite' | 'postgresql' | 'mysql' | 'memory';

export interface ConnectionMetadata {
  readonly driver: DatabaseDriver;
  readonly version?: string;
  readonly connectedAt: Date;
  readonly lastActivity: Date;
  readonly queryCount: number;
  readonly errorCount: number;
}

// ========================================
// Query Types
// ========================================

export interface QueryBuilder<T = unknown> {
  readonly select: <K extends keyof T>(columns?: readonly K[]) => SelectQuery<Pick<T, K>>;
  readonly insert: (data: Partial<T> | readonly Partial<T>[]) => InsertQuery<T>;
  readonly update: (data: Partial<T>) => UpdateQuery<T>;
  readonly delete: () => DeleteQuery<T>;
  readonly raw: (sql: string, params?: readonly unknown[]) => RawQuery<T>;
}

export interface SelectQuery<T> {
  readonly from: (table: string) => SelectQuery<T>;
  readonly where: (condition: WhereCondition<T>) => SelectQuery<T>;
  readonly orderBy: (column: keyof T, direction?: SortDirection) => SelectQuery<T>;
  readonly limit: (count: number) => SelectQuery<T>;
  readonly offset: (count: number) => SelectQuery<T>;
  readonly join: (table: string, condition: JoinCondition) => SelectQuery<T>;
  readonly groupBy: (columns: readonly (keyof T)[]) => SelectQuery<T>;
  readonly having: (condition: WhereCondition<T>) => SelectQuery<T>;
  readonly toSQL: () => { sql: string; params: readonly unknown[] };
  readonly execute: (connection: DatabaseConnection) => Promise<DbResult<readonly T[]>>;
  readonly first: (connection: DatabaseConnection) => Promise<DbResult<T | undefined>>;
}

export interface InsertQuery<T> {
  readonly into: (table: string) => InsertQuery<T>;
  readonly onConflict: (action: ConflictAction) => InsertQuery<T>;
  readonly returning: <K extends keyof T>(columns: readonly K[]) => InsertQuery<Pick<T, K>>;
  readonly toSQL: () => { sql: string; params: readonly unknown[] };
  readonly execute: (connection: DatabaseConnection) => Promise<DbResult<InsertResult>>;
}

export interface UpdateQuery<T> {
  readonly table: (table: string) => UpdateQuery<T>;
  readonly where: (condition: WhereCondition<T>) => UpdateQuery<T>;
  readonly returning: <K extends keyof T>(columns: readonly K[]) => UpdateQuery<Pick<T, K>>;
  readonly toSQL: () => { sql: string; params: readonly unknown[] };
  readonly execute: (connection: DatabaseConnection) => Promise<DbResult<UpdateResult>>;
}

export interface DeleteQuery<T> {
  readonly from: (table: string) => DeleteQuery<T>;
  readonly where: (condition: WhereCondition<T>) => DeleteQuery<T>;
  readonly returning: <K extends keyof T>(columns: readonly K[]) => DeleteQuery<Pick<T, K>>;
  readonly toSQL: () => { sql: string; params: readonly unknown[] };
  readonly execute: (connection: DatabaseConnection) => Promise<DbResult<DeleteResult>>;
}

export interface RawQuery<T> {
  readonly toSQL: () => { sql: string; params: readonly unknown[] };
  readonly execute: (connection: DatabaseConnection) => Promise<DbResult<readonly T[]>>;
}

// ========================================
// Query Condition Types
// ========================================

export type WhereCondition<T> = SimpleCondition<T> | LogicalCondition<T> | ComparisonCondition<T>;

export interface SimpleCondition<T> {
  readonly column: keyof T;
  readonly operator: ComparisonOperator;
  readonly value: unknown;
}

export interface LogicalCondition<T> {
  readonly operator: LogicalOperator;
  readonly conditions: readonly WhereCondition<T>[];
}

export interface ComparisonCondition<T> {
  readonly column: keyof T;
  readonly operator: 'IN' | 'NOT IN' | 'BETWEEN' | 'LIKE' | 'ILIKE';
  readonly values: readonly unknown[];
}

export type ComparisonOperator = '=' | '!=' | '<' | '>' | '<=' | '>=' | 'IS' | 'IS NOT';
export type LogicalOperator = 'AND' | 'OR' | 'NOT';
export type SortDirection = 'ASC' | 'DESC';
export type ConflictAction = 'IGNORE' | 'REPLACE' | 'UPDATE';

export interface JoinCondition {
  readonly type: JoinType;
  readonly on: string;
}

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

// ========================================
// Query Result Types
// ========================================

export interface InsertResult {
  readonly insertedCount: number;
  readonly insertedId?: number | string;
  readonly insertedIds?: readonly (number | string)[];
}

export interface UpdateResult {
  readonly updatedCount: number;
  readonly changedRows: number;
}

export interface DeleteResult {
  readonly deletedCount: number;
}

export interface QueryMetadata {
  readonly sql: string;
  readonly params: readonly unknown[];
  readonly duration: number;
  readonly rowCount: number;
  readonly timestamp: Date;
}

// ========================================
// Schema Types
// ========================================

export interface TableSchema {
  readonly name: string;
  readonly columns: readonly ColumnDefinition[];
  readonly indexes: readonly IndexDefinition[];
  readonly constraints: readonly ConstraintDefinition[];
  readonly options: TableOptions;
}

export interface ColumnDefinition {
  readonly name: string;
  readonly type: ColumnType;
  readonly nullable: boolean;
  readonly primary: boolean;
  readonly unique: boolean;
  readonly autoIncrement: boolean;
  readonly defaultValue?: unknown;
  readonly references?: ForeignKeyReference;
}

export type ColumnType =
  | 'INTEGER'
  | 'REAL'
  | 'TEXT'
  | 'BLOB'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME'
  | 'TIMESTAMP'
  | 'JSON'
  | 'UUID';

export interface IndexDefinition {
  readonly name: string;
  readonly columns: readonly string[];
  readonly unique: boolean;
  readonly partial?: string;
}

export interface ConstraintDefinition {
  readonly name: string;
  readonly type: ConstraintType;
  readonly columns: readonly string[];
  readonly references?: ForeignKeyReference;
  readonly check?: string;
}

export type ConstraintType = 'PRIMARY' | 'FOREIGN' | 'UNIQUE' | 'CHECK';

export interface ForeignKeyReference {
  readonly table: string;
  readonly column: string;
  readonly onDelete?: ReferentialAction;
  readonly onUpdate?: ReferentialAction;
}

export type ReferentialAction = 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';

export interface TableOptions {
  readonly temporary?: boolean;
  readonly ifNotExists?: boolean;
  readonly engine?: string;
  readonly charset?: string;
  readonly collation?: string;
}

// ========================================
// Migration Types
// ========================================

export interface Migration {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly timestamp: Date;
  readonly up: MigrationFn;
  readonly down: MigrationFn;
  readonly dependencies?: readonly string[];
}

export type MigrationFn = (builder: SchemaBuilder) => Promise<DbResult<void>> | DbResult<void>;

export interface MigrationConfig {
  readonly directory?: string;
  readonly tableName?: string;
  readonly lockTimeout?: number;
  readonly batchSize?: number;
}

export interface MigrationStatus {
  readonly applied: readonly AppliedMigration[];
  readonly pending: readonly Migration[];
  readonly conflicts: readonly string[];
}

export interface AppliedMigration {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly appliedAt: Date;
  readonly batch: number;
}

// ========================================
// Schema Builder Types
// ========================================

export interface SchemaBuilder {
  readonly createTable: (name: string, callback: (table: TableBuilder) => void) => SchemaBuilder;
  readonly dropTable: (name: string, ifExists?: boolean) => SchemaBuilder;
  readonly alterTable: (
    name: string,
    callback: (table: AlterTableBuilder) => void
  ) => SchemaBuilder;
  readonly createIndex: (
    name: string,
    table: string,
    columns: readonly string[],
    unique?: boolean
  ) => SchemaBuilder;
  readonly dropIndex: (name: string, ifExists?: boolean) => SchemaBuilder;
  readonly raw: (sql: string) => SchemaBuilder;
  readonly toSQL: () => readonly string[];
  readonly execute: (connection: DatabaseConnection) => Promise<DbResult<void>>;
}

export interface TableBuilder {
  readonly column: (name: string, type: ColumnType, options?: ColumnOptions) => TableBuilder;
  readonly integer: (name: string, options?: ColumnOptions) => TableBuilder;
  readonly real: (name: string, options?: ColumnOptions) => TableBuilder;
  readonly text: (name: string, options?: ColumnOptions) => TableBuilder;
  readonly boolean: (name: string, options?: ColumnOptions) => TableBuilder;
  readonly date: (name: string, options?: ColumnOptions) => TableBuilder;
  readonly datetime: (name: string, options?: ColumnOptions) => TableBuilder;
  readonly timestamp: (name: string, options?: ColumnOptions) => TableBuilder;
  readonly json: (name: string, options?: ColumnOptions) => TableBuilder;
  readonly uuid: (name: string, options?: ColumnOptions) => TableBuilder;
  readonly primary: (columns: readonly string[]) => TableBuilder;
  readonly foreign: (column: string, references: ForeignKeyReference) => TableBuilder;
  readonly unique: (columns: readonly string[], name?: string) => TableBuilder;
  readonly index: (columns: readonly string[], name?: string, unique?: boolean) => TableBuilder;
  readonly check: (name: string, expression: string) => TableBuilder;
}

export interface AlterTableBuilder {
  readonly addColumn: (
    name: string,
    type: ColumnType,
    options?: ColumnOptions
  ) => AlterTableBuilder;
  readonly dropColumn: (name: string) => AlterTableBuilder;
  readonly renameColumn: (oldName: string, newName: string) => AlterTableBuilder;
  readonly modifyColumn: (
    name: string,
    type: ColumnType,
    options?: ColumnOptions
  ) => AlterTableBuilder;
  readonly addIndex: (
    columns: readonly string[],
    name?: string,
    unique?: boolean
  ) => AlterTableBuilder;
  readonly dropIndex: (name: string) => AlterTableBuilder;
  readonly addConstraint: (constraint: ConstraintDefinition) => AlterTableBuilder;
  readonly dropConstraint: (name: string) => AlterTableBuilder;
}

export interface ColumnOptions {
  readonly nullable?: boolean;
  readonly primary?: boolean;
  readonly unique?: boolean;
  readonly autoIncrement?: boolean;
  readonly defaultValue?: unknown;
  readonly references?: ForeignKeyReference;
}

// ========================================
// Transaction Types
// ========================================

export interface Transaction {
  readonly id: string;
  readonly connection: DatabaseConnection;
  readonly isolation?: IsolationLevel;
  readonly readonly?: boolean;
  readonly startedAt: Date;
  readonly commit: () => Promise<DbResult<void>>;
  readonly rollback: () => Promise<DbResult<void>>;
  readonly savepoint: (name: string) => Promise<DbResult<void>>;
  readonly rollbackTo: (name: string) => Promise<DbResult<void>>;
}

export type IsolationLevel =
  | 'READ_UNCOMMITTED'
  | 'READ_COMMITTED'
  | 'REPEATABLE_READ'
  | 'SERIALIZABLE';

// ========================================
// Operations Types
// ========================================

export interface DatabaseOperations {
  readonly connect: (
    url: string,
    options?: Partial<ConnectionOptions>
  ) => Promise<DbResult<DatabaseConnection>>;
  readonly disconnect: (connection: DatabaseConnection) => Promise<DbResult<void>>;
  readonly ping: (connection: DatabaseConnection) => Promise<DbResult<boolean>>;
  readonly query: <T = unknown>(table?: string) => QueryBuilder<T>;
  readonly transaction: (
    connection: DatabaseConnection,
    fn: (tx: Transaction) => Promise<DbResult<unknown>>,
    options?: TransactionOptions
  ) => Promise<DbResult<unknown>>;
  readonly migrate: (
    connection: DatabaseConnection,
    migrations: readonly Migration[]
  ) => Promise<DbResult<MigrationStatus>>;
  readonly schema: () => SchemaBuilder;
}

export interface TransactionOptions {
  readonly isolation?: IsolationLevel;
  readonly readonly?: boolean;
  readonly timeout?: number;
}

export interface AdapterOperations {
  readonly register: (driver: DatabaseDriver, adapter: DatabaseAdapter) => void;
  readonly get: (driver: DatabaseDriver) => DatabaseAdapter | undefined;
  readonly supports: (driver: DatabaseDriver) => boolean;
}

export interface DatabaseAdapter {
  readonly driver: DatabaseDriver;
  readonly connect: (
    url: string,
    options: ConnectionOptions
  ) => Promise<DbResult<DatabaseConnection>>;
  readonly disconnect: (connection: DatabaseConnection) => Promise<DbResult<void>>;
  readonly execute: (
    connection: DatabaseConnection,
    sql: string,
    params?: readonly unknown[]
  ) => Promise<DbResult<QueryResult>>;
  readonly transaction: (
    connection: DatabaseConnection,
    fn: (connection: DatabaseConnection) => Promise<DbResult<unknown>>,
    options?: TransactionOptions
  ) => Promise<DbResult<unknown>>;
  readonly migrate: (
    connection: DatabaseConnection,
    migration: Migration
  ) => Promise<DbResult<void>>;
}

export interface QueryResult {
  readonly rows: readonly Record<string, unknown>[];
  readonly rowCount: number;
  readonly insertId?: number | string;
  readonly metadata: QueryMetadata;
}
