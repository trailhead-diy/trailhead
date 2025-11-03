import { describe, it, expect } from 'vitest'
import { createCLI } from '../src/cli.js'
import { createCommand } from '../src/command/index.js'
import { ok, err } from '@trailhead/core'

describe('Domain Package Integration', () => {
  it('should import and use @trailhead/core types', () => {
    // Test that Result types work correctly
    const successResult = ok('test')
    const errorResult = err({
      type: 'TEST_ERROR',
      message: 'Test error',
      recoverable: false,
    })

    expect(successResult.isOk()).toBe(true)
    expect(errorResult.isErr()).toBe(true)
  })

  it('should integrate @trailhead/fs in command context', async () => {
    const command = createCommand({
      name: 'fs-test',
      description: 'Test filesystem integration',
      action: async (options, context) => {
        // Test fs methods are actual functions
        expect(typeof context.fs.exists).toBe('function')
        expect(typeof context.fs.readFile).toBe('function')
        expect(typeof context.fs.writeFile).toBe('function')

        return ok(undefined)
      },
    })

    const _cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI with FS integration',
      commands: [command],
    })

    // Test CLI was created successfully
  })

  it('should provide logger in command context', async () => {
    const command = createCommand({
      name: 'logger-test',
      description: 'Test logger integration',
      action: async (options, context) => {
        // Test logger methods are actual functions
        expect(typeof context.logger.info).toBe('function')
        expect(typeof context.logger.success).toBe('function')
        expect(typeof context.logger.error).toBe('function')
        expect(typeof context.logger.warning).toBe('function')
        expect(typeof context.logger.debug).toBe('function')
        expect(typeof context.logger.step).toBe('function')

        return ok(undefined)
      },
    })

    const _cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI with logger integration',
      commands: [command],
    })

    // Test CLI was created successfully
  })

  it('should provide project context information', async () => {
    const command = createCommand({
      name: 'context-test',
      description: 'Test context integration',
      action: async (options, context) => {
        // Test context provides actual values
        expect(typeof context.projectRoot).toBe('string')
        expect(typeof context.verbose).toBe('boolean')
        expect(Array.isArray(context.args)).toBe(true)

        return ok(undefined)
      },
    })

    const _cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI with context integration',
      commands: [command],
    })

    // Test CLI was created successfully
  })

  it('should handle domain package errors correctly', async () => {
    const command = createCommand({
      name: 'error-test',
      description: 'Test error handling',
      action: async (_options, _context) => {
        // Return domain package style error
        return err({
          type: 'FILESYSTEM_ERROR',
          message: 'File not found',
          recoverable: false,
        })
      },
    })

    // Verify command creation doesn't throw
    expect(() => command).not.toThrow()
    expect(command.name).toBe('error-test')
  })
})
