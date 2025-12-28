import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sortJSONArray, extractUniqueSorted } from '../core.js'

describe('JSON Sorting Edge Cases', () => {
  describe('sortJSONArray null/undefined handling', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('should handle array with null items', () => {
      const array = [{ name: 'Alice', age: 30 }, null, { name: 'Bob', age: 25 }] as any[]
      const result = sortJSONArray(array, [{ field: 'name' }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // null items should be handled gracefully
        expect(result.value).toHaveLength(3)
        expect(warnSpy).toHaveBeenCalled()
      }
    })

    it('should handle array with undefined items', () => {
      const array = [{ name: 'Alice', age: 30 }, undefined, { name: 'Bob', age: 25 }] as any[]
      const result = sortJSONArray(array, [{ field: 'name' }])

      // Should handle undefined items gracefully without crashing
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(3)
        // Undefined items are included in the sorted output
        expect(result.value).toContainEqual(undefined)
      }
    })

    it('should handle objects with null field values', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: null, age: 25 },
        { name: 'Bob', age: 35 },
      ]
      const result = sortJSONArray(array, [{ field: 'name' }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(3)
      }
    })

    it('should handle objects with undefined field values', () => {
      const array = [
        { name: 'Alice', age: 30 },
        { name: undefined, age: 25 },
        { name: 'Bob', age: 35 },
      ]
      const result = sortJSONArray(array, [{ field: 'name' }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(3)
      }
    })

    it('should handle objects with missing fields', () => {
      const array = [{ name: 'Alice', age: 30 }, { age: 25 }, { name: 'Bob', age: 35 }] as any[]
      const result = sortJSONArray(array, [{ field: 'name' }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(3)
      }
    })

    it('should return error for non-array input', () => {
      const result = sortJSONArray('not an array' as any, [{ field: 'name' }])

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid input')
      }
    })

    it('should return error for empty sort fields', () => {
      const result = sortJSONArray([{ name: 'test' }], [])

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('No sort fields')
      }
    })

    it('should return error for invalid sort field type', () => {
      const result = sortJSONArray([{ name: 'test' }], [{ field: 123 as any }])

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid sort field')
      }
    })

    it('should sort with function accessor', () => {
      const array = [
        { user: { name: 'Bob' } },
        { user: { name: 'Alice' } },
        { user: { name: 'Charlie' } },
      ]
      const result = sortJSONArray(array, [{ field: (item) => item.user.name }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value[0].user.name).toBe('Alice')
        expect(result.value[1].user.name).toBe('Bob')
        expect(result.value[2].user.name).toBe('Charlie')
      }
    })

    it('should handle descending order', () => {
      const array = [{ value: 1 }, { value: 3 }, { value: 2 }]
      const result = sortJSONArray(array, [{ field: 'value', order: 'desc' }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value[0].value).toBe(3)
        expect(result.value[1].value).toBe(2)
        expect(result.value[2].value).toBe(1)
      }
    })

    it('should handle multiple sort fields', () => {
      const array = [
        { category: 'B', value: 2 },
        { category: 'A', value: 2 },
        { category: 'A', value: 1 },
        { category: 'B', value: 1 },
      ]
      const result = sortJSONArray(array, [{ field: 'category' }, { field: 'value' }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value[0]).toEqual({ category: 'A', value: 1 })
        expect(result.value[1]).toEqual({ category: 'A', value: 2 })
        expect(result.value[2]).toEqual({ category: 'B', value: 1 })
        expect(result.value[3]).toEqual({ category: 'B', value: 2 })
      }
    })
  })

  describe('extractUniqueSorted accessor recovery', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('should recover from accessor failures on individual items', () => {
      const array = [
        { data: { value: 10 } },
        { data: null }, // This will cause accessor to fail (null.value throws)
        { data: { value: 20 } },
      ] as any[]

      const result = extractUniqueSorted(array, (item) => item.data.value)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // Should include values where accessor succeeded (undefined filtered out)
        expect(result.value).toContain(10)
        expect(result.value).toContain(20)
        expect(result.value).toHaveLength(2) // Only 10 and 20, not the failed one
        expect(warnSpy).toHaveBeenCalled()
      }
    })

    it('should return error when all accessor calls fail', () => {
      const array = [{ data: null }, { data: null }, { data: null }] as any[]

      // When ALL accessors fail, it returns an error (not an empty array)
      const result = extractUniqueSorted(array, (item) => item.data.value)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to extract values')
      }
    })

    it('should return error for non-array input', () => {
      const result = extractUniqueSorted('not array' as any, (item) => item)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Expected an array')
      }
    })

    it('should return error for invalid sort order', () => {
      const result = extractUniqueSorted([1, 2, 3], undefined, 'invalid' as any)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid sort order')
      }
    })

    it('should extract and sort unique values without accessor', () => {
      const array = [3, 1, 2, 2, 3, 1, 4]
      const result = extractUniqueSorted(array)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([1, 2, 3, 4])
      }
    })

    it('should sort in descending order', () => {
      const array = [3, 1, 2, 2, 3, 1, 4]
      const result = extractUniqueSorted(array, undefined, 'desc')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([4, 3, 2, 1])
      }
    })

    it('should extract unique values with accessor', () => {
      const array = [
        { category: 'A' },
        { category: 'B' },
        { category: 'A' },
        { category: 'C' },
        { category: 'B' },
      ]
      const result = extractUniqueSorted(array, (item) => item.category)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(['A', 'B', 'C'])
      }
    })

    it('should handle mixed null/undefined in extraction', () => {
      const array = [
        { value: 1 },
        { value: null },
        { value: 2 },
        { value: undefined },
        { value: 3 },
      ] as any[]
      const result = extractUniqueSorted(array, (item) => item.value)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // Should have extracted the non-null/undefined values
        expect(result.value).toContain(1)
        expect(result.value).toContain(2)
        expect(result.value).toContain(3)
      }
    })
  })
})
