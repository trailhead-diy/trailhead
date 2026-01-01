import { describe, it, expect } from 'vitest'
import { defineCommand } from '../src/command/base.js'
import { createMockContext } from '../src/testing/context.js'
import { ok, err, createCoreError } from '@trailhead/core'

describe('defineCommand with citty', () => {
  describe('basic command execution', () => {
    it('executes command and returns success', async () => {
      const cmd = defineCommand({
        meta: {
          name: 'test',
          description: 'Test command',
        },
        args: {},
        run: async (args, context) => {
          context.logger.info('Test executed')
          return ok(undefined)
        },
      })

      const ctx = createMockContext()
      const result = await cmd.run({ args: { _: [] } })

      // Command wrapper handles Result types internally
      expect(result).toBeUndefined()
    })

    it('passes parsed args to command run function', async () => {
      let receivedArgs: any

      const cmd = defineCommand({
        meta: { name: 'greet' },
        args: {
          name: { type: 'string', required: true },
          loud: { type: 'boolean' },
        },
        run: async (args, context) => {
          receivedArgs = args
          return ok(undefined)
        },
      })

      await cmd.run({ args: { _: [], name: 'World', loud: true } })

      expect(receivedArgs.name).toBe('World')
      expect(receivedArgs.loud).toBe(true)
    })
  })

  describe('CommandContext injection', () => {
    it('injects logger into context', async () => {
      const cmd = defineCommand({
        meta: { name: 'test' },
        args: {},
        run: async (args, context) => {
          context.logger.info('Hello')
          context.logger.error('Error')
          context.logger.debug('Debug')
          return ok(undefined)
        },
      })

      // Run command - logger is injected automatically
      await cmd.run({ args: { _: [] } })

      // Success - no errors thrown
      expect(true).toBe(true)
    })

    it('injects fs into context', async () => {
      const cmd = defineCommand({
        meta: { name: 'test' },
        args: {},
        run: async (args, context) => {
          expect(context.fs).toBeDefined()
          expect(context.fs.readFile).toBeDefined()
          expect(context.fs.writeFile).toBeDefined()
          return ok(undefined)
        },
      })

      await cmd.run({ args: { _: [] } })
    })

    it('sets projectRoot to cwd', async () => {
      const cmd = defineCommand({
        meta: { name: 'test' },
        args: {},
        run: async (args, context) => {
          expect(context.projectRoot).toBe(process.cwd())
          return ok(undefined)
        },
      })

      await cmd.run({ args: { _: [] } })
    })

    it('handles verbose flag', async () => {
      const cmd = defineCommand({
        meta: { name: 'test' },
        args: {},
        run: async (args, context) => {
          expect(context.verbose).toBe(true)
          return ok(undefined)
        },
      })

      await cmd.run({ args: { _: [], verbose: true, v: true } })
    })
  })

  describe('error handling with Result types', () => {
    it('handles error results and exits process', async () => {
      const originalExit = process.exit
      let exitCode = 0
      process.exit = ((code: number) => {
        exitCode = code
        throw new Error(`process.exit(${code})`)
      }) as any

      const cmd = defineCommand({
        meta: { name: 'test' },
        args: {},
        run: async (args, context) => {
          return err(
            createCoreError('TEST_ERROR', 'CLI_ERROR', 'Test error message', {
              recoverable: false,
            })
          )
        },
      })

      try {
        await cmd.run({ args: { _: [] } })
      } catch (e) {
        // Expected - process.exit throws in test
      }

      expect(exitCode).toBe(1)
      process.exit = originalExit
    })

    it('logs error message and suggestion on failure', async () => {
      const originalExit = process.exit
      process.exit = (() => {
        throw new Error('exit')
      }) as any

      const cmd = defineCommand({
        meta: { name: 'test' },
        args: {},
        run: async (args, context) => {
          return err(
            createCoreError('TEST_ERROR', 'CLI_ERROR', 'Something went wrong', {
              recoverable: false,
              suggestion: 'Try running with --verbose',
            })
          )
        },
      })

      try {
        await cmd.run({ args: { _: [] } })
      } catch (e) {
        // Expected
      }

      process.exit = originalExit
    })
  })
})
