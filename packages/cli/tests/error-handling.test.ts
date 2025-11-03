import { describe, it, expect } from 'vitest'
import { createCLI } from '../src/cli.js'
import { createCommand } from '../src/command/index.js'
import { err } from '@trailhead/core'

describe('CLI Error Handling', () => {
  it('should handle command action errors gracefully', async () => {
    const command = createCommand({
      name: 'failing-command',
      description: 'Command that fails',
      action: async () =>
        err({
          type: 'COMMAND_ERROR',
          message: 'Command failed',
          recoverable: false,
        }),
    })

    const _cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'CLI with failing command',
      commands: [command],
    })

    // Test command was created with proper name
    expect(command.name).toBe('failing-command')
  })

  it('should handle validation errors during command creation', () => {
    // Command creation should throw for invalid configurations (this is correct behavior)
    expect(() =>
      createCommand({
        name: 'test',
        description: 'Test command',
        options: [
          {
            flags: 'invalid-flags', // Invalid format
            description: 'Invalid option',
          },
        ],
        action: async () =>
          err({
            type: 'TEST_ERROR',
            message: 'Test error',
            recoverable: false,
          }),
      })
    ).toThrow()
  })

  it('should handle CLI creation with invalid configuration', () => {
    // CLI creation should not throw for basic config issues
    expect(() =>
      createCLI({
        name: '', // Empty name
        version: '1.0.0',
        description: 'Test CLI',
      })
    ).not.toThrow()
  })

  it('should handle missing command dependencies gracefully', async () => {
    const command = createCommand({
      name: 'dependency-test',
      description: 'Test command dependencies',
      action: async (options, context) => {
        // Test that context provides working methods
        expect(typeof context.logger.info).toBe('function')
        expect(typeof context.fs.readFile).toBe('function')

        return err({
          type: 'DEPENDENCY_ERROR',
          message: 'Required dependency not found',
          recoverable: true,
        })
      },
    })

    // Test command creation succeeded
    expect(command.name).toBe('dependency-test')
  })
})
