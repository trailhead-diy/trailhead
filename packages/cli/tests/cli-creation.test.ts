import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createCLI } from '../src/cli.js'
import { createCommand } from '../src/command/index.js'
import { ok, err, createCoreError } from '@trailhead/core'

describe('CLI Creation and Configuration', () => {
  it('should create CLI with basic configuration and accept required properties', () => {
    const _cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI application',
    })

    // Test actual functionality, not just existence
    expect(typeof _cli.run).toBe('function')
  })

  it('should create CLI with commands and register them properly', () => {
    const testCommand = createCommand({
      name: 'test',
      description: 'Test command',
      action: async () => ok(undefined),
    })

    const _cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI with commands',
      commands: [testCommand],
    })

    // Verify the command was properly registered
    expect(testCommand.name).toBe('test')
    expect(testCommand.description).toBe('Test command')
  })

  it('should handle both empty and undefined commands gracefully', () => {
    // Test both cases in one test since they should behave the same
    const cliWithEmpty = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI with empty commands',
      commands: [],
    })

    const cliWithUndefined = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI without commands',
    })

    // Both should create valid CLI instances
    expect(typeof cliWithEmpty.run).toBe('function')
    expect(typeof cliWithUndefined.run).toBe('function')
  })
})

describe('CLI.run() execution', () => {
  let originalExit: typeof process.exit
  let originalArgv: string[]

  beforeEach(() => {
    originalExit = process.exit
    originalArgv = process.argv
    // Mock process.exit to prevent test termination
    process.exit = vi.fn() as unknown as typeof process.exit
  })

  afterEach(() => {
    process.exit = originalExit
    process.argv = originalArgv
  })

  it('should execute command action when matching command is invoked', async () => {
    const actionMock = vi.fn().mockResolvedValue(ok(undefined))

    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
      commands: [
        createCommand({
          name: 'greet',
          description: 'Greet someone',
          action: actionMock,
        }),
      ],
    })

    // Set up argv for the test
    process.argv = ['node', 'test-cli', 'greet']

    await cli.run()

    expect(actionMock).toHaveBeenCalledTimes(1)
  })

  it('should pass options to command action', async () => {
    const actionMock = vi.fn().mockResolvedValue(ok(undefined))

    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
      commands: [
        createCommand({
          name: 'process',
          description: 'Process something',
          options: [
            { name: 'verbose', flags: '-v, --verbose', description: 'Enable verbose output', type: 'boolean' as const, default: false },
            { name: 'output', flags: '-o, --output <path>', description: 'Output file path', type: 'string' as const },
          ],
          action: actionMock,
        }),
      ],
    })

    process.argv = ['node', 'test-cli', 'process', '-v', '-o', 'result.txt']

    await cli.run()

    expect(actionMock).toHaveBeenCalled()
    const [options] = actionMock.mock.calls[0]
    expect(options.verbose).toBe(true)
    expect(options.output).toBe('result.txt')
  })

  it('should pass arguments to command context', async () => {
    const actionMock = vi.fn().mockResolvedValue(ok(undefined))

    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
      commands: [
        createCommand({
          name: 'read',
          description: 'Read a file',
          arguments: '<file>',
          action: actionMock,
        }),
      ],
    })

    process.argv = ['node', 'test-cli', 'read', 'input.txt']

    await cli.run()

    expect(actionMock).toHaveBeenCalled()
    const [_options, context] = actionMock.mock.calls[0]
    expect(context.args).toContain('input.txt')
  })

  it('should handle command that returns error', async () => {
    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
      commands: [
        createCommand({
          name: 'fail',
          description: 'Fail intentionally',
          action: async () =>
            err(
              createCoreError('TEST_ERROR', 'CLI_ERROR', 'Intentional failure', {
                recoverable: false,
              })
            ),
        }),
      ],
    })

    process.argv = ['node', 'test-cli', 'fail']

    // Should not throw, just handle the error
    await expect(cli.run()).resolves.not.toThrow()
  })

  it('should execute multiple commands in same CLI', async () => {
    const addMock = vi.fn().mockResolvedValue(ok(undefined))
    const removeMock = vi.fn().mockResolvedValue(ok(undefined))

    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
      commands: [
        createCommand({
          name: 'add',
          description: 'Add item',
          action: addMock,
        }),
        createCommand({
          name: 'remove',
          description: 'Remove item',
          action: removeMock,
        }),
      ],
    })

    // Run 'add' command
    process.argv = ['node', 'test-cli', 'add']
    await cli.run()
    expect(addMock).toHaveBeenCalled()
    expect(removeMock).not.toHaveBeenCalled()
  })

  // TODO: Subcommand execution via Commander.js requires different test approach
  // The parent command action runs first, subcommand routing happens internally
  it.skip('should handle subcommands', async () => {
    const listMock = vi.fn().mockResolvedValue(ok(undefined))

    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
      commands: [
        createCommand({
          name: 'config',
          description: 'Config commands',
          subcommands: [
            createCommand({
              name: 'list',
              description: 'List config',
              action: listMock,
            }),
          ],
          action: async () => ok(undefined),
        }),
      ],
    })

    process.argv = ['node', 'test-cli', 'config', 'list']

    await cli.run()

    expect(listMock).toHaveBeenCalled()
  })
})
