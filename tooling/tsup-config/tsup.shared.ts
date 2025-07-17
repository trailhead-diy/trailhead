import type { Options } from 'tsup'

/**
 * Shared tsup configuration for all packages
 * This eliminates duplication across package tsup.config.ts files
 */
export interface TsupConfigOptions {
  entry?: string | string[] | Record<string, string>
  format?: Array<'cjs' | 'esm'>
  target?: string
  dts?: boolean
  sourcemap?: boolean
  clean?: boolean
  splitting?: boolean
  minify?: boolean
  bundle?: boolean
  external?: string[]
  platform?: 'node' | 'browser' | 'neutral'
  env?: Record<string, string>
  define?: Record<string, string>
  publicDir?: string
  loader?: Record<
    string,
    | 'js'
    | 'jsx'
    | 'ts'
    | 'tsx'
    | 'css'
    | 'json'
    | 'text'
    | 'base64'
    | 'file'
    | 'dataurl'
    | 'binary'
    | 'copy'
  >
  banner?: {
    js?: string
    css?: string
  }
  footer?: {
    js?: string
    css?: string
  }
  replaceNodeEnv?: boolean
  shims?: boolean
  watch?: boolean | string[]
  outDir?: string
  outExtension?: (ctx: { format: string }) => { js?: string; dts?: string }
  treeshake?: boolean
  silent?: boolean
  skipNodeModulesBundle?: boolean
  cjsInterop?: boolean
  legacyOutput?: boolean
  keepNames?: boolean
  globalName?: string
  metafile?: boolean
  onSuccess?: string
  esbuildOptions?: (options: any, context: any) => void
  esbuildPlugins?: any[]
  plugins?: any[]
  noExternal?: string[]
  injectStyle?: boolean
  experimentalDts?: {
    entry?: string | Record<string, string>
    resolve?: boolean
    only?: boolean
    compilerOptions?: any
  }
}

/**
 * Create a standardized tsup configuration
 */
export const createTsupConfig = (options: TsupConfigOptions = {}): Options => {
  const {
    entry = { index: 'src/index.ts' },
    format = ['esm'],
    target = 'es2022',
    dts = false,
    sourcemap = true,
    clean = true,
    splitting = false,
    minify = false,
    bundle = true,
    external = [],
    platform = 'node',
    env = {},
    define = {},
    publicDir,
    loader = {},
    banner,
    footer,
    replaceNodeEnv = false,
    shims = false,
    watch = false,
    outDir = 'dist',
    outExtension,
    treeshake = true,
    silent = false,
    skipNodeModulesBundle = false,
    cjsInterop = false,
    legacyOutput = false,
    keepNames = false,
    globalName,
    metafile = false,
    onSuccess,
    esbuildOptions,
    esbuildPlugins = [],
    plugins = [],
    noExternal = [],
    injectStyle = false,
    experimentalDts,
    ...additionalOptions
  } = options

  const config: any = {
    entry: entry as any,
    format,
    target,
    dts,
    sourcemap,
    clean,
    splitting,
    minify,
    bundle,
    external,
    platform,
    env,
    define,
    publicDir,
    loader,
    banner,
    footer,
    replaceNodeEnv,
    shims,
    watch,
    outDir,
    outExtension,
    treeshake,
    silent,
    skipNodeModulesBundle,
    cjsInterop,
    legacyOutput,
    keepNames,
    globalName,
    metafile,
    esbuildOptions,
    esbuildPlugins,
    plugins,
    noExternal,
    injectStyle,
    experimentalDts,
    ...additionalOptions,
  }

  // Only add onSuccess if it's defined
  if (onSuccess) {
    config.onSuccess = onSuccess
  }

  return config
}

/**
 * Configuration profiles for different package types
 */
