import { createCoreError } from '@trailhead/core'
import type { ValidationError } from './types.js'
import type { z } from 'zod'

export const createValidationError = (
  message: string,
  options?: {
    field?: string
    value?: unknown
    constraints?: Record<string, unknown>
    cause?: unknown
    suggestion?: string
    context?: Record<string, unknown>
  }
): ValidationError => ({
  ...createCoreError('VALIDATION_ERROR', 'VALIDATION_ERROR', message, {
    component: 'validation',
    operation: 'validate',
    severity: 'medium',
    recoverable: true,
    cause: options?.cause,
    suggestion: options?.suggestion,
    context: {
      field: options?.field,
      value: options?.value,
      constraints: options?.constraints,
      ...options?.context,
    },
  }),
  type: 'VALIDATION_ERROR',
  field: options?.field,
  value: options?.value,
  constraints: options?.constraints,
})

export const createRequiredFieldError = (field: string): ValidationError =>
  createValidationError(`Required field '${field}' is missing`, {
    field,
    suggestion: `Provide a value for '${field}'`,
  })

export const createInvalidTypeError = (
  field: string,
  expectedType: string,
  actualValue: unknown
): ValidationError => {
  const actualType = Array.isArray(actualValue) ? 'array' : typeof actualValue
  return createValidationError(
    `Field '${field}' must be of type '${expectedType}', got '${actualType}'`,
    {
      field,
      value: actualValue,
      constraints: { expectedType, actualType },
      suggestion: `Ensure '${field}' is a ${expectedType}`,
    }
  )
}

export const zodErrorToValidationError = (
  error: z.ZodError,
  options?: { field?: string }
): ValidationError => {
  const issues = error.issues

  if (issues.length === 0) {
    return createValidationError('Validation failed', {
      field: options?.field,
      cause: error,
      suggestion: 'Check the value and ensure it meets the validation requirements',
    })
  }

  const firstError = issues[0]
  const path = firstError.path.join('.')
  const field = options?.field || (path !== '' ? path : undefined)

  return createValidationError(firstError.message, {
    field,
    value: 'input' in firstError ? (firstError as any).input : undefined,
    cause: error,
    constraints: {
      code: firstError.code,
      path: firstError.path,
    },
    suggestion: 'Check the value and ensure it meets the validation requirements',
  })
}
