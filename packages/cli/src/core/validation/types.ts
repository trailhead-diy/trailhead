export interface ValidationError {
  readonly type: 'ValidationError';
  readonly message: string;
  readonly field?: string;
  readonly cause?: unknown;
}

export type Result<T, E = ValidationError> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

export interface ValidationRule<T, C = unknown> {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly validate: (
    value: T,
    context?: C,
  ) => Promise<Result<T, ValidationError>> | Result<T, ValidationError>;
}

/**
 * Validation result for a single rule
 */
export interface ValidationResult {
  readonly rule: string;
  readonly passed: boolean;
  readonly message: string;
  readonly suggestion?: string;
  readonly value?: unknown;
}

/**
 * Validation summary for multiple rules
 */
export interface ValidationSummary {
  readonly passed: readonly ValidationResult[];
  readonly failed: readonly ValidationResult[];
  readonly warnings: readonly ValidationResult[];
  readonly overall: 'pass' | 'fail' | 'warning';
}

export const Ok = <T>(value: T): Result<T, ValidationError> => ({
  success: true,
  value,
});

export const Err = (
  message: string,
  field?: string,
  cause?: unknown,
): Result<never, ValidationError> => ({
  success: false,
  error: {
    type: 'ValidationError',
    message,
    field,
    cause,
  },
});

/**
 * Validator function type
 */
export type Validator<T> = (value: unknown) => Result<T, ValidationError>;

/**
 * Async validator function type
 */
export type AsyncValidator<T> = (
  value: unknown,
) => Promise<Result<T, ValidationError>>;

/**
 * Composable validator
 */
export interface ComposableValidator<T> {
  validate: Validator<T>;
  and: <U>(other: ComposableValidator<U>) => ComposableValidator<T & U>;
  or: <U>(other: ComposableValidator<U>) => ComposableValidator<T | U>;
  map: <U>(fn: (value: T) => U) => ComposableValidator<U>;
  mapError: (
    fn: (error: ValidationError) => ValidationError,
  ) => ComposableValidator<T>;
}
