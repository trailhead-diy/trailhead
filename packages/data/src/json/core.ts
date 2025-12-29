import { ok, err } from '@trailhead/core'
import { readFile, writeFile } from '@trailhead/cli/fs'
import type { JSONProcessingOptions, DataResult } from '../types.js'
import { defaultJSONConfig, type CreateJSONOperations, type JSONFormatOptions } from './types.js'
import { createJSONError, createParsingError, mapLibraryError } from '../errors.js'

// ========================================
// Inline Sorting Utilities
// ========================================

type Order = 'asc' | 'desc'

/** Sort strings alphabetically with optional order */
const sortStrings = (arr: string[], order: Order = 'asc'): string[] =>
  order === 'desc' ? [...arr].sort().reverse() : [...arr].sort()

/** Sort array of primitives with optional order */
const sortArray = <T extends string | number>(arr: T[], order: Order = 'asc'): T[] =>
  order === 'desc'
    ? [...arr].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0))
    : [...arr].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

/** Sort array by multiple criteria */
const sortMultiple = <T>(
  arr: T[],
  criteria: Array<{ accessor: (item: T) => any; order: Order }>
): T[] => {
  return [...arr].sort((a, b) => {
    for (const { accessor, order } of criteria) {
      const aVal = accessor(a)
      const bVal = accessor(b)
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
    }
    return 0
  })
}

// ========================================
// JSON Core Operations
// ========================================

/**
 * Create JSON operations with custom configuration
 * @param {JSONConfig} [config={}] - JSON configuration options
 * @returns {JSONOperations} Configured JSON operations object
 *
 * @example Basic usage
 * ```typescript
 * const jsonOps = createJSONOperations()
 * const result = await jsonOps.parseFile('config.json')
 * ```
 *
 * @example With custom reviver
 * ```typescript
 * const jsonOps = createJSONOperations({
 *   reviver: (key, value) => {
 *     if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
 *       return new Date(value)
 *     }
 *     return value
 *   }
 * })
 * ```
 */
export const createJSONOperations: CreateJSONOperations = (config = {}) => {
  const jsonConfig = { ...defaultJSONConfig, ...config }

  const parseString = (data: string, options: JSONProcessingOptions = {}): DataResult<any> => {
    try {
      const mergedOptions = { ...jsonConfig, ...options }

      if (!data || data.trim().length === 0) {
        return err(createJSONError('Empty JSON data provided', {}))
      }

      let processedData = data

      // Handle trailing commas if allowed
      if (mergedOptions.allowTrailingCommas) {
        processedData = processedData.replace(/,(\s*[}\]])/g, '$1')
      }

      // Handle comments if allowed
      if (mergedOptions.allowComments) {
        // Remove single-line comments
        processedData = processedData.replace(/\/\/.*$/gm, '')
        // Remove multi-line comments
        processedData = processedData.replace(/\/\*[\s\S]*?\*\//g, '')
      }

      const parsed = JSON.parse(processedData, mergedOptions.reviver)
      return ok(parsed)
    } catch (error) {
      if (error instanceof SyntaxError) {
        return err(
          createParsingError('JSON parsing failed', {
            details: `Invalid JSON syntax: ${error.message}`,
            cause: error,
            context: { originalData: data.substring(0, 100) + '...' },
          })
        )
      }
      return err(mapLibraryError('JSON', 'parseString', error))
    }
  }

  const parseFile = async (
    filePath: string,
    options: JSONProcessingOptions = {}
  ): Promise<DataResult<any>> => {
    const fileResult = await readFile()(filePath)
    if (fileResult.isErr()) {
      return err(fileResult.error)
    }

    return parseString(fileResult.value, options)
  }

  const stringify = (data: any, options: JSONProcessingOptions = {}): DataResult<string> => {
    try {
      const mergedOptions = { ...jsonConfig, ...options }

      if (data === undefined) {
        return err(createJSONError('Cannot stringify undefined value', {}))
      }

      const jsonString = JSON.stringify(data, mergedOptions.replacer, mergedOptions.space)

      if (jsonString === undefined) {
        return err(
          createJSONError(
            'Stringify returned undefined - data contains non-serializable values',
            {}
          )
        )
      }

      return ok(jsonString)
    } catch (error) {
      if (error instanceof TypeError) {
        return err(
          createJSONError('JSON stringify failed', {
            details: `Cannot serialize data: ${error.message}`,
            cause: error,
          })
        )
      }
      return err(mapLibraryError('JSON', 'stringify', error))
    }
  }

  const writeFileOperation = async (
    data: any,
    filePath: string,
    options: JSONProcessingOptions = {}
  ): Promise<DataResult<void>> => {
    const stringifyResult = stringify(data, options)
    if (stringifyResult.isErr()) {
      return err(stringifyResult.error)
    }

    return await writeFile()(filePath, stringifyResult.value)
  }

  const validate = (data: string): DataResult<boolean> => {
    try {
      if (!data || data.trim().length === 0) {
        return ok(false)
      }

      JSON.parse(data)
      return ok(true)
    } catch {
      return ok(false)
    }
  }

  const minify = (data: string): DataResult<string> => {
    const parseResult = parseString(data)
    if (parseResult.isErr()) {
      return err(parseResult.error)
    }

    return stringify(parseResult.value)
  }

  const format = (data: string, options: JSONFormatOptions = {}): DataResult<string> => {
    const parseResult = parseString(data)
    if (parseResult.isErr()) {
      return err(parseResult.error)
    }

    let formatOptions: JSONProcessingOptions = {
      space: options.indent ?? 2,
    }

    if (options.sortKeys || options.sortArrays) {
      formatOptions = { ...formatOptions, replacer: createAdvancedReplacer(options) }
    }

    return stringify(parseResult.value, formatOptions)
  }

  return {
    parseString,
    parseFile,
    stringify,
    writeFile: writeFileOperation,
    validate,
    minify,
    format,
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Creates an advanced replacer function that handles sorting
 */
const createAdvancedReplacer = (options: JSONFormatOptions) => {
  return (key: string, value: any) => {
    // Handle object key sorting
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const sortedObject: Record<string, any> = {}
      let keys = Object.keys(value)

      if (options.sortKeys) {
        if (typeof options.sortKeys === 'function') {
          keys = keys.sort(options.sortKeys)
        } else if (options.sortKeys === 'desc') {
          keys = sortStrings(keys, 'desc')
        } else {
          // Default ascending sort
          keys = sortStrings(keys, 'asc')
        }
      }

      keys.forEach((sortedKey) => {
        sortedObject[sortedKey] = value[sortedKey]
      })
      return sortedObject
    }

    // Handle array sorting
    if (Array.isArray(value) && options.sortArrays) {
      if (typeof options.sortArrays === 'function') {
        return [...value].sort(options.sortArrays)
      } else {
        // Default sort for arrays of primitives
        if (value.every((item) => typeof item === 'string' || typeof item === 'number')) {
          return sortArray(value)
        }
      }
    }

    return value
  }
}

