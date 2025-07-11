import { describe, it, expect } from 'vitest';
import { createTestOperations } from './operations.js';

describe('Test Operations', () => {
  const testOps = createTestOperations();

  describe('createSuite', () => {
    it('should create a test suite builder', () => {
      const suite = testOps.createSuite('Test Suite');

      expect(suite.name).toBe('Test Suite');
      expect(suite.context.name).toBe('Test Suite');
    });

    it('should allow adding tests to suite', () => {
      const suite = testOps
        .createSuite('Test Suite')
        .test('test 1', () => testOps.expect(true).toBe(true))
        .test('test 2', () => testOps.expect(1 + 1).toBe(2));

      const builtSuite = suite.build();
      expect(builtSuite.tests).toHaveLength(2);
      expect(builtSuite.tests[0].name).toBe('test 1');
      expect(builtSuite.tests[1].name).toBe('test 2');
    });

    it('should allow nested suites', () => {
      const suite = testOps.createSuite('Parent Suite').describe('Child Suite', child => {
        child.test('nested test', () => testOps.expect(true).toBeTruthy());
      });

      const builtSuite = suite.build();
      expect(builtSuite.suites).toHaveLength(1);
      expect(builtSuite.suites[0].name).toBe('Child Suite');
      expect(builtSuite.suites[0].tests).toHaveLength(1);
    });
  });

  describe('createMock', () => {
    it('should create a mock function', () => {
      const mockFn = testOps.createMock();

      expect(typeof mockFn).toBe('function');
      expect(mockFn.mock).toBeDefined();
      expect(mockFn.mock.calls).toEqual([]);
    });

    it('should track function calls', () => {
      const mockFn = testOps.createMock();

      mockFn('arg1', 'arg2');
      mockFn('arg3');

      expect(mockFn.mock.calls).toHaveLength(2);
      expect(mockFn.mock.calls[0]).toEqual(['arg1', 'arg2']);
      expect(mockFn.mock.calls[1]).toEqual(['arg3']);
    });

    it('should support custom implementation', () => {
      const mockFn = testOps.createMock((a: number, b: number) => a + b);

      const result = mockFn(2, 3);

      expect(result).toBe(5);
      expect(mockFn.mock.calls).toHaveLength(1);
      expect(mockFn.mock.results[0].value).toBe(5);
    });
  });

  describe('expect', () => {
    it('should create assertions', () => {
      const assertion = testOps.expect(42);

      expect(assertion.value).toBe(42);
      expect(typeof assertion.toBe).toBe('function');
      expect(typeof assertion.toEqual).toBe('function');
    });

    it('should support toBe assertion', () => {
      expect(() => testOps.expect(5).toBe(5)).not.toThrow();
      expect(() => testOps.expect(5).toBe(4)).toThrow();
    });

    it('should support toEqual assertion', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };

      expect(() => testOps.expect(obj1).toEqual(obj2)).not.toThrow();
      expect(() => testOps.expect(obj1).toEqual({ a: 1, b: 3 })).toThrow();
    });

    it('should support negation', () => {
      expect(() => testOps.expect(5).not.toBe(4)).not.toThrow();
      expect(() => testOps.expect(5).not.toBe(5)).toThrow();
    });

    it('should support truthiness assertions', () => {
      expect(() => testOps.expect('hello').toBeTruthy()).not.toThrow();
      expect(() => testOps.expect('').toBeFalsy()).not.toThrow();
      expect(() => testOps.expect(null).toBeNull()).not.toThrow();
      expect(() => testOps.expect(undefined).toBeUndefined()).not.toThrow();
    });
  });

  describe('createRunner', () => {
    it('should create a test runner', () => {
      const runner = testOps.createRunner();

      expect(typeof runner.run).toBe('function');
      expect(typeof runner.runTest).toBe('function');
      expect(typeof runner.createContext).toBe('function');
    });

    it('should run a simple test suite', async () => {
      const runner = testOps.createRunner();
      const suite = testOps
        .createSuite('Simple Suite')
        .test('passing test', () => testOps.expect(true).toBe(true))
        .build();

      const result = await runner.run(suite);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(true);
        expect(result.value.stats.total).toBe(1);
        expect(result.value.stats.passed).toBe(1);
        expect(result.value.stats.failed).toBe(0);
      }
    });

    it('should handle failing tests', async () => {
      const runner = testOps.createRunner();
      const suite = testOps
        .createSuite('Failing Suite')
        .test('failing test', () => testOps.expect(true).toBe(false))
        .build();

      const result = await runner.run(suite);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(false);
        expect(result.value.stats.total).toBe(1);
        expect(result.value.stats.passed).toBe(0);
        expect(result.value.stats.failed).toBe(1);
      }
    });

    it('should support test context', () => {
      const runner = testOps.createRunner();
      const context = runner.createContext();

      expect(typeof context.cleanup).toBe('function');
      expect(typeof context.skip).toBe('function');
      expect(typeof context.fail).toBe('function');
    });
  });
});
