/**
 * file-type detection functions wrapped with Result<T> patterns
 */

import {
  fileTypeFromFile,
  fileTypeFromBuffer,
  fileTypeFromStream,
  fileTypeFromBlob,
} from 'file-type';
import type { Result } from '../core/errors/types.js';
import { Ok, Err, createError } from '../core/errors/factory.js';
import type {
  FormatDetectionResult,
  FormatDetectionOptions,
  StreamDetectionOptions,
} from './types.js';

/**
 * Detect file type from file path using magic numbers
 */
export async function detectFromFile(
  filePath: string,
  _options: FormatDetectionOptions = {}
): Promise<Result<FormatDetectionResult>> {
  try {
    const result = await fileTypeFromFile(filePath);

    if (!result) {
      return Err(
        createError('FORMAT_NOT_DETECTED', `Unable to detect format for file: ${filePath}`, {
          recoverable: true,
          suggestion: 'File may be corrupted, empty, or unsupported format',
        })
      );
    }

    return Ok({
      ...result,
      confidence: 0.95, // High confidence for magic number detection
      detectionMethod: 'magic-number' as const,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Err(
      createError('FILE_ACCESS_ERROR', `Cannot access file for format detection: ${filePath}`, {
        details: message,
        recoverable: false,
        suggestion: 'Check file exists and permissions',
      })
    );
  }
}

/**
 * Detect file type from buffer using magic numbers
 */
export async function detectFromBuffer(
  buffer: Uint8Array | ArrayBuffer,
  _options: FormatDetectionOptions = {}
): Promise<Result<FormatDetectionResult>> {
  try {
    const result = await fileTypeFromBuffer(buffer);

    if (!result) {
      return Err(
        createError('FORMAT_NOT_DETECTED', 'Unable to detect format from buffer content', {
          recoverable: true,
          suggestion: 'Buffer may contain unsupported format or insufficient data',
        })
      );
    }

    return Ok({
      ...result,
      confidence: 0.95,
      detectionMethod: 'magic-number' as const,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Err(
      createError('BUFFER_PROCESSING_ERROR', 'Error processing buffer for format detection', {
        details: message,
        recoverable: false,
      })
    );
  }
}

/**
 * Detect file type from readable stream
 */
export async function detectFromStream(
  stream: ReadableStream | NodeJS.ReadableStream,
  _options: StreamDetectionOptions = {}
): Promise<Result<FormatDetectionResult>> {
  try {
    const result = await fileTypeFromStream(stream as any);

    if (!result) {
      return Err(
        createError('FORMAT_NOT_DETECTED', 'Unable to detect format from stream', {
          recoverable: true,
          suggestion: 'Stream may contain unsupported format or insufficient data',
        })
      );
    }

    return Ok({
      ...result,
      confidence: 0.9, // Slightly lower for streams
      detectionMethod: 'magic-number' as const,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Err(
      createError('STREAM_PROCESSING_ERROR', 'Error processing stream for format detection', {
        details: message,
        recoverable: false,
      })
    );
  }
}

/**
 * Detect file type from Blob (browser/File API)
 */
export async function detectFromBlob(
  blob: Blob,
  _options: FormatDetectionOptions = {}
): Promise<Result<FormatDetectionResult>> {
  try {
    const result = await fileTypeFromBlob(blob);

    if (!result) {
      return Err(
        createError('FORMAT_NOT_DETECTED', 'Unable to detect format from blob', {
          recoverable: true,
          suggestion: 'Blob may contain unsupported format or insufficient data',
        })
      );
    }

    return Ok({
      ...result,
      confidence: 0.93,
      detectionMethod: 'magic-number' as const,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Err(
      createError('BLOB_PROCESSING_ERROR', 'Error processing blob for format detection', {
        details: message,
        recoverable: false,
      })
    );
  }
}
