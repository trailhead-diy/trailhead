/**
 * Web-UI CLI configuration using simplified @esteban-url/trailhead-cli config system
 */

import { createConfig, z, type ConfigLoadResult } from '@esteban-url/trailhead-cli/config';

// Schema definitions
export const transformConfigSchema = z.object({
  enabled: z.boolean().optional(),
  srcDir: z.string().optional(),
  excludePatterns: z.array(z.string()).optional(),
  enabledTransforms: z.array(z.string()).optional(),
  disabledTransforms: z.array(z.string()).optional(),
});

export const installConfigSchema = z.object({
  destDir: z.string().optional(),
  wrappers: z.boolean().optional(),
});

export const devRefreshConfigSchema = z.object({
  srcDir: z.string().optional(),
  destDir: z.string().optional(),
  prefix: z.string().optional(),
});

/**
 * Main configuration schema for Trailhead UI
 */
export const trailheadConfigSchema = z.object({
  $schema: z.string().optional(),
  install: installConfigSchema.optional(),
  transforms: transformConfigSchema.optional(),
  devRefresh: devRefreshConfigSchema.optional(),
  verbose: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

/**
 * Inferred type from schema
 */
export type TrailheadConfigInput = z.infer<typeof trailheadConfigSchema>;

/**
 * Final configuration types (with required defaults applied)
 */
export interface TransformConfig {
  enabled?: boolean;
  srcDir?: string;
  excludePatterns?: string[];
  enabledTransforms?: string[];
  disabledTransforms?: string[];
}

export interface InstallationConfig {
  destDir?: string;
  wrappers?: boolean;
}

export interface DevRefreshConfig {
  srcDir?: string;
  destDir?: string;
  prefix?: string;
}

export interface TrailheadConfig {
  $schema?: string;
  install?: InstallationConfig;
  transforms?: TransformConfig;
  devRefresh?: DevRefreshConfig;
  verbose?: boolean;
  dryRun?: boolean;
}

/**
 * Default configuration values
 */
const defaultConfig: TrailheadConfig = {
  install: {
    wrappers: true,
  },
  transforms: {
    enabled: true,
    excludePatterns: [],
    disabledTransforms: [],
  },
  devRefresh: {
    prefix: 'catalyst-',
  },
  verbose: false,
  dryRun: false,
};

/**
 * Configuration search places for CLI framework config system
 * Order matters: most specific files first
 */
const SEARCH_PLACES = [
  'trailhead.config.js',
  'trailhead.config.cjs',
  '.trailheadrc.js',
  '.trailheadrc.cjs',
  '.trailheadrc.json',
  '.trailheadrc.yaml',
  '.trailheadrc.yml',
  '.trailheadrc',
  'package.json',
];

/**
 * Web-UI configuration loader instance
 */
const configLoader = createConfig({
  name: 'trailhead',
  schema: trailheadConfigSchema,
  defaults: defaultConfig,
  searchPlaces: SEARCH_PLACES,
});

/**
 * Load configuration synchronously with file path info
 */
export function loadConfigSync(startPath?: string): ConfigLoadResult<TrailheadConfig> {
  const result = configLoader.loadSync(startPath);

  // CLI framework already handles validation and merging with defaults
  // Just need to determine source and return in the expected format
  let source: 'file' | 'package.json' | 'defaults' = 'defaults';
  if (result.filepath) {
    source = result.filepath.endsWith('package.json') ? 'package.json' : 'file';
  }

  return {
    config: result.config,
    filepath: result.filepath,
    source,
  };
}

/**
 * Load configuration asynchronously with file path info
 */
export async function loadConfig(startPath?: string): Promise<ConfigLoadResult<TrailheadConfig>> {
  const result = await configLoader.load(startPath);

  // CLI framework already handles validation and merging with defaults
  // Just need to determine source and return in the expected format
  let source: 'file' | 'package.json' | 'defaults' = 'defaults';
  if (result.filepath) {
    source = result.filepath.endsWith('package.json') ? 'package.json' : 'file';
  }

  return {
    config: result.config,
    filepath: result.filepath,
    source,
  };
}

/**
 * Clear configuration cache
 */
export function clearConfigCache(): void {
  configLoader.clearCache();
}

/**
 * Log configuration discovery details with enhanced info
 */
export function logConfigDiscovery(
  filepath: string | null,
  config: TrailheadConfig,
  verbose: boolean = false,
  source: 'file' | 'package.json' | 'defaults' = 'defaults'
): void {
  if (!verbose) return;

  console.log('\n📋 Configuration Discovery:');
  console.log(`   Source: ${source}`);
  if (filepath) {
    console.log(`   File: ${filepath}`);
  } else {
    console.log('   File: Using defaults (no config file found)');
  }

  console.log('\n⚙️  Configuration Values:');
  console.log(`   Verbose: ${config.verbose}`);
  console.log(`   Dry Run: ${config.dryRun}`);

  if (config.install) {
    console.log(`   Install Wrappers: ${config.install.wrappers}`);
    if (config.install.destDir) {
      console.log(`   Install Destination: ${config.install.destDir}`);
    }
  }

  if (config.transforms) {
    console.log(`   Transforms Enabled: ${config.transforms.enabled}`);
    if (config.transforms.srcDir) {
      console.log(`   Transform Source: ${config.transforms.srcDir}`);
    }
    if (config.transforms.excludePatterns?.length) {
      console.log(`   Exclude Patterns: ${config.transforms.excludePatterns.join(', ')}`);
    }
  }

  if (config.devRefresh) {
    console.log(`   Dev Refresh Prefix: ${config.devRefresh.prefix}`);
  }

  console.log('');
}
