/**
 * Validation testing helpers
 */

import { z } from 'zod'

/**
 * Creates a validation test case
 */
export const createValidationTestCase = <T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  expected: { success: boolean; data?: T; errorMessage?: string }
) => {
  const result = schema.safeParse(input)

  return {
    input,
    expected,
    actual: {
      success: result.success,
      data: result.success ? result.data : undefined,
      error: result.success ? undefined : result.error,
    },
    passes: result.success === expected.success,
  }
}

/**
 * Batch validation test runner
 */
export const runBatchValidationTests = <T>(
  schema: z.ZodSchema<T>,
  testCases: Array<{ input: unknown; shouldPass: boolean }>
) => {
  const results = testCases.map(({ input, shouldPass }) => {
    const result = schema.safeParse(input)
    return {
      input,
      shouldPass,
      actualSuccess: result.success,
      passes: result.success === shouldPass,
      error: result.success ? undefined : result.error,
    }
  })

  return {
    results,
    allPassed: results.every((r) => r.passes),
    passCount: results.filter((r) => r.passes).length,
    failCount: results.filter((r) => !r.passes).length,
  }
}
