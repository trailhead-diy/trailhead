// Core database operations
export { createDatabaseOperations, registerAdapter, getAdapter } from './core/index.js';

// Database adapters
export { createMemoryAdapter } from './adapters/index.js';

// Query builder
export { createQueryBuilder } from './query/index.js';

// Schema builder
export { createSchemaBuilder } from './schema/index.js';

// Types
export type {
  DbResult,
  DatabaseConnection,
  ConnectionOptions,
  ConnectionMetadata,
  DatabaseDriver,
  DatabaseOperations,
  DatabaseAdapter,
  AdapterOperations,
  QueryBuilder,
  SelectQuery,
  InsertQuery,
  UpdateQuery,
  DeleteQuery,
  RawQuery,
  WhereCondition,
  JoinCondition,
  InsertResult,
  UpdateResult,
  DeleteResult,
  QueryResult,
  QueryMetadata,
  Transaction,
  TransactionOptions,
  IsolationLevel,
  Migration,
  MigrationStatus,
  MigrationConfig,
  AppliedMigration,
  SchemaBuilder,
  TableBuilder,
  AlterTableBuilder,
  TableSchema,
  ColumnDefinition,
  IndexDefinition,
  ConstraintDefinition,
  ColumnOptions,
  ColumnType,
  ForeignKeyReference,
  ReferentialAction,
  TableOptions,
  ComparisonOperator,
  LogicalOperator,
  SortDirection,
  ConflictAction,
  JoinType,
  ConstraintType,
} from './types.js';