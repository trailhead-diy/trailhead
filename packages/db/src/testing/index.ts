/**
 * @esteban-url/db/testing
 *
 * Database testing utilities for connection testing, query mocking, and transaction testing.
 * Provides domain-focused utilities for testing database operations and data persistence.
 *
 * @example
 * ```typescript
 * import {
 *   createMockDatabase,
 *   dbFixtures,
 *   assertQueryResult,
 *   createTestTransaction,
 * } from '@esteban-url/db/testing'
 * 
 * // Create mock database
 * const mockDb = createMockDatabase()
 * mockDb.mockQuery('SELECT * FROM users', dbFixtures.users.sample)
 * 
 * // Test database operations
 * const result = await userRepository.findAll()
 * assertQueryResult(result, 2) // Expect 2 users
 * ```
 */

import { ok, err, type Result } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'

// ========================================
// Database Types and Interfaces
// ========================================

export interface DatabaseRow {
  [key: string]: any
}

export interface QueryResult<T = DatabaseRow> {
  rows: T[]
  rowCount: number
  command: string
  duration?: number
}

export interface TransactionContext {
  readonly id: string
  readonly startTime: number
  readonly queries: Array<{ sql: string; params?: any[]; result?: any; error?: CoreError }>
  readonly status: 'active' | 'committed' | 'rolledback'
}

export interface MockDatabase {
  readonly connectionString: string
  readonly isConnected: boolean
  connect(): Promise<Result<void, CoreError>>
  disconnect(): Promise<Result<void, CoreError>>
  query<T = DatabaseRow>(sql: string, params?: any[]): Promise<Result<QueryResult<T>, CoreError>>
  beginTransaction(): Promise<Result<TransactionContext, CoreError>>
  commitTransaction(tx: TransactionContext): Promise<Result<void, CoreError>>
  rollbackTransaction(tx: TransactionContext): Promise<Result<void, CoreError>>
  mockQuery(sql: string, result: any[] | CoreError): void
  mockConnection(shouldSucceed: boolean): void
  getQueryHistory(): Array<{ sql: string; params?: any[]; timestamp: number }>
  clearMocks(): void
}

// ========================================
// Mock Database Creation
// ========================================

/**
 * Creates a mock database for testing
 */
