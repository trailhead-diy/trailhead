/**
 * Transform helpers for testing
 */

/**
 * Creates transform test cases
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
 * Batch transform test runner
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
