/**
 * Format registry using file-type's comprehensive support
 */

import { supportedExtensions, supportedMimeTypes } from 'file-type';
import type { Result } from '../core/errors/types.js';
import { Ok, Err, createError } from '../core/errors/factory.js';

/**
 * Get all supported file extensions
 */
export function getSupportedExtensions(): ReadonlySet<string> {
  return supportedExtensions;
}

/**
 * Get all supported MIME types
 */
export function getSupportedMimeTypes(): ReadonlySet<string> {
  return supportedMimeTypes;
}

/**
 * Check if extension is supported
 */
export function isExtensionSupported(extension: string): boolean {
  const normalized = extension.toLowerCase().replace(/^\./, '');
  return supportedExtensions.has(normalized);
}

/**
 * Check if MIME type is supported
 */
export function isMimeTypeSupported(mimeType: string): boolean {
  return supportedMimeTypes.has(mimeType);
}

/**
 * Validate format against supported formats
 */
export function validateFormat(format: string, allowedFormats?: string[]): Result<string> {
  if (!isExtensionSupported(format)) {
    return Err(
      createError(
        'UNSUPPORTED_FORMAT',
        `Format '${format}' is not supported by file-type library`,
        {
          recoverable: true,
          suggestion: `Supported formats: ${Array.from(supportedExtensions).slice(0, 10).join(', ')}...`,
        }
      )
    );
  }

  if (allowedFormats && !allowedFormats.includes(format)) {
    return Err(
      createError(
        'FORMAT_NOT_ALLOWED',
        `Format '${format}' is not in allowed formats: ${allowedFormats.join(', ')}`,
        { recoverable: true }
      )
    );
  }

  return Ok(format);
}

/**
 * Get MIME type for extension
 */
export function getMimeTypeForExtension(extension: string): Result<string> {
  // This would require mapping from file-type's internal registry
  // For now, we'd need to detect a sample file or use a lookup table
  if (!isExtensionSupported(extension)) {
    return Err(
      createError('UNSUPPORTED_EXTENSION', `Extension '${extension}' is not supported`, {
        recoverable: true,
      })
    );
  }

  // Since file-type doesn't expose extension->mime mapping directly,
  // we'd need to maintain a lookup or use detection
  return Err(
    createError(
      'MIME_LOOKUP_NOT_AVAILABLE',
      'Direct MIME type lookup not available, use detection instead',
      {
        recoverable: true,
        suggestion: 'Use detectFromFile() or detectFromBuffer() for accurate MIME type detection',
      }
    )
  );
}
