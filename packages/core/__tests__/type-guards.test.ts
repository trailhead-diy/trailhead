import { describe, it, expect } from 'vitest'
import {
  isDefined,
  isNonEmptyString,
  isObject,
  isNonEmptyArray,
  hasErrorShape,
} from '../src/errors/utils.js'

describe('Type Guards', () => {
  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true)
      expect(isDefined('')).toBe(true)
      expect(isDefined(false)).toBe(true)
      expect(isDefined([])).toBe(true)
      expect(isDefined({})).toBe(true)
      expect(isDefined('hello')).toBe(true)
      expect(isDefined(42)).toBe(true)
    })

    it('should return false for null', () => {
      expect(isDefined(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isDefined(undefined)).toBe(false)
    })

    it('should narrow types correctly', () => {
      const value: string | undefined = 'test'
      if (isDefined(value)) {
        // TypeScript should allow string methods here
        expect(value.toUpperCase()).toBe('TEST')
      }
    })
  })

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true)
      expect(isNonEmptyString('a')).toBe(true)
      expect(isNonEmptyString(' ')).toBe(true) // Single space is non-empty
      expect(isNonEmptyString('  trimmed  ')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isNonEmptyString('')).toBe(false)
    })

    it('should return false for non-string values', () => {
      expect(isNonEmptyString(null)).toBe(false)
      expect(isNonEmptyString(undefined)).toBe(false)
      expect(isNonEmptyString(0)).toBe(false)
      expect(isNonEmptyString(123)).toBe(false)
      expect(isNonEmptyString(true)).toBe(false)
      expect(isNonEmptyString(false)).toBe(false)
      expect(isNonEmptyString([])).toBe(false)
      expect(isNonEmptyString(['a'])).toBe(false)
      expect(isNonEmptyString({})).toBe(false)
      expect(isNonEmptyString({ length: 5 })).toBe(false)
    })
  })

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true)
      expect(isObject({ key: 'value' })).toBe(true)
      expect(isObject({ nested: { deep: true } })).toBe(true)
    })

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false)
    })

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false)
      expect(isObject([1, 2, 3])).toBe(false)
      expect(isObject(['a', 'b'])).toBe(false)
    })

    it('should return false for primitives', () => {
      expect(isObject('string')).toBe(false)
      expect(isObject(123)).toBe(false)
      expect(isObject(true)).toBe(false)
      expect(isObject(undefined)).toBe(false)
      expect(isObject(Symbol('test'))).toBe(false)
    })

    it('should return true for class instances', () => {
      class CustomClass {
        value = 42
      }
      expect(isObject(new CustomClass())).toBe(true)
      expect(isObject(new Date())).toBe(true)
      expect(isObject(new Map())).toBe(true)
    })
  })

  describe('isNonEmptyArray', () => {
    it('should return true for arrays with elements', () => {
      expect(isNonEmptyArray([1])).toBe(true)
      expect(isNonEmptyArray([1, 2, 3])).toBe(true)
      expect(isNonEmptyArray(['a', 'b'])).toBe(true)
      expect(isNonEmptyArray([null])).toBe(true) // Contains null, but array is non-empty
      expect(isNonEmptyArray([undefined])).toBe(true) // Contains undefined, but array is non-empty
    })

    it('should return false for empty arrays', () => {
      expect(isNonEmptyArray([])).toBe(false)
    })

    it('should return false for non-array values', () => {
      expect(isNonEmptyArray(null)).toBe(false)
      expect(isNonEmptyArray(undefined)).toBe(false)
      expect(isNonEmptyArray('string')).toBe(false)
      expect(isNonEmptyArray(123)).toBe(false)
      expect(isNonEmptyArray({})).toBe(false)
      expect(isNonEmptyArray({ length: 3 })).toBe(false) // Array-like but not array
    })

    it('should work with generic type parameter', () => {
      const unknownValue: unknown = ['a', 'b', 'c']
      if (isNonEmptyArray<string>(unknownValue)) {
        // TypeScript should treat this as string[]
        expect(unknownValue[0].toUpperCase()).toBe('A')
      }
    })
  })

  describe('hasErrorShape', () => {
    it('should return true for objects with type and message strings', () => {
      expect(hasErrorShape({ type: 'ERROR', message: 'Something went wrong' })).toBe(true)
      expect(hasErrorShape({ type: 'ValidationError', message: 'Invalid input' })).toBe(true)
      expect(hasErrorShape({ type: '', message: '' })).toBe(true) // Empty strings are still strings
    })

    it('should return true for objects with additional properties', () => {
      expect(
        hasErrorShape({
          type: 'ERROR',
          message: 'Error message',
          code: 'E001',
          details: { foo: 'bar' },
        })
      ).toBe(true)
    })

    it('should return false for objects missing type', () => {
      expect(hasErrorShape({ message: 'Error message' })).toBe(false)
    })

    it('should return false for objects missing message', () => {
      expect(hasErrorShape({ type: 'ERROR' })).toBe(false)
    })

    it('should return false for objects with non-string type', () => {
      expect(hasErrorShape({ type: 123, message: 'Error' })).toBe(false)
      expect(hasErrorShape({ type: null, message: 'Error' })).toBe(false)
      expect(hasErrorShape({ type: undefined, message: 'Error' })).toBe(false)
    })

    it('should return false for objects with non-string message', () => {
      expect(hasErrorShape({ type: 'ERROR', message: 123 })).toBe(false)
      expect(hasErrorShape({ type: 'ERROR', message: null })).toBe(false)
      expect(hasErrorShape({ type: 'ERROR', message: undefined })).toBe(false)
    })

    it('should return false for non-objects', () => {
      expect(hasErrorShape(null)).toBe(false)
      expect(hasErrorShape(undefined)).toBe(false)
      expect(hasErrorShape('string')).toBe(false)
      expect(hasErrorShape(123)).toBe(false)
      expect(hasErrorShape([])).toBe(false)
      expect(hasErrorShape([{ type: 'ERROR', message: 'Error' }])).toBe(false)
    })

    it('should return false for empty object', () => {
      expect(hasErrorShape({})).toBe(false)
    })

    it('should narrow type correctly for catch blocks', () => {
      const unknownError: unknown = { type: 'NetworkError', message: 'Connection failed' }
      if (hasErrorShape(unknownError)) {
        // TypeScript should allow accessing type and message
        expect(unknownError.type).toBe('NetworkError')
        expect(unknownError.message).toBe('Connection failed')
      }
    })
  })
})
