import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineOptions, commonOptions, createFileProcessingCommand } from '../src/command/builders.js'
import { ok, err, createCoreError } from '@trailhead/core'
import type { CommandContext } from '../src/command/types.js'

describe('Command Builders', () => {
  describe('commonOptions', () => {
    it('should create output option with default description', () => {
      const option = commonOptions.output()

      expect(option.name).toBe('output')
      expect(option.alias).toBe('o')
      expect(option.flags).toBe('-o, --output <path>')
      expect(option.description).toBe('Output file path')
      expect(option.type).toBe('string')
    })

    it('should create output option with custom description', () => {
      const option = commonOptions.output('Custom output path')

      expect(option.description).toBe('Custom output path')
    })

    it('should create format option with default choices', () => {
      const option = commonOptions.format()

      expect(option.name).toBe('format')
      expect(option.alias).toBe('f')
      expect(option.flags).toBe('-f, --format <format>')
      expect(option.description).toContain('json')
      expect(option.description).toContain('csv')
      expect(option.default).toBe('json')
    })

    it('should create format option with custom choices', () => {
      const option = commonOptions.format(['xml', 'yaml', 'toml'], 'yaml')

      expect(option.description).toContain('xml')
      expect(option.description).toContain('yaml')
      expect(option.description).toContain('toml')
      expect(option.default).toBe('yaml')
    })

    it('should create verbose option', () => {
      const option = commonOptions.verbose()

      expect(option.name).toBe('verbose')
      expect(option.alias).toBe('v')
      expect(option.flags).toBe('-v, --verbose')
      expect(option.type).toBe('boolean')
      expect(option.default).toBe(false)
    })

    it('should create dryRun option', () => {
      const option = commonOptions.dryRun()

      expect(option.name).toBe('dryRun')
      expect(option.alias).toBe('d')
      expect(option.flags).toBe('-d, --dry-run')
      expect(option.type).toBe('boolean')
      expect(option.default).toBe(false)
    })

    it('should create force option', () => {
      const option = commonOptions.force()

      expect(option.name).toBe('force')
      expect(option.flags).toBe('--force')
      expect(option.type).toBe('boolean')
      expect(option.default).toBe(false)
    })

    it('should create interactive option', () => {
      const option = commonOptions.interactive()

      expect(option.name).toBe('interactive')
      expect(option.alias).toBe('i')
      expect(option.flags).toBe('-i, --interactive')
      expect(option.type).toBe('boolean')
      expect(option.default).toBe(false)
    })
  })

  describe('defineOptions - Fluent API', () => {
    it('should build empty options array', () => {
      const options = defineOptions().build()

      expect(options).toEqual([])
    })

    it('should add common options by name', () => {
      const options = defineOptions().common(['output', 'verbose']).build()

      expect(options).toHaveLength(2)
      expect(options[0].name).toBe('output')
      expect(options[1].name).toBe('verbose')
    })

    it('should add format option', () => {
      const options = defineOptions().format(['json', 'csv', 'xml'], 'csv').build()

      expect(options).toHaveLength(1)
      expect(options[0].name).toBe('format')
      expect(options[0].default).toBe('csv')
    })

    it('should replace existing format option', () => {
      const options = defineOptions()
        .common(['output'])
        .format(['json'], 'json')
        .format(['yaml', 'toml'], 'yaml') // Should replace previous
        .build()

      expect(options).toHaveLength(2)
      const formatOption = options.find((o) => o.name === 'format')
      expect(formatOption?.default).toBe('yaml')
    })

    it('should add custom options', () => {
      const options = defineOptions()
        .custom([
          {
            name: 'timeout',
            flags: '--timeout <ms>',
            description: 'Timeout in ms',
            type: 'number' as const,
          },
        ])
        .build()

      expect(options).toHaveLength(1)
      expect(options[0].name).toBe('timeout')
      expect(options[0].type).toBe('number')
    })

    it('should chain multiple methods', () => {
      const options = defineOptions()
        .common(['output', 'verbose', 'dryRun'])
        .format(['json', 'csv'])
        .custom([
          {
            name: 'timeout',
            flags: '--timeout <ms>',
            description: 'Timeout',
            type: 'number' as const,
          },
        ])
        .build()

      expect(options).toHaveLength(5)
      const names = options.map((o) => o.name)
      expect(names).toContain('output')
      expect(names).toContain('verbose')
      expect(names).toContain('dryRun')
      expect(names).toContain('format')
      expect(names).toContain('timeout')
    })

    it('should preserve option order', () => {
      const options = defineOptions()
        .custom([
          { name: 'first', flags: '--first', description: 'First', type: 'boolean' as const },
        ])
        .common(['verbose'])
        .custom([{ name: 'last', flags: '--last', description: 'Last', type: 'boolean' as const }])
        .build()

      expect(options[0].name).toBe('first')
      expect(options[1].name).toBe('verbose')
      expect(options[2].name).toBe('last')
    })

    it('should support initial options', () => {
      const initial = [
        { name: 'preset', flags: '--preset', description: 'Preset', type: 'string' as const },
      ]
      const options = defineOptions(initial).common(['verbose']).build()

      expect(options).toHaveLength(2)
      expect(options[0].name).toBe('preset')
      expect(options[1].name).toBe('verbose')
    })
  })

  describe('createFileProcessingCommand', () => {
    const createMockContext = (args: string[] = [], fileExists = true): CommandContext => ({
      args,
      options: {},
      fs: {
        readFile: vi.fn().mockResolvedValue(ok('file content')),
        writeFile: vi.fn().mockResolvedValue(ok(undefined)),
        exists: vi.fn().mockResolvedValue(ok(fileExists)),
      },
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
    })

    it('should create command with specified name and description', () => {
      const command = createFileProcessingCommand({
        name: 'process',
        description: 'Process a file',
        inputFile: { required: true },
        action: async () => ok(undefined),
      })

      expect(command.name).toBe('process')
      expect(command.description).toBe('Process a file')
    })

    it('should include common options when specified', () => {
      const command = createFileProcessingCommand({
        name: 'convert',
        description: 'Convert file',
        inputFile: { required: true },
        commonOptions: ['output', 'verbose', 'dryRun'],
        action: async () => ok(undefined),
      })

      expect(command.options).toHaveLength(3)
      const optionNames = command.options?.map((o) => o.name) ?? []
      expect(optionNames).toContain('output')
      expect(optionNames).toContain('verbose')
      expect(optionNames).toContain('dryRun')
    })

    it('should include custom options', () => {
      const command = createFileProcessingCommand({
        name: 'transform',
        description: 'Transform file',
        inputFile: { required: true },
        customOptions: [
          { name: 'encoding', flags: '--encoding <enc>', description: 'File encoding', type: 'string' as const },
        ],
        action: async () => ok(undefined),
      })

      expect(command.options).toHaveLength(1)
      expect(command.options?.[0].name).toBe('encoding')
    })

    it('should return error when required input file is missing', async () => {
      const actionMock = vi.fn().mockResolvedValue(ok(undefined))
      const command = createFileProcessingCommand({
        name: 'process',
        description: 'Process file',
        inputFile: { required: true },
        action: actionMock,
      })

      const context = createMockContext([]) // No args
      const result = await command.action({}, context)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('input file is required')
      }
      expect(actionMock).not.toHaveBeenCalled()
    })

    it('should return error when input file does not exist', async () => {
      const actionMock = vi.fn().mockResolvedValue(ok(undefined))
      const command = createFileProcessingCommand({
        name: 'process',
        description: 'Process file',
        inputFile: { required: true },
        action: actionMock,
      })

      const context = createMockContext(['nonexistent.txt'], false) // File doesn't exist
      const result = await command.action({}, context)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('file not found')
      }
      expect(actionMock).not.toHaveBeenCalled()
    })

    it('should call action with processing context when file exists', async () => {
      const actionMock = vi.fn().mockResolvedValue(ok(undefined))
      const command = createFileProcessingCommand({
        name: 'process',
        description: 'Process file',
        inputFile: { required: true },
        action: actionMock,
      })

      const context = createMockContext(['input.txt'], true)
      const result = await command.action({}, context)

      expect(result.isOk()).toBe(true)
      expect(actionMock).toHaveBeenCalledTimes(1)

      // Verify processing context
      const [options, ctx, processingCtx] = actionMock.mock.calls[0]
      expect(processingCtx.inputFile).toBe('input.txt')
      expect(processingCtx.fs).toBeDefined()
    })

    it('should pass output option to processing context', async () => {
      const actionMock = vi.fn().mockResolvedValue(ok(undefined))
      const command = createFileProcessingCommand({
        name: 'process',
        description: 'Process file',
        inputFile: { required: true },
        commonOptions: ['output'],
        action: actionMock,
      })

      const context = createMockContext(['input.txt'], true)
      const result = await command.action({ output: 'output.txt' }, context)

      expect(result.isOk()).toBe(true)
      const [_options, _ctx, processingCtx] = actionMock.mock.calls[0]
      expect(processingCtx.outputPath).toBe('output.txt')
    })

    it('should allow optional input file', async () => {
      const actionMock = vi.fn().mockResolvedValue(ok(undefined))
      const command = createFileProcessingCommand({
        name: 'generate',
        description: 'Generate output',
        inputFile: { required: false },
        action: actionMock,
      })

      const context = createMockContext([]) // No input file
      const result = await command.action({}, context)

      expect(result.isOk()).toBe(true)
      expect(actionMock).toHaveBeenCalled()

      const [_options, _ctx, processingCtx] = actionMock.mock.calls[0]
      expect(processingCtx.inputFile).toBe('')
    })

    it('should use custom input file description', () => {
      const command = createFileProcessingCommand({
        name: 'analyze',
        description: 'Analyze file',
        inputFile: {
          required: true,
          description: 'Source code file to analyze',
        },
        action: async () => ok(undefined),
      })

      expect(command.arguments).toBe('Source code file to analyze')
    })

    it('should handle action returning error', async () => {
      const command = createFileProcessingCommand({
        name: 'fail',
        description: 'Failing command',
        inputFile: { required: true },
        action: async () =>
          err(createCoreError('ACTION_FAILED', 'CLI_ERROR', 'Something went wrong', { recoverable: true })),
      })

      const context = createMockContext(['input.txt'], true)
      const result = await command.action({}, context)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Something went wrong')
      }
    })
  })
})
