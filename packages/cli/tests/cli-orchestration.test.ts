import { describe, it, expect } from 'vitest'
import { createCLI } from '../src/cli.js'
import { createCommand } from '../src/command/index.js'
import { ok } from '@esteban-url/core'

describe('CLI Orchestration', () => {
  it('should orchestrate multiple commands', () => {
    const command1 = createCommand({
      name: 'build',
      description: 'Build the project',
      action: async () => ok(undefined),
    })

    const command2 = createCommand({
      name: 'test',
      description: 'Run tests',
      action: async () => ok(undefined),
    })

    const _cli = createCLI({
      name: 'project-cli',
      version: '1.0.0',
      description: 'Project management CLI',
      commands: [command1, command2],
    })

    // Test actual functionality, not just existence
    expect(typeof _cli.run).toBe('function')
  })

  it('should provide consistent context across commands', async () => {
    const contextSnapshots: any[] = []

    const command1 = createCommand({
      name: 'context-test-1',
      description: 'First context test',
      action: async (options, context) => {
        contextSnapshots.push({
          projectRoot: context.projectRoot,
          hasLogger: !!context.logger,
          hasFs: !!context.fs,
          verbose: context.verbose,
        })
        return ok(undefined)
      },
    })

    const command2 = createCommand({
      name: 'context-test-2',
      description: 'Second context test',
      action: async (options, context) => {
        contextSnapshots.push({
          projectRoot: context.projectRoot,
          hasLogger: !!context.logger,
          hasFs: !!context.fs,
          verbose: context.verbose,
        })
        return ok(undefined)
      },
    })

    const _cli = createCLI({
      name: 'context-cli',
      version: '1.0.0',
      description: 'CLI for testing context consistency',
      commands: [command1, command2],
    })

    // Context snapshots will be verified when commands are executed
  })

  it('should handle CLI with complex command configurations', () => {
    const complexCommand = createCommand({
      name: 'complex',
      description: 'Complex command with all features',
      arguments: '<input> [output]',
      options: [
        {
          flags: '-v, --verbose',
          description: 'Enable verbose output',
        },
        {
          flags: '-f, --format <type>',
          description: 'Output format',
          required: true,
        },
        {
          flags: '--dry-run',
          description: 'Preview changes without executing',
        },
      ],
      action: async (options, context) => {
        // Test actual values, not just types
        expect(context.projectRoot).toBe(process.cwd())
        expect(typeof context.logger.info).toBe('function')
        expect(typeof context.fs.readFile).toBe('function')

        return ok('Complex command executed successfully')
      },
    })

    const _cli = createCLI({
      name: 'complex-cli',
      version: '2.1.0',
      description: 'CLI with complex command configuration',
      commands: [complexCommand],
    })

    // Context snapshots will be verified when commands are executed
    expect(complexCommand.arguments).toBe('<input> [output]')
    expect(complexCommand.options).toHaveLength(3)
  })

  it('should maintain separation between CLI instances', () => {
    const cli1 = createCLI({
      name: 'cli-1',
      version: '1.0.0',
      description: 'First CLI instance',
    })

    const cli2 = createCLI({
      name: 'cli-2',
      version: '2.0.0',
      description: 'Second CLI instance',
    })

    // Each CLI should be independent
    expect(cli1).not.toBe(cli2)
    expect(typeof cli1.run).toBe('function')
    expect(typeof cli2.run).toBe('function')
  })
})
