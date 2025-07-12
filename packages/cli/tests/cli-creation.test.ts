import { describe, it, expect } from 'vitest';
import { createCLI } from '../src/cli.js';
import { createCommand } from '../src/command/index.js';
import { ok } from '@trailhead/core';

describe('CLI Creation and Configuration', () => {
  it('should create CLI with basic configuration', () => {
    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI application',
    });

    expect(cli).toBeDefined();
    expect(cli.run).toBeTypeOf('function');
  });

  it('should create CLI with commands', () => {
    const testCommand = createCommand({
      name: 'test',
      description: 'Test command',
      action: async () => ok(undefined),
    });

    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI with commands',
      commands: [testCommand],
    });

    expect(cli).toBeDefined();
    expect(cli.run).toBeTypeOf('function');
  });

  it('should handle empty commands array', () => {
    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI without commands',
      commands: [],
    });

    expect(cli).toBeDefined();
  });

  it('should handle undefined commands', () => {
    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI without commands',
    });

    expect(cli).toBeDefined();
  });
});
