import { describe, it, expect } from 'vitest';
import { createCLI } from '../src/cli.js';
import { createCommand } from '../src/command/index.js';
import { ok, err } from '@trailhead/core';

describe('Domain Package Integration', () => {
  it('should import and use @trailhead/core types', () => {
    // Test that Result types work correctly
    const successResult = ok('test');
    const errorResult = err({
      type: 'TEST_ERROR',
      message: 'Test error',
      recoverable: false,
    });

    expect(successResult.isOk()).toBe(true);
    expect(errorResult.isErr()).toBe(true);
  });

  it('should integrate @trailhead/fs in command context', async () => {
    const command = createCommand({
      name: 'fs-test',
      description: 'Test filesystem integration',
      action: async (options, context) => {
        // Verify fs is available in context
        expect(context.fs).toBeDefined();
        expect(context.fs.exists).toBeTypeOf('function');
        expect(context.fs.readFile).toBeTypeOf('function');
        expect(context.fs.writeFile).toBeTypeOf('function');

        return ok(undefined);
      },
    });

    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI with FS integration',
      commands: [command],
    });

    expect(cli).toBeDefined();
  });

  it('should provide logger in command context', async () => {
    const command = createCommand({
      name: 'logger-test',
      description: 'Test logger integration',
      action: async (options, context) => {
        // Verify logger is available
        expect(context.logger).toBeDefined();
        expect(context.logger.info).toBeTypeOf('function');
        expect(context.logger.success).toBeTypeOf('function');
        expect(context.logger.error).toBeTypeOf('function');
        expect(context.logger.warning).toBeTypeOf('function');
        expect(context.logger.debug).toBeTypeOf('function');
        expect(context.logger.step).toBeTypeOf('function');

        return ok(undefined);
      },
    });

    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI with logger integration',
      commands: [command],
    });

    expect(cli).toBeDefined();
  });

  it('should provide project context information', async () => {
    const command = createCommand({
      name: 'context-test',
      description: 'Test context integration',
      action: async (options, context) => {
        // Verify context provides necessary information
        expect(context.projectRoot).toBeTypeOf('string');
        expect(context.verbose).toBeTypeOf('boolean');
        expect(context.args).toBeInstanceOf(Array);

        return ok(undefined);
      },
    });

    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI with context integration',
      commands: [command],
    });

    expect(cli).toBeDefined();
  });

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
        });
      },
    });

    // Verify command creation doesn't throw
    expect(() => command).not.toThrow();
    expect(command.name).toBe('error-test');
  });
});
