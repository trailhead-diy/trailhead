/**
 * @packageDocumentation
 * Fast, type-safe sorting utilities for JavaScript/TypeScript.
 *
 * @example
 * ```typescript
 * import { sortBy, orderBy, topN } from '@trailhead/sort'
 *
 * // Sort by a single property
 * const sorted = sortBy(users, [user => user.age])
 *
 * // Sort by multiple criteria
 * const sorted = orderBy(
 *   users,
 *   [user => user.age, user => user.name],
 *   ['asc', 'desc']
 * )
 *
 * // Get top 10 items efficiently
 * const top10 = topN(10, scores)
 * ```
 */

/**
 * Sort an array by one or more criteria.
 *
 * @param collection - The array to sort
 * @param criteria - An array of key functions or property names to sort by
 *
 * @returns A new sorted array
 *
 * @example
 * // Sort by a single property using a function
 * const users = [
 *   { name: 'John', age: 30 },
 *   { name: 'Jane', age: 25 }
 * ]
 * sortBy(users, [user => user.age])
 * // => [{ name: 'Jane', age: 25 }, { name: 'John', age: 30 }]
 *
 * @example
 * // Sort by property name directly
 * sortBy(users, ['age'])
 * // => [{ name: 'Jane', age: 25 }, { name: 'John', age: 30 }]
 *
 * @example
 * // Sort by multiple criteria
 * const products = [
 *   { category: 'Electronics', price: 999 },
 *   { category: 'Electronics', price: 499 },
 *   { category: 'Books', price: 29 }
 * ]
 * sortBy(products, [p => p.category, p => p.price])
 * // => Books first, then Electronics sorted by price
 */
export { sortBy } from 'es-toolkit'

/**
 * Sort an array by multiple criteria with specified order directions.
 *
 * @param collection - The array to sort
 * @param iteratees - An array of key functions or property names to sort by
 * @param orders - An array of order directions ('asc' or 'desc') for each criterion
 *
 * @returns A new sorted array
 *
 * @example
 * // Sort users by age ascending, then by name descending
 * const users = [
 *   { name: 'John', age: 30 },
 *   { name: 'Jane', age: 30 },
 *   { name: 'Bob', age: 25 }
 * ]
 * orderBy(users, [u => u.age, u => u.name], ['asc', 'desc'])
 * // => [
 * //   { name: 'Bob', age: 25 },
 * //   { name: 'John', age: 30 },
 * //   { name: 'Jane', age: 30 }
 * // ]
 *
 * @example
 * // Using property names
 * orderBy(users, ['age', 'name'], ['asc', 'desc'])
 *
 * @example
 * // Complex sorting with multiple criteria
 * const data = [
 *   { category: 'A', priority: 1, value: 100 },
 *   { category: 'B', priority: 1, value: 200 },
 *   { category: 'A', priority: 2, value: 150 }
 * ]
 * orderBy(data, ['category', 'priority', 'value'], ['asc', 'asc', 'desc'])
 */
export { orderBy } from 'es-toolkit'

// Performance utilities
export { topN, bottomN, partition } from './native'

// String and array utilities
export { sortStrings, sortArray, orderStrings, sortMultiple } from './strings'

// Types

/**
 * Represents the sort order direction.
 * - 'asc' for ascending order (smallest to largest)
 * - 'desc' for descending order (largest to smallest)
 */
export type Order = 'asc' | 'desc'

export type { CompareFn, PropFn, SortDirection, SortOptions } from './types'
