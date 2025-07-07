import { cosmiconfig, cosmiconfigSync } from 'cosmiconfig';
import type { z } from 'zod';
import { Ok, Err } from '../core/errors/index.js';
import type { Result } from '../core/errors/index.js';
import type {
  ConfigSchema,
  LoadOptions,
  SchemaConfigOptions,
} from './types.js';

export function defineConfig<T>(
  schema: z.ZodSchema<T>,
  options: SchemaConfigOptions = {},
): ConfigSchema<T> {
  const config = {
    schema,
    options,

    async load(loadOptions: LoadOptions = {}): Promise<Result<T>> {
      return loadConfigAsync(schema, { ...options, ...loadOptions });
    },

    loadSync(loadOptions: LoadOptions = {}): Result<T> {
      return loadConfigSyncImpl(schema, { ...options, ...loadOptions });
    },

    merge(configs: Partial<T>[]): Result<T> {
      return mergeConfigs(schema, configs);
    },

    validate(config: unknown): Result<T> {
      return validateConfig(schema, config);
    },
  };

  return config;
}

export async function loadConfig<T>(
  schema: z.ZodSchema<T>,
  options: LoadOptions = {},
): Promise<Result<T>> {
  return loadConfigAsync(schema, options);
}

export function loadConfigSync<T>(
  schema: z.ZodSchema<T>,
  options: LoadOptions = {},
): Result<T> {
  return loadConfigSyncImpl(schema, options);
}

/**
 * Async configuration loading implementation
 */
async function loadConfigAsync<T>(
  schema: z.ZodSchema<T>,
  options: LoadOptions = {},
): Promise<Result<T>> {
  const explorer = cosmiconfig(options.name ?? 'config', {
    searchPlaces: createSearchPlaces(options.name ?? 'config'),
    ignoreEmptySearchPlaces: false,
    ...options.cosmiconfigOptions,
  });

  try {
    const result = await explorer.search(options.searchFrom);
    return processConfigResult(schema, result, options);
  } catch (error) {
    return Err({
      code: 'CONFIG_LOAD_ERROR',
      message: `Failed to load configuration: ${(error as Error).message}`,
      recoverable: false,
    });
  }
}

/**
 * Sync configuration loading implementation
 */
function loadConfigSyncImpl<T>(
  schema: z.ZodSchema<T>,
  options: LoadOptions = {},
): Result<T> {
  const cosmiconfigOptions = options.cosmiconfigOptions || {};
  const { transform: _transform, ...syncOptions } = cosmiconfigOptions;
  const explorer = cosmiconfigSync(options.name ?? 'config', {
    searchPlaces: createSearchPlaces(options.name ?? 'config'),
    ignoreEmptySearchPlaces: false,
    ...syncOptions,
  });

  try {
    const result = explorer.search(options.searchFrom);
    return processConfigResultSync(schema, result, options);
  } catch (error) {
    return Err({
      code: 'CONFIG_LOAD_ERROR',
      message: `Failed to load configuration: ${(error as Error).message}`,
      recoverable: false,
    });
  }
}

/**
 * Create search places array for cosmiconfig
 */
function createSearchPlaces(name: string): string[] {
  return [
    'package.json',
    `.${name}rc`,
    `.${name}rc.json`,
    `.${name}rc.js`,
    `.${name}rc.ts`,
    `.${name}rc.mjs`,
    `.${name}rc.cjs`,
    `.${name}rc.yaml`,
    `.${name}rc.yml`,
    `${name}.config.js`,
    `${name}.config.ts`,
    `${name}.config.mjs`,
    `${name}.config.cjs`,
    `${name}.config.json`,
  ];
}

/**
 * Process cosmiconfig result for async loading
 */
function processConfigResult<T>(
  schema: z.ZodSchema<T>,
  result: any,
  options: LoadOptions,
): Result<T> {
  if (!result || result.isEmpty) {
    return handleNoConfig(schema, options);
  }

  return validateAndMergeConfig(schema, result.config, options);
}

/**
 * Process cosmiconfig result for sync loading
 */
function processConfigResultSync<T>(
  schema: z.ZodSchema<T>,
  result: any,
  options: LoadOptions,
): Result<T> {
  if (!result || result.isEmpty) {
    return handleNoConfig(schema, options);
  }

  return validateAndMergeConfig(schema, result.config, options);
}

/**
 * Handle case when no configuration file is found
 */
function handleNoConfig<T>(
  schema: z.ZodSchema<T>,
  options: LoadOptions,
): Result<T> {
  const defaultConfig = options.defaults || {};
  const parsed = schema.safeParse(defaultConfig);

  if (!parsed.success) {
    return Err({
      code: 'CONFIG_VALIDATION_ERROR',
      message: `Invalid default configuration: ${parsed.error.message}`,
      recoverable: false,
    });
  }

  return Ok(parsed.data);
}

/**
 * Validate configuration and merge with defaults
 */
function validateAndMergeConfig<T>(
  schema: z.ZodSchema<T>,
  config: unknown,
  options: LoadOptions,
): Result<T> {
  // Merge with defaults if provided
  const mergedConfig = options.defaults
    ? { ...options.defaults, ...(config as Record<string, unknown>) }
    : config;

  const parsed = schema.safeParse(mergedConfig);
  if (!parsed.success) {
    return Err({
      code: 'CONFIG_VALIDATION_ERROR',
      message: `Invalid configuration: ${formatZodError(parsed.error)}`,
      recoverable: false,
    });
  }

  return Ok(parsed.data);
}

/**
 * Validate configuration against schema
 */
function validateConfig<T>(schema: z.ZodSchema<T>, config: unknown): Result<T> {
  const parsed = schema.safeParse(config);
  if (!parsed.success) {
    return Err({
      code: 'CONFIG_VALIDATION_ERROR',
      message: `Invalid configuration: ${formatZodError(parsed.error)}`,
      recoverable: false,
    });
  }
  return Ok(parsed.data);
}

/**
 * Merge multiple configuration objects
 */
function mergeConfigs<T>(
  schema: z.ZodSchema<T>,
  configs: Partial<T>[],
): Result<T> {
  const merged = configs.reduce((acc, config) => ({ ...acc, ...config }), {});
  return validateConfig(schema, merged);
}

/**
 * Format Zod validation errors for user-friendly display
 */
function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    })
    .join(', ');
}
