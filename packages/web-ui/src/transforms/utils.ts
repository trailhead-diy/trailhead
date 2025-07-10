/**
 * Shared utilities for transform implementations
 * Eliminates duplication across transform files
 */

import { Ok, Err, type Result, type CLIError } from '@esteban-url/trailhead-cli/core';

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
    return Ok(result);
  } catch (error) {
    return Err({
      code: 'TRANSFORM_ERROR',
      message: `Transform execution failed: ${error instanceof Error ? error.message : String(error)}`,
      recoverable: true,
    });
  }
}
