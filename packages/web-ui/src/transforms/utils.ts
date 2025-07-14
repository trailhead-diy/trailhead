/**
 * Shared utilities for transform implementations
 * Eliminates duplication across transform files
 */

import { ok, err, type Result, type CLIError } from '@esteban-url/cli/core';

/**
 * Transform result type
 */
export type TransformResult = {
  content: string;
  changed: boolean;
  warnings: string[];
};

/**
 * Transform metadata type
 */
export type TransformMetadata = {
  readonly name: string;
  readonly description: string;
  readonly category: 'semantic' | 'format' | 'quality' | 'import' | 'ast';
};

/**
 * Create transform metadata
 */
export function createTransformMetadata(
  name: string,
  description: string,
  category: TransformMetadata['category']
): TransformMetadata {
  return { name, description, category } as const;
}

/**
 * Wrap transform execution with consistent error handling
 */
export function executeTransform(
  transformFn: () => TransformResult
): Result<TransformResult, CLIError> {
  try {
    const result = transformFn();
    return ok(result);
  } catch (error) {
    return err({
      code: 'TRANSFORM_ERROR',
      message: `Transform execution failed: ${error instanceof Error ? error.message : String(error)}`,
      recoverable: true,
    });
  }
}
