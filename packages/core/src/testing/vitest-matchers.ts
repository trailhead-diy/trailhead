/**
 * Comprehensive Vitest matchers for Result types
 *
 * These matchers provide fluent assertions for Result types in tests,
 * offering better error messages and type-safe testing patterns.
 *
 * @example
 * ```typescript
 * import { setupResultMatchers } from '@trailhead/core/testing'
 *
 * // Setup in test files or global setup
 * setupResultMatchers()
 *
 * // Use in tests
 * const result = someOperation()
 * expect(result).toBeOk()
 * expect(result).toHaveValue('expected-value')
 * expect(errorResult).toBeErr()
 * expect(errorResult).toHaveErrorCode('VALIDATION_ERROR')
 * ```
 */

import type { Result } from '../errors/index.js'

// Type-safe utility for extracting Result value types
type InferOkType<T> = T extends Result<infer U, any> ? U : never
type InferErrType<T> = T extends Result<any, infer E> ? E : never

// Enhanced error type constraints
interface TypedError {
  readonly code: string
  readonly message: string
  readonly category?: string
}

// Strict typing for Result matchers - simplified for compatibility
interface ResultMatchers<R> {
  toBeOk(): any
  toBeErr(): any
  toHaveValue<T extends InferOkType<R>>(expected: T): any
  toHaveErrorCode<E extends InferErrType<R>>(
    expected: E extends TypedError ? E['code'] : string
  ): any
  toHaveErrorMessage<_E extends InferErrType<R>>(expected: string | RegExp): any
  toHaveLength<T extends InferOkType<R>>(expected: T extends readonly any[] ? number : never): any
}

/**
 * Matcher to check if a Result is successful
 */
const toBeOk = function (this: any, received: Result<any, any>) {
  const { isNot: _isNot } = this

  if (received.isOk()) {
    return {
      pass: true,
      message: () => 'Expected Result to be an error, but it was successful',
    }
  } else {
    return {
      pass: false,
      message: () =>
        `Expected Result to be successful, but got error: ${received.error.message || JSON.stringify(received.error)}`,
    }
  }
}

/**
 * Matcher to check if a Result is an error
 */
const toBeErr = function (this: any, received: Result<any, any>) {
  const { isNot: _isNot } = this

  if (received.isErr()) {
    return {
      pass: true,
      message: () => 'Expected Result to be successful, but it was an error',
    }
  } else {
    return {
      pass: false,
      message: () => 'Expected Result to be an error, but it was successful',
    }
  }
}

/**
 * Matcher to check Result value with custom assertion
 */
const toHaveValue = function (this: any, received: Result<any, any>, expected: any) {
  if (received.isErr()) {
    return {
      pass: false,
      message: () =>
        `Expected Result to have value ${this.utils?.printExpected?.(expected) || expected}, but Result was an error: ${received.error.message || JSON.stringify(received.error)}`,
    }
  }

  const pass = this.equals?.(received.value, expected) || received.value === expected

  return {
    pass,
    message: () =>
      pass
        ? `Expected Result not to have value ${this.utils?.printExpected?.(expected) || expected}`
        : `Expected Result to have value ${this.utils?.printExpected?.(expected) || expected}, but got ${this.utils?.printReceived?.(received.value) || received.value}`,
  }
}

/**
 * Matcher to check Result error matches expected value.
 * Compares the entire error object for equality.
 *
 * @param received - Result to check
 * @param expected - Expected error value
 * @returns Vitest matcher result
 */
const toHaveError = function (this: any, received: Result<any, any>, expected: any) {
  if (received.isOk()) {
    return {
      pass: false,
      message: () =>
        `Expected Result to have error ${this.utils?.printExpected?.(expected) || expected}, but Result was successful`,
    }
  }

  const pass = this.equals?.(received.error, expected) || received.error === expected

  return {
    pass,
    message: () =>
      pass
        ? `Expected Result not to have error ${this.utils?.printExpected?.(expected) || expected}`
        : `Expected Result to have error ${this.utils?.printExpected?.(expected) || expected}, but got ${this.utils?.printReceived?.(received.error) || received.error}`,
  }
}

/**
 * Matcher to check Result error code
 */
const toHaveErrorCode = function (this: any, received: Result<any, any>, expectedCode: string) {
  if (received.isOk()) {
    return {
      pass: false,
      message: () =>
        `Expected Result to have error code '${expectedCode}', but Result was successful`,
    }
  }

  if (!('code' in received.error)) {
    return {
      pass: false,
      message: () => `Expected Result error to have 'code' property, but it doesn't`,
    }
  }

  const actualCode = (received.error as any).code
  const pass = actualCode === expectedCode

  return {
    pass,
    message: () =>
      pass
        ? `Expected Result not to have error code '${expectedCode}'`
        : `Expected Result to have error code '${expectedCode}', but got '${actualCode}'`,
  }
}

