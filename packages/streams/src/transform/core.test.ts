import { describe, it, expect } from 'vitest';
import { createTransformOperations } from './core.js';
import { createReadableOperations } from '../readable/core.js';
import { createWritableOperations } from '../writable/core.js';
import { ok } from '@trailhead/core';

describe('Transform Stream Operations', () => {
  const transformOps = createTransformOperations();
  const readableOps = createReadableOperations();
  const writableOps = createWritableOperations();

  describe('map', () => {
    it('should transform items with mapper function', async () => {
      const data = [1, 2, 3, 4, 5];
      const target: number[] = [];

      const readableResult = readableOps.createFromArray(data);
      const writableResult = writableOps.createToArray(target);
      const transformResult = transformOps.map((item: number) => ok(item * 2));

      expect(readableResult.isOk()).toBe(true);
      expect(writableResult.isOk()).toBe(true);
      expect(transformResult.isOk()).toBe(true);

      if (readableResult.isOk() && writableResult.isOk() && transformResult.isOk()) {
        return new Promise<void>(resolve => {
          const readable = readableResult.value;
          const transform = transformResult.value;
          const writable = writableResult.value;

          writable.on('finish', () => {
            expect(target).toEqual([2, 4, 6, 8, 10]);
            resolve();
          });

          readable.pipe(transform).pipe(writable);
        });
      }
    });

    it('should handle async mapper', async () => {
      const data = ['hello', 'world'];
      const target: string[] = [];

      const readableResult = readableOps.createFromArray(data);
      const writableResult = writableOps.createToArray(target);
      const transformResult = transformOps.map(async (item: string) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return ok(item.toUpperCase());
      });

      expect(readableResult.isOk()).toBe(true);
      expect(writableResult.isOk()).toBe(true);
      expect(transformResult.isOk()).toBe(true);

      if (readableResult.isOk() && writableResult.isOk() && transformResult.isOk()) {
        return new Promise<void>(resolve => {
          const readable = readableResult.value;
          const transform = transformResult.value;
          const writable = writableResult.value;

          writable.on('finish', () => {
            expect(target).toEqual(['HELLO', 'WORLD']);
            resolve();
          });

          readable.pipe(transform).pipe(writable);
        });
      }
    });
  });

  describe('filter', () => {
    it('should filter items based on predicate', async () => {
      const data = [1, 2, 3, 4, 5, 6];
      const target: number[] = [];

      const readableResult = readableOps.createFromArray(data);
      const writableResult = writableOps.createToArray(target);
      const transformResult = transformOps.filter((item: number) => item % 2 === 0);

      expect(readableResult.isOk()).toBe(true);
      expect(writableResult.isOk()).toBe(true);
      expect(transformResult.isOk()).toBe(true);

      if (readableResult.isOk() && writableResult.isOk() && transformResult.isOk()) {
        return new Promise<void>(resolve => {
          const readable = readableResult.value;
          const transform = transformResult.value;
          const writable = writableResult.value;

          writable.on('finish', () => {
            expect(target).toEqual([2, 4, 6]);
            resolve();
          });

          readable.pipe(transform).pipe(writable);
        });
      }
    });

    it('should handle async predicate', async () => {
      const data = [1, 2, 3, 4];
      const target: number[] = [];

      const readableResult = readableOps.createFromArray(data);
      const writableResult = writableOps.createToArray(target);
      const transformResult = transformOps.filter(async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return item > 2;
      });

      expect(readableResult.isOk()).toBe(true);
      expect(writableResult.isOk()).toBe(true);
      expect(transformResult.isOk()).toBe(true);

      if (readableResult.isOk() && writableResult.isOk() && transformResult.isOk()) {
        return new Promise<void>(resolve => {
          const readable = readableResult.value;
          const transform = transformResult.value;
          const writable = writableResult.value;

          writable.on('finish', () => {
            expect(target).toEqual([3, 4]);
            resolve();
          });

          readable.pipe(transform).pipe(writable);
        });
      }
    });
  });

  describe('batch', () => {
    it('should batch items by size', async () => {
      const data = [1, 2, 3, 4, 5, 6, 7];
      const target: number[][] = [];

      const readableResult = readableOps.createFromArray(data);
      const writableResult = writableOps.createToArray(target);
      const transformResult = transformOps.batch({ batchSize: 3 });

      expect(readableResult.isOk()).toBe(true);
      expect(writableResult.isOk()).toBe(true);
      expect(transformResult.isOk()).toBe(true);

      if (readableResult.isOk() && writableResult.isOk() && transformResult.isOk()) {
        return new Promise<void>(resolve => {
          const readable = readableResult.value;
          const transform = transformResult.value;
          const writable = writableResult.value;

          writable.on('finish', () => {
            expect(target).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
            resolve();
          });

          readable.pipe(transform).pipe(writable);
        });
      }
    });

    it('should handle empty stream', async () => {
      const data: number[] = [];
      const target: number[][] = [];

      const readableResult = readableOps.createFromArray(data);
      const writableResult = writableOps.createToArray(target);
      const transformResult = transformOps.batch({ batchSize: 3 });

      expect(readableResult.isOk()).toBe(true);
      expect(writableResult.isOk()).toBe(true);
      expect(transformResult.isOk()).toBe(true);

      if (readableResult.isOk() && writableResult.isOk() && transformResult.isOk()) {
        return new Promise<void>(resolve => {
          const readable = readableResult.value;
          const transform = transformResult.value;
          const writable = writableResult.value;

          writable.on('finish', () => {
            expect(target).toEqual([]);
            resolve();
          });

          readable.pipe(transform).pipe(writable);
        });
      }
    });
  });

  describe('debounce', () => {
    it('should debounce rapid items', async () => {
      const data = [1, 2, 3];
      const target: number[] = [];

      const readableResult = readableOps.createFromArray(data);
      const writableResult = writableOps.createToArray(target);
      const transformResult = transformOps.debounce(10);

      expect(readableResult.isOk()).toBe(true);
      expect(writableResult.isOk()).toBe(true);
      expect(transformResult.isOk()).toBe(true);

      if (readableResult.isOk() && writableResult.isOk() && transformResult.isOk()) {
        return new Promise<void>(resolve => {
          const readable = readableResult.value;
          const transform = transformResult.value;
          const writable = writableResult.value;

          writable.on('finish', () => {
            // Debounce should only emit the last value
            expect(target).toEqual([3]);
            resolve();
          });

          readable.pipe(transform).pipe(writable);
        });
      }
    });
  });

  describe('throttle', () => {
    it('should throttle rapid items', async () => {
      const data = [1, 2, 3, 4, 5];
      const target: number[] = [];

      const readableResult = readableOps.createFromArray(data);
      const writableResult = writableOps.createToArray(target);
      const transformResult = transformOps.throttle(50);

      expect(readableResult.isOk()).toBe(true);
      expect(writableResult.isOk()).toBe(true);
      expect(transformResult.isOk()).toBe(true);

      if (readableResult.isOk() && writableResult.isOk() && transformResult.isOk()) {
        return new Promise<void>(resolve => {
          const readable = readableResult.value;
          const transform = transformResult.value;
          const writable = writableResult.value;

          writable.on('finish', () => {
            // Throttle should emit first item immediately and last item after delay
            expect(target.length).toBeGreaterThan(0);
            expect(target[0]).toBe(1);
            resolve();
          });

          readable.pipe(transform).pipe(writable);
        });
      }
    });
  });

  describe('compress and decompress', () => {
    it('should compress and decompress data', async () => {
      const data = 'Hello, World! This is a test string for compression.';
      const compressedTarget: Buffer[] = [];
      const decompressedTarget: Buffer[] = [];

      const readableResult = readableOps.createFromArray([Buffer.from(data)]);
      const compressResult = transformOps.compress();
      const decompressResult = transformOps.decompress();
      const compressedWritableResult = writableOps.createToArray(compressedTarget);
      const decompressedWritableResult = writableOps.createToArray(decompressedTarget);

      expect(readableResult.isOk()).toBe(true);
      expect(compressResult.isOk()).toBe(true);
      expect(decompressResult.isOk()).toBe(true);
      expect(compressedWritableResult.isOk()).toBe(true);
      expect(decompressedWritableResult.isOk()).toBe(true);

      if (
        readableResult.isOk() &&
        compressResult.isOk() &&
        decompressResult.isOk() &&
        compressedWritableResult.isOk() &&
        decompressedWritableResult.isOk()
      ) {
        return new Promise<void>(resolve => {
          const readable = readableResult.value;
          const compress = compressResult.value;
          const decompress = decompressResult.value;
          const compressedWritable = compressedWritableResult.value;
          const decompressedWritable = decompressedWritableResult.value;

          let step = 0;

          compressedWritable.on('finish', () => {
            step++;
            if (step === 1) {
              // Now decompress
              const compressedData = Buffer.concat(compressedTarget);
              const decompressReadableResult = readableOps.createFromArray([compressedData]);

              if (decompressReadableResult.isOk()) {
                decompressReadableResult.value.pipe(decompress).pipe(decompressedWritable);
              }
            }
          });

          decompressedWritable.on('finish', () => {
            const decompressedData = Buffer.concat(decompressedTarget).toString();
            expect(decompressedData).toBe(data);
            resolve();
          });

          readable.pipe(compress).pipe(compressedWritable);
        });
      }
    });
  });
});
