/**
 * Pre-built configuration templates for common use cases
 */

import { z } from 'zod';
import type { CreateConfigOptions } from './types.js';

/**
 * Data processing configuration template
 */
export const dataProcessingTemplate = {
  name: 'data-processing',
  schema: z.object({
    input: z
      .object({
        format: z.enum(['csv', 'json', 'yaml', 'xml']).default('csv'),
        encoding: z.string().default('utf8'),
        batchSize: z.number().min(1).default(1000),
        skipEmptyLines: z.boolean().default(true),
        headers: z.boolean().default(true),
      })
      .default({}),
    output: z
      .object({
        format: z.enum(['csv', 'json', 'yaml', 'xml']).default('json'),
        encoding: z.string().default('utf8'),
        pretty: z.boolean().default(true),
        indent: z.number().min(0).default(2),
      })
      .default({}),
    validation: z
      .object({
        strict: z.boolean().default(false),
        skipErrors: z.boolean().default(false),
        maxErrors: z.number().min(0).default(100),
      })
      .default({}),
    performance: z
      .object({
        parallel: z.boolean().default(true),
        maxConcurrency: z.number().min(1).default(4),
        memoryLimit: z.string().default('512MB'),
      })
      .default({}),
  }),
  defaults: {
    input: {
      format: 'csv' as const,
      encoding: 'utf8',
      batchSize: 1000,
      skipEmptyLines: true,
      headers: true,
    },
    output: {
      format: 'json' as const,
      encoding: 'utf8',
      pretty: true,
      indent: 2,
    },
    validation: {
      strict: false,
      skipErrors: false,
      maxErrors: 100,
    },
    performance: {
      parallel: true,
      maxConcurrency: 4,
      memoryLimit: '512MB',
    },
  },
} satisfies CreateConfigOptions<any>;

/**
 * CLI application configuration template
 */
export const cliAppTemplate = {
  name: 'cli-app',
  schema: z.object({
    app: z.object({
      name: z.string(),
      version: z.string().default('1.0.0'),
      description: z.string().optional(),
    }),
    commands: z.object({
      defaultCommand: z.string().optional(),
      helpCommand: z.boolean().default(true),
      versionCommand: z.boolean().default(true),
    }),
    output: z.object({
      colors: z.boolean().default(true),
      verbose: z.boolean().default(false),
      quiet: z.boolean().default(false),
      format: z.enum(['text', 'json', 'yaml']).default('text'),
    }),
    logging: z.object({
      level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
      file: z.string().optional(),
      timestamp: z.boolean().default(true),
    }),
  }),
  defaults: {
    app: {
      name: 'cli-app',
      version: '1.0.0',
    },
    commands: {
      helpCommand: true,
      versionCommand: true,
    },
    output: {
      colors: true,
      verbose: false,
      quiet: false,
      format: 'text' as const,
    },
    logging: {
      level: 'info' as const,
      timestamp: true,
    },
  },
} satisfies CreateConfigOptions<any>;

/**
 * File watcher configuration template
 */
export const fileWatcherTemplate = {
  name: 'file-watcher',
  schema: z.object({
    watch: z.object({
      paths: z.array(z.string()).default(['src/**/*']),
      ignored: z.array(z.string()).default(['**/node_modules/**', '**/dist/**']),
      ignoreInitial: z.boolean().default(true),
      followSymlinks: z.boolean().default(true),
    }),
    events: z.object({
      debounce: z.number().min(0).default(100),
      throttle: z.number().min(0).default(200),
      batchEvents: z.boolean().default(false),
      maxBatchSize: z.number().min(1).default(50),
    }),
    actions: z.object({
      build: z.boolean().default(true),
      test: z.boolean().default(false),
      lint: z.boolean().default(false),
      restart: z.boolean().default(false),
    }),
    notifications: z.object({
      enabled: z.boolean().default(true),
      success: z.boolean().default(true),
      error: z.boolean().default(true),
    }),
  }),
  defaults: {
    watch: {
      paths: ['src/**/*'],
      ignored: ['**/node_modules/**', '**/dist/**'],
      ignoreInitial: true,
      followSymlinks: true,
    },
    events: {
      debounce: 100,
      throttle: 200,
      batchEvents: false,
      maxBatchSize: 50,
    },
    actions: {
      build: true,
      test: false,
      lint: false,
      restart: false,
    },
    notifications: {
      enabled: true,
      success: true,
      error: true,
    },
  },
} satisfies CreateConfigOptions<any>;

/**
 * API client configuration template
 */
export const apiClientTemplate = {
  name: 'api-client',
  schema: z.object({
    api: z.object({
      baseURL: z.string().url(),
      timeout: z.number().min(0).default(30000),
      retries: z.number().min(0).default(3),
      retryDelay: z.number().min(0).default(1000),
    }),
    auth: z.object({
      type: z.enum(['none', 'bearer', 'basic', 'apikey']).default('none'),
      token: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      apiKey: z.string().optional(),
      apiKeyHeader: z.string().default('X-API-Key'),
    }),
    request: z.object({
      headers: z.record(z.string()).default({}),
      userAgent: z.string().optional(),
      followRedirects: z.boolean().default(true),
      maxRedirects: z.number().min(0).default(5),
    }),
    response: z.object({
      validateStatus: z.boolean().default(true),
      parseJSON: z.boolean().default(true),
      errorOnFailure: z.boolean().default(true),
    }),
  }),
  defaults: {
    api: {
      baseURL: 'https://api.example.com',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
    },
    auth: {
      type: 'none' as const,
      apiKeyHeader: 'X-API-Key',
    },
    request: {
      headers: {},
      followRedirects: true,
      maxRedirects: 5,
    },
    response: {
      validateStatus: true,
      parseJSON: true,
      errorOnFailure: true,
    },
  },
} satisfies CreateConfigOptions<any>;

