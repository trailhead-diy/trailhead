import { ok, err } from '@trailhead/core'
import type {
  LoaderOperations,
  ConfigLoader,
  ConfigSource,
  ConfigResult,
  ConfigSourceType,
} from '../types.js'

// ========================================
// Loader Operations
// ========================================

/**
 * Creates loader operations for managing configuration source loaders.
 *
 * Provides a registry system for configuration loaders that can fetch data
 * from various sources like files, environment variables, CLI arguments,
 * remote APIs, and more. Includes built-in loaders for common source types.
 *
 * @returns Loader operations interface with registration and loading capabilities
 *
 * @example
 * ```typescript
 * const loaderOps = createLoaderOperations()
 *
 * // Register a custom loader
 * const s3Loader: ConfigLoader = {
 *   load: async (source) => {
 *     const data = await s3.getObject({ Bucket: 'config', Key: source.path })
 *     return ok(JSON.parse(data.Body.toString()))
 *   },
 *   supports: (source) => source.type === 's3'
 * }
 * loaderOps.register(s3Loader)
 *
 * // Load configuration
 * const result = await loaderOps.load({
 *   type: 's3',
 *   path: 'production/config.json',
 *   priority: 1
 * })
 * ```
 *
 * @see {@link LoaderOperations} - Operations interface definition
 * @see {@link ConfigLoader} - Loader interface for custom implementations
 */
export const createLoaderOperations = (): LoaderOperations => {
  const loaders = new Map<ConfigSourceType, ConfigLoader>()

  // Register default loaders
  registerDefaultLoaders()

  function registerDefaultLoaders() {
    // Object loader
    const objectLoader: ConfigLoader = {
      load: async (source: ConfigSource) => {
        if (source.data) {
          return ok(source.data)
        }
        return err({
          type: 'ConfigLoadError',
          code: 'NO_DATA',
          message: 'Object source has no data',
          suggestion: 'Provide data in the source configuration',
          recoverable: true,
        } as any)
      },
      supports: (source: ConfigSource) => source.type === 'object',
    }

    // Environment loader
    const envLoader: ConfigLoader = {
      load: async (source: ConfigSource) => {
        const data: Record<string, unknown> = {}
        const prefix = source.env || ''

        for (const [key, value] of Object.entries(process.env)) {
          if (key.startsWith(prefix)) {
            const configKey = key.slice(prefix.length).toLowerCase()
            data[configKey] = value
          }
        }

        return ok(data)
      },
      supports: (source: ConfigSource) => source.type === 'env',
    }

    loaders.set('object', objectLoader)
    loaders.set('env', envLoader)
  }

  const register = (loader: ConfigLoader): void => {
    // Find supported types and register
    const testSources: ConfigSource[] = [
      { type: 'file', priority: 0 },
      { type: 'env', priority: 0 },
      { type: 'cli', priority: 0 },
      { type: 'object', priority: 0 },
      { type: 'remote', priority: 0 },
      { type: 'vault', priority: 0 },
    ]

    for (const source of testSources) {
      if (loader.supports(source)) {
        loaders.set(source.type, loader)
      }
    }
  }

  const unregister = (type: ConfigSourceType): void => {
    loaders.delete(type)
  }

  const getLoader = (source: ConfigSource): ConfigLoader | undefined => {
    return loaders.get(source.type)
  }

  const load = async (source: ConfigSource): Promise<ConfigResult<Record<string, unknown>>> => {
    const loader = getLoader(source)

    if (!loader) {
      return err({
        type: 'ConfigLoadError',
        code: 'NO_LOADER',
        message: `No loader found for source type: ${source.type}`,
        suggestion: 'Register a loader for this source type',
        recoverable: false,
      } as any)
    }

    return loader.load(source)
  }

  return {
    register,
    unregister,
    getLoader,
    load,
  }
}
