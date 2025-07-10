/**
 * Format utility functions for extensions, MIME types, and validation
 */

import { extname, parse as parsePath } from 'node:path';
import type { Result } from '../core/errors/types.js';
import { Ok, Err, createError } from '../core/errors/factory.js';
import type {
  SupportedFormat,
  FormatInfo,
  FormatValidationResult,
  FormatDetectionOptions,
  FormatValidator,
} from './types.js';
import { FORMAT_REGISTRY, SUPPORTED_FORMATS } from './registry.js';

/**
 * Get file extension for a format
 */
export function getExtension(format: SupportedFormat): string {
  const formatInfo = FORMAT_REGISTRY[format];
  return formatInfo?.extensions[0] ?? '.json';
}

/**
 * Get all extensions for a format
 */
export function getExtensions(format: SupportedFormat): readonly string[] {
  const formatInfo = FORMAT_REGISTRY[format];
  return formatInfo?.extensions ?? [];
}

/**
 * Get MIME type for a format
 */
export function getMimeType(format: SupportedFormat): string {
  const formatInfo = FORMAT_REGISTRY[format];
  return formatInfo?.mimeTypes[0] ?? 'application/octet-stream';
}

/**
 * Get all MIME types for a format
 */
export function getMimeTypes(format: SupportedFormat): readonly string[] {
  const formatInfo = FORMAT_REGISTRY[format];
  return formatInfo?.mimeTypes ?? [];
}

/**
 * Get format information
 */
export function getFormatInfo(format: SupportedFormat): FormatInfo | undefined {
  return FORMAT_REGISTRY[format];
}

/**
 * Check if a format is supported
 */
export function isSupported(format: string): format is SupportedFormat {
  return SUPPORTED_FORMATS.includes(format as SupportedFormat);
}

/**
 * Detect format from file extension
 */
export function detectFormatFromExtension(filename: string): SupportedFormat | undefined {
  const ext = extname(filename).toLowerCase();

  for (const [format, info] of Object.entries(FORMAT_REGISTRY)) {
    if (info.extensions.includes(ext)) {
      return format as SupportedFormat;
    }
  }

  return undefined;
}

/**
 * Detect format from MIME type
 */
export function detectFormatFromMimeType(mimeType: string): SupportedFormat | undefined {
  const normalizedMimeType = mimeType.toLowerCase().split(';')[0]?.trim();

  for (const [format, info] of Object.entries(FORMAT_REGISTRY)) {
    if (info.mimeTypes.includes(normalizedMimeType)) {
      return format as SupportedFormat;
    }
  }

  return undefined;
}

/**
 * Change file extension to match format
 */
export function changeExtension(filename: string, format: SupportedFormat): string {
  const parsed = parsePath(filename);
  const newExtension = getExtension(format);
  return `${parsed.dir}${parsed.dir ? '/' : ''}${parsed.name}${newExtension}`;
}

/**
 * Generate output filename with format extension
 */
export function generateOutputFilename(
  inputPath: string,
  format: SupportedFormat,
  suffix?: string
): string {
  const parsed = parsePath(inputPath);
  const newExtension = getExtension(format);
  const baseName = suffix ? `${parsed.name}${suffix}` : parsed.name;
  return `${parsed.dir}${parsed.dir ? '/' : ''}${baseName}${newExtension}`;
}

/**
 * Validate if content matches expected format
 */
export function validateFormat(
  content: string,
  expectedFormat: SupportedFormat
): FormatValidationResult {
  const validator = createValidator(expectedFormat);
  return validator(content);
}

/**
 * Create a validator for a specific format
 */
export function createValidator(format: SupportedFormat): FormatValidator {
  return (content: string): FormatValidationResult => {
    try {
      switch (format) {
        case 'json':
          JSON.parse(content);
          return { isValid: true, format, confidence: 1.0, errors: [] };

        case 'yaml':
        case 'yml':
          // Basic YAML validation - contains key:value patterns
          const hasYamlPattern = /^[\s]*[\w-]+[\s]*:/.test(content);
          const confidence = hasYamlPattern ? 0.8 : 0.2;
          return {
            isValid: hasYamlPattern,
            format,
            confidence,
            errors: hasYamlPattern ? [] : ['No YAML patterns detected'],
          };

        case 'csv':
        case 'tsv':
          const delimiter = format === 'csv' ? ',' : '\t';
          const lines = content.trim().split('\n');
          const hasDelimiters = lines.some(line => line.includes(delimiter));
          const confidenceLevel = hasDelimiters ? 0.9 : 0.3;
          return {
            isValid: hasDelimiters,
            format,
            confidence: confidenceLevel,
            errors: hasDelimiters ? [] : [`No ${delimiter} delimiters found`],
          };

        case 'xml':
          const hasXmlPattern = /<[\w-]+[^>]*>.*<\/[\w-]+>/.test(content.trim());
          const xmlConfidence = hasXmlPattern ? 0.9 : 0.1;
          return {
            isValid: hasXmlPattern,
            format,
            confidence: xmlConfidence,
            errors: hasXmlPattern ? [] : ['No XML tags detected'],
          };

        default:
          return {
            isValid: false,
            format,
            confidence: 0,
            errors: [`Validation not implemented for format: ${format}`],
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      return {
        isValid: false,
        format,
        confidence: 0,
        errors: [errorMessage],
      };
    }
  };
}

/**
 * Auto-detect format from filename and/or content
 */
export function detectFormat(options: FormatDetectionOptions): Result<SupportedFormat> {
  const { filename, content, strict = false } = options;

  // Try filename first
  if (filename) {
    const formatFromExtension = detectFormatFromExtension(filename);
    if (formatFromExtension) {
      // If we have content and strict mode, validate it matches
      if (content && strict) {
        const validation = validateFormat(content, formatFromExtension);
        if (!validation.isValid) {
          return Err(
            createError(
              'FORMAT_VALIDATION_FAILED',
              `Content does not match expected format ${formatFromExtension}`,
              { recoverable: false }
            )
          );
        }
      }
      return Ok(formatFromExtension);
    }
  }

  // Try content detection if no filename match
  if (content) {
    const candidates: Array<{ format: SupportedFormat; confidence: number }> = [];

    for (const format of SUPPORTED_FORMATS) {
      const validation = validateFormat(content, format);
      if (validation.isValid || validation.confidence > 0.5) {
        candidates.push({ format, confidence: validation.confidence });
      }
    }

    // Sort by confidence and return the best match
    candidates.sort((a, b) => b.confidence - a.confidence);
    const bestMatch = candidates[0];

    if (bestMatch && (bestMatch.confidence > 0.7 || !strict)) {
      return Ok(bestMatch.format);
    }
  }

  return Err(
    createError('FORMAT_DETECTION_FAILED', 'Could not detect format from filename or content', {
      recoverable: true,
      suggestion: 'Try specifying the format explicitly',
    })
  );
}

/**
 * Get all supported formats
 */
export function getSupportedFormats(): readonly SupportedFormat[] {
  return SUPPORTED_FORMATS;
}

/**
 * Check if format supports binary content
 */
export function isBinaryFormat(format: SupportedFormat): boolean {
  const formatInfo = FORMAT_REGISTRY[format];
  return formatInfo?.binary ?? false;
}
