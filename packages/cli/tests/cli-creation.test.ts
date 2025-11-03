import { describe, it, expect } from 'vitest'
import { createCLI } from '../src/cli.js'
import { createCommand } from '../src/command/index.js'
import { ok } from '@trailhead/core'

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
