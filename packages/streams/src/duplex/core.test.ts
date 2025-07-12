import { describe, it, expect } from 'vitest';
import { createDuplexOperations } from './core.js';

describe('Duplex Stream Operations', () => {
  const duplexOps = createDuplexOperations();

  describe('createEcho', () => {
    it('should echo written data back to readable side', async () => {
      const streamResult = duplexOps.createEcho();

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;
        const receivedData: any[] = [];

        return new Promise<void>(resolve => {
          stream.on('data', chunk => {
            receivedData.push(chunk);
          });

          stream.on('end', () => {
            expect(receivedData).toEqual(['hello', 'world']);
            resolve();
          });

          // Write data that should be echoed back
          stream.write('hello');
          stream.write('world');
          stream.end();
        });
      }
    });

    it('should handle object mode', async () => {
      const streamResult = duplexOps.createEcho({ objectMode: true });

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;
        const receivedData: any[] = [];

        return new Promise<void>(resolve => {
          stream.on('data', chunk => {
            receivedData.push(chunk);
          });

          stream.on('end', () => {
            expect(receivedData).toEqual([{ id: 1 }, { id: 2 }]);
            resolve();
          });

          stream.write({ id: 1 });
          stream.write({ id: 2 });
          stream.end();
        });
      }
    });
  });

  describe('createBuffer', () => {
    it('should buffer data and make it available for reading', async () => {
      const streamResult = duplexOps.createBuffer<string>(3);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;
        const receivedData: string[] = [];

        return new Promise<void>(resolve => {
          stream.on('data', chunk => {
            receivedData.push(chunk);
          });

          stream.on('end', () => {
            expect(receivedData).toEqual(['first', 'second', 'third']);
            resolve();
          });

          // Write data to buffer
          stream.write('first');
          stream.write('second');
          stream.write('third');
          stream.end(); // This triggers the buffered data to become readable
        });
      }
    });

    it('should handle buffer overflow', async () => {
      const streamResult = duplexOps.createBuffer<string>(2);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;

        return new Promise<void>(resolve => {
          stream.on('error', error => {
            expect(error.message).toContain('Buffer overflow');
            resolve();
          });

          // Write data that exceeds buffer size
          stream.write('first');
          stream.write('second');
          stream.write('third'); // This should trigger overflow error
        });
      }
    });

    it('should handle empty buffer', async () => {
      const streamResult = duplexOps.createBuffer<string>(5);

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;
        const receivedData: string[] = [];

        return new Promise<void>(resolve => {
          stream.on('data', chunk => {
            receivedData.push(chunk);
          });

          stream.on('end', () => {
            expect(receivedData).toEqual([]);
            resolve();
          });

          stream.end(); // End without writing anything
        });
      }
    });
  });

  describe('createPassThrough', () => {
    it('should pass data through unchanged', async () => {
      const streamResult = duplexOps.createPassThrough();

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;
        const receivedData: any[] = [];

        return new Promise<void>(resolve => {
          stream.on('data', chunk => {
            receivedData.push(chunk);
          });

          stream.on('end', () => {
            expect(receivedData).toEqual(['test1', 'test2', 'test3']);
            resolve();
          });

          stream.write('test1');
          stream.write('test2');
          stream.write('test3');
          stream.end();
        });
      }
    });

    it('should handle object mode', async () => {
      const streamResult = duplexOps.createPassThrough({ objectMode: true });

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;
        const receivedData: any[] = [];

        return new Promise<void>(resolve => {
          stream.on('data', chunk => {
            receivedData.push(chunk);
          });

          stream.on('end', () => {
            expect(receivedData).toEqual([
              { type: 'start' },
              { type: 'data', value: 42 },
              { type: 'end' },
            ]);
            resolve();
          });

          stream.write({ type: 'start' });
          stream.write({ type: 'data', value: 42 });
          stream.write({ type: 'end' });
          stream.end();
        });
      }
    });

    it('should handle large amounts of data', async () => {
      const streamResult = duplexOps.createPassThrough();

      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const stream = streamResult.value;
        const receivedData: string[] = [];
        const inputData = ['chunk1', 'chunk2', 'chunk3', 'chunk4', 'chunk5'];

        return new Promise<void>(resolve => {
          stream.on('data', (chunk: string) => {
            receivedData.push(chunk);
          });

          stream.on('end', () => {
            expect(receivedData).toEqual(inputData);
            resolve();
          });

          // Write the data
          inputData.forEach(chunk => stream.write(chunk));
          stream.end();
        });
      }
    });
  });
});
