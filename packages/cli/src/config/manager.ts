import { Ok, Err, type Result } from '../core/index.js';
import type {
  ConfigurationManager,
  ConfigSchema,
  LoadOptions,
} from './types.js';

/**
 * Create a configuration manager for handling multiple schemas
 */
export function createConfigurationManager(): ConfigurationManager {
  const schemas = new Map<string, ConfigSchema<any>>();
  const cache = new Map<string, unknown>();

  return {
    register: <T>(name: string, schema: ConfigSchema<T>) => {
      schemas.set(name, schema);
    },

    load: async <T>(
      name: string,
      options: LoadOptions = {},
    ): Promise<Result<T>> => {
      const schema = schemas.get(name);
      if (!schema) {
        return Err({
          code: 'CONFIG_NOT_FOUND',
          message: `Configuration schema '${name}' not found`,
          recoverable: false,
        });
      }

      try {
        // Check cache first if enabled
        if (schema.options.cache && cache.has(name)) {
          return Ok(cache.get(name) as T);
        }

        const result = await schema.load({ name, ...options });

        if (result.success && schema.options.cache) {
          cache.set(name, result.value);
        }

        return result;
      } catch (error) {
        return Err({
          code: 'CONFIG_LOAD_ERROR',
          message: `Failed to load configuration '${name}': ${(error as Error).message}`,
          recoverable: false,
        });
      }
    },

    loadSync: <T>(name: string, options: LoadOptions = {}): Result<T> => {
      const schema = schemas.get(name);
      if (!schema) {
        return Err({
          code: 'CONFIG_NOT_FOUND',
          message: `Configuration schema '${name}' not found`,
          recoverable: false,
        });
      }

      try {
        // Check cache first if enabled
        if (schema.options.cache && cache.has(name)) {
          return Ok(cache.get(name) as T);
        }

        const result = schema.loadSync({ name, ...options });

        if (result.success && schema.options.cache) {
          cache.set(name, result.value);
        }

        return result;
      } catch (error) {
        return Err({
          code: 'CONFIG_LOAD_ERROR',
          message: `Failed to load configuration '${name}': ${(error as Error).message}`,
          recoverable: false,
        });
      }
    },

    loadAll: async (
      options: LoadOptions = {},
    ): Promise<Result<Record<string, unknown>>> => {
      const results: Record<string, unknown> = {};
      const errors: string[] = [];

      for (const [name, schema] of schemas) {
        try {
          const result = await schema.load({ name, ...options });
          if (result.success) {
            results[name] = result.value;
          } else {
            errors.push(`${name}: ${result.error.message}`);
          }
        } catch (error) {
          errors.push(`${name}: ${(error as Error).message}`);
        }
      }

      if (errors.length > 0) {
        return Err({
          code: 'CONFIG_LOAD_MULTIPLE_ERRORS',
          message: `Failed to load some configurations: ${errors.join(', ')}`,
          recoverable: true,
        });
      }

      return Ok(results);
    },

    loadAllSync: (
      options: LoadOptions = {},
    ): Result<Record<string, unknown>> => {
      const results: Record<string, unknown> = {};
      const errors: string[] = [];

      for (const [name, schema] of schemas) {
        try {
          const result = schema.loadSync({ name, ...options });
          if (result.success) {
            results[name] = result.value;
          } else {
            errors.push(`${name}: ${result.error.message}`);
          }
        } catch (error) {
          errors.push(`${name}: ${(error as Error).message}`);
        }
      }

      if (errors.length > 0) {
        return Err({
          code: 'CONFIG_LOAD_MULTIPLE_ERRORS',
          message: `Failed to load some configurations: ${errors.join(', ')}`,
          recoverable: true,
        });
      }

      return Ok(results);
    },

    getSchema: <T>(name: string): ConfigSchema<T> | undefined => {
      return schemas.get(name) as ConfigSchema<T> | undefined;
    },

    clearCache: () => {
      cache.clear();
    },
  };
}

/**
 * Global configuration manager instance
 */
let globalManager: ConfigurationManager | undefined;

/**
 * Get or create global configuration manager
 */
export function getGlobalConfigManager(): ConfigurationManager {
  if (!globalManager) {
    globalManager = createConfigurationManager();
  }
  return globalManager;
}

/**
 * Register configuration schema globally
 */
export function registerGlobalConfig<T>(
  name: string,
  schema: ConfigSchema<T>,
): void {
  const manager = getGlobalConfigManager();
  manager.register(name, schema);
}

/**
 * Load configuration from global manager
 */
export async function loadGlobalConfig<T>(
  name: string,
  options: LoadOptions = {},
): Promise<Result<T>> {
  const manager = getGlobalConfigManager();
  return manager.load<T>(name, options);
}

/**
 * Load configuration from global manager synchronously
 */
export function loadGlobalConfigSync<T>(
  name: string,
  options: LoadOptions = {},
): Result<T> {
  const manager = getGlobalConfigManager();
  return manager.loadSync<T>(name, options);
}
