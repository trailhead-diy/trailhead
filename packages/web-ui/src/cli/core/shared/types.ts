/**
 * Shared types and interfaces for conversion scripts
 * Type safety and maintainability focused interfaces
 */

export interface ConversionStats {
  filesProcessed: number;
  filesModified: number;
  totalConversions: number;
  conversionsByType: Map<string, number>;
  startTime: number;
  endTime?: number;
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

// Import Result type from framework
import type { Result } from '@esteban-url/trailhead-cli/core';

// Re-export Result for backward compatibility with shared modules
export type { Result };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Environment configuration
export interface EnvironmentConfig {
  convertSrcDir?: string;
  skipFiles?: string;
  verbose?: string;
  dryRun?: string;
  force?: string;
  catalystSourceDir?: string;
}

// File comparison result
export interface FileComparison {
  sourceExists: boolean;
  destExists: boolean;
  identical: boolean;
  sourceContent?: string;
  destContent?: string;
}

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