export function createMockDatabase(
  connectionString: string = 'mock://localhost:5432/testdb'
): MockDatabase {
  let connected = false
  const queryMocks = new Map<string, any[] | CoreError>()
  const queryHistory: Array<{ sql: string; params?: any[]; timestamp: number }> = []
  const transactions = new Map<string, TransactionContext>()
  let connectionMock: { shouldSucceed: boolean } = { shouldSucceed: true }
  
  return {
    connectionString,
    get isConnected() { return connected },
    
    async connect(): Promise<Result<void, CoreError>> {
      if (!connectionMock.shouldSucceed) {
        return err({
          type: 'db-error' as const,
          domain: 'database',
          code: 'CONNECTION_FAILED',
          message: `Failed to connect to database: ${connectionString}`,
          recoverable: true,
          component: 'MockDatabase',
          operation: 'connect',
          severity: 'high' as const,
          timestamp: new Date(),
        } as CoreError)
      }
      
      connected = true
      return ok(undefined)
    },
    
    async disconnect(): Promise<Result<void, CoreError>> {
      connected = false
      return ok(undefined)
    },
    
    async query<T = DatabaseRow>(
      sql: string,
      params?: any[]
    ): Promise<Result<QueryResult<T>, CoreError>> {
      if (!connected) {
        return err({
          type: 'db-error' as const,
          domain: 'database',
          code: 'NOT_CONNECTED',
          message: 'Database is not connected',
          recoverable: true,
          component: 'MockDatabase',
          operation: 'query',
          severity: 'high' as const,
          timestamp: new Date(),
        } as CoreError)
      }
      
      // Record query in history
      queryHistory.push({ sql, params, timestamp: Date.now() })
      
      // Check for mocked response
      const normalizedSql = sql.trim().toLowerCase()
      for (const [mockedSql, mockedResult] of queryMocks) {
        if (normalizedSql.includes(mockedSql.toLowerCase())) {
          if (mockedResult instanceof Error || 'domain' in mockedResult) {
            return err(mockedResult as CoreError)
          }
          
          return ok({
            rows: mockedResult as T[],
            rowCount: Array.isArray(mockedResult) ? mockedResult.length : 0,
            command: sql.split(' ')[0].toUpperCase(),
            duration: Math.random() * 50, // Mock duration
          })
        }
      }
      
      // Default mock response
      return ok({
        rows: [] as T[],
        rowCount: 0,
        command: sql.split(' ')[0].toUpperCase(),
        duration: Math.random() * 50,
      })
    },
    
    async beginTransaction(): Promise<Result<TransactionContext, CoreError>> {
      if (!connected) {
        return err({
          type: 'db-error' as const,
          domain: 'database',
          code: 'NOT_CONNECTED',
          message: 'Database is not connected',
          recoverable: true,
          component: 'MockDatabase',
          operation: 'beginTransaction',
          severity: 'high' as const,
          timestamp: new Date(),
        } as CoreError)
      }
      
      const txId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const transaction: TransactionContext = {
        id: txId,
        startTime: Date.now(),
        queries: [],
        status: 'active',
      }
      
      transactions.set(txId, transaction)
      return ok(transaction)
    },
    
    async commitTransaction(tx: TransactionContext): Promise<Result<void, CoreError>> {
      const transaction = transactions.get(tx.id)
      if (!transaction) {
        return err({
          type: 'db-error' as const,
          domain: 'database',
          code: 'TRANSACTION_NOT_FOUND',
          message: `Transaction ${tx.id} not found`,
          recoverable: true,
          component: 'MockDatabase',
          operation: 'commitTransaction',
          severity: 'high' as const,
          timestamp: new Date(),
        } as CoreError)
      }
      
      if (transaction.status !== 'active') {
        return err({
          type: 'db-error' as const,
          domain: 'database',
          code: 'TRANSACTION_NOT_ACTIVE',
          message: `Transaction ${tx.id} is not active`,
          recoverable: true,
          component: 'MockDatabase',
          operation: 'commitTransaction',
          severity: 'high' as const,
          timestamp: new Date(),
        } as CoreError)
      }
      
      // Mock commit - mark as committed
      const committed = { ...transaction, status: 'committed' as const }
      transactions.set(tx.id, committed)
      
      return ok(undefined)
    },
    
    async rollbackTransaction(tx: TransactionContext): Promise<Result<void, CoreError>> {
      const transaction = transactions.get(tx.id)
      if (!transaction) {
        return err({
          type: 'db-error' as const,
          domain: 'database',
          code: 'TRANSACTION_NOT_FOUND',
          message: `Transaction ${tx.id} not found`,
          recoverable: true,
          component: 'MockDatabase',
          operation: 'rollbackTransaction',
          severity: 'high' as const,
          timestamp: new Date(),
        } as CoreError)
      }
      
      // Mock rollback - mark as rolledback
      const rolledback = { ...transaction, status: 'rolledback' as const }
      transactions.set(tx.id, rolledback)
      
      return ok(undefined)
    },
    
    mockQuery(sql: string, result: any[] | CoreError): void {
      queryMocks.set(sql, result)
    },
    
    mockConnection(shouldSucceed: boolean): void {
      connectionMock.shouldSucceed = shouldSucceed
    },
    
    getQueryHistory(): Array<{ sql: string; params?: any[]; timestamp: number }> {
      return [...queryHistory]
    },
    
    clearMocks(): void {
      queryMocks.clear()
      queryHistory.length = 0
      transactions.clear()
      connected = false
      connectionMock.shouldSucceed = true
    },
  }
}

// ========================================
// Database Test Fixtures
// ========================================

