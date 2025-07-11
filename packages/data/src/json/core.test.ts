import { describe, it, expect } from 'vitest';
import { createJSONOperations } from './core.js';

describe('JSON Core Operations', () => {
  const jsonOps = createJSONOperations();

  describe('parseString', () => {
    it('should parse valid JSON data', () => {
      const jsonData = '{"name": "John", "age": 30}';
      const result = jsonOps.parseString(jsonData);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ name: 'John', age: 30 });
      }
    });

    it('should handle empty JSON data', () => {
      const result = jsonOps.parseString('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Empty JSON data provided');
      }
    });

    it('should handle invalid JSON syntax', () => {
      const result = jsonOps.parseString('{"invalid": json}');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('JSON parsing failed');
      }
    });

    it('should handle trailing commas when allowed', () => {
      const jsonData = '{"name": "John", "age": 30,}';
      const result = jsonOps.parseString(jsonData, { allowTrailingCommas: true });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ name: 'John', age: 30 });
      }
    });

    it('should handle comments when allowed', () => {
      const jsonData = `{
        // This is a comment
        "name": "John",
        /* Multi-line comment */
        "age": 30
      }`;
      const result = jsonOps.parseString(jsonData, { allowComments: true });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ name: 'John', age: 30 });
      }
    });
  });

  describe('stringify', () => {
    it('should stringify object to JSON', () => {
      const data = { name: 'John', age: 30 };
      const result = jsonOps.stringify(data);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('{"name":"John","age":30}');
      }
    });

    it('should format JSON with indentation', () => {
      const data = { name: 'John', age: 30 };
      const result = jsonOps.stringify(data, { space: 2 });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('  "name": "John"');
        expect(result.value).toContain('  "age": 30');
      }
    });

    it('should handle undefined values', () => {
      const result = jsonOps.stringify(undefined);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Cannot stringify undefined value');
      }
    });
  });

  describe('validate', () => {
    it('should validate valid JSON data', () => {
      const jsonData = '{"name": "John", "age": 30}';
      const result = jsonOps.validate(jsonData);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it('should reject invalid JSON data', () => {
      const result = jsonOps.validate('{"invalid": json}');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });

    it('should reject empty data', () => {
      const result = jsonOps.validate('');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe('minify', () => {
    it('should minify formatted JSON', () => {
      const formattedJson = `{
        "name": "John",
        "age": 30
      }`;
      const result = jsonOps.minify(formattedJson);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('{"name":"John","age":30}');
      }
    });

    it('should handle invalid JSON in minify', () => {
      const result = jsonOps.minify('{"invalid": json}');

      expect(result.isErr()).toBe(true);
    });
  });

  describe('format', () => {
    it('should format minified JSON', () => {
      const minifiedJson = '{"name":"John","age":30}';
      const result = jsonOps.format(minifiedJson, { indent: 2 });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('  "name": "John"');
        expect(result.value).toContain('  "age": 30');
      }
    });

    it('should sort keys when requested', () => {
      const jsonData = '{"b": 2, "a": 1}';
      const result = jsonOps.format(jsonData, { sortKeys: true });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsed = JSON.parse(result.value);
        const keys = Object.keys(parsed);
        expect(keys).toEqual(['a', 'b']);
      }
    });
  });
});
