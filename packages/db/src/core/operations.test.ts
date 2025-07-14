import { describe, it, expect } from 'vitest'
import { createDatabaseOperations, registerAdapter } from './operations.js'
import { createMemoryAdapter } from '../adapters/memory.js'

describe('Database Operations', () => {
  const dbOps = createDatabaseOperations()

  beforeAll(() => {
    // Register memory adapter for testing
    const memoryAdapter = createMemoryAdapter()
    registerAdapter('memory', memoryAdapter)
  })

  describe('connect', () => {
    it('should connect to memory database', async () => {
      const result = await dbOps.connect('memory://test', {
        driver: 'memory',
      })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.url).toBe('memory://test')
        expect(result.value.options.driver).toBe('memory')
        expect(result.value.isConnected).toBe(true)
      }
    })

    it('should fail with unsupported driver', async () => {
      const result = await dbOps.connect('unsupported://test', {
        driver: 'unsupported' as any,
      })

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('ADAPTER_NOT_FOUND')
      }
    })
  })

  describe('query', () => {
    it('should create a query builder', () => {
      const query = dbOps.query('users')

      expect(typeof query.select).toBe('function')
      expect(typeof query.insert).toBe('function')
      expect(typeof query.update).toBe('function')
      expect(typeof query.delete).toBe('function')
      expect(typeof query.raw).toBe('function')
    })

    it('should build select query', () => {
      const query = dbOps
        .query('users')
        .select(['id', 'name'])
        .where({ column: 'active', operator: '=', value: true })

      const { sql, params } = query.toSQL()
      expect(sql).toContain('SELECT')
      expect(sql).toContain('FROM users')
      expect(Array.isArray(params)).toBe(true)
    })

    it('should build insert query', () => {
      const query = dbOps
        .query('users')
        .insert({ name: 'John', email: 'john@example.com' })
        .into('users')

      const { sql, params } = query.toSQL()
      expect(sql).toContain('INSERT INTO users')
      expect(Array.isArray(params)).toBe(true)
    })

    it('should build update query', () => {
      const query = dbOps
        .query('users')
        .update({ name: 'Jane' })
        .table('users')
        .where({ column: 'id', operator: '=', value: 1 })

      const { sql, params } = query.toSQL()
      expect(sql).toContain('UPDATE users')
      expect(sql).toContain('SET')
      expect(sql).toContain('WHERE')
      expect(Array.isArray(params)).toBe(true)
    })

    it('should build delete query', () => {
      const query = dbOps
        .query('users')
        .delete()
        .from('users')
        .where({ column: 'id', operator: '=', value: 1 })

      const { sql, params } = query.toSQL()
      expect(sql).toContain('DELETE FROM users')
      expect(sql).toContain('WHERE')
      expect(Array.isArray(params)).toBe(true)
    })

    it('should build raw query', () => {
      const query = dbOps.query().raw('SELECT COUNT(*) FROM users WHERE active = ?', [true])

      const { sql, params } = query.toSQL()
      expect(sql).toBe('SELECT COUNT(*) FROM users WHERE active = ?')
      expect(params).toEqual([true])
    })
  })

  describe('schema', () => {
    it('should create a schema builder', () => {
      const schema = dbOps.schema()

      expect(typeof schema.createTable).toBe('function')
      expect(typeof schema.dropTable).toBe('function')
      expect(typeof schema.alterTable).toBe('function')
      expect(typeof schema.createIndex).toBe('function')
      expect(typeof schema.dropIndex).toBe('function')
      expect(typeof schema.raw).toBe('function')
    })

    it('should build create table statement', () => {
      const schema = dbOps.schema().createTable('users', (table) => {
        table.integer('id', { primary: true, autoIncrement: true })
        table.text('name', { nullable: false })
        table.text('email', { unique: true })
        table.boolean('active', { defaultValue: true })
      })

      const statements = schema.toSQL()
      expect(statements).toHaveLength(1)
      expect(statements[0]).toContain('CREATE TABLE users')
    })

    it('should build drop table statement', () => {
      const schema = dbOps.schema().dropTable('users', true)

      const statements = schema.toSQL()
      expect(statements).toHaveLength(1)
      expect(statements[0]).toContain('DROP TABLE IF EXISTS users')
    })

    it('should build create index statement', () => {
      const schema = dbOps.schema().createIndex('idx_users_email', 'users', ['email'], true)

      const statements = schema.toSQL()
      expect(statements).toHaveLength(1)
      expect(statements[0]).toContain('CREATE UNIQUE INDEX idx_users_email ON users (email)')
    })
  })

  describe('ping', () => {
    it('should ping connected database', async () => {
      const connectionResult = await dbOps.connect('memory://test', {
        driver: 'memory',
      })

      expect(connectionResult.isOk()).toBe(true)
      if (connectionResult.isOk()) {
        const result = await dbOps.ping(connectionResult.value)
        expect(result.isOk()).toBe(true)
      }
    })
  })

  describe('disconnect', () => {
    it('should disconnect from database', async () => {
      const connectionResult = await dbOps.connect('memory://test', {
        driver: 'memory',
      })

      expect(connectionResult.isOk()).toBe(true)
      if (connectionResult.isOk()) {
        const result = await dbOps.disconnect(connectionResult.value)
        expect(result.isOk()).toBe(true)
      }
    })
  })

  describe('migration', () => {
    it('should handle migrations', async () => {
      const connectionResult = await dbOps.connect('memory://migration-test', {
        driver: 'memory',
      })

      expect(connectionResult.isOk()).toBe(true)
      if (connectionResult.isOk()) {
        const migrations = [
          {
            id: 'create_users_table',
            name: '001_create_users_table',
            version: '1.0.0',
            timestamp: new Date(),
            up: async (schema: any) => {
              schema.createTable('users', (table: any) => {
                table.integer('id', { primary: true })
                table.text('name')
              })
              return schema.execute(connectionResult.value)
            },
            down: async (schema: any) => {
              schema.dropTable('users')
              return schema.execute(connectionResult.value)
            },
          },
        ]

        const result = await dbOps.migrate(connectionResult.value, migrations)
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
          expect(result.value.applied).toBeDefined()
          expect(result.value.pending).toBeDefined()
          expect(result.value.conflicts).toBeDefined()
        }
      }
    })
  })
})
