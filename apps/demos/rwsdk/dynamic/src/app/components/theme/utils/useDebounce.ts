'use client'

import { useCallback, useEffect, useRef } from 'react'
import { debounce } from './debounce'

/**
 * React hook for debouncing values
 *
 * Returns a debounced version of the input value that only updates
 * after the specified delay has passed since the last change.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 *
 * @example
 * function SearchInput() {
 *   const [searchTerm, setSearchTerm] = useState('')
 *   const debouncedSearchTerm = useDebounce(searchTerm, 500)
 *
 *   useEffect(() => {
 *     // API call with debounced value
 *     if (debouncedSearchTerm) {
 *       searchAPI(debouncedSearchTerm)
 *     }
 *   }, [debouncedSearchTerm])
 * }
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * React hook that returns a debounced callback function
 *
 * The callback will only execute after the specified delay has passed
 * since the last invocation. Useful for event handlers.
 *
 * @param callback - The callback function to debounce
 * @param delay - The delay in milliseconds
 * @param deps - Dependency array (like useCallback)
 * @returns A debounced version of the callback
 *
 * @example
 * function ThemeColorPicker() {
 *   const debouncedSetColor = useDebouncedCallback(
 *     (color: string) => {
 *       updateThemeColor(color)
 *     },
 *     300,
 *     []
 *   )
 *
 *   return <input onChange={(e) => debouncedSetColor(e.target.value)} />
 * }
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T & { cancel: () => void } {
  const callbackRef = useRef(callback)
  const debouncedRef = useRef<ReturnType<typeof debounce>>()

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback
  })

  // Create debounced function
  useEffect(() => {
    // Create wrapper that always calls latest callback
    const wrappedCallback = (...args: Parameters<T>) => {
      callbackRef.current(...args)
    }

    // Create debounced version
    debouncedRef.current = debounce(wrappedCallback as T, delay)

    // Cleanup on unmount or when delay changes
    return () => {
      debouncedRef.current?.cancel()
    }
  }, [delay])

  // Return stable debounced callback
  return useCallback(
    ((...args: Parameters<T>) => {
      debouncedRef.current?.(...args)
    }) as T & { cancel: () => void },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps, delay]
  )
}

// Fix missing React import
import * as React from 'react'
