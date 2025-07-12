import { cosmiconfig, cosmiconfigSync } from 'cosmiconfig';
import type { z } from 'zod';
// Use local types for this legacy config implementation
type CreateConfigOptions<T> = {
  name: string;
  schema?: any;
  defaults?: T;
  searchPlaces?: string[];
};

type ConfigLoader<T> = {
  load: (searchFrom?: string) => Promise<ConfigLoadResult<T>>;
  loadSync: (searchFrom?: string) => ConfigLoadResult<T>;
  clearCache: () => void;
};

type ConfigLoadResult<T> = {
  config: T;
  filepath?: string;
};

/**
 * Create a simplified configuration loader
 */
export function createConfig<T>(options: CreateConfigOptions<T>): ConfigLoader<T> {
  const { name, schema, defaults, searchPlaces } = options;

  // Create default search places if not provided
  // Order matters: most specific files first
  const defaultSearchPlaces = [
    `${name}.config.js`,
    `${name}.config.cjs`,
    `.${name}rc.js`,
    `.${name}rc.cjs`,
    `.${name}rc.json`,
    `.${name}rc.yaml`,
    `.${name}rc.yml`,
    `.${name}rc`,
    'package.json',
  ];

  const finalSearchPlaces = searchPlaces || defaultSearchPlaces;

  return {
    async load(searchFrom?: string): Promise<ConfigLoadResult<T>> {
      const explorer = cosmiconfig(name, {
        searchPlaces: finalSearchPlaces,
        ignoreEmptySearchPlaces: false,
      });

      try {
        const result = await explorer.search(searchFrom);
        return processResult(result, schema, defaults);
      } catch (error) {
        throw new Error(
          `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },

    loadSync(searchFrom?: string): ConfigLoadResult<T> {
      const explorer = cosmiconfigSync(name, {
        searchPlaces: finalSearchPlaces,
        ignoreEmptySearchPlaces: false,
      });

      try {
        const result = explorer.search(searchFrom);
        return processResult(result, schema, defaults);
      } catch (error) {
        throw new Error(
          `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },

    clearCache(): void {
      cosmiconfig(name).clearCaches();
      cosmiconfigSync(name).clearCaches();
    },
  };
}

/**
 * Process cosmiconfig result into our standard format
 */
function processResult<T>(result: any, schema: z.ZodSchema<T>, defaults?: T): ConfigLoadResult<T> {
  // No config found - use defaults
  if (!result || result.isEmpty) {
    if (!defaults) {
      throw new Error('No configuration found and no defaults provided');
    }

    // Validate defaults against schema
    const validatedDefaults = schema.parse(defaults);

    return {
      config: validatedDefaults,
      filepath: undefined,
    };
  }

  // Config found - validate and merge with defaults
  const validatedConfig = schema.parse(result.config);

  const finalConfig = defaults ? mergeWithDefaults(defaults, validatedConfig) : validatedConfig;

  const _source = result.filepath?.endsWith('package.json') ? 'package.json' : 'file';

  return {
    config: finalConfig,
    filepath: result.filepath,
  };
}

/**
 * Deep merge defaults with user configuration (user config takes precedence)
 */
function mergeWithDefaults<T>(defaults: T, userConfig: T): T {
  if (typeof defaults !== 'object' || defaults === null) {
    return userConfig as T;
  }

  if (typeof userConfig !== 'object' || userConfig === null) {
    return defaults;
  }

  // Start with defaults and override with user values
  const result = { ...defaults };

  for (const key in userConfig) {
    if (Object.prototype.hasOwnProperty.call(userConfig, key)) {
      const userValue = userConfig[key];
      const defaultValue = (defaults as any)[key];

      if (
        typeof defaultValue === 'object' &&
        defaultValue !== null &&
        !Array.isArray(defaultValue) &&
        typeof userValue === 'object' &&
        userValue !== null &&
        !Array.isArray(userValue)
      ) {
        // Recursively merge objects
        (result as any)[key] = mergeWithDefaults(defaultValue, userValue);
      } else {
        // Override with user value (user config takes precedence)
        (result as any)[key] = userValue;
      }
    }
  }

  return result;
}
