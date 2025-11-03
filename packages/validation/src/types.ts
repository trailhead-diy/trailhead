import type { Result, CoreError } from '@trailhead/core'
import type { z } from 'zod'

export interface ValidationError extends CoreError {
  readonly type: 'VALIDATION_ERROR'
  readonly field?: string
  readonly value?: unknown
  readonly constraints?: Record<string, unknown>
}

export type ValidationResult<T> = Result<T, ValidationError>

// Functional validator types
export type ValidatorFn<T, R = T> = (value: T) => ValidationResult<R>
export type AsyncValidatorFn<T, R = T> = (value: T) => Promise<ValidationResult<R>>

// Schema validation types
export type SchemaValidator<T> = {
  readonly schema: z.ZodType<T>
  readonly validate: ValidatorFn<unknown, T>
}

// Configuration for validation behavior
export interface ValidationConfig {
  readonly abortEarly?: boolean
  readonly stripUnknown?: boolean
  readonly allowUnknown?: boolean
}