/**
 * Build tool configuration template
 */
export const buildToolTemplate = {
  name: 'build-tool',
  schema: z.object({
    build: z.object({
      entry: z.string().default('src/index.ts'),
      outDir: z.string().default('dist'),
      target: z
        .enum(['es5', 'es2015', 'es2017', 'es2018', 'es2019', 'es2020', 'esnext'])
        .default('es2020'),
      format: z.enum(['cjs', 'esm', 'umd', 'iife']).default('esm'),
      minify: z.boolean().default(false),
      sourcemap: z.boolean().default(true),
    }),
    watch: z.object({
      enabled: z.boolean().default(false),
      include: z.array(z.string()).default(['src/**/*']),
      exclude: z.array(z.string()).default(['**/*.test.*', '**/*.spec.*']),
    }),
    typescript: z.object({
      enabled: z.boolean().default(true),
      configPath: z.string().default('tsconfig.json'),
      declaration: z.boolean().default(true),
      declarationMap: z.boolean().default(true),
    }),
    plugins: z.object({
      terser: z.boolean().default(false),
      replace: z.record(z.string()).default({}),
      copy: z.array(z.string()).default([]),
    }),
  }),
  defaults: {
    build: {
      entry: 'src/index.ts',
      outDir: 'dist',
      target: 'es2020' as const,
      format: 'esm' as const,
      minify: false,
      sourcemap: true,
    },
    watch: {
      enabled: false,
      include: ['src/**/*'],
      exclude: ['**/*.test.*', '**/*.spec.*'],
    },
    typescript: {
      enabled: true,
      configPath: 'tsconfig.json',
      declaration: true,
      declarationMap: true,
    },
    plugins: {
      terser: false,
      replace: {},
      copy: [],
    },
  },
} satisfies CreateConfigOptions<any>;

/**
 * Test runner configuration template
 */
export const testRunnerTemplate = {
  name: 'test-runner',
  schema: z.object({
    test: z.object({
      include: z.array(z.string()).default(['**/*.test.{js,ts}', '**/*.spec.{js,ts}']),
      exclude: z.array(z.string()).default(['**/node_modules/**', '**/dist/**']),
      timeout: z.number().min(0).default(10000),
      concurrent: z.boolean().default(true),
      maxConcurrency: z.number().min(1).default(4),
    }),
    coverage: z.object({
      enabled: z.boolean().default(true),
      threshold: z.number().min(0).max(100).default(80),
      include: z.array(z.string()).default(['src/**/*']),
      exclude: z.array(z.string()).default(['**/*.test.*', '**/*.spec.*']),
      reporter: z.enum(['text', 'html', 'json', 'lcov']).default('text'),
    }),
    watch: z.object({
      enabled: z.boolean().default(false),
      runOnChange: z.boolean().default(true),
      ignore: z.array(z.string()).default(['**/node_modules/**']),
    }),
    environment: z.object({
      node: z.boolean().default(true),
      jsdom: z.boolean().default(false),
      happy_dom: z.boolean().default(false),
    }),
  }),
  defaults: {
    test: {
      include: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      timeout: 10000,
      concurrent: true,
      maxConcurrency: 4,
    },
    coverage: {
      enabled: true,
      threshold: 80,
      include: ['src/**/*'],
      exclude: ['**/*.test.*', '**/*.spec.*'],
      reporter: 'text' as const,
    },
    watch: {
      enabled: false,
      runOnChange: true,
      ignore: ['**/node_modules/**'],
    },
    environment: {
      node: true,
      jsdom: false,
      happy_dom: false,
    },
  },
} satisfies CreateConfigOptions<any>;

/**
 * Collection of all available templates
 */
export const configTemplates = {
  dataProcessing: dataProcessingTemplate,
  cliApp: cliAppTemplate,
  fileWatcher: fileWatcherTemplate,
  apiClient: apiClientTemplate,
  buildTool: buildToolTemplate,
  testRunner: testRunnerTemplate,
} as const;

/**
 * Get a configuration template by name
 */
export function getTemplate(name: keyof typeof configTemplates) {
  return configTemplates[name];
}

/**
 * Get all available template names
 */
export function getTemplateNames(): readonly (keyof typeof configTemplates)[] {
  return Object.keys(configTemplates) as (keyof typeof configTemplates)[];
}

/**
 * Check if a template exists
 */
export function hasTemplate(name: string): name is keyof typeof configTemplates {
  return name in configTemplates;
}

// Type helpers for template inference
export type ConfigTemplate = (typeof configTemplates)[keyof typeof configTemplates];
export type DataProcessingConfig = z.infer<typeof dataProcessingTemplate.schema>;
export type CliAppConfig = z.infer<typeof cliAppTemplate.schema>;
export type FileWatcherConfig = z.infer<typeof fileWatcherTemplate.schema>;
export type ApiClientConfig = z.infer<typeof apiClientTemplate.schema>;
export type BuildToolConfig = z.infer<typeof buildToolTemplate.schema>;
export type TestRunnerConfig = z.infer<typeof testRunnerTemplate.schema>;
