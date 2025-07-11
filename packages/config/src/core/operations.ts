import { ok, err } from '@trailhead/core';
import type {
  ConfigOperations,
  ConfigDefinition,
  ConfigManager,
  ConfigState,
  ConfigResult,
  ConfigChangeCallback,
  ConfigWatcher,
  ConfigSchema,
  ConfigTransformer,
  ConfigSource,
  ResolvedSource,
  ConfigMetadata,
} from '../types.js';
import { createConfigManager } from './manager.js';
import { createLoaderOperations } from '../loaders/operations.js';
import { createValidatorOperations } from '../validators/operations.js';
import { createTransformerOperations } from '../transformers/operations.js';

// ========================================
// Configuration Operations
// ========================================

export const createConfigOperations = (): ConfigOperations => {
  const loaderOps = createLoaderOperations();
  const validatorOps = createValidatorOperations();
  const transformerOps = createTransformerOperations();

  const create = <T>(definition: ConfigDefinition<T>): ConfigResult<ConfigManager<T>> => {
    try {
      // Validate definition
      if (!definition.name) {
        return err({
          type: 'ConfigValidationError',
          code: 'INVALID_DEFINITION',
          message: 'Configuration name is required',
          suggestion: 'Provide a name for the configuration',
          recoverable: true,
        } as any);
      }

      if (!definition.sources || definition.sources.length === 0) {
        return err({
          type: 'ConfigValidationError',
          code: 'NO_SOURCES',
          message: 'At least one configuration source is required',
          suggestion: 'Add configuration sources to the definition',
          recoverable: true,
        } as any);
      }

      const manager = createConfigManager(definition, {
        loaderOps,
        validatorOps,
        transformerOps,
      });

      return ok(manager);
    } catch (error) {
      return err({
        type: 'ConfigError',
        code: 'CREATE_FAILED',
        message: 'Failed to create configuration manager',
        suggestion: 'Check the configuration definition',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const load = async <T>(
    definition: ConfigDefinition<T>
  ): Promise<ConfigResult<ConfigState<T>>> => {
    try {
      const managerResult = create(definition);
      if (managerResult.isErr()) {
        return managerResult;
      }

      const manager = managerResult.value;
      return await manager.load();
    } catch (error) {
      return err({
        type: 'ConfigError',
        code: 'LOAD_FAILED',
        message: 'Failed to load configuration',
        suggestion: 'Check configuration sources and try again',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const watch = async <T>(
    definition: ConfigDefinition<T>,
    callback: ConfigChangeCallback<T>
  ): Promise<ConfigResult<ConfigWatcher[]>> => {
    try {
      const managerResult = create(definition);
      if (managerResult.isErr()) {
        return managerResult;
      }

      const manager = managerResult.value;
      return await manager.watch(callback);
    } catch (error) {
      return err({
        type: 'ConfigError',
        code: 'WATCH_FAILED',
        message: 'Failed to watch configuration',
        suggestion: 'Check if configuration sources support watching',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const validate = <T>(config: T, schema: ConfigSchema<T>): ConfigResult<void> => {
    return validatorOps.validateSchema(config, schema);
  };

  const transform = <T>(
    config: Record<string, unknown>,
    transformers: readonly ConfigTransformer<T>[]
  ): ConfigResult<T> => {
    return transformerOps.transform(config, transformers);
  };

  return {
    create,
    load,
    watch,
    validate,
    transform,
  };
};

// ========================================
// Helper Functions
// ========================================

export const mergeConfigs = (sources: readonly ResolvedSource[]): Record<string, unknown> => {
  // Sort by priority (higher priority overrides lower)
  const sorted = [...sources].sort((a, b) => a.source.priority - b.source.priority);

  let merged: Record<string, unknown> = {};

  for (const resolvedSource of sorted) {
    merged = deepMerge(merged, resolvedSource.data);
  }

  return merged;
};

const deepMerge = (
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> => {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        result[key] = deepMerge(
          target[key] as Record<string, unknown>,
          value as Record<string, unknown>
        );
      } else {
        result[key] = { ...value };
      }
    } else {
      result[key] = value;
    }
  }

  return result;
};

export const createConfigMetadata = (
  sources: readonly ResolvedSource[],
  validationErrors: readonly any[] = [],
  transformationErrors: readonly any[] = []
): ConfigMetadata => {
  return {
    loadTime: Date.now(),
    sourceCount: sources.length,
    validationErrors,
    transformationErrors,
    version: '1.0.0',
    checksum: generateChecksum(sources),
  };
};

const generateChecksum = (sources: readonly ResolvedSource[]): string => {
  const content = sources.map(s => JSON.stringify(s.data)).join('|');
  // Simple hash function for demonstration
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};
