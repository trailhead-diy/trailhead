import { describe, it, expect } from 'vitest';
import { processOptionWithCache, processCommandOptionsWithCache } from '../performance.js';
import type { CommandOption } from '../types.js';

describe('Command Performance', () => {
  describe('processOptionWithCache', () => {
    it('should process option with flags', () => {
      const option: CommandOption = {
        flags: '--output <dir>',
        description: 'Output directory',
      };

      const result = processOptionWithCache(option, 0);

      expect(result).toEqual({
        flags: '--output <dir>',
        name: 'output',
        type: undefined,
        required: false,
      });
    });

    it('should process option with name and alias', () => {
      const option: CommandOption = {
        name: 'output',
        alias: 'o',
        description: 'Output directory',
        type: 'string',
        required: true,
        default: 'dist',
      };

      const result = processOptionWithCache(option, 0);

      expect(result).toEqual({
        flags: '-o, --output <value>',
        name: 'output',
        type: 'string',
        required: true,
      });
    });

    it('should process boolean option without value placeholder', () => {
      const option: CommandOption = {
        name: 'watch',
        description: 'Watch mode',
        type: 'boolean',
      };

      const result = processOptionWithCache(option, 0);

      expect(result).toEqual({
        flags: '--watch',
        name: 'watch',
        type: 'boolean',
        required: false,
      });
    });

    it('should extract name from flags when name not provided', () => {
      const option: CommandOption = {
        flags: '-v, --verbose',
        description: 'Verbose output',
      };

      const result = processOptionWithCache(option, 0);

      expect(result.name).toBe('verbose');
      expect(result.flags).toBe('-v, --verbose');
    });

    it('should handle default value in option definition', () => {
      const option: CommandOption = {
        name: 'output',
        description: 'Output directory',
        default: 'default-value',
      };

      const result = processOptionWithCache(option, 0);

      expect(result.name).toBe('output');
      expect(result.flags).toBe('--output <value>');
    });

    it('should cache processed options', () => {
      const option: CommandOption = {
        name: 'output',
        description: 'Output directory',
      };

      // First call
      const result1 = processOptionWithCache(option, 0);

      // Second call should return same object reference (cached)
      const result2 = processOptionWithCache(option, 0);

      expect(result1).toBe(result2);
    });

    it('should throw for option without name or flags', () => {
      const option: CommandOption = {
        description: 'Invalid option',
      };

      expect(() => processOptionWithCache(option, 0)).toThrow(
        'Option at index 0 has no name or flags'
      );
    });
  });

  describe('processCommandOptionsWithCache', () => {
    it('should process multiple options', () => {
      const options: CommandOption[] = [
        {
          name: 'output',
          alias: 'o',
          description: 'Output directory',
          type: 'string',
        },
        {
          flags: '--watch',
          description: 'Watch mode',
          type: 'boolean',
        },
        {
          name: 'verbose',
          alias: 'v',
          description: 'Verbose output',
          type: 'boolean',
        },
      ];

      const result = processCommandOptionsWithCache(options);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('output');
      expect(result[0].flags).toBe('-o, --output <value>');
      expect(result[1].name).toBe('watch');
      expect(result[1].flags).toBe('--watch');
      expect(result[2].name).toBe('verbose');
      expect(result[2].flags).toBe('-v, --verbose');
    });

    it('should cache processed options array', () => {
      const options: CommandOption[] = [
        {
          name: 'output',
          description: 'Output directory',
        },
      ];

      // First call
      const result1 = processCommandOptionsWithCache(options);

      // Second call should return same array reference (cached)
      const result2 = processCommandOptionsWithCache(options);

      expect(result1).toStrictEqual(result2);
    });

    it('should handle empty options array', () => {
      const options: CommandOption[] = [];

      const result = processCommandOptionsWithCache(options);

      expect(result).toEqual([]);
    });
  });

  describe('cache behavior', () => {
    it('should use WeakMap for caching processed options', () => {
      const option: CommandOption = {
        name: 'output',
        description: 'Output directory',
      };

      // First call creates processed option
      const result1 = processOptionWithCache(option, 0);

      // Second call returns same cached instance
      const result2 = processOptionWithCache(option, 0);

      // Should be the same object reference (cached)
      expect(result1).toBe(result2);
      expect(result1.name).toBe('output');
      expect(result1.flags).toBe('--output <value>');
    });

    it('should cache different options separately', () => {
      const option1: CommandOption = {
        name: 'input',
        description: 'Input file',
      };

      const option2: CommandOption = {
        name: 'output',
        description: 'Output file',
      };

      const result1 = processOptionWithCache(option1, 0);
      const result2 = processOptionWithCache(option2, 1);

      // Different options should have different results
      expect(result1).not.toBe(result2);
      expect(result1.name).toBe('input');
      expect(result2.name).toBe('output');
    });
  });
});