export const tsupProfiles = {
  /**
   * Node.js library configuration
   */
  node: (overrides: TsupConfigOptions = {}) =>
    createTsupConfig({
      format: ['esm'],
      target: 'node18',
      platform: 'node',
      dts: false,
      ...overrides,
    }),

  /**
   * Browser library configuration
   */
  browser: (overrides: TsupConfigOptions = {}) =>
    createTsupConfig({
      format: ['esm'],
      target: 'es2020',
      platform: 'browser',
      dts: false,
      ...overrides,
    }),

  /**
   * Universal library configuration
   */
  universal: (overrides: TsupConfigOptions = {}) =>
    createTsupConfig({
      format: ['esm', 'cjs'],
      target: 'es2020',
      platform: 'neutral',
      dts: false,
      ...overrides,
    }),

  /**
   * CLI application configuration
   */
  cli: (overrides: TsupConfigOptions = {}) =>
    createTsupConfig({
      format: ['esm'],
      target: 'node18',
      platform: 'node',
      dts: false,
      banner: {
        js: '#!/usr/bin/env node',
      },
      ...overrides,
    }),

  /**
   * React component library configuration
   */
  react: (overrides: TsupConfigOptions = {}) =>
    createTsupConfig({
      format: ['esm'],
      target: 'es2020',
      platform: 'neutral',
      dts: false,
      external: ['react', 'react-dom'],
      ...overrides,
    }),

  /**
   * TypeScript definition generation
   */
  dts: (overrides: TsupConfigOptions = {}) =>
    createTsupConfig({
      format: ['esm'],
      dts: true,
      clean: false,
      ...overrides,
    }),

  /**
   * Development configuration with watch mode
   */
  dev: (overrides: TsupConfigOptions = {}) =>
    createTsupConfig({
      format: ['esm'],
      target: 'node18',
      platform: 'node',
      dts: false,
      watch: true,
      sourcemap: true,
      ...overrides,
    }),

  /**
   * Production configuration with minification
   */
  prod: (overrides: TsupConfigOptions = {}) =>
    createTsupConfig({
      format: ['esm'],
      target: 'es2020',
      platform: 'neutral',
      dts: false,
      minify: true,
      sourcemap: false,
      ...overrides,
    }),
}

/**
 * Entry point patterns for different package types
 */
export const entryPatterns = {
  /**
   * Single entry point
   */
  single: (file: string = 'src/index.ts') => ({ index: file }),

  /**
   * Multiple entry points
   */
  multiple: (entries: Record<string, string>) => entries,

  /**
   * Subpath exports pattern
   */
  subpath: (subpaths: string[]) => {
    const entries: Record<string, string> = {}
    for (const subpath of subpaths) {
      entries[subpath] = `src/${subpath}/index.ts`
    }
    return entries
  },

  /**
   * CLI with bin entries
   */
  cli: (binName: string, binFile: string = 'src/cli.ts') => ({
    [binName]: binFile,
    index: 'src/index.ts',
  }),

  /**
   * Testing utilities pattern
   */
  testing: (mainEntry: string = 'src/index.ts') => ({
    index: mainEntry,
    testing: 'src/testing/index.ts',
  }),
}

/**
 * Common external dependencies to exclude from bundling
 */
export const commonExternals = {
  node: [
    'fs',
    'path',
    'os',
    'crypto',
    'util',
    'stream',
    'events',
    'buffer',
    'url',
    'querystring',
    'child_process',
    'cluster',
    'dgram',
    'dns',
    'domain',
    'http',
    'https',
    'net',
    'punycode',
    'readline',
    'repl',
    'tls',
    'tty',
    'vm',
    'zlib',
  ],
  react: ['react', 'react-dom', 'react/jsx-runtime'],
  testing: ['vitest', '@vitest/ui', '@testing-library/react', '@testing-library/jest-dom'],
  build: ['tsup', 'typescript', 'rollup', 'esbuild'],
}

/**
 * Utility function to merge externals
 */
export const mergeExternals = (...externalArrays: string[][]): string[] => {
  return Array.from(new Set(externalArrays.flat()))
}

/**
 * Default configuration for most packages
 */
export const defaultConfig = tsupProfiles.node()
