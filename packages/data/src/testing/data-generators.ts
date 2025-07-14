/**
 * Data generators for testing
 */

/**
 * Generates test data arrays
 */
export const generateTestData = {
  /**
   * Generates an array of numbers
   */
  numbers: (count: number): number[] => {
    return Array.from({ length: count }, (_, i) => i + 1)
  },

  /**
   * Generates an array of strings
   */
  strings: (count: number, prefix = 'item'): string[] => {
    return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`)
  },

  /**
   * Generates an array of objects
   */
  objects: (count: number): Array<{ id: number; name: string; value: number }> => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `item${i + 1}`,
      value: (i + 1) * 10,
    }))
  },

  /**
   * Generates random data
   */
  random: {
    number: (min = 0, max = 100): number => {
      return Math.floor(Math.random() * (max - min + 1)) + min
    },

    string: (length = 10): string => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      return Array.from({ length }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('')
    },

    boolean: (): boolean => {
      return Math.random() < 0.5
    },
  },
}