export const dbFixtures = {
  /**
   * Sample user data
   */
  users: {
    sample: [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', created_at: '2023-01-15' },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', created_at: '2023-02-20' },
      { id: 3, name: 'Carol Davis', email: 'carol@example.com', role: 'user', created_at: '2023-03-10' },
    ],
    
    empty: [],
    
    single: [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', created_at: '2023-01-15' },
    ],
  },
  
  /**
   * Sample product data
   */
  products: {
    sample: [
      { id: 1, name: 'Laptop', price: 999.99, category: 'electronics', in_stock: true },
      { id: 2, name: 'Coffee Mug', price: 12.99, category: 'kitchen', in_stock: true },
      { id: 3, name: 'Desk Chair', price: 199.99, category: 'furniture', in_stock: false },
    ],
    
    electronics: [
      { id: 1, name: 'Laptop', price: 999.99, category: 'electronics', in_stock: true },
      { id: 4, name: 'Smartphone', price: 699.99, category: 'electronics', in_stock: true },
    ],
  },
  
  /**
   * Sample order data
   */
  orders: {
    sample: [
      { id: 1, user_id: 1, total: 999.99, status: 'completed', created_at: '2023-04-01' },
      { id: 2, user_id: 2, total: 212.98, status: 'pending', created_at: '2023-04-02' },
    ],
  },
  
  /**
   * Common SQL queries for testing
   */
  queries: {
    selectUsers: 'SELECT * FROM users',
    selectUserById: 'SELECT * FROM users WHERE id = $1',
    insertUser: 'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING *',
    updateUser: 'UPDATE users SET name = $1, email = $2 WHERE id = $3',
    deleteUser: 'DELETE FROM users WHERE id = $1',
    
    selectProducts: 'SELECT * FROM products',
    selectProductsByCategory: 'SELECT * FROM products WHERE category = $1',
    selectProductsInStock: 'SELECT * FROM products WHERE in_stock = true',
    
    selectOrders: 'SELECT * FROM orders',
    selectOrdersByUser: 'SELECT * FROM orders WHERE user_id = $1',
    selectOrdersWithStatus: 'SELECT * FROM orders WHERE status = $1',
  },
  
  /**
   * Common database errors for testing
   */
  errors: {
    connectionFailed: {
      type: 'db-error' as const,
      domain: 'database',
      code: 'CONNECTION_FAILED',
      message: 'Failed to connect to database',
      recoverable: true,
      component: 'MockDatabase',
      operation: 'connect',
      severity: 'high' as const,
      timestamp: new Date(),
    } as CoreError,
    
    queryTimeout: {
      type: 'db-error' as const,
      domain: 'database',
      code: 'QUERY_TIMEOUT',
      message: 'Query execution timed out',
      recoverable: true,
      component: 'MockDatabase',
      operation: 'query',
      severity: 'high' as const,
      timestamp: new Date(),
    } as CoreError,
    
    constraintViolation: {
      type: 'db-error' as const,
      domain: 'database',
      code: 'CONSTRAINT_VIOLATION',
      message: 'Unique constraint violation',
      recoverable: true,
      component: 'MockDatabase',
      operation: 'query',
      severity: 'high' as const,
      timestamp: new Date(),
    } as CoreError,
    
    tableNotFound: {
      type: 'db-error' as const,
      domain: 'database',
      code: 'TABLE_NOT_FOUND',
      message: 'Table does not exist',
      recoverable: true,
      component: 'MockDatabase',
      operation: 'query',
      severity: 'high' as const,
      timestamp: new Date(),
    } as CoreError,
  },
}

// ========================================
// Database Testing Assertions
// ========================================

/**
 * Asserts that a database query succeeded with expected row count
 */
export function assertQueryResult<T>(
  result: Result<QueryResult<T>, CoreError>,
  expectedRowCount?: number,
  expectedCommand?: string
): void {
  if (result.isErr()) {
    throw new Error(`Expected query to succeed, but got error: ${result.error.message}`)
  }
  
  const queryResult = result.value
  
  if (expectedRowCount !== undefined && queryResult.rowCount !== expectedRowCount) {
    throw new Error(
      `Expected ${expectedRowCount} rows, but got ${queryResult.rowCount}`
    )
  }
  
  if (expectedCommand && queryResult.command !== expectedCommand) {
    throw new Error(
      `Expected command '${expectedCommand}', but got '${queryResult.command}'`
    )
  }
}

/**
 * Asserts that a database connection succeeded
 */
export function assertDatabaseConnection(
  result: Result<void, CoreError>
): void {
  if (result.isErr()) {
    throw new Error(`Expected database connection to succeed, but got error: ${result.error.message}`)
  }
}

/**
 * Asserts that a transaction completed successfully
 */
export function assertTransactionSuccess(
  transaction: TransactionContext,
  expectedStatus: TransactionContext['status']
): void {
  if (transaction.status !== expectedStatus) {
    throw new Error(
      `Expected transaction status '${expectedStatus}', but got '${transaction.status}'`
    )
  }
}

/**
 * Asserts that specific queries were executed
 */
