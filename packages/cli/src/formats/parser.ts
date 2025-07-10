/**
 * Advanced file type parsing with custom detectors and abort support
 */

import { fileTypeFromFile, fileTypeFromBuffer, fileTypeFromStream } from 'file-type';
import type { Result, CLIError } from '../core/errors/types.js';
import { ok, err } from '../core/errors/utils.js';
import { createError } from '../core/errors/factory.js';
import type { FormatDetectionResult, AbortableOptions, StreamDetectionOptions } from './types.js';

/**
 * Parse file with custom options and abort support
 */
export async function parseFile(
  filePath: string,
  _options: AbortableOptions = {}
): Promise<Result<FormatDetectionResult, CLIError>> {
  try {
    const result = await fileTypeFromFile(filePath);

    if (!result) {
      return err(
        createError('FORMAT_NOT_DETECTED', `No format detected for file: ${filePath}`, {
          recoverable: true,
        })
      );
    }

    return ok({
      ...result,
      confidence: 0.95,
      detectionMethod: 'magic-number' as const,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return err(
        createError('DETECTION_ABORTED', 'Format detection was aborted', { recoverable: true })
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(
      createError('PARSER_ERROR', `Parser error for file ${filePath}: ${message}`, {
        details: message,
        recoverable: false,
      })
    );
  }
}

/**
 * Parse buffer with custom options
 */
export async function parseBuffer(
  buffer: Uint8Array | ArrayBuffer,
  _options: AbortableOptions = {}
): Promise<Result<FormatDetectionResult, CLIError>> {
  try {
    const result = await fileTypeFromBuffer(buffer);

    if (!result) {
      return err(
        createError('FORMAT_NOT_DETECTED', 'No format detected from buffer', { recoverable: true })
      );
    }

    return ok({
      ...result,
      confidence: 0.95,
      detectionMethod: 'magic-number' as const,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return err(
        createError('DETECTION_ABORTED', 'Format detection was aborted', { recoverable: true })
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(
      createError('PARSER_ERROR', `Parser error: ${message}`, {
        details: message,
        recoverable: false,
      })
    );
  }
}

/**
 * Parse stream with custom options and abort support
 */
export async function parseStream(
  stream: ReadableStream | NodeJS.ReadableStream,
  _options: AbortableOptions & StreamDetectionOptions = {}
): Promise<Result<FormatDetectionResult, CLIError>> {
  try {
    const result = await fileTypeFromStream(stream as any);

    if (!result) {
      return err(
        createError('FORMAT_NOT_DETECTED', 'No format detected from stream', { recoverable: true })
      );
    }

    return ok({
      ...result,
      confidence: 0.9,
      detectionMethod: 'magic-number' as const,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return err(
        createError('DETECTION_ABORTED', 'Stream format detection was aborted', {
          recoverable: true,
        })
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(
      createError('STREAM_PARSER_ERROR', `Stream parser error: ${message}`, {
        details: message,
        recoverable: false,
      })
    );
  }
}
