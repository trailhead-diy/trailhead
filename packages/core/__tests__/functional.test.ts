import { describe, it, expect } from 'vitest';
import { ok, err } from 'neverthrow';
import {
  compose,
  composeMany,
  pipeline,
  curry2,
  curry3,
  flip,
  identity,
  constant,
  tap,
  when,
  unless,
  maybe,
  composeResult,
  composeManyResult,
  composeAsync,
  composeManyAsync,
  retry,
} from '../src/functional/composition.js';

// Test helper functions
const add1 = (x: number) => x + 1;
const multiply2 = (x: number) => x * 2;
const subtract3 = (x: number) => x - 3;
const add = (a: number, b: number) => a + b;
const addThree = (a: number, b: number, c: number) => a + b + c;
const add10 = (x: number) => x + 10;
const double = (x: number) => x * 2;
const asyncAdd1 = async (x: number) => x + 1;
const asyncMultiply2 = async (x: number) => x * 2;
const asyncSubtract3 = async (x: number) => x - 3;

describe('Functional Composition', () => {
  describe('Basic Composition', () => {
    it('should compose two functions', () => {
      const composed = compose(multiply2, add1);

      expect(composed(5)).toBe(12); // (5 + 1) * 2 = 12
    });

    it('should compose multiple functions', () => {
      const composed = composeMany(subtract3, multiply2, add1);

      expect(composed(5)).toBe(9); // ((5 + 1) * 2) - 3 = 9
    });

    it('should create pipeline', () => {
      const pipe = pipeline(add1, multiply2);

      expect(pipe(5)).toBe(12); // (5 + 1) * 2 = 12
    });
  });

  describe('Currying', () => {
    it('should curry function with 2 arguments', () => {
      const curriedAdd = curry2(add);
      const add5 = curriedAdd(5);

      expect(add5(3)).toBe(8);
    });

    it('should curry function with 3 arguments', () => {
      const curriedAddThree = curry3(addThree);
      const add5And3 = curriedAddThree(5)(3);

      expect(add5And3(2)).toBe(10);
    });

    it('should flip arguments of curried function', () => {
      const subtract = curry2((a: number, b: number) => a - b);
      const flippedSubtract = flip(subtract);

      expect(subtract(10)(3)).toBe(7); // 10 - 3
      expect(flippedSubtract(3)(10)).toBe(7); // 10 - 3 (arguments flipped)
    });
  });

  describe('Utility Functions', () => {
    it('should implement identity function', () => {
      expect(identity(42)).toBe(42);
      expect(identity('hello')).toBe('hello');
    });

    it('should implement constant function', () => {
      const constantFive = constant(5);
      expect(constantFive()).toBe(5);
      expect(constantFive()).toBe(5); // Always returns same value
    });

    it('should implement tap for side effects', () => {
      let sideEffect = '';
      const tapFn = tap((x: string) => {
        sideEffect = x;
      });

      const result = tapFn('test');
      expect(result).toBe('test');
      expect(sideEffect).toBe('test');
    });

    it('should conditionally apply function with when', () => {
      const conditionalAdd = when(true, add10);
      const noAdd = when(false, add10);

      expect(conditionalAdd(5)).toBe(15);
      expect(noAdd(5)).toBe(5);
    });

    it('should conditionally apply function with unless', () => {
      const conditionalAdd = unless(false, add10);
      const noAdd = unless(true, add10);

      expect(conditionalAdd(5)).toBe(15);
      expect(noAdd(5)).toBe(5);
    });

    it('should handle maybe values', () => {
      const safeDouble = maybe(double);

      expect(safeDouble(5)).toBe(10);
      expect(safeDouble(null)).toBe(null);
      expect(safeDouble(undefined)).toBe(null);
    });
  });

  describe('Result Composition', () => {
    it('should compose functions returning Results', () => {
      const parseNumber = (s: string) => {
        const num = parseInt(s, 10);
        return isNaN(num) ? err('Invalid number') : ok(num);
      };

      const doubleNumber = (n: number) => ok(n * 2);

      const composed = composeResult(doubleNumber, parseNumber);

      expect(composed('5').unwrapOr(0)).toBe(10);
      expect(composed('abc').isErr()).toBe(true);
    });

    it('should compose multiple Result functions', () => {
      const parseNumber = (s: string) => {
        const num = parseInt(s, 10);
        return isNaN(num) ? err('Invalid number') : ok(num);
      };

      const doubleNumber = (n: number) => ok(n * 2);
      const addOne = (n: number) => ok(n + 1);

      const composed = composeManyResult(parseNumber, doubleNumber, addOne);

      expect(composed('5').unwrapOr(0)).toBe(11); // ((5 * 2) + 1)
      expect(composed('abc').isErr()).toBe(true);
    });
  });

  describe('Async Composition', () => {
    it('should compose async functions', async () => {
      const composed = composeAsync(asyncMultiply2, asyncAdd1);

      const result = await composed(5);
      expect(result).toBe(12); // (5 + 1) * 2
    });

    it('should compose multiple async functions', async () => {
      const composed = composeManyAsync(asyncAdd1, asyncMultiply2, asyncSubtract3);

      const result = await composed(5);
      expect(result).toBe(9); // ((5 + 1) * 2) - 3
    });
  });

  describe('Retry Logic', () => {
    it('should retry function until success', () => {
      let attempts = 0;
      const flakeyFunction = () => {
        attempts++;
        return attempts < 3 ? err('Failed') : ok('Success');
      };

      const retriedFunction = retry(flakeyFunction, 3);
      const result = retriedFunction();

      expect(result.unwrapOr('')).toBe('Success');
      expect(attempts).toBe(3);
    });

    it('should fail after max attempts', () => {
      let attempts = 0;
      const alwaysFailFunction = () => {
        attempts++;
        return err('Always fails');
      };

      const retriedFunction = retry(alwaysFailFunction, 2);
      const result = retriedFunction();

      expect(result.isErr()).toBe(true);
      expect(attempts).toBe(2);
    });
  });
});
