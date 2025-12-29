import { describe, it, expect } from 'vitest'
import {
  processOptionWithCache,
  processCommandOptionsWithCache,
} from '../src/command/performance.js'
import type { CommandOption } from '../src/command/types.js'

describe('processOptionWithCache', () => {
  it('should process option with flags and extract name', () => {
    const option: CommandOption = {
      flags: '-o, --output <dir>',
      description: 'Output directory',
      type: 'string',
    }

    const result = processOptionWithCache(option, 0)

    expect(result.flags).toBe('-o, --output <dir>')
    expect(result.name).toBe('output')
    expect(result.type).toBe('string')
    expect(result.required).toBe(false)
  })

  it('should process option with name and alias', () => {
    const option: CommandOption = {
      name: 'verbose',
      alias: 'v',
      description: 'Enable verbose output',
      type: 'boolean',
    }

    const result = processOptionWithCache(option, 0)

    expect(result.flags).toBe('-v, --verbose')
    expect(result.name).toBe('verbose')
    expect(result.type).toBe('boolean')
  })

  it('should process option with just name (no alias)', () => {
    const option: CommandOption = {
      name: 'debug',
      description: 'Enable debug mode',
      type: 'boolean',
    }

    const result = processOptionWithCache(option, 0)

    expect(result.flags).toBe('--debug')
    expect(result.name).toBe('debug')
  })

  it('should add <value> for non-boolean options without flags', () => {
    const option: CommandOption = {
      name: 'config',
      description: 'Config file path',
      type: 'string',
    }

    const result = processOptionWithCache(option, 0)

    expect(result.flags).toBe('--config <value>')
    expect(result.type).toBe('string')
  })

  it('should not add <value> for boolean options', () => {
    const option: CommandOption = {
      name: 'force',
      description: 'Force operation',
      type: 'boolean',
    }

    const result = processOptionWithCache(option, 0)

    expect(result.flags).toBe('--force')
    expect(result.flags).not.toContain('<value>')
  })

  it('should use fallback name when flags regex fails to match', () => {
    const option: CommandOption = {
      flags: '-x', // No long option
      description: 'Short option only',
    }

    const result = processOptionWithCache(option, 5)

    expect(result.flags).toBe('-x')
    expect(result.name).toBe('option_5') // Fallback using index
  })

  it('should preserve explicit name even with flags', () => {
    const option: CommandOption = {
      name: 'myName',
      flags: '-o, --output <dir>',
      description: 'Output directory',
    }

    const result = processOptionWithCache(option, 0)

    expect(result.name).toBe('myName') // Explicit name takes precedence
  })

  it('should throw error when option has neither name nor flags', () => {
    const option: CommandOption = {
      description: 'Invalid option',
    } as CommandOption

    expect(() => processOptionWithCache(option, 3)).toThrow(
      'Option at index 3 has no name or flags'
    )
  })

  it('should set required flag when option is required', () => {
    const option: CommandOption = {
      name: 'input',
      description: 'Required input file',
      type: 'string',
      required: true,
    }

    const result = processOptionWithCache(option, 0)

    expect(result.required).toBe(true)
  })

  it('should return cached result for same option object', () => {
    const option: CommandOption = {
      flags: '-t, --test',
      description: 'Test option',
      type: 'boolean',
    }

    const result1 = processOptionWithCache(option, 0)
    const result2 = processOptionWithCache(option, 0)

    // Same reference means cached
    expect(result1).toBe(result2)
  })

  it('should process different option objects independently', () => {
    const option1: CommandOption = {
      name: 'first',
      description: 'First option',
      type: 'boolean',
    }
    const option2: CommandOption = {
      name: 'second',
      description: 'Second option',
      type: 'boolean',
    }

    const result1 = processOptionWithCache(option1, 0)
    const result2 = processOptionWithCache(option2, 1)

    expect(result1.name).toBe('first')
    expect(result2.name).toBe('second')
  })
})

describe('processCommandOptionsWithCache', () => {
  it('should process array of options', () => {
    const options: CommandOption[] = [
      { flags: '-v, --verbose', description: 'Verbose output', type: 'boolean' },
      { flags: '-o, --output <dir>', description: 'Output directory', type: 'string' },
    ]

    const result = processCommandOptionsWithCache(options)

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('verbose')
    expect(result[1].name).toBe('output')
  })

  it('should return empty array for empty options', () => {
    const result = processCommandOptionsWithCache([])

    expect(result).toEqual([])
  })

  it('should process mixed option styles', () => {
    const options: CommandOption[] = [
      { flags: '-c, --config <file>', description: 'Config file', type: 'string' },
      { name: 'debug', alias: 'd', description: 'Debug mode', type: 'boolean' },
      { name: 'quiet', description: 'Quiet mode', type: 'boolean' },
    ]

    const result = processCommandOptionsWithCache(options)

    expect(result).toHaveLength(3)
    expect(result[0].flags).toBe('-c, --config <file>')
    expect(result[1].flags).toBe('-d, --debug')
    expect(result[2].flags).toBe('--quiet')
  })
})
