/**
 * Clean public API exposing file-type functionality with Result<T> patterns
 */

export type {
  FormatDetectionResult,
  FormatDetectionOptions,
  StreamDetectionOptions,
  AbortableOptions,
  SupportedFormat,
} from './types.js';

// Core detection functions
export { detectFromFile, detectFromBuffer, detectFromStream, detectFromBlob } from './detection.js';

// Advanced parsing with custom detectors
export { parseFile, parseBuffer, parseStream } from './parser.js';

// Stream utilities
export { enhanceStream, createDetectionStream } from './stream-utils.js';

// Registry and validation
export {
  getSupportedExtensions,
  getSupportedMimeTypes,
  isExtensionSupported,
  isMimeTypeSupported,
  validateFormat,
  getMimeTypeForExtension,
} from './registry.js';

// Custom detector utilities (simplified implementation)
// For advanced custom detectors, use file-type's native API directly

// Use the core detection functions directly - no legacy aliases needed
