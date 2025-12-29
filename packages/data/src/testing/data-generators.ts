/**
 * @module testing/data-generators
 * @description Test data generation utilities for creating sample datasets
 *
 * Provides functions for generating arrays of numbers, strings, objects,
 * and random data for testing purposes.
 */

/**
 * Test data generators for creating sample arrays
 *
 * @example
 * ```typescript
 * // Generate array of numbers 1-10
 * const nums = generateTestData.numbers(10);
 *
 * // Generate array of strings
 * const strs = generateTestData.strings(5, 'user');
 *
 * // Generate random values
 * const randNum = generateTestData.random.number(1, 100);
 * ```
 */
export const generateTestData = {
  /**
   * Generates an array of sequential numbers starting from 1
   *
   * @param count - Number of elements to generate
   * @returns Array of numbers [1, 2, 3, ...]
   */
  numbers: (count: number): number[] => {
    return Array.from({ length: count }, (_, i) => i + 1)
  },

  /**
   * Generates an array of prefixed strings
   *
   * @param count - Number of elements to generate
   * @param prefix - String prefix (default: 'item')
   * @returns Array of strings ['item1', 'item2', ...]
   */
  strings: (count: number, prefix = 'item'): string[] => {
    return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`)
  },

  /**
   * Generates an array of objects with id, name, and value fields
   *
   * @param count - Number of objects to generate
   * @returns Array of objects with sequential ids and computed values
   */
  objects: (count: number): Array<{ id: number; name: string; value: number }> => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `item${i + 1}`,
      value: (i + 1) * 10,
    }))
  },

  /**
   * Random data generators for testing edge cases
   */
  random: {
    /**
     * Generates a random integer within range (inclusive)
     *
     * @param min - Minimum value (default: 0)
     * @param max - Maximum value (default: 100)
     * @returns Random integer between min and max
     */
    number: (min = 0, max = 100): number => {
      return Math.floor(Math.random() * (max - min + 1)) + min
    },

    /**
     * Generates a random alphanumeric string
     *
     * @param length - String length (default: 10)
     * @returns Random string of specified length
     */
    string: (length = 10): string => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      return Array.from({ length }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('')
    },

    /**
     * Generates a random boolean
     *
     * @returns Random true or false
     */
    boolean: (): boolean => {
      return Math.random() < 0.5
    },
  },
}
