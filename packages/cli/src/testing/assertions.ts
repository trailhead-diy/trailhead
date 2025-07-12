import type { Result, CoreError } from '@trailhead/core';

/**
 * Assert that a Result is successful
 */
export function expectResult<T>(
  result: Result<T, CoreError>
): asserts result is Extract<Result<T, CoreError>, { isOk(): true }> {
  if (result.isErr()) {
    throw new Error(`Expected successful result, but got error: ${result.error.message}`);
  }
}

/**
 * Assert that a Result is an error
 */
export function expectError<E = CoreError>(
  result: Result<any, E>
): asserts result is Extract<Result<any, E>, { isErr(): true }> {
  if (result.isOk()) {
    throw new Error('Expected error result, but operation succeeded');
  }
}

/**
 * Combined assertion and value extraction for successful Results
 * Reduces boilerplate from 3 lines to 1 line
 */
export function expectSuccess<T>(result: Result<T, CoreError>): T {
  if (result.isErr()) {
    throw new Error(`Expected successful result, but got error: ${result.error.message}`);
  }
  return result.value;
}

/**
 * Combined assertion and error extraction for failed Results
 * Reduces boilerplate from 3 lines to 1 line
 */
export function expectFailure<E = CoreError>(result: Result<any, E>): E {
  if (result.isOk()) {
    throw new Error('Expected error result, but operation succeeded');
  }
  return result.error;
}

/**
 * Convenient assertion for specific error codes
 */
export function expectErrorCode<E extends { code: string }>(
  result: Result<any, E>,
  expectedCode: string
): E {
  if (result.isOk()) {
    throw new Error('Expected error result, but operation succeeded');
  }
  if (result.error.code !== expectedCode) {
    throw new Error(`Expected error code '${expectedCode}', but got '${result.error.code}'`);
  }
  return result.error;
}

/**
 * Convenient assertion for error messages containing specific text
 */
export function expectErrorMessage<E extends { message: string }>(
  result: Result<any, E>,
  expectedMessage: string | RegExp
): E {
  if (result.isOk()) {
    throw new Error('Expected error result, but operation succeeded');
  }

  const message = result.error.message;
  if (typeof expectedMessage === 'string') {
    if (!message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to contain '${expectedMessage}', but got '${message}'`
      );
    }
  } else {
    if (!expectedMessage.test(message)) {
      throw new Error(`Expected error message to match ${expectedMessage}, but got '${message}'`);
    }
  }

  return result.error;
}
