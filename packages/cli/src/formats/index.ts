/**
 * Format utilities for DRY format handling across CLI applications
 *
 * This module provides centralized utilities for:
 * - File extension management
 * - MIME type handling
 * - Format validation and detection
 * - Output path generation
 *
 * @example
 * ```typescript
 * import { formatUtils } from '@esteban-url/trailhead-cli/formats';
 *
 * // Get extension for format
 * const ext = formatUtils.getExtension('json'); // '.json'
 *
 * // Detect format from filename
 * const format = formatUtils.detectFormatFromExtension('data.csv'); // 'csv'
 *
 * // Validate content matches format
 * const validation = formatUtils.validateFormat(content, 'json');
 *
 * // Generate output filename
 * const output = formatUtils.generateOutputFilename('input.csv', 'json'); // 'input.json'
 * ```
 */

// Types
export type {
  SupportedFormat,
  FormatInfo,
  FormatValidationResult,
  FormatDetectionOptions,
  FormatValidator,
  FormatRegistry,
} from './types.js';

// Registry
export { FORMAT_REGISTRY, SUPPORTED_FORMATS, ALL_EXTENSIONS, ALL_MIME_TYPES } from './registry.js';

// Utilities
export {
  getExtension,
  getExtensions,
  getMimeType,
  getMimeTypes,
  getFormatInfo,
  isSupported,
  detectFormatFromExtension,
  detectFormatFromMimeType,
  changeExtension,
  generateOutputFilename,
  validateFormat,
  createValidator,
  detectFormat,
  getSupportedFormats,
  isBinaryFormat,
} from './utils.js';

// Import utilities for the convenience object
import {
  getExtension,
  getExtensions,
  getMimeType,
  getMimeTypes,
  getFormatInfo,
  isSupported,
  detectFormatFromExtension,
  detectFormatFromMimeType,
  changeExtension,
  generateOutputFilename,
  validateFormat,
  createValidator,
  detectFormat,
  getSupportedFormats,
  isBinaryFormat,
} from './utils.js';

// Convenience object for cleaner imports
export const formatUtils = {
  getExtension,
  getExtensions,
  getMimeType,
  getMimeTypes,
  getFormatInfo,
  isSupported,
  detectFormatFromExtension,
  detectFormatFromMimeType,
  changeExtension,
  generateOutputFilename,
  validateFormat,
  createValidator,
  detectFormat,
  getSupportedFormats,
  isBinaryFormat,
} as const;

// Re-export everything from utils for backward compatibility
export * from './utils.js';
