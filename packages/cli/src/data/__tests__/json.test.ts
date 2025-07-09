import { describe, it, expect } from 'vitest';
import { createJSONProcessor, jsonUtils } from '../json.js';

describe('JSON Processor', () => {
  const jsonData = `{
    "name": "John",
    "age": 30,
    "email": "john@example.com",
    "active": true
  }`;

  const json5Data = `{
    name: "John", // Single quotes and comments
    age: 30,
    email: "john@example.com",
    active: true,
    trailing: "comma", // Trailing comma
  }`;

  describe('createJSONProcessor', () => {
    it('should create a JSON processor with default options', () => {
      const processor = createJSONProcessor();
      expect(processor).toBeDefined();
      expect(typeof processor.parseString).toBe('function');
      expect(typeof processor.stringify).toBe('function');
    });

    it('should create a JSON processor with custom options', () => {
      const processor = createJSONProcessor({
        allowTrailingCommas: false,
        allowComments: false,
        errorTolerant: true,
      });
      expect(processor).toBeDefined();
    });
  });

  describe('parseString', () => {
    it('should parse valid JSON', () => {
      const processor = createJSONProcessor();
      const result = processor.parseString(jsonData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          name: 'John',
          age: 30,
          email: 'john@example.com',
          active: true,
        });
      }
    });

    it('should parse JSON5 with enhanced features', () => {
      const processor = createJSONProcessor({
        allowTrailingCommas: true,
        allowComments: true,
        allowSingleQuotes: true,
      });

      const result = processor.parseString(json5Data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.name).toBe('John');
        expect(result.value.trailing).toBe('comma');
      }
    });

    it('should handle malformed JSON with error tolerance', () => {
      const malformedJson = `{
        "name": "John",
        "age": 30,
        "email": "john@example.com",
        "trailing": "comma",
      }`;

      const processor = createJSONProcessor({ errorTolerant: true });
      const result = processor.parseString(malformedJson);

      expect(result.success).toBe(true);
    });

    it('should fail on malformed JSON without error tolerance', () => {
      const malformedJson = `{
        "name": "John",
        "age": 30,
        "email": "john@example.com",
        "trailing": "comma",
      }`;

      const processor = createJSONProcessor({ errorTolerant: false, allowTrailingCommas: false });
      const result = processor.parseString(malformedJson);

      expect(result.success).toBe(false);
    });

    it('should use custom reviver function', () => {
      const processor = createJSONProcessor({
        reviver: (key, value) => {
          if (key === 'age') {
            return value * 2;
          }
          return value;
        },
      });

      const result = processor.parseString(jsonData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.age).toBe(60); // 30 * 2
      }
    });
  });

  describe('parseEnhanced', () => {
    it('should parse JSON with enhanced features enabled', () => {
      const processor = createJSONProcessor();
      const result = processor.parseEnhanced(json5Data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.name).toBe('John');
      }
    });
  });

  describe('stringify', () => {
    it('should stringify data to JSON', () => {
      const processor = createJSONProcessor();
      const data = {
        name: 'John',
        age: 30,
        email: 'john@example.com',
        active: true,
      };

      const result = processor.stringify(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('"name":"John"');
        expect(result.value).toContain('"age":30');
      }
    });

    it('should use JSON5 for enhanced features', () => {
      const processor = createJSONProcessor({
        allowTrailingCommas: true,
        allowComments: true,
      });

      const data = { name: 'John', age: 30 };
      const result = processor.stringify(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('name:');
      }
    });
  });

  describe('stringifyFormatted', () => {
    it('should stringify with custom formatting', () => {
      const processor = createJSONProcessor();
      const data = { name: 'John', age: 30, email: 'john@example.com' };

      const result = processor.stringifyFormatted(data, { indent: 4 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('    "name": "John"');
      }
    });

    it('should sort keys when requested', () => {
      const processor = createJSONProcessor();
      const data = { zebra: 1, apple: 2, banana: 3 };

      const result = processor.stringifyFormatted(data, { sortKeys: true });

      expect(result.success).toBe(true);
      if (result.success) {
        const lines = result.value.split('\n');
        const appleIndex = lines.findIndex(line => line.includes('apple'));
        const bananaIndex = lines.findIndex(line => line.includes('banana'));
        const zebraIndex = lines.findIndex(line => line.includes('zebra'));

        expect(appleIndex).toBeLessThan(bananaIndex);
        expect(bananaIndex).toBeLessThan(zebraIndex);
      }
    });
  });

  describe('validateJSON', () => {
    it('should validate valid JSON', () => {
      const processor = createJSONProcessor();
      const result = processor.validateJSON(jsonData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(true);
      }
    });

    it('should validate JSON5 when standard JSON fails', () => {
      const processor = createJSONProcessor();
      const result = processor.validateJSON(json5Data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(true);
      }
    });

    it('should reject invalid JSON', () => {
      const processor = createJSONProcessor();
      const invalidJson = '{ invalid json }';
      const result = processor.validateJSON(invalidJson);

      expect(result.success).toBe(false);
    });
  });

  describe('minify', () => {
    it('should minify JSON by removing whitespace', () => {
      const processor = createJSONProcessor();
      const result = processor.minify(jsonData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).not.toContain('  ');
        expect(result.value).not.toContain('\n');
        expect(result.value).toContain('{"name":"John"');
      }
    });
  });

  describe('validate', () => {
    it('should validate JSON format', () => {
      const processor = createJSONProcessor();
      const result = processor.validate(jsonData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(true);
      }
    });
  });
});

