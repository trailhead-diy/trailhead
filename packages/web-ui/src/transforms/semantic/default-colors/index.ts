/**
 * Default colors transform - main export
 *
 * Transforms components to use the useDefaultColor hook system instead of hardcoded defaults.
 * This enables centralized default color management and consistent theming.
 */

import { type Result, type CLIError } from '@esteban-url/trailhead-cli/core';
import { executeTransform, createTransformMetadata, type TransformResult } from '../../utils.js';
import { executeDefaultColorsTransform } from './transform.js';

/**
 * Transform metadata for default colors support
 */
export const defaultColorsTransform = createTransformMetadata(
  'default-colors',
  'Add default color support using useDefaultColor hook',
  'semantic'
);

/**
 * Main transform function for default colors support
 *
 * Transforms component functions to use the default color system by:
 * - Adding useDefaultColor import statements
 * - Removing hardcoded default values from color parameters
 * - Adding useDefaultColor hook calls
 * - Updating color usage patterns to include fallback values
 *
 * @param input - The source code to transform
 * @returns Result containing the transformed content or error
 *
 * @example
 * ```typescript
 * const result = transformDefaultColors(sourceCode);
 * if (result.isOk()) {
 *   const { content, changed, warnings } = result.value;
 *   // Use transformed content
 * }
 * ```
 */
export function transformDefaultColors(input: string): Result<TransformResult, CLIError> {
  return executeTransform(() => executeDefaultColorsTransform(input));
}

// Re-export utilities for testing
export { executeDefaultColorsTransform } from './transform.js';
export {
  getComponentType,
  getComponentConfig,
  supportsDefaultColors,
  getSupportedComponents,
  type DefaultColorComponentConfig,
} from './mappings.js';
