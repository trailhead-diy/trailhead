/**
 * Function composition utilities
 */

/**
 * Pure function composition utility
 * Composes multiple functions from left to right (mathematical function composition)
 * Each function transforms the input and passes result to next function
 */
export const pipe = <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
  fns.reduce((acc, fn) => fn(acc), value)

/**
 * Compose functions from right to left
 * Traditional mathematical composition order
 */
export const compose = <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
  fns.reduceRight((acc, fn) => fn(acc), value)

/**
 * Create custom formatting pipeline
 * Allows consumers to compose their own formatting pipeline from individual functions
 * 
 * @param formatters - Array of formatting functions to compose
 * @returns Composed formatting function
 */
export function createPostProcessor(...formatters: Array<(code: string) => string>) {
  return pipe(...formatters)
}

/**
 * Conditional formatter
 * Applies formatter only if condition is met
 */
export function conditionalFormatter(
  condition: (code: string) => boolean,
  formatter: (code: string) => string
) {
  return (code: string): string => {
    return condition(code) ? formatter(code) : code
  }
}