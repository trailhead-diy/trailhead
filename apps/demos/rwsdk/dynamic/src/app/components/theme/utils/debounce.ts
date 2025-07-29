/**
 * Debounce utility for delaying function execution
 *
 * Creates a debounced version of a function that delays invoking the function
 * until after `delay` milliseconds have elapsed since the last time it was invoked.
 *
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the function with a cancel method
 *
 * @example
 * const debouncedSave = debounce((data) => saveToAPI(data), 500)
 *
 * // Rapid calls will be debounced
 * debouncedSave(data1) // cancelled
 * debouncedSave(data2) // cancelled
 * debouncedSave(data3) // executed after 500ms
 *
 * // Cancel pending execution
 * debouncedSave.cancel()
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debounced = ((...args: Parameters<T>) => {
    // Clear any existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }) as T

  // Add cancel method
  ;(debounced as any).cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debounced as T & { cancel: () => void }
}

/**
 * Creates a debounced function with leading edge execution
 *
 * This variant executes the function immediately on the first call,
 * then debounces subsequent calls.
 *
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the function with immediate first execution
 */
export function debounceLeading<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastCallTime = 0

  const debounced = ((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime

    // Clear any existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    // Execute immediately if first call or enough time has passed
    if (timeSinceLastCall >= delay) {
      fn(...args)
      lastCallTime = now
    } else {
      // Schedule execution after remaining delay
      timeoutId = setTimeout(() => {
        fn(...args)
        lastCallTime = Date.now()
        timeoutId = null
      }, delay - timeSinceLastCall)
    }
  }) as T

  // Add cancel method
  ;(debounced as any).cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debounced as T & { cancel: () => void }
}