describe('JSON Utils', () => {
  describe('deepMerge', () => {
    it('should merge two objects deeply', () => {
      const target = { a: 1, b: { c: 2, d: 3 } };
      const source = { b: { d: 4, e: 5 }, f: 6 };

      const result = jsonUtils.deepMerge(target, source);

      expect(result).toEqual({
        a: 1,
        b: { c: 2, d: 4, e: 5 },
        f: 6,
      });
    });

    it('should handle null values', () => {
      const target = { a: 1 };
      const source = null;

      const result = jsonUtils.deepMerge(target, source);

      expect(result).toEqual({ a: 1 });
    });

    it('should handle arrays', () => {
      const target = { a: [1, 2] };
      const source = { a: [3, 4] };

      const result = jsonUtils.deepMerge(target, source);

      expect(result.a).toEqual([3, 4]);
    });
  });

  describe('flatten', () => {
    it('should flatten nested object', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3,
          },
        },
      };

      const result = jsonUtils.flatten(obj);

      expect(result).toEqual({
        a: 1,
        'b.c': 2,
        'b.d.e': 3,
      });
    });

    it('should use custom separator', () => {
      const obj = { a: { b: 1 } };
      const result = jsonUtils.flatten(obj, '', '_');

      expect(result).toEqual({ a_b: 1 });
    });

    it('should handle arrays', () => {
      const obj = { a: [1, 2, 3] };
      const result = jsonUtils.flatten(obj);

      expect(result).toEqual({ a: [1, 2, 3] });
    });
  });

  describe('unflatten', () => {
    it('should unflatten flattened object', () => {
      const obj = {
        a: 1,
        'b.c': 2,
        'b.d.e': 3,
      };

      const result = jsonUtils.unflatten(obj);

      expect(result).toEqual({
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3,
          },
        },
      });
    });

    it('should use custom separator', () => {
      const obj = { a_b: 1 };
      const result = jsonUtils.unflatten(obj, '_');

      expect(result).toEqual({ a: { b: 1 } });
    });
  });

  describe('deepEqual', () => {
    it('should compare objects for deep equality', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      const obj3 = { a: 1, b: { c: 3 } };

      expect(jsonUtils.deepEqual(obj1, obj2)).toBe(true);
      expect(jsonUtils.deepEqual(obj1, obj3)).toBe(false);
    });

    it('should handle arrays', () => {
      const arr1 = [1, 2, { a: 3 }];
      const arr2 = [1, 2, { a: 3 }];
      const arr3 = [1, 2, { a: 4 }];

      expect(jsonUtils.deepEqual(arr1, arr2)).toBe(true);
      expect(jsonUtils.deepEqual(arr1, arr3)).toBe(false);
    });

    it('should handle primitives', () => {
      expect(jsonUtils.deepEqual(1, 1)).toBe(true);
      expect(jsonUtils.deepEqual(1, 2)).toBe(false);
      expect(jsonUtils.deepEqual('a', 'a')).toBe(true);
      expect(jsonUtils.deepEqual('a', 'b')).toBe(false);
    });
  });

  describe('getPath', () => {
    it('should get value from nested object', () => {
      const obj = { a: { b: { c: 42 } } };
      const result = jsonUtils.getPath(obj, 'a.b.c');

      expect(result).toBe(42);
    });

    it('should return undefined for missing path', () => {
      const obj = { a: { b: 1 } };
      const result = jsonUtils.getPath(obj, 'a.c.d');

      expect(result).toBeUndefined();
    });

    it('should use custom separator', () => {
      const obj = { a: { b: 42 } };
      const result = jsonUtils.getPath(obj, 'a_b', '_');

      expect(result).toBe(42);
    });
  });

  describe('setPath', () => {
    it('should set value in nested object', () => {
      const obj = { a: { b: 1 } };
      jsonUtils.setPath(obj, 'a.b.c', 42);

      expect(obj.a.b.c).toBe(42);
    });

    it('should create missing intermediate objects', () => {
      const obj = {};
      jsonUtils.setPath(obj, 'a.b.c', 42);

      expect(obj.a.b.c).toBe(42);
    });

    it('should use custom separator', () => {
      const obj = {};
      jsonUtils.setPath(obj, 'a_b_c', 42, '_');

      expect(obj.a.b.c).toBe(42);
    });
  });

  describe('removePath', () => {
    it('should remove value from nested object', () => {
      const obj = { a: { b: { c: 42 } } };
      jsonUtils.removePath(obj, 'a.b.c');

      expect(obj.a.b.c).toBeUndefined();
    });

    it('should handle missing path gracefully', () => {
      const obj = { a: { b: 1 } };
      jsonUtils.removePath(obj, 'a.c.d');

      expect(obj.a.b).toBe(1);
    });
  });

  describe('prettify', () => {
    it('should prettify JSON object', () => {
      const obj = { name: 'John', age: 30 };
      const result = jsonUtils.prettify(obj);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('  "name": "John"');
        expect(result.value).toContain('  "age": 30');
      }
    });

    it('should use custom indent', () => {
      const obj = { name: 'John' };
      const result = jsonUtils.prettify(obj, 4);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('    "name": "John"');
      }
    });
  });

  describe('compact', () => {
    it('should compact JSON object', () => {
      const obj = { name: 'John', age: 30 };
      const result = jsonUtils.compact(obj);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('{"name":"John","age":30}');
      }
    });
  });

  describe('validateSchema', () => {
    it('should validate object against schema', () => {
      const data = { name: 'John', age: 30 };
      const schema = {
        name: { type: 'string' },
        age: { type: 'number' },
      };

      const result = jsonUtils.validateSchema(data, schema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(true);
      }
    });

    it('should reject invalid data', () => {
      const data = { name: 'John', age: 'thirty' };
      const schema = {
        name: { type: 'string' },
        age: { type: 'number' },
      };

      const result = jsonUtils.validateSchema(data, schema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(false);
      }
    });
  });
});
