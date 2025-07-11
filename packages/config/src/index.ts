// ========================================
// Main Configuration Operations Exports
// ========================================

export { createConfigOperations } from './core/operations.js';
export { createConfigManager } from './core/manager.js';

// ========================================
// Sub-module Exports
// ========================================

export { createLoaderOperations } from './loaders/operations.js';
export { createValidatorOperations } from './validators/operations.js';
export { createTransformerOperations } from './transformers/operations.js';

// ========================================
// Type Exports
// ========================================

export type {
  // Result types
  ConfigResult,

  // Configuration types
  ConfigDefinition,
  ConfigSource,
  ConfigSourceType,
  ConfigSchema,
  ConfigProperty,
  ConfigPropertyType,

  // State types
  ConfigState,
  ResolvedSource,
  ConfigMetadata,

  // Loader types
  ConfigLoader,
  ConfigWatchCallback,
  ConfigWatcher,

  // Transformer types
  ConfigTransformer,

  // Validator types
  ConfigValidator,

  // Operations types
  ConfigOperations,
  LoaderOperations,
  ValidatorOperations,
  TransformerOperations,

  // Manager types
  ConfigManager,
  ConfigChangeCallback,
  ConfigChange,

  // Options types
  FileLoaderOptions,
  EnvLoaderOptions,
  CLILoaderOptions,

  // Utility types
  DeepPartial,
  ConfigPath,
} from './types.js';
