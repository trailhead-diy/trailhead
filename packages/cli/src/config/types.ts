import type { z } from 'zod';

/**
 * Configuration load result with file path information
 */
export interface ConfigLoadResult<T> {
  /** The validated configuration object merged with defaults */
  readonly config: T;
  /** Path to the configuration file that was found, or null if using defaults */
  readonly filepath: string | null;
  /** Source of the configuration */
  readonly source: 'file' | 'package.json' | 'defaults';
}

/**
 * Configuration creation options
 */
export interface CreateConfigOptions<T> {
  /** Configuration name (used for file discovery) */
  name: string;
  /** Zod schema for validation */
  schema: z.ZodSchema<T>;
  /** Default configuration values */
  defaults?: T;
  /** Custom search places for configuration files */
  searchPlaces?: string[];
}

/**
 * Configuration loader interface
 */
export interface ConfigLoader<T> {
  /** Load configuration asynchronously */
  load: (searchFrom?: string) => Promise<ConfigLoadResult<T>>;
  /** Load configuration synchronously */
  loadSync: (searchFrom?: string) => ConfigLoadResult<T>;
  /** Clear configuration cache */
  clearCache: () => void;
}
