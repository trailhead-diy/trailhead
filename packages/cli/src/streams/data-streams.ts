/**
 * Specialized streams for common data processing tasks
 */

import { Transform } from 'node:stream';
import type { Result, CLIError } from '../core/errors/types.js';
import { ok, err } from '../core/errors/utils.js';
import { createError } from '../core/errors/factory.js';
import type { TransformStreamOptions, StreamTransformer } from './types.js';
import { createTransformStream } from './core.js';

export interface CSVStreamOptions extends TransformStreamOptions {
  readonly delimiter?: string;
  readonly quote?: string;
  readonly escape?: string;
  readonly headers?: boolean;
  readonly skipEmptyLines?: boolean;
}

export interface JSONLStreamOptions extends TransformStreamOptions {
  readonly pretty?: boolean;
  readonly indent?: number;
}

export interface LineStreamOptions extends TransformStreamOptions {
  readonly skipEmpty?: boolean;
  readonly trim?: boolean;
}

/**
 * Create a stream that parses CSV data line by line
 */
export function createCSVParseStream(options: CSVStreamOptions = {}): Result<Transform, CLIError> {
  const {
    delimiter = ',',
    quote = '"',
    escape: _escape = '"',
    headers = true,
    skipEmptyLines = true,
  } = options;

  let headerRow: string[] | null = headers ? null : [];
  let _rowIndex = 0;

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === quote) {
        if (inQuotes && nextChar === quote) {
          // Escaped quote
          current += quote;
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === delimiter && !inQuotes) {
        // Field separator
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current);
    return result;
  };

  const transformer: StreamTransformer<string, Record<string, string> | null> = line => {
    const trimmedLine = line.trim();

    if (skipEmptyLines && !trimmedLine) {
      return null;
    }

    const fields = parseCSVLine(trimmedLine);

    if (headers && headerRow === null) {
      headerRow = fields;
      return null;
    }

    if (headers && headerRow) {
      const record: Record<string, string> = {};
      for (let i = 0; i < Math.max(fields.length, headerRow.length); i++) {
        const key = headerRow[i] || `column_${i}`;
        const value = fields[i] || '';
        record[key] = value;
      }
      _rowIndex++;
      return record;
    }

    // No headers - return array as object with numeric keys
    const record: Record<string, string> = {};
    fields.forEach((field, index) => {
      record[index.toString()] = field;
    });
    _rowIndex++;
    return record;
  };

  return createTransformStream(transformer, {
    ...options,
    objectMode: true,
  });
}

/**
 * Create a stream that converts objects to CSV format
 */
export function createCSVStringifyStream(
  options: CSVStreamOptions = {}
): Result<Transform, CLIError> {
  const { delimiter = ',', quote = '"', headers = true } = options;

  let headerWritten = false;
  const seenKeys = new Set<string>();

  const escapeField = (field: string): string => {
    if (field.includes(delimiter) || field.includes(quote) || field.includes('\n')) {
      return `${quote}${field.replace(new RegExp(quote, 'g'), quote + quote)}${quote}`;
    }
    return field;
  };

  const transformer: StreamTransformer<Record<string, any>, string> = record => {
    const keys = Object.keys(record);
    keys.forEach(key => seenKeys.add(key));

    if (headers && !headerWritten) {
      headerWritten = true;
      const headerLine = Array.from(seenKeys).map(escapeField).join(delimiter);
      const dataLine = Array.from(seenKeys)
        .map(key => escapeField(String(record[key] || '')))
        .join(delimiter);
      return `${headerLine}\n${dataLine}`;
    }

    const values = Array.from(seenKeys).map(key => escapeField(String(record[key] || '')));
    return values.join(delimiter);
  };

  return createTransformStream(transformer, {
    ...options,
    objectMode: true,
  });
}

/**
 * JSON Lines transformer function
 */
const jsonlTransformer: StreamTransformer<string, any> = line => {
  const trimmedLine = line.trim();
  if (!trimmedLine) {
    return null;
  }

  try {
    return JSON.parse(trimmedLine);
  } catch {
    throw new Error(`Invalid JSON on line: ${trimmedLine}`);
  }
};

/**
 * Create a stream that parses JSON Lines format
 */
export function createJSONLParseStream(
  options: JSONLStreamOptions = {}
): Result<Transform, CLIError> {
  return createTransformStream(jsonlTransformer, {
    ...options,
    objectMode: true,
  });
}

/**
 * Create a stream that converts objects to JSON Lines format
 */
export function createJSONLStringifyStream(
  options: JSONLStreamOptions = {}
): Result<Transform, CLIError> {
  const { pretty = false, indent = 2 } = options;

  const transformer: StreamTransformer<any, string> = obj => {
    if (pretty) {
      return JSON.stringify(obj, null, indent);
    }
    return JSON.stringify(obj);
  };

  return createTransformStream(transformer, {
    ...options,
    objectMode: true,
  });
}

/**
 * Create a stream that splits text into lines
 */
export function createLineStream(options: LineStreamOptions = {}): Result<Transform, CLIError> {
  const { skipEmpty = true, trim = true } = options;

  let buffer = '';

  const transformStream = new Transform({
    objectMode: options.objectMode ?? true,
    highWaterMark: options.highWaterMark,

    transform(chunk, _encoding, callback) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');

      // Keep the last part in buffer (might be incomplete line)
      buffer = lines.pop() || '';

      for (const line of lines) {
        let processedLine = trim ? line.trim() : line;

        if (skipEmpty && !processedLine) {
          continue;
        }

        this.push(processedLine);
      }

      callback();
    },

    flush(callback) {
      // Emit any remaining content in buffer
      if (buffer) {
        let processedLine = trim ? buffer.trim() : buffer;
        if (!skipEmpty || processedLine) {
          this.push(processedLine);
        }
      }
      callback();
    },
  });

  return ok(transformStream);
}

/**
 * Create a stream that chunks data into fixed-size arrays
 */
export function createChunkStream<T = any>(
  chunkSize: number,
  options: TransformStreamOptions = {}
): Result<Transform, CLIError> {
  if (chunkSize <= 0) {
    return err(
      createError('STREAM_INVALID_CHUNK_SIZE', 'Chunk size must be greater than 0', {
        recoverable: true,
        suggestion: 'Use a positive integer for chunk size',
      })
    );
  }

  let buffer: T[] = [];

  const transformStream = new Transform({
    objectMode: true,
    highWaterMark: options.highWaterMark,

    transform(chunk: T, _encoding, callback) {
      buffer.push(chunk);

      if (buffer.length >= chunkSize) {
        const currentChunk = buffer.slice(0, chunkSize);
        buffer = buffer.slice(chunkSize);
        this.push(currentChunk);
      }

      callback();
    },

    flush(callback) {
      // Emit remaining items if any
      if (buffer.length > 0) {
        this.push(buffer);
      }
      callback();
    },
  });

  return ok(transformStream);
}
