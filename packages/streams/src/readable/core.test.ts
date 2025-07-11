import { describe, it, expect } from 'vitest';
import { createReadableOperations } from './core.js';

describe('Readable Stream Operations', () => {
  const readableOps = createReadableOperations();

  describe('createFromArray', () => {
    it('should create a readable stream from array', async () => {
      const data = [1, 2, 3, 4, 5];
      const streamResult = readableOps.createFromArray(data);
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const arrayResult = await readableOps.toArray(streamResult.value);
        expect(arrayResult.isOk()).toBe(true);
        if (arrayResult.isOk()) {
          expect(arrayResult.value).toEqual(data);
        }
      }
    });

    it('should create empty stream from empty array', async () => {
      const streamResult = readableOps.createFromArray([]);
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const arrayResult = await readableOps.toArray(streamResult.value);
        expect(arrayResult.isOk()).toBe(true);
        if (arrayResult.isOk()) {
          expect(arrayResult.value).toEqual([]);
        }
      }
    });

    it('should handle object mode', async () => {
      const data = [{ id: 1 }, { id: 2 }];
      const streamResult = readableOps.createFromArray(data, { objectMode: true });
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const arrayResult = await readableOps.toArray(streamResult.value);
        expect(arrayResult.isOk()).toBe(true);
        if (arrayResult.isOk()) {
          expect(arrayResult.value).toEqual(data);
        }
      }
    });
  });

  describe('createFromIterator', () => {
    it('should create stream from iterable', async () => {
      const data = new Set([1, 2, 3]);
      const streamResult = readableOps.createFromIterator(data);
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const arrayResult = await readableOps.toArray(streamResult.value);
        expect(arrayResult.isOk()).toBe(true);
        if (arrayResult.isOk()) {
          expect(new Set(arrayResult.value)).toEqual(data);
        }
      }
    });

    it('should create stream from generator', async () => {
      function* numberGenerator() {
        yield 1;
        yield 2;
        yield 3;
      }
      
      const streamResult = readableOps.createFromIterator(numberGenerator());
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const arrayResult = await readableOps.toArray(streamResult.value);
        expect(arrayResult.isOk()).toBe(true);
        if (arrayResult.isOk()) {
          expect(arrayResult.value).toEqual([1, 2, 3]);
        }
      }
    });
  });

  describe('createFromAsyncIterator', () => {
    it('should create stream from async iterable', async () => {
      async function* asyncNumberGenerator() {
        yield 1;
        yield 2;
        yield 3;
      }
      
      const streamResult = readableOps.createFromAsyncIterator(asyncNumberGenerator());
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const arrayResult = await readableOps.toArray(streamResult.value);
        expect(arrayResult.isOk()).toBe(true);
        if (arrayResult.isOk()) {
          expect(arrayResult.value).toEqual([1, 2, 3]);
        }
      }
    });

    it('should handle async iterator errors', async () => {
      async function* errorGenerator() {
        yield 1;
        throw new Error('Async iterator error');
      }
      
      const streamResult = readableOps.createFromAsyncIterator(errorGenerator());
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const arrayResult = await readableOps.toArray(streamResult.value);
        expect(arrayResult.isErr()).toBe(true);
      }
    });
  });

  describe('forEach', () => {
    it('should process each item with sync function', async () => {
      const data = [1, 2, 3];
      const processed: number[] = [];
      
      const streamResult = readableOps.createFromArray(data);
      expect(streamResult.isOk()).toBe(true);
      
      if (streamResult.isOk()) {
        const forEachResult = await readableOps.forEach(streamResult.value, (item: number) => {
          processed.push(item * 2);
          return { isOk: () => true, isErr: () => false } as any;
        });
        
        expect(forEachResult.isOk()).toBe(true);
        expect(processed).toEqual([2, 4, 6]);
      }
    });

    it('should handle empty stream', async () => {
      const streamResult = readableOps.createFromArray([]);
      expect(streamResult.isOk()).toBe(true);
      
      if (streamResult.isOk()) {
        const forEachResult = await readableOps.forEach(streamResult.value, (_item: any) => {
          return { isOk: () => true, isErr: () => false } as any;
        });
        
        expect(forEachResult.isOk()).toBe(true);
      }
    });
  });

  describe('filter', () => {
    it('should filter items based on predicate', async () => {
      const data = [1, 2, 3, 4, 5];
      const streamResult = readableOps.createFromArray(data);
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const filteredResult = readableOps.filter(streamResult.value, (item: number) => item % 2 === 0);
        expect(filteredResult.isOk()).toBe(true);
        
        if (filteredResult.isOk()) {
          const arrayResult = await readableOps.toArray(filteredResult.value);
          expect(arrayResult.isOk()).toBe(true);
          if (arrayResult.isOk()) {
            expect(arrayResult.value).toEqual([2, 4]);
          }
        }
      }
    });

    it('should handle async predicate', async () => {
      const data = [1, 2, 3, 4];
      const streamResult = readableOps.createFromArray(data);
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const filteredResult = readableOps.filter(streamResult.value, async (item: number) => {
          await new Promise(resolve => setTimeout(resolve, 1));
          return item > 2;
        });
        
        expect(filteredResult.isOk()).toBe(true);
        if (filteredResult.isOk()) {
          const arrayResult = await readableOps.toArray(filteredResult.value);
          expect(arrayResult.isOk()).toBe(true);
          if (arrayResult.isOk()) {
            expect(arrayResult.value).toEqual([3, 4]);
          }
        }
      }
    });
  });

  describe('map', () => {
    it('should transform items with mapper function', async () => {
      const data = [1, 2, 3];
      const streamResult = readableOps.createFromArray(data);
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const mappedResult = readableOps.map(streamResult.value, (item: number) => ({
          isOk: () => true,
          isErr: () => false,
          value: item * 2
        } as any));
        
        expect(mappedResult.isOk()).toBe(true);
        if (mappedResult.isOk()) {
          const arrayResult = await readableOps.toArray(mappedResult.value);
          expect(arrayResult.isOk()).toBe(true);
          if (arrayResult.isOk()) {
            expect(arrayResult.value).toEqual([2, 4, 6]);
          }
        }
      }
    });

    it('should handle mapper errors', async () => {
      const data = [1, 2, 3];
      const streamResult = readableOps.createFromArray(data);
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const mappedResult = readableOps.map(streamResult.value, (item: number) => {
          if (item === 2) {
            return {
              isOk: () => false,
              isErr: () => true,
              error: { message: 'Mapping error' }
            } as any;
          }
          return {
            isOk: () => true,
            isErr: () => false,
            value: item * 2
          } as any;
        });
        
        expect(mappedResult.isOk()).toBe(true);
        if (mappedResult.isOk()) {
          const arrayResult = await readableOps.toArray(mappedResult.value);
          expect(arrayResult.isErr()).toBe(true);
        }
      }
    });
  });

  describe('reduce', () => {
    it('should reduce stream to single value', async () => {
      const data = [1, 2, 3, 4, 5];
      const streamResult = readableOps.createFromArray(data);
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const reduceResult = await readableOps.reduce(
          streamResult.value,
          (acc: number, curr: number) => acc + curr,
          0
        );
        
        expect(reduceResult.isOk()).toBe(true);
        if (reduceResult.isOk()) {
          expect(reduceResult.value).toBe(15);
        }
      }
    });

    it('should handle async reducer', async () => {
      const data = [1, 2, 3];
      const streamResult = readableOps.createFromArray(data);
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const reduceResult = await readableOps.reduce(
          streamResult.value,
          async (acc: number, curr: number) => {
            await new Promise(resolve => setTimeout(resolve, 1));
            return acc + curr;
          },
          0
        );
        
        expect(reduceResult.isOk()).toBe(true);
        if (reduceResult.isOk()) {
          expect(reduceResult.value).toBe(6);
        }
      }
    });

    it('should handle empty stream with initial value', async () => {
      const streamResult = readableOps.createFromArray([]);
      
      expect(streamResult.isOk()).toBe(true);
      if (streamResult.isOk()) {
        const reduceResult = await readableOps.reduce(
          streamResult.value,
          (acc: number, curr: number) => acc + curr,
          42
        );
        
        expect(reduceResult.isOk()).toBe(true);
        if (reduceResult.isOk()) {
          expect(reduceResult.value).toBe(42);
        }
      }
    });
  });
});