/**
 * Type definitions for @trailhead/sort
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
 * Type guard to check if a value is an array
 */
export const isArray = <T>(value: unknown): value is T[] => Array.isArray(value)

/**
 * Type guard to check if a value is a readonly array
 */
export const isReadonlyArray = <T>(value: unknown): value is readonly T[] => Array.isArray(value)

/**
 * Common sorting options interface for consistent API across packages
 */
export interface SortOptions<T = any> {
  /**
   * Field(s) to sort by - can be a single field or array of fields
   */
  by?: string | string[] | PropFn<T, any> | Array<PropFn<T, any>>

  /**
   * Sort order(s) - can be a single order or array matching the fields
   */
  order?: SortDirection | SortDirection[]

  /**
   * Optional custom comparison function
   */
  compareFn?: CompareFn<T>

  /**
   * Whether to perform case-insensitive string comparison
   */
  caseInsensitive?: boolean

  /**
   * Maximum number of items to return (for topN/bottomN operations)
   */
  limit?: number
}
