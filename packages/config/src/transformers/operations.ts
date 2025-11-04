import { ok, err } from '@trailhead/core'
import type { TransformerOperations, ConfigTransformer, ConfigResult } from '../types.js'

// ========================================
// Transformer Operations
// ========================================

/**
 * Creates transformer operations for managing configuration transformers.
 *
 * Provides a registry system for configuration transformers that can modify
 * and normalize configuration data during the loading process. Transformers
 * are applied in priority order and can perform operations like environment
 * variable expansion, format conversion, and data normalization.
 *
 * @returns Transformer operations interface with registration and transformation capabilities
 *
 * @example
 * ```typescript
 * const transformerOps = createTransformerOperations()
 *
 * // Register a custom transformer
 * const envExpansionTransformer: ConfigTransformer<any> = {
 *   name: 'environment-expansion',
 *   priority: 1,
 *   transform: (config) => {
 *     // Expand ${ENV_VAR} placeholders
 *     const expanded = JSON.parse(
 *       JSON.stringify(config).replace(
 *         /\$\{([^}]+)\}/g,
 *         (_, varName) => process.env[varName] || ''
 *       )
 *     )
 *     return ok(expanded)
 *   }
 * }
 *
 * transformerOps.register(envExpansionTransformer)
 *
 * // Transform configuration
 * const result = transformerOps.transform(rawConfig, [envExpansionTransformer])
 * ```
 *
 * @see {@link TransformerOperations} - Operations interface definition
 * @see {@link ConfigTransformer} - Transformer interface for custom implementations
 */
export const createTransformerOperations = (): TransformerOperations => {
  const transformers = new Map<string, ConfigTransformer<any>>()

  const register = <T>(transformer: ConfigTransformer<T>): void => {
    transformers.set(transformer.name, transformer)
  }

  const unregister = (name: string): void => {
    transformers.delete(name)
  }

  const transform = <T>(
    config: Record<string, unknown>,
    configTransformers: readonly ConfigTransformer<T>[]
  ): ConfigResult<T> => {
    try {
      let result: any = config

      // Sort by priority (lower numbers first)
      const sorted = [...configTransformers].sort((a, b) => (a.priority || 0) - (b.priority || 0))

      for (const transformer of sorted) {
        const transformResult = transformer.transform(result)
        if (transformResult.isErr()) {
          return transformResult
        }
        result = transformResult.value
      }

      return ok(result as T)
    } catch (error) {
      return err({
        type: 'ConfigTransformError',
        code: 'TRANSFORM_FAILED',
        message: 'Configuration transformation failed',
        suggestion: 'Check transformer implementations',
        cause: error,
        recoverable: false,
      } as any)
    }
  }

  return {
    register,
    unregister,
    transform,
  }
}
