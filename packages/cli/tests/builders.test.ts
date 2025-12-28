import { describe, it, expect } from 'vitest'
import { defineOptions, commonOptions } from '../src/command/builders.js'

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
})
