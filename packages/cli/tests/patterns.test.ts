import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok, err, createCoreError } from '@trailhead/core'
import {
  executeFileSystemOperations,
  executeSubprocess,
  executeBatch,
  executeWithPhases,
  displaySummary,
  executeInteractiveCommand,
  executeWithValidation,
  executeWithDryRun,
  type InteractiveCommandOptions,
  type ValidationRule,
} from '../src/command/patterns.js'
import type { CommandContext, CommandPhase } from '../src/command/types.js'

// Create a mock logger with all required methods
const createMockLogger = () => ({
  info: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  step: vi.fn(),
})

// Create mock command context
const createMockContext = (overrides: Partial<CommandContext> = {}): CommandContext => ({
  projectRoot: '/test/project',
  logger: createMockLogger(),
  verbose: false,
  fs: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    exists: vi.fn(),
  },
  args: [],
  ...overrides,
})

describe('CLI Pattern Utilities', () => {
  describe('executeFileSystemOperations - Rollback Behavior', () => {
    let context: CommandContext

    beforeEach(() => {
      context = createMockContext()
    })

    it('should execute all operations successfully', async () => {
      const operations = [
        {
          name: 'op1',
          execute: vi.fn().mockResolvedValue(ok('result1')),
          rollback: vi.fn(),
        },
        {
          name: 'op2',
          execute: vi.fn().mockResolvedValue(ok('result2')),
          rollback: vi.fn(),
        },
      ]

      const result = await executeFileSystemOperations(operations, context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(['result1', 'result2'])
      }
      expect(operations[0].execute).toHaveBeenCalled()
      expect(operations[1].execute).toHaveBeenCalled()
      expect(operations[0].rollback).not.toHaveBeenCalled()
      expect(operations[1].rollback).not.toHaveBeenCalled()
    })

    it('should rollback completed operations on failure', async () => {
      const operations = [
        {
          name: 'create-dir',
          execute: vi.fn().mockResolvedValue(ok('dir-created')),
          rollback: vi.fn().mockResolvedValue(undefined),
        },
        {
          name: 'write-file',
          execute: vi.fn().mockResolvedValue(ok('file-written')),
          rollback: vi.fn().mockResolvedValue(undefined),
        },
        {
          name: 'failing-op',
          execute: vi
            .fn()
            .mockResolvedValue(err(createCoreError('OP_FAILED', 'CLI_ERROR', 'Operation failed'))),
          rollback: vi.fn(),
        },
      ]

      const result = await executeFileSystemOperations(operations, context)

      expect(result.isErr()).toBe(true)
      // Rollback should be called in reverse order for completed ops
      expect(operations[0].rollback).toHaveBeenCalled()
      expect(operations[1].rollback).toHaveBeenCalled()
      expect(operations[2].rollback).not.toHaveBeenCalled()
    })

    it('should handle rollback failures gracefully', async () => {
      const rollbackError = new Error('Rollback failed')
      const operations = [
        {
          name: 'op1',
          execute: vi.fn().mockResolvedValue(ok('result1')),
          rollback: vi.fn().mockRejectedValue(rollbackError),
        },
        {
          name: 'failing-op',
          execute: vi
            .fn()
            .mockResolvedValue(err(createCoreError('OP_FAILED', 'CLI_ERROR', 'Operation failed'))),
        },
      ]

      const result = await executeFileSystemOperations(operations, context)

      expect(result.isErr()).toBe(true)
      // Should still attempt rollback even if it fails
      expect(operations[0].rollback).toHaveBeenCalled()
      // Logger should report rollback failure
      expect(context.logger.error).toHaveBeenCalled()
    })

    it('should handle operations without rollback function', async () => {
      const operations = [
        {
          name: 'op-no-rollback',
          execute: vi.fn().mockResolvedValue(ok('result')),
          // No rollback function
        },
        {
          name: 'failing-op',
          execute: vi
            .fn()
            .mockResolvedValue(err(createCoreError('OP_FAILED', 'CLI_ERROR', 'Failed'))),
        },
      ]

      const result = await executeFileSystemOperations(operations, context)

      expect(result.isErr()).toBe(true)
      // Should not throw when no rollback is defined
    })

    it('should handle exception during operation execution', async () => {
      const operations = [
        {
          name: 'throwing-op',
          execute: vi.fn().mockRejectedValue(new Error('Unexpected exception')),
        },
      ]

      const result = await executeFileSystemOperations(operations, context)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('OPERATION_ERROR')
        expect(result.error.message).toContain('throwing-op')
      }
    })

    it('should return empty array for empty operations list', async () => {
      const result = await executeFileSystemOperations([], context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([])
      }
    })
  })

  describe('executeSubprocess', () => {
    let context: CommandContext

    beforeEach(() => {
      context = createMockContext()
    })

    it('should execute command and capture stdout', async () => {
      const result = await executeSubprocess(
        {
          command: 'echo',
          args: ['hello', 'world'],
        },
        context
      )

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.trim()).toBe('hello world')
      }
    })

    it('should handle command with custom cwd', async () => {
      const result = await executeSubprocess(
        {
          command: 'pwd',
          args: [],
          cwd: '/tmp',
        },
        context
      )

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.trim()).toContain('tmp')
      }
    })

    it('should handle command with custom environment', async () => {
      const result = await executeSubprocess(
        {
          command: 'sh',
          args: ['-c', 'echo $TEST_VAR'],
          env: { TEST_VAR: 'test-value' },
        },
        context
      )

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.trim()).toBe('test-value')
      }
    })

    it('should return error for non-zero exit code', async () => {
      const result = await executeSubprocess(
        {
          command: 'sh',
          args: ['-c', 'exit 1'],
        },
        context
      )

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('SUBPROCESS_EXIT_ERROR')
        expect(result.error.message).toContain('exit')
        expect(result.error.message).toContain('1')
      }
    })

    it('should return error for non-existent command', async () => {
      const result = await executeSubprocess(
        {
          command: 'nonexistent-command-that-does-not-exist',
          args: [],
        },
        context
      )

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('SUBPROCESS_ERROR')
      }
    })

    it('should capture stderr on failure', async () => {
      const result = await executeSubprocess(
        {
          command: 'sh',
          args: ['-c', 'echo "error output" >&2 && exit 1'],
        },
        context
      )

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.context?.stderr).toContain('error output')
      }
    })
  })

  describe('executeBatch', () => {
    let context: CommandContext

    beforeEach(() => {
      context = createMockContext()
    })

    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5]
      const processor = vi.fn().mockImplementation((x: number) => Promise.resolve(ok(x * 2)))

      const result = await executeBatch(items, processor, { batchSize: 2 }, context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([2, 4, 6, 8, 10])
      }
      expect(processor).toHaveBeenCalledTimes(5)
    })

    it('should call progress callback during processing', async () => {
      const items = [1, 2, 3, 4]
      const processor = vi.fn().mockImplementation((x: number) => Promise.resolve(ok(x)))
      const onProgress = vi.fn()

      await executeBatch(items, processor, { batchSize: 2, onProgress }, context)

      expect(onProgress).toHaveBeenCalledWith(2, 4) // After first batch
      expect(onProgress).toHaveBeenCalledWith(4, 4) // After second batch
    })

    it('should fail fast on first error', async () => {
      const items = [1, 2, 3, 4]
      let callCount = 0
      const processor = vi.fn().mockImplementation((x: number) => {
        callCount++
        if (x === 2) {
          return Promise.resolve(err(createCoreError('BATCH_ERR', 'CLI_ERROR', 'Item 2 failed')))
        }
        return Promise.resolve(ok(x))
      })

      const result = await executeBatch(items, processor, { batchSize: 2 }, context)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Item 2 failed')
      }
      // With batchSize 2, items 1 and 2 are processed together
      // Item 2 fails, so we should have processed 2 items
      expect(callCount).toBe(2)
    })

    it('should handle empty items array', async () => {
      const processor = vi.fn()

      const result = await executeBatch([], processor, { batchSize: 2 }, context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([])
      }
      expect(processor).not.toHaveBeenCalled()
    })

    it('should handle batch size larger than items', async () => {
      const items = [1, 2]
      const processor = vi.fn().mockImplementation((x: number) => Promise.resolve(ok(x)))

      const result = await executeBatch(items, processor, { batchSize: 10 }, context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([1, 2])
      }
    })
  })

  describe('executeWithPhases', () => {
    let context: CommandContext

    beforeEach(() => {
      context = createMockContext()
    })

    it('should execute phases in sequence', async () => {
      const executionOrder: string[] = []
      const phases: CommandPhase<number>[] = [
        {
          name: 'phase1',
          execute: async (data) => {
            executionOrder.push('phase1')
            return ok(data + 1)
          },
        },
        {
          name: 'phase2',
          execute: async (data) => {
            executionOrder.push('phase2')
            return ok(data * 2)
          },
        },
      ]

      const result = await executeWithPhases(phases, 5, context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(12) // (5 + 1) * 2
      }
      expect(executionOrder).toEqual(['phase1', 'phase2'])
    })

    it('should stop on phase failure', async () => {
      const executionOrder: string[] = []
      const phases: CommandPhase<number>[] = [
        {
          name: 'phase1',
          execute: async (data) => {
            executionOrder.push('phase1')
            return ok(data)
          },
        },
        {
          name: 'failing-phase',
          execute: async (_data) => {
            executionOrder.push('failing-phase')
            return err(createCoreError('PHASE_FAILED', 'CLI_ERROR', 'Phase 2 failed'))
          },
        },
        {
          name: 'phase3',
          execute: async (data) => {
            executionOrder.push('phase3')
            return ok(data)
          },
        },
      ]

      const result = await executeWithPhases(phases, 5, context)

      expect(result.isErr()).toBe(true)
      expect(executionOrder).toEqual(['phase1', 'failing-phase'])
      expect(executionOrder).not.toContain('phase3')
    })

    it('should handle exception in phase execution', async () => {
      const phases: CommandPhase<number>[] = [
        {
          name: 'throwing-phase',
          execute: async () => {
            throw new Error('Unexpected error in phase')
          },
        },
      ]

      const result = await executeWithPhases(phases, 5, context)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('PHASE_ERROR')
        expect(result.error.message).toContain('throwing-phase')
      }
    })

    it('should pass data between phases', async () => {
      interface PhaseData {
        value: number
        processed: string[]
      }
      const phases: CommandPhase<PhaseData>[] = [
        {
          name: 'add',
          execute: async (data) =>
            ok({ value: data.value + 10, processed: [...data.processed, 'add'] }),
        },
        {
          name: 'multiply',
          execute: async (data) =>
            ok({ value: data.value * 2, processed: [...data.processed, 'multiply'] }),
        },
      ]

      const result = await executeWithPhases(phases, { value: 5, processed: [] }, context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.value).toBe(30) // (5 + 10) * 2
        expect(result.value.processed).toEqual(['add', 'multiply'])
      }
    })

    it('should log phase completion in verbose mode', async () => {
      const verboseContext = createMockContext({ verbose: true })
      const phases: CommandPhase<number>[] = [
        {
          name: 'test-phase',
          execute: async (data) => ok(data),
        },
      ]

      await executeWithPhases(phases, 5, verboseContext)

      expect(verboseContext.logger.success).toHaveBeenCalledWith(
        expect.stringContaining('test-phase')
      )
    })
  })

  describe('displaySummary', () => {
    let context: CommandContext

    beforeEach(() => {
      context = createMockContext()
    })

    it('should display title and items', () => {
      displaySummary(
        'Build Summary',
        [
          { label: 'Files processed', value: 42 },
          { label: 'Errors', value: 0 },
        ],
        context
      )

      expect(context.logger.info).toHaveBeenCalledWith(expect.stringContaining('Build Summary'))
    })

    it('should display boolean values with checkmarks', () => {
      displaySummary(
        'Config',
        [
          { label: 'TypeScript', value: true },
          { label: 'ESLint', value: false },
        ],
        context
      )

      // Should show checkmarks/crosses for booleans
      const calls = (context.logger.info as any).mock.calls.map((c: any) => c[0])
      const hasYes = calls.some((c: string) => c.includes('Yes') || c.includes('✓'))
      const hasNo = calls.some((c: string) => c.includes('No') || c.includes('✗'))
      expect(hasYes).toBe(true)
      expect(hasNo).toBe(true)
    })

    it('should display statistics when provided', () => {
      displaySummary('Results', [{ label: 'Status', value: 'Complete' }], context, [
        { label: 'Duration', value: '2.5s' },
        { label: 'Memory', value: '128MB' },
      ])

      const calls = (context.logger.info as any).mock.calls.map((c: any) => c[0])
      const hasStats = calls.some((c: string) => c.includes('Statistics'))
      expect(hasStats).toBe(true)
    })
  })

  describe('executeInteractiveCommand', () => {
    let context: CommandContext

    beforeEach(() => {
      context = createMockContext()
    })

    interface TestOptions extends InteractiveCommandOptions {
      name?: string
      output?: string
    }

    it('should run prompts and merge results when interactive is true', async () => {
      const options: TestOptions = { interactive: true }
      const promptFn = vi.fn().mockResolvedValue({ name: 'prompted-name', output: 'prompted.txt' })
      const executeFn = vi.fn().mockResolvedValue(ok('success'))

      await executeInteractiveCommand(options, promptFn, executeFn, context)

      expect(promptFn).toHaveBeenCalled()
      expect(executeFn).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'prompted-name',
          output: 'prompted.txt',
          interactive: true,
        })
      )
    })

    it('should skip prompts when skipPrompts is true', async () => {
      const options: TestOptions = { interactive: true, skipPrompts: true, name: 'cli-name' }
      const promptFn = vi.fn().mockResolvedValue({ name: 'prompted-name' })
      const executeFn = vi.fn().mockResolvedValue(ok('success'))

      await executeInteractiveCommand(options, promptFn, executeFn, context)

      expect(promptFn).not.toHaveBeenCalled()
      expect(executeFn).toHaveBeenCalledWith(options)
    })

    it('should skip prompts when interactive is false', async () => {
      const options: TestOptions = { interactive: false, name: 'cli-name' }
      const promptFn = vi.fn().mockResolvedValue({ name: 'prompted-name' })
      const executeFn = vi.fn().mockResolvedValue(ok('success'))

      await executeInteractiveCommand(options, promptFn, executeFn, context)

      expect(promptFn).not.toHaveBeenCalled()
      expect(executeFn).toHaveBeenCalledWith(options)
    })

    it('should give CLI options precedence over prompted values', async () => {
      const options: TestOptions = { interactive: true, name: 'cli-name' }
      const promptFn = vi.fn().mockResolvedValue({ name: 'prompted-name', output: 'prompted.txt' })
      const executeFn = vi.fn().mockResolvedValue(ok('success'))

      await executeInteractiveCommand(options, promptFn, executeFn, context)

      expect(executeFn).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'cli-name', // CLI value takes precedence
          output: 'prompted.txt', // Prompted value used when no CLI value
        })
      )
    })

    it('should return error when prompt function throws', async () => {
      const options: TestOptions = { interactive: true }
      const promptFn = vi.fn().mockRejectedValue(new Error('Prompt cancelled'))
      const executeFn = vi.fn().mockResolvedValue(ok('success'))

      const result = await executeInteractiveCommand(options, promptFn, executeFn, context)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('PROMPT_ERROR')
        expect(result.error.message).toContain('Interactive prompts failed')
      }
      expect(executeFn).not.toHaveBeenCalled()
    })

    it('should propagate execute function result', async () => {
      const options: TestOptions = { interactive: false }
      const promptFn = vi.fn()
      const executeFn = vi
        .fn()
        .mockResolvedValue(err(createCoreError('EXEC_ERROR', 'CLI_ERROR', 'Execution failed')))

      const result = await executeInteractiveCommand(options, promptFn, executeFn, context)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('EXEC_ERROR')
      }
    })
  })

  describe('executeWithValidation', () => {
    let context: CommandContext

    beforeEach(() => {
      context = createMockContext()
    })

    interface TestData {
      path: string
      value: number
    }

    it('should execute function when all validations pass', async () => {
      const data: TestData = { path: '/valid/path', value: 42 }
      const rules: ValidationRule<TestData>[] = [
        { name: 'path-check', validate: (d) => ok(d) },
        { name: 'value-check', validate: (d) => ok(d) },
      ]
      const executeFn = vi.fn().mockResolvedValue(ok('processed'))

      const result = await executeWithValidation(data, rules, executeFn, context)

      expect(result.isOk()).toBe(true)
      expect(executeFn).toHaveBeenCalledWith(data)
    })

    it('should stop on first validation failure', async () => {
      const data: TestData = { path: '', value: 42 }
      const rules: ValidationRule<TestData>[] = [
        {
          name: 'path-required',
          validate: (d) =>
            d.path ? ok(d) : err(createCoreError('INVALID_PATH', 'VALIDATION_ERROR', 'Path required')),
        },
        { name: 'value-check', validate: vi.fn().mockReturnValue(ok(data)) },
      ]
      const executeFn = vi.fn().mockResolvedValue(ok('processed'))

      const result = await executeWithValidation(data, rules, executeFn, context)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH')
      }
      expect(rules[1].validate).not.toHaveBeenCalled()
      expect(executeFn).not.toHaveBeenCalled()
    })

    it('should allow validators to transform data', async () => {
      const data: TestData = { path: 'relative/path', value: 10 }
      const rules: ValidationRule<TestData>[] = [
        {
          name: 'normalize-path',
          validate: (d) => ok({ ...d, path: `/absolute/${d.path}` }),
        },
        {
          name: 'double-value',
          validate: (d) => ok({ ...d, value: d.value * 2 }),
        },
      ]
      const executeFn = vi.fn().mockResolvedValue(ok('done'))

      await executeWithValidation(data, rules, executeFn, context)

      expect(executeFn).toHaveBeenCalledWith({
        path: '/absolute/relative/path',
        value: 20,
      })
    })

    it('should log validation failure', async () => {
      const data: TestData = { path: '', value: 0 }
      const rules: ValidationRule<TestData>[] = [
        {
          name: 'failing-rule',
          validate: () => err(createCoreError('VALIDATION', 'VALIDATION_ERROR', 'Failed')),
        },
      ]
      const executeFn = vi.fn()

      await executeWithValidation(data, rules, executeFn, context)

      expect(context.logger.error).toHaveBeenCalledWith('Validation failed: failing-rule')
    })

    it('should handle empty rules array', async () => {
      const data: TestData = { path: '/test', value: 5 }
      const executeFn = vi.fn().mockResolvedValue(ok('executed'))

      const result = await executeWithValidation(data, [], executeFn, context)

      expect(result.isOk()).toBe(true)
      expect(executeFn).toHaveBeenCalledWith(data)
    })

    it('should propagate execute function error', async () => {
      const data: TestData = { path: '/test', value: 5 }
      const rules: ValidationRule<TestData>[] = []
      const executeFn = vi
        .fn()
        .mockResolvedValue(err(createCoreError('EXEC_ERROR', 'CLI_ERROR', 'Execute failed')))

      const result = await executeWithValidation(data, rules, executeFn, context)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('EXEC_ERROR')
      }
    })
  })

  describe('executeWithDryRun', () => {
    let context: CommandContext

    beforeEach(() => {
      context = createMockContext()
    })

    interface DryRunOptions {
      dryRun?: boolean
      target: string
    }

    it('should show dry-run messaging when dryRun is true', async () => {
      const options: DryRunOptions = { dryRun: true, target: 'test.txt' }
      const executeFn = vi.fn().mockResolvedValue(ok('result'))

      const result = await executeWithDryRun(options, executeFn, context)

      expect(result.isOk()).toBe(true)
      expect(context.logger.info).toHaveBeenCalledWith('🔍 DRY RUN MODE - No changes will be made')
      expect(context.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('no actual changes were made')
      )
    })

    it('should execute function even in dry-run mode', async () => {
      const options: DryRunOptions = { dryRun: true, target: 'test.txt' }
      const executeFn = vi.fn().mockResolvedValue(ok('result'))

      await executeWithDryRun(options, executeFn, context)

      expect(executeFn).toHaveBeenCalledWith(options)
    })

    it('should execute normally when dryRun is false', async () => {
      const options: DryRunOptions = { dryRun: false, target: 'test.txt' }
      const executeFn = vi.fn().mockResolvedValue(ok('result'))

      const result = await executeWithDryRun(options, executeFn, context)

      expect(result.isOk()).toBe(true)
      expect(executeFn).toHaveBeenCalledWith(options)
      // Should not show dry-run messaging
      const dryRunCalls = (context.logger.info as any).mock.calls.filter((c: any[]) =>
        c[0]?.includes?.('DRY RUN')
      )
      expect(dryRunCalls).toHaveLength(0)
    })

    it('should skip dry-run messaging when result is error', async () => {
      const options: DryRunOptions = { dryRun: true, target: 'test.txt' }
      const executeFn = vi
        .fn()
        .mockResolvedValue(err(createCoreError('ERROR', 'CLI_ERROR', 'Failed')))

      const result = await executeWithDryRun(options, executeFn, context)

      expect(result.isErr()).toBe(true)
      // Should show initial dry-run message but not completion message
      expect(context.logger.info).toHaveBeenCalledWith('🔍 DRY RUN MODE - No changes will be made')
      const completionCalls = (context.logger.info as any).mock.calls.filter((c: any[]) =>
        c[0]?.includes?.('no actual changes were made')
      )
      expect(completionCalls).toHaveLength(0)
    })

    it('should skip confirmation when --force is in args', async () => {
      const forceContext = createMockContext({ args: ['--force'] })
      const options: DryRunOptions = { dryRun: false, target: 'test.txt' }
      const executeFn = vi.fn().mockResolvedValue(ok('result'))

      const result = await executeWithDryRun(
        options,
        executeFn,
        forceContext,
        'Are you sure you want to proceed?'
      )

      expect(result.isOk()).toBe(true)
      expect(executeFn).toHaveBeenCalled()
    })

    it('should handle undefined dryRun option as false', async () => {
      const options = { target: 'test.txt' } as DryRunOptions
      const executeFn = vi.fn().mockResolvedValue(ok('result'))

      const result = await executeWithDryRun(options, executeFn, context)

      expect(result.isOk()).toBe(true)
      expect(executeFn).toHaveBeenCalled()
      // Should not show dry-run messaging
      const dryRunCalls = (context.logger.info as any).mock.calls.filter((c: any[]) =>
        c[0]?.includes?.('DRY RUN')
      )
      expect(dryRunCalls).toHaveLength(0)
    })
  })
})
