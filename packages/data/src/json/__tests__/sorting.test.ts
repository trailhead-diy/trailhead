import { describe, it, expect } from 'vitest'
import { sortJSONArray, extractUniqueSorted, createJSONOperations } from '../core'

describe('JSON sorting utilities', () => {
  describe('sortJSONArray', () => {
    const testData = [
      { name: 'Alice', age: 30, score: 85 },
      { name: 'Bob', age: 25, score: 92 },
      { name: 'Charlie', age: 35, score: 78 },
      { name: 'Diana', age: 28, score: 88 },
    ]

    it('should sort by single field ascending', () => {
      const result = sortJSONArray(testData, [{ field: 'age' }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.map((item) => item.age)).toEqual([25, 28, 30, 35])
        expect(result.value.map((item) => item.name)).toEqual(['Bob', 'Diana', 'Alice', 'Charlie'])
      }
    })

    it('should sort by single field descending', () => {
      const result = sortJSONArray(testData, [{ field: 'score', order: 'desc' }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.map((item) => item.score)).toEqual([92, 88, 85, 78])
        expect(result.value.map((item) => item.name)).toEqual(['Bob', 'Diana', 'Alice', 'Charlie'])
      }
    })

    it('should sort by multiple fields', () => {
      const dataWithDuplicates = [
        { category: 'A', priority: 2, value: 100 },
        { category: 'B', priority: 1, value: 200 },
        { category: 'A', priority: 1, value: 150 },
        { category: 'B', priority: 2, value: 175 },
      ]

      const result = sortJSONArray(dataWithDuplicates, [
        { field: 'category', order: 'asc' },
        { field: 'priority', order: 'asc' },
        { field: 'value', order: 'desc' },
      ])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([
          { category: 'A', priority: 1, value: 150 },
          { category: 'A', priority: 2, value: 100 },
          { category: 'B', priority: 1, value: 200 },
          { category: 'B', priority: 2, value: 175 },
        ])
      }
    })

    it('should sort using accessor functions', () => {
      const result = sortJSONArray(testData, [
        { field: (item) => item.name.length, order: 'asc' },
        { field: 'name' },
      ])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // Bob (3) < Alice (5) < Diana (5) < Charlie (7)
        // For same length, sort by name alphabetically
        const names = result.value.map((item) => item.name)
        expect(names[0]).toBe('Bob') // Shortest name
        expect(names[names.length - 1]).toBe('Charlie') // Longest name
      }
    })

    it('should handle empty arrays', () => {
      const result = sortJSONArray([], [{ field: 'name' }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([])
      }
    })

    it('should return error for invalid input', () => {
      const result = sortJSONArray('not an array' as any, [{ field: 'name' }])

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid input for sorting')
        expect(result.error.message).toContain('Expected an array')
      }
    })

    it('should return error for empty sort fields', () => {
      const result = sortJSONArray(testData, [])

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('No sort fields specified')
      }
    })

    it('should return error for invalid sort field types', () => {
      const result = sortJSONArray(testData, [{ field: 123 as any }])

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to sort JSON array')
        expect(result.error.message).toContain('Invalid sort field')
      }
    })

    it('should handle null/undefined items gracefully', () => {
      const dataWithNulls = [{ name: 'Alice', age: 30 }, null, { name: 'Bob', age: 25 }, undefined]

      // Mock console.warn to capture warnings
      const originalWarn = console.warn
      const warnings: string[] = []
      console.warn = (...args: any[]) => warnings.push(args.join(' '))

      const result = sortJSONArray(dataWithNulls, [{ field: 'name' }])

      console.warn = originalWarn

      expect(result.isOk()).toBe(true)
      expect(warnings.some((w) => w.includes('null/undefined item'))).toBe(true)
    })

    it('should provide detailed error context', () => {
      const result = sortJSONArray(testData, [
        {
          field: () => {
            throw new Error('Accessor error')
          },
        },
      ])

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.context).toMatchObject({
          arrayLength: 4,
          sortFieldCount: 1,
        })
      }
    })
  })

  describe('extractUniqueSorted', () => {
    const testArray = ['apple', 'banana', 'apple', 'cherry', 'banana', 'date']
    const testObjects = [
      { category: 'fruit', name: 'apple' },
      { category: 'vegetable', name: 'carrot' },
      { category: 'fruit', name: 'banana' },
      { category: 'fruit', name: 'apple' },
    ]

    it('should extract unique values from primitive array', () => {
      const result = extractUniqueSorted(testArray)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(['apple', 'banana', 'cherry', 'date'])
      }
    })

    it('should extract unique values in descending order', () => {
      const result = extractUniqueSorted(testArray, undefined, 'desc')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(['date', 'cherry', 'banana', 'apple'])
      }
    })

    it('should extract unique values using accessor function', () => {
      const result = extractUniqueSorted(testObjects, (item) => item.category)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(['fruit', 'vegetable'])
      }
    })

    it('should extract unique names from objects', () => {
      const result = extractUniqueSorted(testObjects, (item) => item.name, 'desc')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(['carrot', 'banana', 'apple'])
      }
    })

    it('should handle empty arrays', () => {
      const result = extractUniqueSorted([])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([])
      }
    })

    it('should return error for invalid input type', () => {
      const result = extractUniqueSorted('not an array' as any)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid input for unique extraction')
        expect(result.error.message).toContain('Expected an array')
      }
    })

    it('should return error for invalid sort order', () => {
      const result = extractUniqueSorted(testArray, undefined, 'invalid' as any)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid sort order')
        expect(result.error.message).toContain("Expected 'asc' or 'desc'")
      }
    })

    it('should handle accessor function errors gracefully', () => {
      const problematicAccessor = (item: any) => {
        if (item.name === 'apple') {
          throw new Error('Accessor error')
        }
        return item.name
      }

      // Mock console.warn to capture warnings
      const originalWarn = console.warn
      const warnings: string[] = []
      console.warn = (...args: any[]) => warnings.push(args.join(' '))

      const result = extractUniqueSorted(testObjects, problematicAccessor)

      console.warn = originalWarn

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(['banana', 'carrot'])
      }
      expect(warnings.some((w) => w.includes('Accessor failed'))).toBe(true)
      expect(warnings.some((w) => w.includes('items were excluded'))).toBe(true)
    })

    it('should handle accessor function that fails completely', () => {
      const failingAccessor = () => {
        throw new Error('Complete accessor failure')
      }

      const result = extractUniqueSorted(testObjects, failingAccessor)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to extract values using accessor')
        expect(result.error.context).toMatchObject({
          arrayLength: 4,
          hasAccessor: true,
        })
      }
    })

    it('should provide detailed error context', () => {
      const result = extractUniqueSorted('invalid' as any, undefined, 'desc')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.context).toMatchObject({
          providedType: 'string',
        })
      }
    })
  })

  describe('JSON format with advanced sorting', () => {
    const jsonOps = createJSONOperations()

    it('should format JSON with sorted keys', () => {
      const data = {
        zebra: 1,
        apple: 2,
        banana: 3,
      }

      const result = jsonOps.format(JSON.stringify(data), {
        sortKeys: true,
        indent: 2,
      })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const parsed = JSON.parse(result.value)
        const keys = Object.keys(parsed)
        expect(keys).toEqual(['apple', 'banana', 'zebra'])
      }
    })

    it('should format JSON with sorted keys in descending order', () => {
      const data = {
        zebra: 1,
        apple: 2,
        banana: 3,
      }

      const result = jsonOps.format(JSON.stringify(data), {
        sortKeys: 'desc',
        indent: 2,
      })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const parsed = JSON.parse(result.value)
        const keys = Object.keys(parsed)
        expect(keys).toEqual(['zebra', 'banana', 'apple'])
      }
    })

    it('should format JSON with sorted arrays', () => {
      const data = {
        numbers: [3, 1, 4, 1, 5],
        strings: ['zebra', 'apple', 'banana'],
      }

      const result = jsonOps.format(JSON.stringify(data), {
        sortArrays: true,
        indent: 2,
      })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const parsed = JSON.parse(result.value)
        expect(parsed.numbers).toEqual([1, 1, 3, 4, 5])
        expect(parsed.strings).toEqual(['apple', 'banana', 'zebra'])
      }
    })

    it('should format JSON with custom key sorting function', () => {
      const data = {
        b_important: 1,
        a_normal: 2,
        c_important: 3,
        d_normal: 4,
      }

      // Sort by importance (important first), then alphabetically
      const customSort = (a: string, b: string) => {
        const aImportant = a.includes('important')
        const bImportant = b.includes('important')

        if (aImportant && !bImportant) return -1
        if (!aImportant && bImportant) return 1
        return a.localeCompare(b)
      }

      const result = jsonOps.format(JSON.stringify(data), {
        sortKeys: customSort,
        indent: 2,
      })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const parsed = JSON.parse(result.value)
        const keys = Object.keys(parsed)
        expect(keys).toEqual(['b_important', 'c_important', 'a_normal', 'd_normal'])
      }
    })

    it('should handle nested objects with sorting', () => {
      const data = {
        zebra: {
          gamma: 1,
          alpha: 2,
          beta: 3,
        },
        apple: {
          charlie: 4,
          alpha: 5,
          bravo: 6,
        },
      }

      const result = jsonOps.format(JSON.stringify(data), {
        sortKeys: true,
        indent: 2,
      })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const parsed = JSON.parse(result.value)
        expect(Object.keys(parsed)).toEqual(['apple', 'zebra'])
        expect(Object.keys(parsed.apple)).toEqual(['alpha', 'bravo', 'charlie'])
        expect(Object.keys(parsed.zebra)).toEqual(['alpha', 'beta', 'gamma'])
      }
    })
  })
})
