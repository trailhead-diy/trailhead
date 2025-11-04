import { describe, it, expect, vi } from 'vitest'
import { createCommand, type CommandContext } from '../src/command/index.js'
import { ok, err } from '@trailhead/core'
import { createDefaultLogger } from '../src/utils/logger.js'
import { fs } from '@trailhead/fs'

// Create mock context for testing
const createMockContext = (args: string[] = []): CommandContext => ({
  projectRoot: '/test',
  logger: createDefaultLogger(false),
  verbose: false,
  fs: fs as any,
  args,
})

describe('Command Registration and Execution', () => {
  it('should create command with basic configuration', () => {
    const command = createCommand({
      name: 'test',
      description: 'Test command',
      action: async () => ok(undefined),
    })

    expect(command.name).toBe('test')
    expect(command.description).toBe('Test command')
    expect(command.execute).toBeTypeOf('function')
  })

  it('should create command with options', () => {
    const command = createCommand({
      name: 'test',
      description: 'Test command with options',
      options: [
        {
          flags: '-f, --file <path>',
          description: 'Input file path',
          required: true,
        },
      ],
      action: async () => ok(undefined),
    })

    expect(command.options).toHaveLength(1)
    expect(command.options![0].flags).toBe('-f, --file <path>')
  })

  it('should execute command action successfully', async () => {
    const mockAction = vi.fn().mockResolvedValue(ok('success'))

    const command = createCommand({
      name: 'test',
      description: 'Test command',
      action: mockAction,
    })

    const context = createMockContext()
    const result = await command.execute({}, context)

    expect(result.isOk()).toBe(true)
    expect(mockAction).toHaveBeenCalledWith({}, context)
  })

  it('should handle command action errors', async () => {
    const command = createCommand({
      name: 'test',
      description: 'Test command',
      action: async () =>
        err({
          type: 'TEST_ERROR',
          message: 'Test error',
          recoverable: false,
        }),
    })

    const context = createMockContext()
    const result = await command.execute({}, context)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe('Test error')
    }
  })

  it('should pass command arguments correctly', async () => {
    const mockAction = vi.fn().mockResolvedValue(ok(undefined))

    const command = createCommand({
      name: 'test',
      description: 'Test command',
      arguments: '<file>',
      action: mockAction,
    })

    const context = createMockContext(['test.txt'])
    await command.execute({}, context)

    expect(mockAction).toHaveBeenCalledWith({}, context)
    expect(context.args).toEqual(['test.txt'])
  })

  it('should pass command options correctly', async () => {
    const mockAction = vi.fn().mockResolvedValue(ok(undefined))

    const command = createCommand({
      name: 'test',
      description: 'Test command',
      options: [
        {
          flags: '-v, --verbose',
          description: 'Verbose output',
        },
      ],
      action: mockAction,
    })

    const context = createMockContext()
    const options = { verbose: true }
    await command.execute(options, context)

    expect(mockAction).toHaveBeenCalledWith(options, context)
  })
})