/**
 * Sort an array of objects by multiple fields
 */
export const sortJSONArray = <T>(
  array: T[],
  sortFields: Array<{
    field: keyof T | ((item: T) => any)
    order?: 'asc' | 'desc'
  }>
): DataResult<T[]> => {
  try {
    // Validate inputs
    if (!Array.isArray(array)) {
      return err(
        createJSONError('Invalid input for sorting. Expected an array', {
          details: 'Expected an array but received ' + typeof array,
          context: { providedType: typeof array },
        })
      )
    }

    if (!sortFields || sortFields.length === 0) {
      return err(
        createJSONError('No sort fields specified', {
          details: 'At least one sort field must be provided',
          context: { sortFields },
        })
      )
    }

    const accessors = sortFields.map(({ field }, index) => {
      if (typeof field === 'function') {
        return field
      } else if (typeof field === 'string' || typeof field === 'symbol') {
        return (item: T) => {
          if (item === null || item === undefined) {
            console.warn(`Warning: Cannot access field '${String(field)}' on null/undefined item`)
            return undefined
          }
          return item[field]
        }
      } else {
        throw new Error(
          `Invalid sort field at index ${index}: expected string, symbol, or function`
        )
      }
    })

    // Use our sort package's multi-field sort
    const sortCriteria = sortFields.map(({ order }, index) => ({
      accessor: accessors[index],
      order: order || 'asc',
    }))

    const sorted = sortMultiple(array, sortCriteria)

    return ok(sorted)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isFieldError = errorMessage.includes('Invalid sort field')
    return err(
      createJSONError(
        isFieldError
          ? 'Failed to sort JSON array. Invalid sort field'
          : 'Failed to sort JSON array',
        {
          details: errorMessage,
          cause: error,
          context: {
            arrayLength: array.length,
            sortFieldCount: sortFields.length,
            sortFields: sortFields.map(({ field, order }) => ({
              fieldType: typeof field,
              order: order || 'asc',
            })),
          },
        }
      )
    )
  }
}

/**
 * Extract and sort unique values from a JSON array
 */
export const extractUniqueSorted = <T>(
  array: T[],
  accessor?: (item: T) => any,
  order: 'asc' | 'desc' = 'asc'
): DataResult<any[]> => {
  try {
    // Validate inputs
    if (!Array.isArray(array)) {
      return err(
        createJSONError('Invalid input for unique extraction. Expected an array', {
          details: 'Expected an array but received ' + typeof array,
          context: { providedType: typeof array },
        })
      )
    }

    if (order !== 'asc' && order !== 'desc') {
      return err(
        createJSONError(`Invalid sort order. Expected 'asc' or 'desc'`, {
          details: `Expected 'asc' or 'desc' but received '${order}'`,
          context: { providedOrder: order },
        })
      )
    }

    // Extract values with error handling for accessor
    let values: any[]
    let failureCount = 0

    try {
      values = accessor
        ? array.map((item, index) => {
            try {
              return accessor(item)
            } catch (accessorError) {
              console.warn(`Warning: Accessor failed for item at index ${index}:`, accessorError)
              failureCount++
              return undefined
            }
          })
        : array
    } catch (mappingError) {
      return err(
        createJSONError('Failed to extract values using accessor', {
          details:
            mappingError instanceof Error
              ? mappingError.message
              : 'Accessor function threw an error',
          cause: mappingError,
          context: { arrayLength: array.length, hasAccessor: !!accessor },
        })
      )
    }

    // If accessor failed for all items, treat as complete failure
    if (accessor && failureCount === array.length && array.length > 0) {
      return err(
        createJSONError('Failed to extract values using accessor', {
          details: 'Accessor function failed for all items',
          context: { arrayLength: array.length, hasAccessor: !!accessor },
        })
      )
    }

    // Filter out undefined values from failed accessor calls
    const validValues = values.filter((v) => v !== undefined)
    if (validValues.length < values.length) {
      console.warn(
        `Note: ${values.length - validValues.length} items were excluded due to accessor failures`
      )
    }

    const unique = [...new Set(validValues)]
    const sorted = sortArray(unique, order)

    return ok(sorted)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return err(
      createJSONError('Failed to extract unique sorted values', {
        details: errorMessage,
        cause: error,
        context: {
          arrayLength: array.length,
          hasAccessor: !!accessor,
          sortOrder: order,
        },
      })
    )
  }
}
