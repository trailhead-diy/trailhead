import type { Result, CoreError } from '@esteban-url/core'

/**
 * Assert that a Result is successful
 *
 * Type assertion that narrows Result type to success case.
 * Throws descriptive error if Result contains an error.
 *
 * @template T - Success value type
 * @param result - Result to check
 * @throws {Error} When result is an error
 *
 * @example
 * ```typescript
 * const result = await parseConfig(data);
 * expectResult(result);
 * // TypeScript now knows result.value is accessible
 * console.log(result.value.name);
 * ```
 */
export function expectResult<T>(
  result: Result<T, CoreError>
): asserts result is Extract<Result<T, CoreError>, { isOk(): true }> {
  if (result.isErr()) {
    throw new Error(`Expected successful result, but got error: ${result.error.message}`)
  }
}

/**
 * Assert that a Result is an error
 *
 * Type assertion that narrows Result type to error case.
 * Throws if Result contains a success value.
 *
 * @template E - Error type (default: CoreError)
 * @param result - Result to check
 * @throws {Error} When result is successful
 *
 * @example
 * ```typescript
 * const result = await validateInput(invalid);
 * expectError(result);
 * // TypeScript now knows result.error is accessible
 * console.log(result.error.message);
 * ```
 */
export function expectError<E = CoreError>(
  result: Result<any, E>
): asserts result is Extract<Result<any, E>, { isErr(): true }> {
  if (result.isOk()) {
    throw new Error('Expected error result, but operation succeeded')
  }
}

/**
 * Assert success and extract value in one call
 *
 * Combines assertion and value extraction for cleaner test code.
 * Throws descriptive error if Result contains an error.
 *
 * @template T - Success value type
 * @param result - Result to check and extract
 * @returns The success value
 * @throws {Error} When result is an error
 *
 * @example
 * ```typescript
 * // Instead of:
 * // expectResult(result);
 * // const config = result.value;
 *
 * // Use:
 * const config = expectSuccess(result);
 * ```
 */
export function expectSuccess<T>(result: Result<T, CoreError>): T {
  if (result.isErr()) {
    throw new Error(`Expected successful result, but got error: ${result.error.message}`)
  }
  return result.value
}

/**
 * Assert error and extract error in one call
 *
 * Combines assertion and error extraction for cleaner test code.
 * Throws if Result contains a success value.
 *
 * @template E - Error type (default: CoreError)
 * @param result - Result to check and extract
 * @returns The error value
 * @throws {Error} When result is successful
 *
 * @example
 * ```typescript
 * // Instead of:
 * // expectError(result);
 * // const error = result.error;
 *
 * // Use:
 * const error = expectFailure(result);
 * expect(error.code).toBe('VALIDATION_ERROR');
 * ```
 */
export function expectFailure<E = CoreError>(result: Result<any, E>): E {
  if (result.isOk()) {
    throw new Error('Expected error result, but operation succeeded')
  }
  return result.error
}

/**
 * Assert error with specific error code
 *
 * Verifies Result is an error with the expected code property.
 * Useful for testing specific error conditions.
 *
 * @template E - Error type with code property
 * @param result - Result to check
 * @param expectedCode - Expected error code
 * @returns The error value
 * @throws {Error} When result is successful or code doesn't match
 *
 * @example
 * ```typescript
 * const error = expectErrorCode(result, 'FILE_NOT_FOUND');
 * // Guaranteed to have error with code 'FILE_NOT_FOUND'
 * ```
 */
export function expectErrorCode<E extends { code: string }>(
  result: Result<any, E>,
  expectedCode: string
): E {
  if (result.isOk()) {
    throw new Error('Expected error result, but operation succeeded')
  }
  if (result.error.code !== expectedCode) {
    throw new Error(`Expected error code '${expectedCode}', but got '${result.error.code}'`)
  }
  return result.error
}

/**
 * Assert error with message matching pattern
 *
 * Verifies Result is an error with message containing text
 * or matching regex pattern. Useful for testing error descriptions.
 *
 * @template E - Error type with message property
 * @param result - Result to check
 * @param expectedMessage - String to find or regex to match
 * @returns The error value
 * @throws {Error} When result is successful or message doesn't match
 *
 * @example
 * ```typescript
 * // String contains
 * expectErrorMessage(result, 'file not found');
 *
 * // Regex match
 * expectErrorMessage(result, /invalid.*format/i);
 * ```
 */
export function expectErrorMessage<E extends { message: string }>(
  result: Result<any, E>,
  expectedMessage: string | RegExp
): E {
  if (result.isOk()) {
    throw new Error('Expected error result, but operation succeeded')
  }

  const message = result.error.message
  if (typeof expectedMessage === 'string') {
    if (!message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to contain '${expectedMessage}', but got '${message}'`
      )
    }
  } else {
    if (!expectedMessage.test(message)) {
      throw new Error(`Expected error message to match ${expectedMessage}, but got '${message}'`)
    }
  }

  return result.error
}