export function assertQueriesExecuted(
  queryHistory: Array<{ sql: string; params?: any[] }>,
  expectedQueries: Array<{ sql: string; params?: any[] }>
): void {
  for (const expectedQuery of expectedQueries) {
    const found = queryHistory.some(query => 
      query.sql.toLowerCase().includes(expectedQuery.sql.toLowerCase()) &&
      (!expectedQuery.params || 
        JSON.stringify(query.params) === JSON.stringify(expectedQuery.params))
    )
    
    if (!found) {
      throw new Error(
        `Expected query not found: ${expectedQuery.sql} with params ${JSON.stringify(expectedQuery.params)}`
      )
    }
  }
}

/**
 * Asserts that query performance meets expectations
 */
export function assertQueryPerformance<T>(
  result: Result<QueryResult<T>, CoreError>,
  maxDurationMs: number
): void {
  if (result.isErr()) {
    throw new Error(`Cannot check performance of failed query: ${result.error.message}`)
  }
  
  const duration = result.value.duration
  if (duration && duration > maxDurationMs) {
    throw new Error(
      `Query took ${duration}ms, expected <= ${maxDurationMs}ms`
    )
  }
}

// ========================================
// Database Test Scenarios
// ========================================

/**
 * Creates a test transaction scenario
 */
export function createTestTransaction(database: MockDatabase): {
  beginTransaction: () => Promise<Result<TransactionContext, CoreError>>
  executeInTransaction: (tx: TransactionContext, queries: Array<{ sql: string; params?: any[] }>) => Promise<Result<any[], CoreError>>
  commitTransaction: (tx: TransactionContext) => Promise<Result<void, CoreError>>
  rollbackTransaction: (tx: TransactionContext) => Promise<Result<void, CoreError>>
} {
  return {
    async beginTransaction(): Promise<Result<TransactionContext, CoreError>> {
      return database.beginTransaction()
    },
    
    async executeInTransaction(
      tx: TransactionContext,
      queries: Array<{ sql: string; params?: any[] }>
    ): Promise<Result<any[], CoreError>> {
      const results: any[] = []
      
      for (const query of queries) {
        const result = await database.query(query.sql, query.params)
        if (result.isErr()) {
          return err(result.error)
        }
        results.push(result.value)
      }
      
      return ok(results)
    },
    
    async commitTransaction(tx: TransactionContext): Promise<Result<void, CoreError>> {
      return database.commitTransaction(tx)
    },
    
    async rollbackTransaction(tx: TransactionContext): Promise<Result<void, CoreError>> {
      return database.rollbackTransaction(tx)
    },
  }
}

/**
 * Creates a database test scenario with common operations
 */
export function createDatabaseTestScenario(options: {
  connectionString?: string
  shouldConnect?: boolean
  mockQueries?: Array<{ sql: string; result: any[] | CoreError }>
} = {}): {
  database: MockDatabase
  setupScenario: () => Promise<void>
  runQueries: (queries: Array<{ sql: string; params?: any[] }>) => Promise<Result<any[], CoreError>>
  cleanup: () => Promise<void>
} {
  const database = createMockDatabase(options.connectionString)
  
  if (options.shouldConnect !== undefined) {
    database.mockConnection(options.shouldConnect)
  }
  
  if (options.mockQueries) {
    for (const mockQuery of options.mockQueries) {
      database.mockQuery(mockQuery.sql, mockQuery.result)
    }
  }
  
  return {
    database,
    
    async setupScenario(): Promise<void> {
      const connectResult = await database.connect()
      if (connectResult.isErr()) {
        throw new Error(`Failed to setup database scenario: ${connectResult.error.message}`)
      }
    },
    
    async runQueries(
      queries: Array<{ sql: string; params?: any[] }>
    ): Promise<Result<any[], CoreError>> {
      const results: any[] = []
      
      for (const query of queries) {
        const result = await database.query(query.sql, query.params)
        if (result.isErr()) {
          return err(result.error)
        }
        results.push(result.value)
      }
      
      return ok(results)
    },
    
    async cleanup(): Promise<void> {
      await database.disconnect()
      database.clearMocks()
    },
  }
}

// ========================================
// Export Collections
// ========================================

/**
 * Database testing utilities grouped by functionality
 */
export const dbTesting = {
  // Database creation
  createMockDatabase,
  createTestTransaction,
  createDatabaseTestScenario,
  
  // Fixtures and test data
  fixtures: dbFixtures,
  
  // Assertions
  assertQueryResult,
  assertDatabaseConnection,
  assertTransactionSuccess,
  assertQueriesExecuted,
  assertQueryPerformance,
}