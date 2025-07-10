/**
 * Clean public API exposing file-type functionality with Result<T> patterns
 */

export type {
  FormatDetectionResult,
  FormatDetectionOptions,
  StreamDetectionOptions,
  AbortableOptions,
  SupportedFormat,
  // Legacy types for backward compatibility
  FormatValidator,
  FormatValidationResult,
  FormatInfo,
  FormatRegistry,
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

// Convenience aliases that match file-type API
export {
  detectFromFile as fileTypeFromFile,
  detectFromBuffer as fileTypeFromBuffer,
  detectFromStream as fileTypeFromStream,
  detectFromBlob as fileTypeFromBlob,
} from './detection.js';

// Legacy utilities removed - use new file-type API functions instead
