import type { Result } from '../core/errors/index.js';

/**
 * Custom Vitest matchers for Result types
 * Provides fluent assertions for improved developer experience
 */

/**
 * Matcher to check if a Result is successful
 */
const toBeOk = function (this: any, received: Result<any>) {
  const { isNot: _isNot } = this;

  if (received.success) {
    return {
      pass: true,
      message: () => 'Expected Result to be an error, but it was successful',
    };
  } else {
    return {
      pass: false,
      message: () => `Expected Result to be successful, but got error: ${received.error.message}`,
    };
  }
};

/**
 * Matcher to check if a Result is an error
 */
const toBeErr = function (this: any, received: Result<any>) {
  const { isNot: _isNot } = this;

  if (!received.success) {
    return {
      pass: true,
      message: () => 'Expected Result to be successful, but it was an error',
    };
  } else {
    return {
      pass: false,
      message: () => 'Expected Result to be an error, but it was successful',
    };
  }
};

/**
 * Matcher to check Result value with custom assertion
 */
const toHaveValue = function (this: any, received: Result<any>, expected: any) {
  if (!received.success) {
    return {
      pass: false,
      message: () =>
        `Expected Result to have value ${this.utils?.printExpected?.(expected) || expected}, but Result was an error: ${received.error.message}`,
    };
  }

  const pass = this.equals?.(received.value, expected) || received.value === expected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected Result not to have value ${this.utils?.printExpected?.(expected) || expected}`
        : `Expected Result to have value ${this.utils?.printExpected?.(expected) || expected}, but got ${this.utils?.printReceived?.(received.value) || received.value}`,
  };
};

/**
 * Matcher to check Result error with custom assertion
 */
const toHaveError = function (this: any, received: Result<any>, expected: any) {
  if (received.success) {
    return {
      pass: false,
      message: () =>
        `Expected Result to have error ${this.utils?.printExpected?.(expected) || expected}, but Result was successful`,
    };
  }

  const pass = this.equals?.(received.error, expected) || received.error === expected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected Result not to have error ${this.utils?.printExpected?.(expected) || expected}`
        : `Expected Result to have error ${this.utils?.printExpected?.(expected) || expected}, but got ${this.utils?.printReceived?.(received.error) || received.error}`,
  };
};

/**
 * Matcher to check Result error code
 */
const toHaveErrorCode = function (this: any, received: Result<any>, expectedCode: string) {
  if (received.success) {
    return {
      pass: false,
      message: () =>
        `Expected Result to have error code '${expectedCode}', but Result was successful`,
    };
  }

  if (!('code' in received.error)) {
    return {
      pass: false,
      message: () => `Expected Result error to have 'code' property, but it doesn't`,
    };
  }

  const actualCode = (received.error as any).code;
  const pass = actualCode === expectedCode;

  return {
    pass,
    message: () =>
      pass
        ? `Expected Result not to have error code '${expectedCode}'`
        : `Expected Result to have error code '${expectedCode}', but got '${actualCode}'`,
  };
};

/**
 * Matcher to check Result error message
 */
const toHaveErrorMessage = function (this: any, received: Result<any>, expected: string | RegExp) {
  if (received.success) {
    return {
      pass: false,
      message: () => `Expected Result to have error message, but Result was successful`,
    };
  }

  if (!('message' in received.error)) {
    return {
      pass: false,
      message: () => `Expected Result error to have 'message' property, but it doesn't`,
    };
  }

  const actualMessage = (received.error as any).message;
  let pass: boolean;

  if (typeof expected === 'string') {
    pass = actualMessage.includes(expected);
  } else {
    pass = expected.test(actualMessage);
  }

  return {
    pass,
    message: () =>
      pass
        ? `Expected Result error message not to contain/match ${this.utils?.printExpected?.(expected) || expected}`
        : `Expected Result error message to contain/match ${this.utils?.printExpected?.(expected) || expected}, but got '${actualMessage}'`,
  };
};

/**
 * Matcher to check array length in Result value
 */
const toHaveLength = function (this: any, received: Result<any>, expectedLength: number) {
  if (!received.success) {
    return {
      pass: false,
      message: () =>
        `Expected Result to have array of length ${expectedLength}, but Result was an error: ${received.error.message}`,
    };
  }

  if (!Array.isArray(received.value)) {
    return {
      pass: false,
      message: () => `Expected Result value to be an array, but got ${typeof received.value}`,
    };
  }

  const actualLength = received.value.length;
  const pass = actualLength === expectedLength;

  return {
    pass,
    message: () =>
      pass
        ? `Expected Result array not to have length ${expectedLength}`
        : `Expected Result array to have length ${expectedLength}, but got ${actualLength}`,
  };
};

/**
 * Matcher to check if Result value matches a pattern
 */
const toMatchResult = function (this: any, received: Result<any>, expected: any) {
  if (!received.success) {
    return {
      pass: false,
      message: () =>
        `Expected Result to match ${this.utils?.printExpected?.(expected) || expected}, but Result was an error: ${received.error.message}`,
    };
  }

  const pass = this.equals?.(received.value, expected) || received.value === expected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected Result value not to match ${this.utils?.printExpected?.(expected) || expected}`
        : `Expected Result value to match ${this.utils?.printExpected?.(expected) || expected}, but got ${this.utils?.printReceived?.(received.value) || received.value}`,
  };
};

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
};

/**
 * Type declarations for TypeScript
 */
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeOk(): T;
    toBeErr(): T;
    toHaveValue(expected: any): T;
    toHaveError(expected: any): T;
    toHaveErrorCode(code: string): T;
    toHaveErrorMessage(message: string | RegExp): T;
    toHaveLength(length: number): T;
    toMatchResult(expected: any): T;
  }

  interface AsymmetricMatchersContaining {
    toBeOk(): any;
    toBeErr(): any;
    toHaveValue(expected: any): any;
    toHaveError(expected: any): any;
    toHaveErrorCode(code: string): any;
    toHaveErrorMessage(message: string | RegExp): any;
    toHaveLength(length: number): any;
    toMatchResult(expected: any): any;
  }
}

/**
 * Setup function to register matchers with Vitest
 */
export function setupResultMatchers() {
  if (
    typeof globalThis !== 'undefined' &&
    'expect' in globalThis &&
    (globalThis as any).expect.extend
  ) {
    (globalThis as any).expect.extend(resultMatchers);
  } else {
    throw new Error('setupResultMatchers requires a test framework with expect.extend');
  }
}
