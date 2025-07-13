import type { Result, CoreError } from '@trailhead/core';

// ========================================
// Result Type Alias
// ========================================

export type ConfigResult<T> = Result<T, CoreError>;

// ========================================
// Configuration Types
// ========================================

export interface ConfigDefinition<T = Record<string, unknown>> {
  readonly name: string;
  readonly version?: string;
  readonly description?: string;
  readonly schema?: unknown; // Will be properly typed when imported in operations
  readonly sources: readonly ConfigSource[];
  readonly defaults?: Partial<T>;
  readonly transformers?: readonly ConfigTransformer<T>[];
  readonly validators?: readonly ConfigValidator<T>[];
}

export interface ConfigSource {
  readonly type: ConfigSourceType;
  readonly path?: string;
  readonly data?: Record<string, unknown>;
  readonly priority: number;
  readonly optional?: boolean;
  readonly watch?: boolean;
  readonly env?: string;
}

export type ConfigSourceType = 'file' | 'env' | 'cli' | 'object' | 'remote' | 'vault';

export interface ConfigSchema<T = Record<string, unknown>> {
  readonly properties: Record<string, ConfigProperty>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
  readonly validate?: (config: T) => ConfigResult<void>;
}

export interface ConfigProperty {
  readonly type: ConfigPropertyType;
  readonly description?: string;
  readonly default?: unknown;
  readonly required?: boolean;
  readonly enum?: readonly unknown[];
  readonly pattern?: string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly items?: ConfigProperty;
  readonly properties?: Record<string, ConfigProperty>;
  readonly transform?: (value: unknown) => unknown;
  readonly validate?: (value: unknown) => boolean;
}

export type ConfigPropertyType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';

// ========================================
// Configuration State
// ========================================

export interface ConfigState<T = Record<string, unknown>> {
  readonly definition: ConfigDefinition<T>;
  readonly raw: Record<string, unknown>;
  readonly resolved: T;
  readonly sources: readonly ResolvedSource[];
  readonly metadata: ConfigMetadata;
}

export interface ResolvedSource {
  readonly source: ConfigSource;
  readonly data: Record<string, unknown>;
  readonly loadTime: number;
  readonly error?: CoreError;
}

export interface ConfigMetadata {
  readonly loadTime: number;
  readonly sourceCount: number;
  readonly validationErrors: readonly CoreError[];
  readonly transformationErrors: readonly CoreError[];
  readonly version?: string;
  readonly checksum?: string;
}

// ========================================
// Loader Types
// ========================================

export interface ConfigLoader {
  readonly load: (source: ConfigSource) => Promise<ConfigResult<Record<string, unknown>>>;
  readonly watch?: (
    source: ConfigSource,
    callback: ConfigWatchCallback
  ) => Promise<ConfigResult<ConfigWatcher>>;
  readonly supports: (source: ConfigSource) => boolean;
}

export type ConfigWatchCallback = (data: Record<string, unknown>, error?: CoreError) => void;

export interface ConfigWatcher {
  readonly source: ConfigSource;
  readonly stop: () => Promise<ConfigResult<void>>;
}

// ========================================
// Transformer Types
// ========================================

export interface ConfigTransformer<T = Record<string, unknown>> {
  readonly name: string;
  readonly transform: (config: Record<string, unknown>) => ConfigResult<T>;
  readonly priority?: number;
}

// ========================================
// Validator Types
// ========================================

export interface ConfigValidator<T = Record<string, unknown>> {
  readonly name: string;
  readonly schema?: unknown; // Schema will be properly typed when imported
  readonly validate: (config: unknown) => Promise<ConfigResult<T>>;
  readonly priority?: number;
}

// ========================================
// Operations Types
// ========================================

export interface ConfigOperations {
  readonly create: <T>(definition: ConfigDefinition<T>) => ConfigResult<ConfigManager<T>>;
  readonly load: <T>(definition: ConfigDefinition<T>) => Promise<ConfigResult<ConfigState<T>>>;
  readonly watch: <T>(
    definition: ConfigDefinition<T>,
    callback: ConfigChangeCallback<T>
  ) => Promise<ConfigResult<ConfigWatcher[]>>;
  readonly validate: <T>(config: T, schema: ConfigSchema<T>) => ConfigResult<void>;
  readonly transform: <T>(
    config: Record<string, unknown>,
    transformers: readonly ConfigTransformer<T>[]
  ) => ConfigResult<T>;
}

export interface LoaderOperations {
  readonly register: (loader: ConfigLoader) => void;
  readonly unregister: (type: ConfigSourceType) => void;
  readonly getLoader: (source: ConfigSource) => ConfigLoader | undefined;
  readonly load: (source: ConfigSource) => Promise<ConfigResult<Record<string, unknown>>>;
}

export interface ValidatorOperations {
  readonly register: <T>(validator: ConfigValidator<T>) => void;
  readonly unregister: (name: string) => void;
  readonly validate: <T>(
    config: T,
    validators: readonly ConfigValidator<T>[]
  ) => Result<void, CoreError>;
  readonly validateSchema: <T>(config: T, schema: unknown) => Result<void, CoreError>;
  readonly getRegisteredValidators: () => readonly string[];
  readonly hasValidator: (name: string) => boolean;
}

export interface TransformerOperations {
  readonly register: <T>(transformer: ConfigTransformer<T>) => void;
  readonly unregister: (name: string) => void;
  readonly transform: <T>(
    config: Record<string, unknown>,
    transformers: readonly ConfigTransformer<T>[]
  ) => ConfigResult<T>;
}

// ========================================
// Manager Types
// ========================================

export interface ConfigManager<T = Record<string, unknown>> {
  readonly definition: ConfigDefinition<T>;
  readonly load: () => Promise<ConfigResult<ConfigState<T>>>;
  readonly reload: () => Promise<ConfigResult<ConfigState<T>>>;
  readonly get: <K extends keyof T>(key: K) => T[K] | undefined;
  readonly set: <K extends keyof T>(key: K, value: T[K]) => ConfigResult<void>;
  readonly has: (key: keyof T) => boolean;
  readonly watch: (callback: ConfigChangeCallback<T>) => Promise<ConfigResult<ConfigWatcher[]>>;
  readonly validate: () => ConfigResult<void>;
  readonly getState: () => ConfigState<T> | undefined;
  readonly getMetadata: () => ConfigMetadata | undefined;
}

export type ConfigChangeCallback<T = Record<string, unknown>> = (
  newConfig: T,
  oldConfig: T,
  changes: readonly ConfigChange[]
) => void;

export interface ConfigChange {
  readonly path: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
  readonly source: ConfigSource;
}

// ========================================
// Built-in Types
// ========================================

export interface FileLoaderOptions {
  readonly encoding?: BufferEncoding;
  readonly maxSize?: number;
  readonly allowedExtensions?: readonly string[];
}

export interface EnvLoaderOptions {
  readonly prefix?: string;
  readonly separator?: string;
  readonly parseNumbers?: boolean;
  readonly parseBooleans?: boolean;
  readonly allowEmpty?: boolean;
}

export interface CLILoaderOptions {
  readonly prefix?: string;
  readonly separator?: string;
  readonly parseNumbers?: boolean;
  readonly parseBooleans?: boolean;
  readonly aliases?: Record<string, string>;
}

// ========================================
// Utility Types
// ========================================

export type DeepPartial<T> = {
  readonly [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends readonly (infer U)[]
      ? readonly DeepPartial<U>[]
      : T[P] extends object
        ? DeepPartial<T[P]>
        : T[P];
};

export type ConfigPath<T> = T extends object
  ? {
      readonly [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${ConfigPath<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;