/**
 * Matcher to check Result error message
 */
const toHaveErrorMessage = function (
  this: any,
  received: Result<any, any>,
  expected: string | RegExp
) {
  if (received.isOk()) {
    return {
      pass: false,
      message: () => `Expected Result to have error message, but Result was successful`,
    }
  }

  if (!('message' in received.error)) {
    return {
      pass: false,
      message: () => `Expected Result error to have 'message' property, but it doesn't`,
    }
  }

  const actualMessage = (received.error as any).message
  let pass: boolean

  if (typeof expected === 'string') {
    pass = actualMessage.includes(expected)
  } else {
    pass = expected.test(actualMessage)
  }

  return {
    pass,
    message: () =>
      pass
        ? `Expected Result error message not to contain/match ${this.utils?.printExpected?.(expected) || expected}`
        : `Expected Result error message to contain/match ${this.utils?.printExpected?.(expected) || expected}, but got '${actualMessage}'`,
  }
}

/**
 * Matcher to check array length in Result value
 */
const toHaveLength = function (this: any, received: Result<any, any>, expectedLength: number) {
  if (received.isErr()) {
    return {
      pass: false,
      message: () =>
        `Expected Result to have array of length ${expectedLength}, but Result was an error: ${received.error.message || JSON.stringify(received.error)}`,
    }
  }

  if (!Array.isArray(received.value)) {
    return {
      pass: false,
      message: () => `Expected Result value to be an array, but got ${typeof received.value}`,
    }
  }

  const actualLength = received.value.length
  const pass = actualLength === expectedLength

  return {
    pass,
    message: () =>
      pass
        ? `Expected Result array not to have length ${expectedLength}`
        : `Expected Result array to have length ${expectedLength}, but got ${actualLength}`,
  }
}

/**
 * Matcher to check if Result value matches a pattern.
 * Uses deep equality comparison on the Ok value.
 *
 * @param received - Result to check
 * @param expected - Expected value pattern to match
 * @returns Vitest matcher result
 */
const toMatchResult = function (this: any, received: Result<any, any>, expected: any) {
  if (received.isErr()) {
    return {
      pass: false,
      message: () =>
        `Expected Result to match ${this.utils?.printExpected?.(expected) || expected}, but Result was an error: ${received.error.message || JSON.stringify(received.error)}`,
    }
  }

  const pass = this.equals?.(received.value, expected) || received.value === expected

  return {
    pass,
    message: () =>
      pass
        ? `Expected Result value not to match ${this.utils?.printExpected?.(expected) || expected}`
        : `Expected Result value to match ${this.utils?.printExpected?.(expected) || expected}, but got ${this.utils?.printReceived?.(received.value) || received.value}`,
  }
}

/**
 * Export all matchers for Vitest
 */
export const resultMatchers = {
  toBeOk,
  toBeErr,
  toHaveValue,
  toHaveError,
  toHaveErrorCode,
  toHaveErrorMessage,
  toHaveLength,
  toMatchResult,
}

/**
 * Setup function to register matchers with Vitest
 *
 * Call this in your test setup files or individual test files to register
 * the Result matchers with the global expect function.
 *
 * @example
 * ```typescript
 * // In vitest.setup.ts or individual test files
 * import { setupResultMatchers } from '@trailhead/core/testing'
 *
 * setupResultMatchers()
 * ```
 *
 * @throws Error if expect.extend is not available
 */
export function setupResultMatchers(): void {
  if (
    typeof globalThis !== 'undefined' &&
    'expect' in globalThis &&
    (globalThis as any).expect.extend
  ) {
    ;(globalThis as any).expect.extend(resultMatchers)
  } else {
    throw new Error('setupResultMatchers requires a test framework with expect.extend')
  }
}

/**
 * Enhanced type declarations for TypeScript with strict Result type checking
 * These extend the Vitest expect interface with type-safe Result matchers
 */

// Global augmentation for enhanced Vitest types with Result constraints
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeOk(): any
      toBeErr(): any
      toHaveValue(expected: any): any
      toHaveErrorCode(expected: string): any
      toHaveErrorMessage(expected: string | RegExp): any
      toHaveLength(expected: number): any
    }

    interface Assertion<T = any> {
      // Result-specific matchers with type constraints
      toBeOk(): Assertion<T>
      toBeErr(): Assertion<T>
      toHaveValue(expected: any): Assertion<T>
      toHaveErrorCode(expected: string): Assertion<T>
      toHaveErrorMessage(expected: string | RegExp): Assertion<T>
      toHaveLength(expected: number): Assertion<T>
    }
  }
}

// Export type utilities for consumer packages
export type { InferOkType, InferErrType, TypedError, ResultMatchers }
