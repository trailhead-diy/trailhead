/**
 * Performance-critical sorting utilities not provided by es-toolkit
 */

import type { CompareFn, PropFn } from './types'

/**
 * Default comparison function that handles common JavaScript types
 */
function defaultCompare<T>(a: T, b: T): number {
  // Handle null/undefined
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1
  if (b === null || b === undefined) return -1

  // Numbers (including NaN handling)
  if (typeof a === 'number' && typeof b === 'number') {
    if (isNaN(a) && isNaN(b)) return 0
    if (isNaN(a)) return 1
    if (isNaN(b)) return -1
    return a - b
  }

  // Strings
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b)
  }

  // Dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime()
  }

  // Booleans (false < true)
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return (a ? 1 : 0) - (b ? 1 : 0)
  }

  // Default: convert to string and compare
  return String(a).localeCompare(String(b))
}

/**
 * Get the top N elements from an array in descending order.
 *
 * This function uses an optimized partial sorting algorithm that is significantly
 * faster than sorting the entire array when N is small relative to the array size.
 *
 * @param n - The number of top elements to return
 * @param array - The input array to select from
 * @param compareFnOrSelector - Optional comparison function or property selector.
 *                              If a function with 2 parameters, it's used as a comparator.
 *                              If a function with 1 parameter, it's used as a property selector.
 *                              If omitted, elements are compared using default comparison.
 *
 * @returns An array containing the top N elements in descending order
 *
 * @example
 * // Get top 3 numbers
 * topN(3, [9, 3, 1, 7, 2, 8, 4, 6, 5])
 * // => [9, 8, 7]
 *
 * @example
 * // Get top 3 users by score
 * const users = [
 *   { name: 'Alice', score: 95 },
 *   { name: 'Bob', score: 87 },
 *   { name: 'Charlie', score: 91 }
 * ]
 * topN(2, users, u => u.score)
 * // => [{ name: 'Alice', score: 95 }, { name: 'Charlie', score: 91 }]
 *
 * @example
 * // Using custom comparator
 * topN(2, users, (a, b) => a.score - b.score)
 * // => [{ name: 'Alice', score: 95 }, { name: 'Charlie', score: 91 }]
 */
export function topN<T>(
  n: number,
  array: readonly T[],
  compareFnOrSelector?: CompareFn<T> | PropFn<T, any>
): T[] {
  if (n <= 0 || array.length === 0) return []
  if (n >= array.length) {
    // Sort in descending order to match expected behavior
    const sorted = [...array].sort((a: T, b: T) => -defaultCompare(a, b))
    return sorted
  }

  // Determine comparison function
  let compareFn: CompareFn<T>
  if (typeof compareFnOrSelector === 'function' && compareFnOrSelector.length === 2) {
    compareFn = compareFnOrSelector as CompareFn<T>
  } else if (compareFnOrSelector) {
    const selector = compareFnOrSelector as PropFn<T, any>
    compareFn = (a, b) => defaultCompare(selector(a), selector(b))
  } else {
    compareFn = defaultCompare
  }

  // Use partial sort algorithm for efficiency
  const result = array.slice(0, n)
  result.sort(compareFn)

  for (let i = n; i < array.length; i++) {
    const current = array[i]
    // If current is larger than the smallest in result
    if (compareFn(current, result[0]) > 0) {
      // Binary search to find insertion position
      let left = 0
      let right = n - 1

      while (left < right) {
        const mid = Math.floor((left + right + 1) / 2)
        if (compareFn(current, result[mid]) >= 0) {
          left = mid
        } else {
          right = mid - 1
        }
      }

      // Shift and insert
      result.shift()
      result.splice(left, 0, current)
    }
  }

  return result.reverse()
}

