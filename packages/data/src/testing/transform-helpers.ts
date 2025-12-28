/**
 * @module testing/transform-helpers
 * @description Transform testing utilities for validating data transformations
 *
 * Provides helpers for creating and running transformation test cases
 * with expected/actual comparison.
 */

/**
 * Creates a test case for a transform function
 *
 * Runs the transform and compares actual output to expected using JSON equality.
 *
 * @template T - Input type
 * @template U - Output type
 * @param transform - Transform function to test
 * @param input - Input value
 * @param expected - Expected output value
 * @returns Test case result with input, expected, actual, and passes flag
 */
export const createTransformTestCase = <T, U>(
  transform: (input: T) => U,
  input: T,
  expected: U
) => {
  const actual = transform(input)
  return {
    input,
    expected,
    actual,
    passes: JSON.stringify(actual) === JSON.stringify(expected),
  }
}

/**
 * Runs multiple transform test cases and aggregates results
 *
 * @template T - Input type
 * @template U - Output type
 * @param transform - Transform function to test
 * @param testCases - Array of input/expected pairs
 * @returns Aggregate results with pass/fail counts
 */
export const runBatchTransformTests = <T, U>(
  transform: (input: T) => U,
  testCases: Array<{ input: T; expected: U }>
) => {
  const results = testCases.map(({ input, expected }) =>
    createTransformTestCase(transform, input, expected)
  )

  return {
    results,
    allPassed: results.every((r) => r.passes),
    passCount: results.filter((r) => r.passes).length,
    failCount: results.filter((r) => !r.passes).length,
  }
}
