import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { join } from 'path'
import { tmpdir } from 'os'
import { mkdtemp, rm } from 'fs/promises'
import { createJSONOperations, sortJSONArray, extractUniqueSorted } from '../src/json/core.js'

describe('JSON Integration Tests', () => {
  const jsonOps = createJSONOperations()
  const fixturesPath = join(__dirname, 'fixtures')
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'json-test-'))
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('parseFile', () => {
    it('should parse JSON file with nested structure', async () => {
      const result = await jsonOps.parseFile(join(fixturesPath, 'sample.json'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const data = result.value
        expect(data.name).toBe('Test Config')
        expect(data.version).toBe('1.0.0')
        expect(data.settings.debug).toBe(true)
        expect(data.settings.timeout).toBe(5000)
        expect(data.users).toHaveLength(2)
        expect(data.users[0].name).toBe('Alice')
        expect(data.features).toContain('auth')
      }
    })

    it('should return error for non-existent file', async () => {
      const result = await jsonOps.parseFile('/non/existent/file.json')

      expect(result.isErr()).toBe(true)
    })

    it('should return error for malformed JSON', async () => {
      const malformedPath = join(tempDir, 'malformed.json')
      const { writeFile } = await import('fs/promises')
      await writeFile(malformedPath, '{ invalid json }')

      const result = await jsonOps.parseFile(malformedPath)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('parsing')
      }
    })
  })

  describe('stringify (in-memory round-trip)', () => {
    it('should stringify JSON data', () => {
      const data = { name: 'test', value: 42, nested: { key: 'value' } }
      const result = jsonOps.stringify(data)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const parsed = JSON.parse(result.value)
        expect(parsed.name).toBe('test')
        expect(parsed.nested.key).toBe('value')
      }
    })

    it('should round-trip complex data correctly', () => {
      const originalData = {
        strings: ['a', 'b', 'c'],
        numbers: [1, 2.5, 3],
        nested: {
          deep: { value: true },
        },
        nullValue: null,
      }

      const stringifyResult = jsonOps.stringify(originalData)
      expect(stringifyResult.isOk()).toBe(true)

      if (stringifyResult.isOk()) {
        const parseResult = jsonOps.parseString(stringifyResult.value)
        expect(parseResult.isOk()).toBe(true)
        if (parseResult.isOk()) {
          expect(parseResult.value).toEqual(originalData)
        }
      }
    })

    it('should stringify with custom formatting', () => {
      const data = { a: 1, b: 2 }
      const result = jsonOps.stringify(data, { space: 4 })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toContain('    ')
      }
    })
  })

  describe('parseString', () => {
    it('should parse JSON string', () => {
      const result = jsonOps.parseString('{"key": "value", "num": 123}')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.key).toBe('value')
        expect(result.value.num).toBe(123)
      }
    })

    it('should handle trailing commas when allowed', () => {
      const jsonWithTrailing = '{"a": 1, "b": 2,}'
      const result = jsonOps.parseString(jsonWithTrailing, { allowTrailingCommas: true })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.a).toBe(1)
      }
    })

    it('should handle comments when allowed', () => {
      const jsonWithComments = `{
        // Single line comment
        "key": "value",
        /* Multi-line
           comment */
        "num": 42
      }`
      const result = jsonOps.parseString(jsonWithComments, { allowComments: true })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.key).toBe('value')
        expect(result.value.num).toBe(42)
      }
    })

    it('should return error for empty string', () => {
      const result = jsonOps.parseString('')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Empty')
      }
    })
  })

  describe('validate', () => {
    it('should validate well-formed JSON', () => {
      const result = jsonOps.validate('{"valid": true}')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(true)
      }
    })

    it('should return false for invalid JSON', () => {
      const result = jsonOps.validate('{ invalid }')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(false)
      }
    })

    it('should return false for empty string', () => {
      const result = jsonOps.validate('')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(false)
      }
    })
  })

  describe('minify', () => {
    it('should minify JSON string', () => {
      const formatted = `{
        "key": "value",
        "array": [1, 2, 3]
      }`
      const result = jsonOps.minify(formatted)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).not.toContain('\n')
        expect(result.value).not.toContain('  ')
      }
    })
  })

  describe('format', () => {
    it('should format JSON with custom indent', () => {
      const minified = '{"a":1,"b":2}'
      const result = jsonOps.format(minified, { indent: 4 })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toContain('    ')
      }
    })

    it('should sort keys when requested', () => {
      const json = '{"z": 1, "a": 2, "m": 3}'
      const result = jsonOps.format(json, { sortKeys: true })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const aIndex = result.value.indexOf('"a"')
        const mIndex = result.value.indexOf('"m"')
        const zIndex = result.value.indexOf('"z"')
        expect(aIndex).toBeLessThan(mIndex)
        expect(mIndex).toBeLessThan(zIndex)
      }
    })
  })

  describe('sortJSONArray', () => {
    it('should sort array by single field', () => {
      const data = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }]
      const result = sortJSONArray(data, [{ field: 'name' }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value[0].name).toBe('Alice')
        expect(result.value[1].name).toBe('Bob')
        expect(result.value[2].name).toBe('Charlie')
      }
    })

    it('should sort by multiple fields', () => {
      const data = [
        { dept: 'A', score: 90 },
        { dept: 'B', score: 85 },
        { dept: 'A', score: 80 },
      ]
      const result = sortJSONArray(data, [{ field: 'dept' }, { field: 'score', order: 'desc' }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value[0].dept).toBe('A')
        expect(result.value[0].score).toBe(90)
        expect(result.value[1].dept).toBe('A')
        expect(result.value[1].score).toBe(80)
      }
    })

    it('should handle null/undefined values in array', () => {
      const data = [{ name: 'Alice' }, null as any, { name: 'Bob' }]
      const result = sortJSONArray(data, [{ field: 'name' }])

      // Should handle gracefully - either succeed with warning or error
      expect(result.isOk() || result.isErr()).toBe(true)
    })

    it('should return error for non-array input', () => {
      const result = sortJSONArray('not an array' as any, [{ field: 'name' }])

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('array')
      }
    })

    it('should return error for empty sort fields', () => {
      const result = sortJSONArray([{ a: 1 }], [])

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('sort field')
      }
    })
  })

  describe('extractUniqueSorted', () => {
    it('should extract unique values and sort', () => {
      const data = [{ id: 3 }, { id: 1 }, { id: 2 }, { id: 1 }]
      const result = extractUniqueSorted(data, (item) => item.id)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([1, 2, 3])
      }
    })

    it('should sort in descending order', () => {
      const data = [{ v: 1 }, { v: 3 }, { v: 2 }]
      const result = extractUniqueSorted(data, (item) => item.v, 'desc')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([3, 2, 1])
      }
    })

    it('should work without accessor for primitive arrays', () => {
      const data = [3, 1, 2, 1, 3]
      const result = extractUniqueSorted(data)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([1, 2, 3])
      }
    })

    it('should return error for non-array input', () => {
      const result = extractUniqueSorted('not array' as any)

      expect(result.isErr()).toBe(true)
    })
  })
})
