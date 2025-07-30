import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce } from '../utils/debounce'

describe('Debounce Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should delay function execution', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn('test')
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledWith('test')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should cancel previous calls when called multiple times', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn('first')
    vi.advanceTimersByTime(50)

    debouncedFn('second')
    vi.advanceTimersByTime(50)

    debouncedFn('third')
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('third')
  })

  it('should pass multiple arguments correctly', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn('arg1', 'arg2', { key: 'value' })
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' })
  })

  it('should maintain correct this context', () => {
    const obj = {
      value: 42,
      method: vi.fn(function (this: any) {
        return this.value
      }),
    }

    const debouncedMethod = debounce(obj.method.bind(obj), 100)
    debouncedMethod()
    vi.advanceTimersByTime(100)

    expect(obj.method).toHaveBeenCalled()
    expect(obj.method).toHaveReturnedWith(42)
  })

  it('should support cancel method', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn('test')
    debouncedFn.cancel()
    vi.advanceTimersByTime(100)

    expect(fn).not.toHaveBeenCalled()
  })

  it('should handle rapid successive calls correctly', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    // Simulate rapid typing
    for (let i = 0; i < 10; i++) {
      debouncedFn(i)
      vi.advanceTimersByTime(20)
    }

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(9) // Last value
  })

  it('should work with zero delay', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 0)

    debouncedFn('immediate')
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(0)
    expect(fn).toHaveBeenCalledWith('immediate')
  })

  it('should handle errors in debounced function', () => {
    const error = new Error('Test error')
    const fn = vi.fn(() => {
      throw error
    })
    const debouncedFn = debounce(fn, 100)

    debouncedFn()

    expect(() => {
      vi.advanceTimersByTime(100)
    }).toThrow(error)
  })

  it('should not execute if cancelled multiple times', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn('test')
    debouncedFn.cancel()
    debouncedFn.cancel() // Multiple cancels should be safe
    vi.advanceTimersByTime(100)

    expect(fn).not.toHaveBeenCalled()
  })

  describe('Real-world Scenarios', () => {
    it('should handle theme changes with appropriate delays', () => {
      const applyTheme = vi.fn()
      const debouncedApplyTheme = debounce(applyTheme, 50)

      // User rapidly changes colors
      debouncedApplyTheme({ primary: 'blue' })
      vi.advanceTimersByTime(20)
      debouncedApplyTheme({ primary: 'purple' })
      vi.advanceTimersByTime(20)
      debouncedApplyTheme({ primary: 'green' })

      // Only the last change should be applied
      vi.advanceTimersByTime(50)
      expect(applyTheme).toHaveBeenCalledTimes(1)
      expect(applyTheme).toHaveBeenCalledWith({ primary: 'green' })
    })

    it('should handle cookie saves with longer delays', () => {
      const saveCookie = vi.fn()
      const debouncedSaveCookie = debounce(saveCookie, 150)

      // Multiple theme updates
      debouncedSaveCookie({ mode: 'light' })
      vi.advanceTimersByTime(50)
      debouncedSaveCookie({ mode: 'dark' })
      vi.advanceTimersByTime(50)
      debouncedSaveCookie({ mode: 'system' })

      // Should wait full 150ms from last call
      vi.advanceTimersByTime(50)
      expect(saveCookie).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(saveCookie).toHaveBeenCalledTimes(1)
      expect(saveCookie).toHaveBeenCalledWith({ mode: 'system' })
    })
  })
})
