/**
 * Filter out undefined values from an object
 * This prevents undefined values from overriding defaults when spreading
 * @param obj - Object to filter
 * @returns New object with undefined values removed
 * @example
 * ```typescript
 * const options = { name: 'test', value: undefined, count: 0 };
 * const filtered = filterUndefined(options); // { name: 'test', count: 0 }
 * ```
 */
export function filterUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key as keyof T] = value;
    }
  }

  return result;
}

/**
 * Merge options with defaults, ignoring undefined values
 * Undefined values in options will not override defaults
 * @param defaults - Default configuration object
 * @param options - User-provided options (may contain undefined values)
 * @returns Merged configuration with defaults preserved
 * @example
 * ```typescript
 * const defaults = { host: 'localhost', port: 3000, debug: false };
 * const options = { port: 8080, debug: undefined };
 * const config = mergeOptionsWithDefaults(defaults, options);
 * // Result: { host: 'localhost', port: 8080, debug: false }
 * ```
 */
export function mergeOptionsWithDefaults<T extends Record<string, any>>(
  defaults: T,
  options: Partial<T>
): T {
  const filteredOptions = filterUndefined(options);
  return { ...defaults, ...filteredOptions };
}

/**
 * Type-safe option coercion based on expected type
 * @param value - Value to coerce
 * @param type - Target type for coercion
 * @returns Coerced value or original value if coercion fails
 * @example
 * ```typescript
 * coerceOptionType('123', 'number'); // 123
 * coerceOptionType('true', 'boolean'); // true
 * coerceOptionType(42, 'string'); // '42'
 * coerceOptionType('invalid', 'number'); // 'invalid' (unchanged)
 * ```
 */
export function coerceOptionType(value: any, type: 'string' | 'number' | 'boolean'): any {
  if (value === undefined || value === null) {
    return value;
  }

  switch (type) {
    case 'string':
      return String(value);

    case 'number': {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }

    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return Boolean(value);

    default:
      return value;
  }
}

/**
 * Process command options with type coercion and filtering
 * @param rawOptions - Raw options from command line
 * @param optionDefinitions - Optional type definitions for options
 * @returns Processed options with type coercion applied and undefined values filtered
 * @example
 * ```typescript
 * const rawOptions = { port: '3000', verbose: 'true', debug: undefined };
 * const definitions = [
 *   { name: 'port', type: 'number' as const },
 *   { name: 'verbose', type: 'boolean' as const }
 * ];
 * const processed = processCommandOptions(rawOptions, definitions);
 * // Result: { port: 3000, verbose: true }
 * ```
 */
export function processCommandOptions<T extends Record<string, any>>(
  rawOptions: Record<string, any>,
  optionDefinitions?: Array<{
    name: string;
    type?: 'string' | 'number' | 'boolean';
  }>
): T {
  const processed: Record<string, any> = {};

  // First, copy all defined options with type coercion
  if (optionDefinitions) {
    for (const def of optionDefinitions) {
      if (def.name in rawOptions) {
        const value = rawOptions[def.name];
        if (value !== undefined) {
          processed[def.name] = def.type ? coerceOptionType(value, def.type) : value;
        }
      }
    }
  }

  // Then copy any additional options that weren't defined
  for (const [key, value] of Object.entries(rawOptions)) {
    if (!(key in processed) && value !== undefined) {
      processed[key] = value;
    }
  }

  return processed as T;
}
