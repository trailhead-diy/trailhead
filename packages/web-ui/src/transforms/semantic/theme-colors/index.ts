/**
 * Default colors transform - main export
 *
 * Transforms components to use the useThemeColor hook system instead of hardcoded defaults.
 * This enables centralized default color management and consistent theming.
 */

import { type Result, type CLIError } from '@esteban-url/trailhead-cli/core';
import { executeTransform, createTransformMetadata, type TransformResult } from '../../utils.js';
import { executeThemeColorsTransform } from './transform.js';

/**
 * Transform metadata for default colors support
 */
export const themeColorsTransform = createTransformMetadata(
  'theme-colors',
  'Add default color support using useThemeColor hook',
  'semantic'
);

/**
 * Main transform function for default colors support
 *
 * Transforms component functions to use the default color system by:
 * - Adding useThemeColor import statements
 * - Removing hardcoded default values from color parameters
 * - Adding useThemeColor hook calls
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
  return executeTransform(() => executeThemeColorsTransform(input));
}

// Re-export utilities for testing
export { executeThemeColorsTransform } from './transform.js';
export {
  getComponentType,
  getComponentConfig,
  supportsDefaultColors,
  getSupportedComponents,
  type DefaultColorComponentConfig,
} from './mappings.js';
