import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  createValidationError,
  createRequiredFieldError,
  createInvalidTypeError,
  zodErrorToValidationError,
} from '../errors.js'

describe('Validation Errors', () => {
  describe('createValidationError', () => {
    it('should create basic validation error', () => {
      const error = createValidationError('Test validation failed')

      expect(error.type).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Test validation failed')
      expect(error.recoverable).toBe(true)
    })

    it('should create error with all options', () => {
      const error = createValidationError('Validation failed', {
        field: 'email',
        value: 'invalid-email',
        constraints: { format: 'email' },
        cause: new Error('Original error'),
        suggestion: 'Provide valid email',
        context: { customField: 'value' },
      })

      expect(error.type).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Validation failed')
      expect(error.field).toBe('email')
      expect(error.value).toBe('invalid-email')
      expect(error.constraints).toEqual({ format: 'email' })
      expect(error.suggestion).toBe('Provide valid email')
      expect(error.recoverable).toBe(true)
      expect(error.cause).toBeInstanceOf(Error)
      expect(error.context).toEqual({
        field: 'email',
        value: 'invalid-email',
        constraints: { format: 'email' },
        customField: 'value',
      })
    })
  })

  describe('createRequiredFieldError', () => {
    it('should create required field error', () => {
      const error = createRequiredFieldError('username')

      expect(error.type).toBe('VALIDATION_ERROR')
      expect(error.message).toBe("Required field 'username' is missing")
      expect(error.field).toBe('username')
      expect(error.suggestion).toBe("Provide a value for 'username'")
      expect(error.recoverable).toBe(true)
    })
  })

  describe('createInvalidTypeError', () => {
    it('should create invalid type error for different types', () => {
      const testCases = [
        { value: 123, expectedType: 'string', actualType: 'number' },
        { value: 'text', expectedType: 'number', actualType: 'string' },
        { value: [], expectedType: 'string', actualType: 'array' },
        { value: {}, expectedType: 'string', actualType: 'object' },
        { value: true, expectedType: 'string', actualType: 'boolean' },
      ]

      testCases.forEach(({ value, expectedType, actualType }) => {
        const error = createInvalidTypeError('testField', expectedType, value)

        expect(error.type).toBe('VALIDATION_ERROR')
        expect(error.message).toBe(
          `Field 'testField' must be of type '${expectedType}', got '${actualType}'`
        )
        expect(error.field).toBe('testField')
        expect(error.value).toBe(value)
        expect(error.constraints).toEqual({ expectedType, actualType })
        expect(error.suggestion).toBe(`Ensure 'testField' is a ${expectedType}`)
      })
    })
  })

  describe('zodErrorToValidationError', () => {
    it('should convert Zod string validation error', () => {
      const schema = z.string().min(5)
      const result = schema.safeParse('hi')

      if (!result.success) {
        const error = zodErrorToValidationError(result.error)

        expect(error.type).toBe('VALIDATION_ERROR')
        expect(error.message).toContain('String must contain at least 5 character(s)')
        expect(error.cause).toBe(result.error)
        expect(error.constraints).toEqual({
          code: 'too_small',
          path: [],
        })
        expect(error.suggestion).toBe(
          'Check the value and ensure it meets the validation requirements'
        )
      }
    })

    it('should convert Zod email validation error', () => {
      const schema = z.string().email()
      const result = schema.safeParse('invalid-email')

      if (!result.success) {
        const error = zodErrorToValidationError(result.error)

        expect(error.type).toBe('VALIDATION_ERROR')
        expect(error.message).toBe('Invalid email')
        expect(error.constraints?.code).toBe('invalid_string')
      }
    })

    it('should handle nested object validation errors', () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email(),
        }),
      })

      const result = schema.safeParse({
        user: {
          email: 'invalid-email',
        },
      })

      if (!result.success) {
        const error = zodErrorToValidationError(result.error)

        expect(error.type).toBe('VALIDATION_ERROR')
        expect(error.constraints?.path).toEqual(['user', 'email'])
        expect(error.field).toBe('user.email')
      }
    })

    it('should handle array validation errors', () => {
      const schema = z.array(z.string().email())
      const result = schema.safeParse(['valid@email.com', 'invalid-email'])

      if (!result.success) {
        const error = zodErrorToValidationError(result.error)

        expect(error.type).toBe('VALIDATION_ERROR')
        expect(error.constraints?.path).toEqual([1])
        expect(error.field).toBe('1')
      }
    })

    it('should use custom field name when provided', () => {
      const schema = z.string().min(5)
      const result = schema.safeParse('hi')

      if (!result.success) {
        const error = zodErrorToValidationError(result.error, { field: 'customField' })

        expect(error.field).toBe('customField')
      }
    })

    it('should handle errors without path', () => {
      const schema = z.string()
      const result = schema.safeParse(123)

      if (!result.success) {
        const error = zodErrorToValidationError(result.error)

        expect(error.type).toBe('VALIDATION_ERROR')
        expect(error.field).toBeUndefined()
      }
    })
  })
})
