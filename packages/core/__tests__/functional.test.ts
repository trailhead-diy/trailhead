import { describe, it, expect, vi } from 'vitest'
import { ok, err, ResultAsync } from 'neverthrow'
import { tap, composeResult, composeResultAsync } from '../src/functional/composition.js'

// Test helper functions
const add1 = (x: number) => x + 1

describe('Foundation Functional Utilities', () => {
  describe('Foundation Utilities', () => {
    it('should tap for side effects without changing value', () => {
      let sideEffect = 0
      const tapFn = tap((x: number) => {
        sideEffect = x
      })

      const result = add1(tapFn(5))

      expect(result).toBe(6)
      expect(sideEffect).toBe(5)
    })
  })

  describe('Result Type Composition', () => {
    const addResult = (x: number) => ok(x + 1)
    const multiplyResult = (x: number) => ok(x * 2)
    const errorResult = (_x: number) => err('error occurred')

    it('should compose Result-returning functions successfully', () => {
      const composed = composeResult(multiplyResult, addResult)
      const result = composed(5)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(12) // (5 + 1) * 2 = 12
      }
    })

    it('should handle errors in Result composition', () => {
      const composed = composeResult(multiplyResult, errorResult)
      const result = composed(5)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('error occurred')
      }
    })

    it('should compose ResultAsync functions', async () => {
      const addAsync = (x: number) => ResultAsync.fromSafePromise(Promise.resolve(x + 1))
      const multiplyAsync = (x: number) => ResultAsync.fromSafePromise(Promise.resolve(x * 2))

      const composed = composeResultAsync(multiplyAsync, addAsync)
      const result = await composed(5)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(12) // (5 + 1) * 2 = 12
      }
    })

    it('should short-circuit on first error in composeResultAsync', async () => {
      const failAsync = (_x: number) =>
        ResultAsync.fromPromise(Promise.reject(new Error('First failed')), () => 'error from first')
      const shouldNotRun = vi.fn().mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(99)))

      const composed = composeResultAsync(shouldNotRun, failAsync)
      const result = await composed(5)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('error from first')
      }
      expect(shouldNotRun).not.toHaveBeenCalled()
    })

    it('should short-circuit when second function fails in composeResultAsync', async () => {
      const successAsync = (x: number) => ResultAsync.fromSafePromise(Promise.resolve(x + 1))
      const failAsync = (_x: number) =>
        ResultAsync.fromPromise(
          Promise.reject(new Error('Second failed')),
          () => 'error from second'
        )

      const composed = composeResultAsync(failAsync, successAsync)
      const result = await composed(5)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('error from second')
      }
    })
  })
})
