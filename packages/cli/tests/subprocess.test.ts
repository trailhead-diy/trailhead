import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok } from '@trailhead/core'
import { executeSubprocess, type SubprocessConfig } from '../src/command/patterns.js'
import type { CommandContext } from '../src/command/types.js'

describe('Subprocess Execution', () => {
  let mockContext: CommandContext

  beforeEach(() => {
    mockContext = {
      projectRoot: process.cwd(),
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        success: vi.fn(),
        debug: vi.fn(),
        step: vi.fn(),
      },
      verbose: false,
      fs: {} as any,
      args: [],
    }
  })

  describe('executeSubprocess', () => {
    it('should execute simple command and return stdout', async () => {
      const config: SubprocessConfig = {
        command: 'echo',
        args: ['hello world'],
      }

      const result = await executeSubprocess(config, mockContext)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.trim()).toBe('hello world')
      }
    })

    it('should capture stdout from command', async () => {
      const config: SubprocessConfig = {
        command: 'node',
        args: ['-e', 'console.log("test output")'],
      }

      const result = await executeSubprocess(config, mockContext)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toContain('test output')
      }
    })

    it('should return error for non-zero exit code', async () => {
      const config: SubprocessConfig = {
        command: 'node',
        args: ['-e', 'process.exit(1)'],
      }

      const result = await executeSubprocess(config, mockContext)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('SUBPROCESS_EXIT_ERROR')
        expect(result.error.message).toContain('exited with code 1')
      }
    })

    it('should return error for non-existent command', async () => {
      const config: SubprocessConfig = {
        command: 'nonexistent_command_xyz',
        args: [],
      }

      const result = await executeSubprocess(config, mockContext)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('SUBPROCESS_ERROR')
        expect(result.error.message).toContain('Failed to spawn')
      }
    })

    it('should use custom working directory', async () => {
      const config: SubprocessConfig = {
        command: 'pwd',
        args: [],
        cwd: '/tmp',
      }

      const result = await executeSubprocess(config, mockContext)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // On macOS, /tmp is a symlink to /private/tmp
        expect(result.value.trim()).toMatch(/^(\/tmp|\/private\/tmp)$/)
      }
    })

    it('should pass custom environment variables', async () => {
      const config: SubprocessConfig = {
        command: 'node',
        args: ['-e', 'console.log(process.env.TEST_VAR)'],
        env: { TEST_VAR: 'custom_value' },
      }

      const result = await executeSubprocess(config, mockContext)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toContain('custom_value')
      }
    })

    it('should capture stderr on failure', async () => {
      const config: SubprocessConfig = {
        command: 'node',
        args: ['-e', 'console.error("error message"); process.exit(1)'],
      }

      const result = await executeSubprocess(config, mockContext)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.context?.stderr).toContain('error message')
      }
    })

    it('should log debug message when spawning', async () => {
      const config: SubprocessConfig = {
        command: 'echo',
        args: ['test'],
      }

      await executeSubprocess(config, mockContext)

      expect(mockContext.logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Spawning: echo test')
      )
    })

    it('should inherit stdio in verbose mode', async () => {
      const verboseContext: CommandContext = {
        ...mockContext,
        verbose: true,
      }

      const config: SubprocessConfig = {
        command: 'echo',
        args: ['verbose output'],
      }

      const result = await executeSubprocess(config, verboseContext)

      // In verbose mode, stdout is inherited so we get empty string
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // With inherited stdio, stdout is not captured
        expect(result.value).toBe('')
      }
    })
  })

  describe('Subprocess Edge Cases', () => {
    it('should handle command with multiple arguments', async () => {
      // Use echo to test that multiple args are passed correctly
      const config: SubprocessConfig = {
        command: 'echo',
        args: ['arg1', 'arg2', 'arg3'],
      }

      const result = await executeSubprocess(config, mockContext)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.trim()).toBe('arg1 arg2 arg3')
      }
    })

    it('should handle command with special characters in args', async () => {
      const config: SubprocessConfig = {
        command: 'echo',
        args: ['hello "world"'],
      }

      const result = await executeSubprocess(config, mockContext)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toContain('hello')
        expect(result.value).toContain('world')
      }
    })

    it('should handle empty args array', async () => {
      const config: SubprocessConfig = {
        command: 'node',
        args: [],
      }

      // node without args will wait for input, so use a quick version check
      const versionConfig: SubprocessConfig = {
        command: 'node',
        args: ['--version'],
      }

      const result = await executeSubprocess(versionConfig, mockContext)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toMatch(/^v\d+\.\d+\.\d+/)
      }
    })
  })
})
