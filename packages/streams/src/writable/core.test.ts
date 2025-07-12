import { describe, it, expect } from 'vitest';
import { createWritableOperations } from './core.js';

describe('Writable Stream Operations', () => {
  const writableOps = createWritableOperations();

  describe('createToArray', () => {
    it('should create writable stream that writes to array', async () => {
      const target: number[] = [];
      const streamResult = writableOps.createToArray(target);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;

        // Write some data
        stream.write(1);
        stream.write(2);
        stream.write(3);

        const endResult = await writableOps.end(stream);
        expect(endResult.isOk()).toBe(true);
        expect(target).toEqual([1, 2, 3]);
      }
    });

    it('should handle object mode', async () => {
      const target: any[] = [];
      const streamResult = writableOps.createToArray(target, { objectMode: true });

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;

        stream.write({ id: 1 });
        stream.write({ id: 2 });

        const endResult = await writableOps.end(stream);
        expect(endResult.isOk()).toBe(true);
        expect(target).toEqual([{ id: 1 }, { id: 2 }]);
      }
    });

    it('should handle empty writes', async () => {
      const target: number[] = [];
      const streamResult = writableOps.createToArray(target);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const endResult = await writableOps.end(streamResult.value);
        expect(endResult.isOk()).toBe(true);
        expect(target).toEqual([]);
      }
    });
  });

  describe('createToCallback', () => {
    it('should create writable stream that calls callback', async () => {
      const received: number[] = [];
      const callback = (data: number) => {
        received.push(data * 2);
      };

      const streamResult = writableOps.createToCallback(callback);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;

        stream.write(1);
        stream.write(2);
        stream.write(3);

        const endResult = await writableOps.end(stream);
        expect(endResult.isOk()).toBe(true);
        expect(received).toEqual([2, 4, 6]);
      }
    });

    it('should handle async callback', async () => {
      const received: string[] = [];
      const callback = async (data: string) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        received.push(data.toUpperCase());
      };

      const streamResult = writableOps.createToCallback(callback);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;

        stream.write('hello');
        stream.write('world');

        const endResult = await writableOps.end(stream);
        expect(endResult.isOk()).toBe(true);
        expect(received).toEqual(['HELLO', 'WORLD']);
      }
    });

    it('should handle callback errors', async () => {
      const callback = (data: number) => {
        if (data === 2) {
          throw new Error('Callback error');
        }
      };

      const streamResult = writableOps.createToCallback(callback);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;

        stream.write(1);

        return new Promise<void>(resolve => {
          stream.on('error', error => {
            expect(error.message).toBe('Callback error');
            resolve();
          });

          stream.write(2); // This should trigger the error
        });
      }
    });
  });

  describe('writeAll', () => {
    it('should write all data to stream', async () => {
      const target: number[] = [];
      const streamResult = writableOps.createToArray(target);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const data = [1, 2, 3, 4, 5];
        const writeResult = await writableOps.writeAll(streamResult.value, data);

        expect(writeResult.isOk()).toBe(true);
        expect(target).toEqual(data);
      }
    });

    it('should handle large data arrays', async () => {
      const target: number[] = [];
      const streamResult = writableOps.createToArray(target);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const data = Array.from({ length: 1000 }, (_, i) => i);
        const writeResult = await writableOps.writeAll(streamResult.value, data);

        expect(writeResult.isOk()).toBe(true);
        expect(target).toEqual(data);
      }
    });

    it('should handle empty data array', async () => {
      const target: number[] = [];
      const streamResult = writableOps.createToArray(target);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const writeResult = await writableOps.writeAll(streamResult.value, []);

        expect(writeResult.isOk()).toBe(true);
        expect(target).toEqual([]);
      }
    });
  });

  describe('end', () => {
    it('should end writable stream', async () => {
      const target: number[] = [];
      const streamResult = writableOps.createToArray(target);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;

        stream.write(1);
        stream.write(2);

        const endResult = await writableOps.end(stream);
        expect(endResult.isOk()).toBe(true);
        expect(target).toEqual([1, 2]);
        expect(stream.writableEnded).toBe(true);
      }
    });

    it('should handle already ended stream', async () => {
      const target: number[] = [];
      const streamResult = writableOps.createToArray(target);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;

        // End the stream first time
        const firstEndResult = await writableOps.end(stream);
        expect(firstEndResult.isOk()).toBe(true);

        // Try to end again
        const secondEndResult = await writableOps.end(stream);
        expect(secondEndResult.isErr()).toBe(true);
      }
    });
  });
});
