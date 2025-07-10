/**
 * Enhanced stream utilities with format detection
 */

import { fileTypeStream } from 'file-type';
import type { Result } from '../core/errors/types.js';
import { Ok, Err, createError } from '../core/errors/factory.js';
import type { FormatDetectionResult, StreamDetectionOptions } from './types.js';

/**
 * Enhance stream with file type detection
 */
export async function enhanceStream<T extends ReadableStream | NodeJS.ReadableStream>(
  stream: T,
  options: StreamDetectionOptions = {}
): Promise<Result<T & { fileType?: FormatDetectionResult }>> {
  try {
    const enhancedStream = await fileTypeStream(stream as any, options);

    if (!enhancedStream.fileType) {
      // Return stream without file type info
      return Ok(enhancedStream as unknown as T & { fileType?: FormatDetectionResult });
    }

    const detectionResult: FormatDetectionResult = {
      ...enhancedStream.fileType,
      confidence: 0.9,
      detectionMethod: 'magic-number' as const,
    };

    return Ok({
      ...enhancedStream,
      fileType: detectionResult,
    } as unknown as T & { fileType?: FormatDetectionResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Err(
      createError(
        'STREAM_ENHANCEMENT_ERROR',
        `Failed to enhance stream with file type detection: ${message}`,
        { details: message, recoverable: false }
      )
    );
  }
}

/**
 * Create readable stream with format detection
 */
export async function createDetectionStream(
  source: string | Buffer | Blob,
  options: StreamDetectionOptions = {}
): Promise<Result<ReadableStream & { fileType?: FormatDetectionResult }>> {
  try {
    let stream: ReadableStream;

    if (typeof source === 'string') {
      // Create stream from file path
      const fs = await import('node:fs');
      stream = fs.createReadStream(source) as unknown as ReadableStream;
    } else if (Buffer.isBuffer(source)) {
      // Create stream from buffer
      const { Readable } = await import('node:stream');
      stream = Readable.from(source) as unknown as ReadableStream;
    } else {
      // Create stream from blob
      stream = source.stream();
    }

    return enhanceStream(stream, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Err(
      createError('STREAM_CREATION_ERROR', `Failed to create detection stream: ${message}`, {
        details: message,
        recoverable: false,
      })
    );
  }
}