/**
 * Get the bottom N elements from an array in ascending order.
 *
 * This function uses an optimized partial sorting algorithm that is significantly
 * faster than sorting the entire array when N is small relative to the array size.
 *
 * @param n - The number of bottom elements to return
 * @param array - The input array to select from
 * @param compareFnOrSelector - Optional comparison function or property selector.
 *                              If a function with 2 parameters, it's used as a comparator.
 *                              If a function with 1 parameter, it's used as a property selector.
 *                              If omitted, elements are compared using default comparison.
 *
 * @returns An array containing the bottom N elements in ascending order
 *
 * @example
 * // Get bottom 3 numbers
 * bottomN(3, [9, 3, 1, 7, 2, 8, 4, 6, 5])
 * // => [1, 2, 3]
 *
 * @example
 * // Get bottom 3 users by score (lowest scores)
 * const users = [
 *   { name: 'Alice', score: 95 },
 *   { name: 'Bob', score: 87 },
 *   { name: 'Charlie', score: 91 },
 *   { name: 'David', score: 82 }
 * ]
 * bottomN(2, users, u => u.score)
 * // => [{ name: 'David', score: 82 }, { name: 'Bob', score: 87 }]
 *
 * @example
 * // Get earliest dates
 * const dates = [
 *   new Date('2024-03-15'),
 *   new Date('2024-01-10'),
 *   new Date('2024-02-20')
 * ]
 * bottomN(2, dates)
 * // => [Date('2024-01-10'), Date('2024-02-20')]
 */
export function bottomN<T>(
  n: number,
  array: readonly T[],
  compareFnOrSelector?: CompareFn<T> | PropFn<T, any>
): T[] {
  if (n <= 0 || array.length === 0) return []
  if (n >= array.length) {
    // Sort in ascending order
    const sorted = [...array].sort(defaultCompare)
    return sorted
  }

  // Determine comparison function
  let compareFn: CompareFn<T>
  if (typeof compareFnOrSelector === 'function' && compareFnOrSelector.length === 2) {
    compareFn = compareFnOrSelector as CompareFn<T>
  } else if (compareFnOrSelector) {
    const selector = compareFnOrSelector as PropFn<T, any>
    compareFn = (a, b) => defaultCompare(selector(a), selector(b))
  } else {
    compareFn = defaultCompare
  }

  // Use partial sort algorithm for efficiency (reverse of topN)
  const result = array.slice(0, n)
  result.sort((a, b) => -compareFn(a, b))

  for (let i = n; i < array.length; i++) {
    const current = array[i]
    // If current is smaller than the largest in result
    if (compareFn(current, result[0]) < 0) {
      // Binary search to find insertion position
      let left = 0
      let right = n - 1

      while (left < right) {
        const mid = Math.floor((left + right + 1) / 2)
        if (compareFn(current, result[mid]) <= 0) {
          left = mid
        } else {
          right = mid - 1
        }
      }

      // Shift and insert
      result.shift()
      result.splice(left, 0, current)
    }
  }

  return result.reverse()
}

/**
 * Partition an array into two arrays based on a predicate function.
 *
 * This function splits an array into two arrays: the first contains all elements
 * that satisfy the predicate, and the second contains all elements that don't.
 * The original order of elements is preserved in both arrays.
 *
 * @param predicate - A function that returns true for elements that should go in the first array
 * @param array - The input array to partition
 *
 * @returns A tuple of two arrays: [passing elements, failing elements]
 *
 * @example
 * // Partition numbers by threshold
 * const [high, low] = partition(x => x > 5, [1, 6, 3, 8, 2, 9])
 * // => [[6, 8, 9], [1, 3, 2]]
 *
 * @example
 * // Separate adults from minors
 * const users = [
 *   { name: 'Alice', age: 25 },
 *   { name: 'Bob', age: 17 },
 *   { name: 'Charlie', age: 30 },
 *   { name: 'David', age: 16 }
 * ]
 * const [adults, minors] = partition(user => user.age >= 18, users)
 * // => [
 * //   [{ name: 'Alice', age: 25 }, { name: 'Charlie', age: 30 }],
 * //   [{ name: 'Bob', age: 17 }, { name: 'David', age: 16 }]
 * // ]
 *
 * @example
 * // Filter valid vs invalid data
 * const data = [
 *   { id: 1, value: 10 },
 *   { id: 2, value: null },
 *   { id: 3, value: 20 },
 *   { id: 4, value: undefined }
 * ]
 * const [valid, invalid] = partition(item => item.value != null, data)
 * // => [
 * //   [{ id: 1, value: 10 }, { id: 3, value: 20 }],
 * //   [{ id: 2, value: null }, { id: 4, value: undefined }]
 * // ]
 */
export function partition<T>(predicate: (value: T) => boolean, array: readonly T[]): [T[], T[]] {
  const pass: T[] = []
  const fail: T[] = []

  for (const item of array) {
    if (predicate(item)) {
      pass.push(item)
    } else {
      fail.push(item)
    }
  }

  return [pass, fail]
}
