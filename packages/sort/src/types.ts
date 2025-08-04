/**
 * Type definitions for @esteban-url/sort
 */

/**
 * A comparison function that determines the relative order of two values.
 *
 * @typeParam T - The type of values being compared
 *
 * @param a - The first value to compare
 * @param b - The second value to compare
 *
 * @returns A number indicating the relative order:
 *          - Negative number if `a` should come before `b`
 *          - Zero if `a` and `b` are considered equal
 *          - Positive number if `a` should come after `b`
 *
 * @example
 * // Simple number comparison
 * const compareNumbers: CompareFn<number> = (a, b) => a - b
 *
 * @example
 * // Case-insensitive string comparison
 * const compareStrings: CompareFn<string> = (a, b) =>
 *   a.toLowerCase().localeCompare(b.toLowerCase())
 *
 * @example
 * // Custom object comparison
 * const compareUsers: CompareFn<User> = (a, b) =>
 *   a.age - b.age || a.name.localeCompare(b.name)
 */
export type CompareFn<T> = (a: T, b: T) => number

/**
 * A function that extracts a comparable value from an object.
 *
 * This is commonly used with sorting functions to specify which property
 * or computed value should be used for comparison.
 *
 * @typeParam T - The type of the input object
 * @typeParam K - The type of the extracted value
 *
 * @param item - The object to extract a value from
 *
 * @returns The extracted value to use for comparison
 *
 * @example
 * // Extract a property
 * const getAge: PropFn<User, number> = user => user.age
 *
 * @example
 * // Compute a value
 * const getFullName: PropFn<User, string> = user =>
 *   `${user.firstName} ${user.lastName}`
 *
 * @example
 * // Complex calculation
 * const getTotalScore: PropFn<Player, number> = player =>
 *   player.scores.reduce((sum, score) => sum + score, 0)
 */
export type PropFn<T, K> = (item: T) => K

/**
 * Represents sorting direction
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Configuration for sorting operations
 */
export interface SortConfig<T> {
  /**
   * Custom comparison function
   */
  compareFn?: CompareFn<T>

  /**
   * Sort direction (default: 'asc')
   */
  direction?: SortDirection

  /**
   * Whether to perform stable sort (default: true)
   */
  stable?: boolean
}

/**
 * Multi-criteria sort configuration
 */
export interface SortByConfig<T, K> {
  /**
   * Property selector function
   */
  selector: PropFn<T, K>

  /**
   * Sort direction for this property
   */
  direction?: SortDirection

  /**
   * Custom comparator for the selected property
   */
  compareFn?: CompareFn<K>
}

/**
 * Type guard to check if a value is an array
 */
export const isArray = <T>(value: unknown): value is T[] => Array.isArray(value)

/**
 * Type guard to check if a value is a readonly array
 */
export const isReadonlyArray = <T>(value: unknown): value is readonly T[] => Array.isArray(value)
