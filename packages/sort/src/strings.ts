/**
 * String and primitive array sorting utilities
 */

import type { SortDirection } from './types'

/**
 * Sort an array of strings
 *
 * @param strings - Array of strings to sort
 * @param order - Sort order ('asc' or 'desc')
 * @returns New sorted array
 *
 * @example
 * ```typescript
 * sortStrings(['zebra', 'apple', 'banana']) // ['apple', 'banana', 'zebra']
 * sortStrings(['zebra', 'apple', 'banana'], 'desc') // ['zebra', 'banana', 'apple']
 * ```
 */
export function sortStrings(strings: string[], order: SortDirection = 'asc'): string[] {
  const sorted = [...strings].sort()
  return order === 'desc' ? sorted.reverse() : sorted
}

/**
 * Sort an array of strings with custom comparator
 *
 * @param strings - Array of strings to sort
 * @param compareFn - Custom comparison function
 * @param order - Sort order ('asc' or 'desc')
 * @returns New sorted array
 *
 * @example
 * ```typescript
 * // Sort by length
 * orderStrings(['a', 'abc', 'ab'], (a, b) => a.length - b.length)
 * // ['a', 'ab', 'abc']
 * ```
 */
export function orderStrings(
  strings: string[],
  compareFn: (a: string, b: string) => number,
  order: SortDirection = 'asc'
): string[] {
  const sorted = [...strings].sort(compareFn)
  return order === 'desc' ? sorted.reverse() : sorted
}

/**
 * Sort an array of primitives (strings, numbers, booleans)
 *
 * @param array - Array of primitives to sort
 * @param order - Sort order ('asc' or 'desc')
 * @returns New sorted array
 *
 * @example
 * ```typescript
 * sortArray([3, 1, 2]) // [1, 2, 3]
 * sortArray(['c', 'a', 'b']) // ['a', 'b', 'c']
 * sortArray([3, 1, 2], 'desc') // [3, 2, 1]
 * ```
 */
export function sortArray<T extends string | number | boolean>(
  array: T[],
  order: SortDirection = 'asc'
): T[] {
  const sorted = [...array].sort()
  return order === 'desc' ? sorted.reverse() : sorted
}

/**
 * Sort an array with multiple sort criteria (for objects)
 * Useful when es-toolkit's orderBy doesn't handle the specific case
 *
 * @param array - Array to sort
 * @param criteria - Array of accessor functions and their sort orders
 * @returns New sorted array
 *
 * @example
 * ```typescript
 * const data = [
 *   { name: 'John', age: 30 },
 *   { name: 'Jane', age: 25 },
 *   { name: 'Bob', age: 30 }
 * ]
 *
 * sortMultiple(data, [
 *   { accessor: (item) => item.age, order: 'asc' },
 *   { accessor: (item) => item.name, order: 'desc' }
 * ])
 * ```
 */
export function sortMultiple<T>(
  array: T[],
  criteria: Array<{
    accessor: (item: T) => any
    order?: SortDirection
  }>
): T[] {
  return [...array].sort((a, b) => {
    for (const { accessor, order = 'asc' } of criteria) {
      const aValue = accessor(a)
      const bValue = accessor(b)

      let comparison = 0
      if (aValue < bValue) comparison = -1
      else if (aValue > bValue) comparison = 1

      if (comparison !== 0) {
        return order === 'desc' ? -comparison : comparison
      }
    }
    return 0
  })
}
