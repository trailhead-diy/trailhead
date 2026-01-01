import { describe, it, expect } from 'vitest'
import { createMockContext, createMockLogger, createMockFileSystem } from '../src/testing/index.js'
import { ok } from '@trailhead/core'

describe('testing utilities', () => {
  describe('createMockLogger', () => {
    it('captures log messages', () => {
      const logger = createMockLogger()

      logger.info('Info message')
      logger.error('Error message')
      logger.debug('Debug message')

      expect(logger.logs).toHaveLength(3)
      expect(logger.logs[0]).toEqual({ level: 'info', message: 'Info message' })
      expect(logger.logs[1]).toEqual({ level: 'error', message: 'Error message' })
      expect(logger.logs[2]).toEqual({ level: 'debug', message: 'Debug message' })
    })
  })

  describe('createMockFileSystem', () => {
    it('returns file not found for non-existent files', async () => {
      const fs = createMockFileSystem()
      const result = await fs.readFile('missing.txt')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('File not found')
      }
    })

    it('stores and retrieves files', async () => {
      const fs = createMockFileSystem()

      const writeResult = await fs.writeFile('test.txt', 'Hello World')
      expect(writeResult.isOk()).toBe(true)

      const readResult = await fs.readFile('test.txt')
      expect(readResult.isOk()).toBe(true)
      if (readResult.isOk()) {
        expect(readResult.value).toBe('Hello World')
      }
    })

    it('checks file existence', async () => {
      const fs = createMockFileSystem()

      await fs.writeFile('exists.txt', 'content')

      const existsResult = await fs.exists('exists.txt')
      const notExistsResult = await fs.exists('missing.txt')

      expect(existsResult.isOk()).toBe(true)
      if (existsResult.isOk()) {
        expect(existsResult.value).toBe(true)
      }

      expect(notExistsResult.isOk()).toBe(true)
      if (notExistsResult.isOk()) {
        expect(notExistsResult.value).toBe(false)
      }
    })
  })

  describe('createMockContext', () => {
    it('creates context with default values', () => {
      const ctx = createMockContext()

      expect(ctx.projectRoot).toBe(process.cwd())
      expect(ctx.verbose).toBe(false)
      expect(ctx.logger).toBeDefined()
      expect(ctx.fs).toBeDefined()
      expect(ctx.args).toEqual({ _: [] })
    })

    it('accepts overrides', () => {
      const ctx = createMockContext({
        projectRoot: '/custom/path',
        verbose: true,
        args: { _: ['arg1'], name: 'value' },
      })

      expect(ctx.projectRoot).toBe('/custom/path')
      expect(ctx.verbose).toBe(true)
      expect(ctx.args).toEqual({ _: ['arg1'], name: 'value' })
    })

    it('logger captures logs', () => {
      const ctx = createMockContext()

      ctx.logger.info('Test message')

      expect(ctx.logger.logs).toContainEqual({
        level: 'info',
        message: 'Test message',
      })
    })
  })

  describe('testing command run functions directly', () => {
    it('tests command logic with mock context', async () => {
      // Define a simple command run function
      const greetRun = async (args: any, context: any) => {
        const greeting = args.loud
          ? `HELLO ${args.name.toUpperCase()}!`
          : `Hello ${args.name}!`

        context.logger.info(greeting)
        return ok(undefined)
      }

      // Test it directly
      const ctx = createMockContext()
      const result = await greetRun({ _: [], name: 'World', loud: false }, ctx)

      expect(result.isOk()).toBe(true)
      expect(ctx.logger.logs).toContainEqual({
        level: 'info',
        message: 'Hello World!',
      })
    })

    it('tests command with filesystem operations', async () => {
      const readFileRun = async (args: any, context: any) => {
        const fileResult = await context.fs.readFile(args.file)

        if (fileResult.isErr()) {
          return fileResult
        }

        context.logger.info(`Read ${fileResult.value.length} characters`)
        return ok(undefined)
      }

      const ctx = createMockContext()
      const fs = createMockFileSystem()
      await fs.writeFile('test.txt', 'Hello World')
      ctx.fs = fs as any

      const result = await readFileRun({ _: [], file: 'test.txt' }, ctx)

      expect(result.isOk()).toBe(true)
      expect(ctx.logger.logs).toContainEqual({
        level: 'info',
        message: 'Read 11 characters',
      })
    })
  })
})
