import { ok, err } from '@trailhead/core';
import type {
  ConfigManager,
  ConfigDefinition,
  ConfigState,
  ConfigResult,
  ConfigChangeCallback,
  ConfigWatcher,
  ConfigMetadata,
  ResolvedSource,
  LoaderOperations,
  ValidatorOperations,
  TransformerOperations,
} from '../types.js';
import { mergeConfigs, createConfigMetadata } from './operations.js';

// ========================================
// Configuration Manager
// ========================================

interface ManagerDependencies {
  readonly loaderOps: LoaderOperations;
  readonly validatorOps: ValidatorOperations;
  readonly transformerOps: TransformerOperations;
}

export const createConfigManager = <T>(
  definition: ConfigDefinition<T>,
  deps: ManagerDependencies
): ConfigManager<T> => {
  let currentState: ConfigState<T> | undefined;
  const watchers: ConfigWatcher[] = [];

  const load = async (): Promise<ConfigResult<ConfigState<T>>> => {
    try {
      // Load from all sources
      const resolvedSources: ResolvedSource[] = [];

      for (const source of definition.sources) {
        const startTime = Date.now();
        const loadResult = await deps.loaderOps.load(source);

        if (loadResult.isOk()) {
          resolvedSources.push({
            source,
            data: loadResult.value,
            loadTime: Date.now() - startTime,
          });
        } else {
          if (!source.optional) {
            return err({
              type: 'ConfigLoadError',
              code: 'REQUIRED_SOURCE_FAILED',
              message: `Failed to load required configuration source: ${source.type}`,
              suggestion: 'Check the source configuration and ensure it is accessible',
              cause: loadResult.error,
              recoverable: false,
            } as any);
          }

          resolvedSources.push({
            source,
            data: {},
            loadTime: Date.now() - startTime,
            error: loadResult.error,
          });
        }
      }

      // Merge configurations
      const rawConfig = mergeConfigs(resolvedSources);

      // Apply defaults
      const configWithDefaults = {
        ...definition.defaults,
        ...rawConfig,
      };

      // Transform configuration
      let transformedConfig: T;
      if (definition.transformers && definition.transformers.length > 0) {
        const transformResult = deps.transformerOps.transform(
          configWithDefaults,
          definition.transformers
        );

        if (transformResult.isErr()) {
          return err(transformResult.error);
        }

        transformedConfig = transformResult.value;
      } else {
        transformedConfig = configWithDefaults as T;
      }

      // Validate configuration
      if (definition.validators && definition.validators.length > 0) {
        const validationResult = deps.validatorOps.validate(
          transformedConfig,
          definition.validators
        );

        if (validationResult.isErr()) {
          return err(validationResult.error);
        }
      }

      // Create state
      const state: ConfigState<T> = {
        definition,
        raw: rawConfig,
        resolved: transformedConfig,
        sources: resolvedSources,
        metadata: createConfigMetadata(resolvedSources),
      };

      currentState = state;
      return ok(state);
    } catch (error) {
      return err({
        type: 'ConfigError',
        code: 'LOAD_FAILED',
        message: 'Failed to load configuration',
        suggestion: 'Check configuration sources and definition',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const reload = async (): Promise<ConfigResult<ConfigState<T>>> => {
    return load();
  };

  const get = <K extends keyof T>(key: K): T[K] | undefined => {
    return currentState?.resolved[key];
  };

  const set = <K extends keyof T>(key: K, value: T[K]): ConfigResult<void> => {
    if (!currentState) {
      return err({
        type: 'ConfigError',
        code: 'NOT_LOADED',
        message: 'Configuration not loaded',
        suggestion: 'Load configuration before setting values',
        recoverable: true,
      } as any);
    }

    try {
      const newResolved = {
        ...currentState.resolved,
        [key]: value,
      };

      currentState = {
        ...currentState,
        resolved: newResolved,
      };

      return ok(undefined);
    } catch (error) {
      return err({
        type: 'ConfigError',
        code: 'SET_FAILED',
        message: `Failed to set configuration value for key: ${String(key)}`,
        suggestion: 'Check the value type and key validity',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const has = (key: keyof T): boolean => {
    return currentState?.resolved[key] !== undefined;
  };

  const watch = async (
    callback: ConfigChangeCallback<T>
  ): Promise<ConfigResult<ConfigWatcher[]>> => {
    try {
      const newWatchers: ConfigWatcher[] = [];

      for (const source of definition.sources) {
        if (source.watch) {
          const loader = deps.loaderOps.getLoader(source);

          if (loader?.watch) {
            const watchResult = await loader.watch(source, async (data, error) => {
              if (error) {
                return;
              }

              // Reload and notify of changes
              const oldConfig = currentState?.resolved;
              const reloadResult = await reload();

              if (reloadResult.isOk() && oldConfig) {
                const newConfig = reloadResult.value.resolved;
                const changes = detectChanges(oldConfig, newConfig);

                if (changes.length > 0) {
                  callback(newConfig, oldConfig, changes);
                }
              }
            });

            if (watchResult.isOk()) {
              newWatchers.push(watchResult.value);
              watchers.push(watchResult.value);
            }
          }
        }
      }

      return ok(newWatchers);
    } catch (error) {
      return err({
        type: 'ConfigError',
        code: 'WATCH_FAILED',
        message: 'Failed to set up configuration watching',
        suggestion: 'Check if sources support watching',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const validate = (): ConfigResult<void> => {
    if (!currentState) {
      return err({
        type: 'ConfigError',
        code: 'NOT_LOADED',
        message: 'Configuration not loaded',
        suggestion: 'Load configuration before validating',
        recoverable: true,
      } as any);
    }

    if (definition.validators && definition.validators.length > 0) {
      return deps.validatorOps.validate(currentState.resolved, definition.validators);
    }

    return ok(undefined);
  };

  const getState = (): ConfigState<T> | undefined => {
    return currentState;
  };

  const getMetadata = (): ConfigMetadata | undefined => {
    return currentState?.metadata;
  };

  return {
    definition,
    load,
    reload,
    get,
    set,
    has,
    watch,
    validate,
    getState,
    getMetadata,
  };
};

// ========================================
// Helper Functions
// ========================================

const detectChanges = <T>(oldConfig: T, newConfig: T): any[] => {
  const changes: any[] = [];

  const compare = (old: any, current: any, path: string) => {
    if (old !== current) {
      changes.push({
        path,
        oldValue: old,
        newValue: current,
        source: { type: 'unknown', priority: 0 }, // Simplified
      });
    }
  };

  // Simple change detection - could be more sophisticated
  if (typeof oldConfig === 'object' && typeof newConfig === 'object') {
    const allKeys = new Set([...Object.keys(oldConfig as any), ...Object.keys(newConfig as any)]);

    for (const key of allKeys) {
      compare((oldConfig as any)[key], (newConfig as any)[key], key);
    }
  } else {
    compare(oldConfig, newConfig, 'root');
  }

  return changes;
};
