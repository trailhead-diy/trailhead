import { describe, it, expect } from 'vitest';
import {
  filterUndefined,
  mergeOptionsWithDefaults,
  coerceOptionType,
  processCommandOptions,
} from '../options.js';

describe('Options Utilities', () => {
  describe('filterUndefined', () => {
    it('should remove undefined values', () => {
      const input = {
        name: 'test',
        value: undefined,
        count: 0,
        flag: false,
        data: null,
      };

      const result = filterUndefined(input);

      expect(result).toEqual({
        name: 'test',
        count: 0,
        flag: false,
        data: null,
      });
      expect(result).not.toHaveProperty('value');
    });

    it('should handle empty object', () => {
      expect(filterUndefined({})).toEqual({});
    });

    it('should handle object with all undefined values', () => {
      const input = {
        a: undefined,
        b: undefined,
        c: undefined,
      };

      expect(filterUndefined(input)).toEqual({});
    });

    it('should handle object with no undefined values', () => {
      const input = {
        name: 'test',
        count: 42,
        active: true,
        items: ['a', 'b'],
      };

      expect(filterUndefined(input)).toEqual(input);
    });

    it('should preserve falsy non-undefined values', () => {
      const input = {
        name: '',
        count: 0,
        active: false,
        items: [],
        data: null,
        missing: undefined,
      };

      const result = filterUndefined(input);

      expect(result).toEqual({
        name: '',
        count: 0,
        active: false,
        items: [],
        data: null,
      });
    });
  });

  describe('mergeOptionsWithDefaults', () => {
    it('should merge options with defaults', () => {
      const defaults = {
        host: 'localhost',
        port: 3000,
        debug: false,
        features: [],
      };

      const options = {
        port: 8080,
        debug: true,
      };

      const result = mergeOptionsWithDefaults(defaults, options);

      expect(result).toEqual({
        host: 'localhost',
        port: 8080,
        debug: true,
        features: [],
      });
    });

    it('should filter undefined values before merging', () => {
      const defaults = {
        timeout: 5000,
        retries: 3,
        verbose: false,
      };

      const options = {
        timeout: undefined,
        retries: 5,
        verbose: undefined,
      };

      const result = mergeOptionsWithDefaults(defaults, options);

      expect(result).toEqual({
        timeout: 5000, // default preserved
        retries: 5,    // option applied
        verbose: false, // default preserved
      });
    });

    it('should handle empty defaults and options', () => {
      expect(mergeOptionsWithDefaults({}, {})).toEqual({});
    });

    it('should handle null and false values correctly', () => {
      const defaults = {
        value1: 'default',
        value2: true,
        value3: 100,
      };

      const options = {
        value1: null,
        value2: false,
        value3: 0,
      };

      const result = mergeOptionsWithDefaults(defaults, options);

      expect(result).toEqual({
        value1: null,
        value2: false,
        value3: 0,
      });
    });

    it('should add new properties from options', () => {
      const defaults = {
        name: 'test',
      };

      const options = {
        version: '1.0.0',
        description: 'Test app',
      };

      const result = mergeOptionsWithDefaults(defaults, options);

      expect(result).toEqual({
        name: 'test',
        version: '1.0.0',
        description: 'Test app',
      });
    });
  });

  describe('coerceOptionType', () => {
    describe('string coercion', () => {
      it('should convert values to string', () => {
        expect(coerceOptionType(123, 'string')).toBe('123');
        expect(coerceOptionType(true, 'string')).toBe('true');
        expect(coerceOptionType(false, 'string')).toBe('false');
        expect(coerceOptionType([1, 2, 3], 'string')).toBe('1,2,3');
        expect(coerceOptionType({ a: 1 }, 'string')).toBe('[object Object]');
      });

      it('should preserve string values', () => {
        expect(coerceOptionType('hello', 'string')).toBe('hello');
        expect(coerceOptionType('', 'string')).toBe('');
      });

      it('should handle null and undefined', () => {
        expect(coerceOptionType(null, 'string')).toBe(null);
        expect(coerceOptionType(undefined, 'string')).toBe(undefined);
      });
    });

    describe('number coercion', () => {
      it('should convert string numbers to numbers', () => {
        expect(coerceOptionType('123', 'number')).toBe(123);
        expect(coerceOptionType('3.14', 'number')).toBe(3.14);
        expect(coerceOptionType('-42', 'number')).toBe(-42);
        expect(coerceOptionType('0', 'number')).toBe(0);
      });

      it('should preserve number values', () => {
        expect(coerceOptionType(123, 'number')).toBe(123);
        expect(coerceOptionType(0, 'number')).toBe(0);
        expect(coerceOptionType(-42.5, 'number')).toBe(-42.5);
      });

      it('should return original value for invalid numbers', () => {
        expect(coerceOptionType('not-a-number', 'number')).toBe('not-a-number');
        expect(coerceOptionType('', 'number')).toBe(0); // Empty string converts to 0
        expect(coerceOptionType('abc123', 'number')).toBe('abc123');
      });

      it('should handle null and undefined', () => {
        expect(coerceOptionType(null, 'number')).toBe(null);
        expect(coerceOptionType(undefined, 'number')).toBe(undefined);
      });
    });

    describe('boolean coercion', () => {
      it('should preserve boolean values', () => {
        expect(coerceOptionType(true, 'boolean')).toBe(true);
        expect(coerceOptionType(false, 'boolean')).toBe(false);
      });

      it('should convert string booleans', () => {
        expect(coerceOptionType('true', 'boolean')).toBe(true);
        expect(coerceOptionType('false', 'boolean')).toBe(false);
      });

      it('should convert truthy/falsy values', () => {
        expect(coerceOptionType(1, 'boolean')).toBe(true);
        expect(coerceOptionType(0, 'boolean')).toBe(false);
        expect(coerceOptionType('yes', 'boolean')).toBe(true);
        expect(coerceOptionType('', 'boolean')).toBe(false);
        expect(coerceOptionType([], 'boolean')).toBe(true);
        expect(coerceOptionType({}, 'boolean')).toBe(true);
      });

      it('should handle null and undefined', () => {
        expect(coerceOptionType(null, 'boolean')).toBe(null);
        expect(coerceOptionType(undefined, 'boolean')).toBe(undefined);
      });
    });

    it('should return original value for unknown types', () => {
      expect(coerceOptionType('test', 'unknown' as any)).toBe('test');
      expect(coerceOptionType(123, 'invalid' as any)).toBe(123);
    });
  });

  describe('processCommandOptions', () => {
    it('should process options with type definitions', () => {
      const rawOptions = {
        name: 'test',
        port: '8080',
        verbose: 'true',
        count: undefined,
        debug: false,
      };

      const optionDefinitions = [
        { name: 'name', type: 'string' as const },
        { name: 'port', type: 'number' as const },
        { name: 'verbose', type: 'boolean' as const },
        { name: 'debug', type: 'boolean' as const },
      ];

      const result = processCommandOptions(rawOptions, optionDefinitions);

      expect(result).toEqual({
        name: 'test',
        port: 8080,
        verbose: true,
        debug: false,
        // count is undefined, so it's filtered out
      });
    });

    it('should handle options without type definitions', () => {
      const rawOptions = {
        name: 'test',
        value: 123,
        flag: true,
        missing: undefined,
      };

      const result = processCommandOptions(rawOptions);

      expect(result).toEqual({
        name: 'test',
        value: 123,
        flag: true,
        // missing is undefined, so it's filtered out
      });
    });

    it('should handle partial option definitions', () => {
      const rawOptions = {
        name: 'test',
        port: '3000',
        verbose: 'true',
        extra: 'value',
        missing: undefined,
      };

      const optionDefinitions = [
        { name: 'port', type: 'number' as const },
      ];

      const result = processCommandOptions(rawOptions, optionDefinitions);

      expect(result).toEqual({
        port: 3000,      // type coerced
        name: 'test',    // preserved as-is
        verbose: 'true', // preserved as-is
        extra: 'value',  // preserved as-is
        // missing is filtered out
      });
    });

    it('should handle empty input', () => {
      expect(processCommandOptions({})).toEqual({});
      expect(processCommandOptions({}, [])).toEqual({});
    });

    it('should preserve non-undefined falsy values', () => {
      const rawOptions = {
        name: '',
        count: 0,
        active: false,
        items: null,
        missing: undefined,
      };

      const result = processCommandOptions(rawOptions);

      expect(result).toEqual({
        name: '',
        count: 0,
        active: false,
        items: null,
      });
    });

    it('should handle complex option definitions', () => {
      const rawOptions = {
        host: 'localhost',
        port: '8080',
        ssl: 'false',
        timeout: '5000',
        verbose: undefined,
        debug: 'true',
        retries: '3',
      };

      const optionDefinitions = [
        { name: 'host', type: 'string' as const },
        { name: 'port', type: 'number' as const },
        { name: 'ssl', type: 'boolean' as const },
        { name: 'timeout', type: 'number' as const },
        { name: 'debug', type: 'boolean' as const },
        { name: 'retries', type: 'number' as const },
      ];

      const result = processCommandOptions(rawOptions, optionDefinitions);

      expect(result).toEqual({
        host: 'localhost',
        port: 8080,
        ssl: false,
        timeout: 5000,
        debug: true,
        retries: 3,
        // verbose is filtered out (undefined)
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should work with real CLI option patterns', () => {
      // Simulate commander.js-style options
      const rawOptions = {
        input: 'file.txt',
        output: undefined,  // Not provided
        format: 'json',
        verbose: true,
        port: '3000',
        ssl: undefined,     // Not provided
      };

      const defaults = {
        output: 'output.txt',
        format: 'text',
        verbose: false,
        port: 8080,
        ssl: false,
      };

      const optionDefinitions = [
        { name: 'port', type: 'number' as const },
      ];

      // Process and merge
      const processed = processCommandOptions(rawOptions, optionDefinitions);
      const final = mergeOptionsWithDefaults(defaults, processed);

      expect(final).toEqual({
        input: 'file.txt',
        output: 'output.txt', // default preserved (undefined filtered)
        format: 'json',       // option applied
        verbose: true,        // option applied
        port: 3000,          // option applied and coerced
        ssl: false,          // default preserved (undefined filtered)
      });
    });

    it('should handle nested option configurations', () => {
      const rawOptions = {
        database: {
          host: 'localhost',
          port: '5432',
          ssl: 'true',
        },
        api: {
          version: 'v2',
          timeout: undefined,
        },
      };

      // Process nested options separately
      const processed = processCommandOptions(rawOptions);

      expect(processed).toEqual({
        database: {
          host: 'localhost',
          port: '5432',
          ssl: 'true',
        },
        api: {
          version: 'v2',
          // timeout filtered out
        },
      });
    });
  });
});