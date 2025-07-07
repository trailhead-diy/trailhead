import type { z } from 'zod';
import type { Options as CosmiconfigOptions } from 'cosmiconfig';
import type { Result } from '../core/errors/index.js';

/**
 * Enhanced configuration schema with additional capabilities
 */
export interface ConfigSchema<T = any> {
  /** Zod schema for validation */
  schema: z.ZodSchema<T>;
  /** Schema configuration options */
  options: SchemaConfigOptions;
  /** Load configuration asynchronously */
  load: (options?: LoadOptions) => Promise<Result<T>>;
  /** Load configuration synchronously */
  loadSync: (options?: LoadOptions) => Result<T>;
  /** Merge multiple configuration objects */
  merge: (configs: Partial<T>[]) => Result<T>;
  /** Validate configuration against schema */
  validate: (config: unknown) => Result<T>;
}

/**
 * Schema configuration options
 */
export interface SchemaConfigOptions {
  /** Enable configuration caching */
  cache?: boolean;
  /** Configuration file discovery timeout */
  timeout?: number;
  /** Whether to merge with defaults */
  mergeDefaults?: boolean;
}

/**
 * Configuration loading options
 */
export interface LoadOptions {
  /** Directory to start searching from */
  searchFrom?: string;
  /** Configuration name (used for file discovery) */
  name?: string;
  /** Default configuration values */
  defaults?: Record<string, unknown>;
  /** Cosmiconfig options */
  cosmiconfigOptions?: Partial<CosmiconfigOptions>;
}

/**
 * Configuration manager for handling multiple configurations
 */
export interface ConfigurationManager {
  /** Register a configuration schema */
  register: <T>(name: string, schema: ConfigSchema<T>) => void;
  /** Load specific configuration by name */
  load: <T>(name: string, options?: LoadOptions) => Promise<Result<T>>;
  /** Load all registered configurations */
  loadAll: (options?: LoadOptions) => Promise<Result<Record<string, unknown>>>;
  /** Get registered schema by name */
  getSchema: <T>(name: string) => ConfigSchema<T> | undefined;
  /** Clear configuration cache */
  clearCache: () => void;
}
