/**
 * Core types for atomic transforms
 */

export interface TransformResult {
  hasChanges: boolean;
  changes: TransformChange[];
}

export interface TransformChange {
  type: string;
  description: string;
  location?: string;
  before?: string;
  after?: string;
}

export interface TransformConfig {
  dryRun?: boolean;
  verbose?: boolean;
  skipValidation?: boolean;
}

export interface AtomicTransform<TConfig = any> {
  name: string;
  description: string;
  apply: (source: string, config?: TConfig) => TransformResult;
}

export interface ComponentMapping {
  originalName: string;
  prefixedName: string;
  importPath?: string;
}

export interface ColorMapping {
  component: string;
  colors: Record<string, string>;
}

export interface SemanticColorDefinition {
  name: string;
  lightValue: string;
  darkValue: string;
  description?: string;
}
