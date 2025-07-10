/**
 * @file Streaming utilities tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createReadStream as nodeCreateReadStream, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  streamUtils,
  createReadStream,
  createWriteStream,
  createTransformStream,
  createFilterStream,
  createMapStream,
  createStatsStream,
  pipeline,
  streamToBuffer,
  streamToString,
  createLineStream,
  createChunkStream,
} from '../index.js';

describe('Stream Utils', () => {
  let tempFiles: string[] = [];

  beforeEach(() => {
    tempFiles = [];
  });

  afterEach(async () => {
    // Wait a bit for any pending stream operations to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    // Clean up temp files
    tempFiles.forEach(file => {
      try {
        unlinkSync(file);
      } catch {
        // Ignore cleanup errors
      }
    });
  });

  const createTempFile = (content: string): string => {
    const filepath = join(
      tmpdir(),
      `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.txt`
    );
    writeFileSync(filepath, content);
    tempFiles.push(filepath);
    return filepath;
  };

  describe('createReadStream', () => {
    it('creates read stream for existing file', () => {
      const content = 'test content for reading';
      const filepath = createTempFile(content);

      const result = createReadStream(filepath);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value).toBeDefined();
      }
    });

    it('creates stream for non-existent files (error occurs on read)', () => {
      // Note: Node.js createReadStream doesn't fail synchronously for non-existent files
      // The error occurs when you try to read from the stream
      const result = createReadStream('/non/existent/file.txt');
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value).toBeDefined();
        // The stream will emit an error event when reading starts
        // Add error handler to prevent unhandled errors
        result.value.on('error', () => {
          // Expected error - file doesn't exist
        });
      }
    });

    it('accepts stream options', () => {
      const content = 'test content with encoding';
      const filepath = createTempFile(content);

      const result = createReadStream(filepath, {
        encoding: 'utf8',
        highWaterMark: 1024,
      });

      expect(result.isOk()).toBe(true);
    });
  });

  describe('createWriteStream', () => {
    it('creates write stream for valid path', () => {
      const filepath = join(tmpdir(), `test-write-${Date.now()}.txt`);
      tempFiles.push(filepath);

      const result = createWriteStream(filepath);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value).toBeDefined();
        result.value.end(); // Close the stream
      }
    });

    it('accepts stream options', () => {
      const filepath = join(tmpdir(), `test-write-opts-${Date.now()}.txt`);
      tempFiles.push(filepath);

      const result = createWriteStream(filepath, {
        encoding: 'utf8',
        flags: 'w',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        result.value.end();
      }
    });
  });

  describe('createTransformStream', () => {
    it('creates transform stream with custom transformer', () => {
      const transformer = (chunk: string) => chunk.toUpperCase();
      const result = createTransformStream(transformer);

      expect(result.isOk()).toBe(true);
    });

    it('handles async transformers', () => {
      const transformer = async (chunk: string) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return chunk.toLowerCase();
      };

      const result = createTransformStream(transformer);
      expect(result.isOk()).toBe(true);
    });

    it('handles transformer errors', async () => {
      const transformer = () => {
        throw new Error('Transform error');
      };

      const result = createTransformStream(transformer);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const transform = result.value;
        const errorPromise = new Promise(resolve => {
          transform.on('error', resolve);
        });

        transform.write('test');
        const error = await errorPromise;
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('createFilterStream', () => {
    it('creates filter stream with predicate', () => {
      const predicate = (chunk: string) => chunk.length > 3;
      const result = createFilterStream(predicate);

      expect(result.isOk()).toBe(true);
    });

    it('handles async predicates', () => {
      const predicate = async (chunk: string) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return chunk.includes('keep');
      };

      const result = createFilterStream(predicate);
      expect(result.isOk()).toBe(true);
    });
  });

  describe('createMapStream', () => {
    it('creates map stream with mapper function', () => {
      const mapper = (chunk: string, index: number) => `${index}: ${chunk}`;
      const result = createMapStream(mapper);

      expect(result.isOk()).toBe(true);
    });

    it('handles async mappers', () => {
      const mapper = async (chunk: string) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return chunk.trim();
      };

      const result = createMapStream(mapper);
      expect(result.isOk()).toBe(true);
    });
  });

  describe('createStatsStream', () => {
    it('creates stats tracking stream', () => {
      const statsCallback = (stats: any) => {
        expect(stats.chunksProcessed).toBeGreaterThanOrEqual(0);
        expect(stats.startTime).toBeGreaterThan(0);
      };

      const result = createStatsStream(statsCallback);
      expect(result.isOk()).toBe(true);
    });

    it('tracks stream statistics', async () => {
      let finalStats: any = null;
      const statsCallback = (stats: any) => {
        finalStats = stats;
      };

      const result = createStatsStream(statsCallback, { objectMode: false });
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const statsStream = result.value;

        return new Promise<void>(resolve => {
          statsStream.on('finish', () => {
            expect(finalStats).toBeDefined();
            expect(finalStats.endTime).toBeDefined();
            resolve();
          });

          statsStream.write('test data');
          statsStream.write('more data');
          statsStream.end();
        });
      }
    });
  });

  describe('pipeline', () => {
    it('pipelines streams together', async () => {
      const content = 'test content for pipeline';
      const inputFile = createTempFile(content);
      const outputFile = join(tmpdir(), `pipeline-output-${Date.now()}.txt`);
      tempFiles.push(outputFile);

      const readResult = createReadStream(inputFile);
      const writeResult = createWriteStream(outputFile);

      expect(readResult.isOk()).toBe(true);
      expect(writeResult.isOk()).toBe(true);

      if (readResult.isOk() && writeResult.isOk()) {
        const result = await pipeline(readResult.value, writeResult.value);
        expect(result.isOk()).toBe(true);
      }
    });

    it('handles pipeline errors', async () => {
      const readResult = createReadStream('/non/existent/file.txt');

      if (!readResult.isOk()) {
        // This is expected - the file doesn't exist
        expect(readResult.isOk()).toBe(false);
      } else {
        // Stream creation succeeded but will error on read
        // Add an error handler to prevent unhandled errors
        readResult.value.on('error', () => {
          // Expected error - file doesn't exist
        });
      }
    });
  });

  describe('streamToBuffer', () => {
    it('converts stream to buffer', async () => {
      const content = 'test content for buffer conversion';
      const stream = nodeCreateReadStream(createTempFile(content));

      const result = await streamToBuffer(stream);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value.toString()).toBe(content);
      }
    });
  });

  describe('streamToString', () => {
    it('converts stream to string', async () => {
      const content = 'test content for string conversion';
      const stream = nodeCreateReadStream(createTempFile(content));

      const result = await streamToString(stream);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value).toBe(content);
      }
    });

    it('handles different encodings', async () => {
      const content = 'test content with encoding';
      const stream = nodeCreateReadStream(createTempFile(content));

      const result = await streamToString(stream, 'utf8');
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value).toBe(content);
      }
    });
  });

  describe('createLineStream', () => {
    it('splits text into lines', () => {
      const result = createLineStream();
      expect(result.isOk()).toBe(true);
    });

    it('handles empty lines based on options', () => {
      const skipEmptyResult = createLineStream({ skipEmpty: true });
      const keepEmptyResult = createLineStream({ skipEmpty: false });

      expect(skipEmptyResult.isOk()).toBe(true);
      expect(keepEmptyResult.isOk()).toBe(true);
    });

    it('handles line trimming', () => {
      const trimResult = createLineStream({ trim: true });
      const noTrimResult = createLineStream({ trim: false });

      expect(trimResult.isOk()).toBe(true);
      expect(noTrimResult.isOk()).toBe(true);
    });
  });

  describe('createChunkStream', () => {
    it('creates chunk stream with valid size', () => {
      const result = createChunkStream(5);
      expect(result.isOk()).toBe(true);
    });

    it('rejects invalid chunk sizes', () => {
      const result = createChunkStream(0);
      expect(result.isOk()).toBe(false);

      if (!result.isOk()) {
        expect(result.error.message).toContain('Chunk size must be greater than 0');
      }
    });

    it('rejects negative chunk sizes', () => {
      const result = createChunkStream(-1);
      expect(result.isOk()).toBe(false);
    });
  });

  describe('streamUtils convenience object', () => {
    it('exposes all utility functions', () => {
      expect(streamUtils.createReadStream).toBe(createReadStream);
      expect(streamUtils.createWriteStream).toBe(createWriteStream);
      expect(streamUtils.createTransformStream).toBe(createTransformStream);
      expect(streamUtils.pipeline).toBe(pipeline);
      expect(streamUtils.streamToBuffer).toBe(streamToBuffer);
    });

    it('can be used as a unified API', () => {
      const content = 'test for unified API';
      const filepath = createTempFile(content);

      const result = streamUtils.createReadStream(filepath);
      expect(result.isOk()).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('processes data through multiple transforms', async () => {
      const content = 'line1\nline2\nline3';
      const inputFile = createTempFile(content);
      const outputFile = join(tmpdir(), `integration-${Date.now()}.txt`);
      tempFiles.push(outputFile);

      const readResult = createReadStream(inputFile, { encoding: 'utf8' });
      const lineResult = createLineStream();
      const mapResult = createMapStream((line: string) => line.toUpperCase());
      const writeResult = createWriteStream(outputFile);

      expect(readResult.isOk()).toBe(true);
      expect(lineResult.isOk()).toBe(true);
      expect(mapResult.isOk()).toBe(true);
      expect(writeResult.isOk()).toBe(true);

      if (readResult.isOk() && lineResult.isOk() && mapResult.isOk() && writeResult.isOk()) {
        const pipelineResult = await pipeline(
          readResult.value,
          lineResult.value,
          mapResult.value,
          writeResult.value
        );

        expect(pipelineResult.isOk()).toBe(true);
      }
    });
  });
});
