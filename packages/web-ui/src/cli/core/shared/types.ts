/**
 * Shared types and interfaces for conversion scripts
 * Type safety and maintainability focused interfaces
 */

// Re-export StatsTracker from CLI framework for other uses
export type { StatsTracker } from '@esteban-url/trailhead-cli/utils';

// UI-specific conversion stats interface
export interface ConversionStats {
  readonly filesProcessed: number;
  readonly filesModified: number;
  readonly totalConversions: number;
  readonly conversionsByType: Map<string, number>;
}

export interface ConversionMapping {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  description: string;
}

export interface ContextAwareConversion {
  test: (content: string, index: number) => boolean;
  pattern: RegExp;
  replacement: string;
  description: string;
}

export interface ConverterConfig {
  name: string;
  description: string;
  srcDir?: string;
  skipFiles?: string[];
  verbose?: boolean;
  dryRun?: boolean;
  force?: boolean;
  catalystSourceDir?: string;
}

export interface ConversionResult {
  converted: string;
  changes: Array<{
    original: string;
    converted: string;
    description: string;
    position?: number;
  }>;
}

export interface FileProcessingResult {
  success: boolean;
  filePath: string;
  changes: number;
  error?: string;
}

export type ConverterType = 'colors' | 'all';

export interface ConverterDefinition {
  name: string;
  description: string;
  mappings: ConversionMapping[];
  contextAware?: ContextAwareConversion[];
  processor?: (content: string) => ConversionResult;
}

// Import Result and CLIError types from framework
import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';

// Re-export Result for backward compatibility with shared modules
export type { Result };

export type AsyncResult<T, E = CLIError> = Promise<Result<T, E>>;

// Environment configuration
export interface EnvironmentConfig {
  convertSrcDir?: string;
  skipFiles?: string;
  verbose?: string;
  dryRun?: string;
  force?: string;
  catalystSourceDir?: string;
}

// File comparison result - re-export from CLI framework
export type { FileComparison } from '@esteban-url/trailhead-cli/filesystem';

// Processing configuration
export interface ProcessingConfig {
  srcDir: string;
  skipFiles: string[];
  verbose: boolean;
  dryRun: boolean;
  force: boolean;
  catalystSourceDir?: string;
}

// Converter options
export interface ConverterOptions {
  dryRun: boolean;
  verbose: boolean;
  quiet: boolean;
}
