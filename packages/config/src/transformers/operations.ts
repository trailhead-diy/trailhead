import { ok, err } from '@esteban-url/core';
import type { TransformerOperations, ConfigTransformer, ConfigResult } from '../types.js';

// ========================================
// Transformer Operations
// ========================================

export const createTransformerOperations = (): TransformerOperations => {
  const transformers = new Map<string, ConfigTransformer<any>>();

  const register = <T>(transformer: ConfigTransformer<T>): void => {
    transformers.set(transformer.name, transformer);
  };

  const unregister = (name: string): void => {
    transformers.delete(name);
  };

  const transform = <T>(
    config: Record<string, unknown>,
    configTransformers: readonly ConfigTransformer<T>[]
  ): ConfigResult<T> => {
    try {
      let result: any = config;

      // Sort by priority (lower numbers first)
      const sorted = [...configTransformers].sort((a, b) => (a.priority || 0) - (b.priority || 0));

      for (const transformer of sorted) {
        const transformResult = transformer.transform(result);
        if (transformResult.isErr()) {
          return transformResult;
        }
        result = transformResult.value;
      }

      return ok(result as T);
    } catch (error) {
      return err({
        type: 'ConfigTransformError',
        code: 'TRANSFORM_FAILED',
        message: 'Configuration transformation failed',
        suggestion: 'Check transformer implementations',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  return {
    register,
    unregister,
    transform,
  };
};
