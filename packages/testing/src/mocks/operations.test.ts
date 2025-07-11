import { describe, it, expect } from 'vitest';
import { createMockOperations } from './operations.js';

describe('Mock Operations', () => {
  const mockOps = createMockOperations();

  describe('createFunction', () => {
    it('should create a mock function', () => {
      const mockFn = mockOps.createFunction();

      expect(typeof mockFn).toBe('function');
      expect(mockFn.mock).toBeDefined();
      expect(mockFn.mock.calls).toEqual([]);
    });

    it('should track function calls and results', () => {
      const mockFn = mockOps.createFunction((x: number) => x * 2);

      const result1 = mockFn(5);
      const result2 = mockFn(10);

      expect(result1).toBe(10);
      expect(result2).toBe(20);
      expect(mockFn.mock.calls).toHaveLength(2);
      expect(mockFn.mock.calls[0]).toEqual([5]);
      expect(mockFn.mock.calls[1]).toEqual([10]);
      expect(mockFn.mock.results[0].value).toBe(10);
      expect(mockFn.mock.results[1].value).toBe(20);
    });

    it('should track thrown errors', () => {
      const mockFn = mockOps.createFunction(() => {
        throw new Error('Test error');
      });

      expect(() => mockFn()).toThrow('Test error');
      expect(mockFn.mock.calls).toHaveLength(1);
      expect(mockFn.mock.results[0].type).toBe('throw');
      expect(mockFn.mock.results[0].error?.message).toBe('Test error');
    });

    it('should support clearing mock data', () => {
      const mockFn = mockOps.createFunction();

      mockFn('arg1');
      mockFn('arg2');
      expect(mockFn.mock.calls).toHaveLength(2);

      mockFn.mock.clear();
      expect(mockFn.mock.calls).toHaveLength(0);
      expect(mockFn.mock.results).toHaveLength(0);
    });

    it('should support resetting mock', () => {
      const mockFn = mockOps.createFunction((x: number) => x + 1);

      mockFn(5);
      expect(mockFn(10)).toBe(11);

      mockFn.mock.reset();
      expect(mockFn.mock.calls).toHaveLength(0);
      expect(mockFn(10)).toBeUndefined();
    });
  });

  describe('spyOn', () => {
    it('should spy on object methods', () => {
      const obj = {
        method: (x: number) => x * 2,
      };

      const spy = mockOps.spyOn(obj, 'method');

      const result = obj.method(5);

      expect(result).toBe(10);
      expect(spy.mock.calls).toHaveLength(1);
      expect(spy.mock.calls[0]).toEqual([5]);
    });

    it('should restore original method', () => {
      const obj = {
        method: (x: number) => x * 2,
      };
      const originalMethod = obj.method;

      const spy = mockOps.spyOn(obj, 'method');
      expect(obj.method).toBe(spy);

      spy.mock.restore();
      expect(obj.method).toBe(originalMethod);
    });

    it('should throw for non-function properties', () => {
      const obj = {
        prop: 'not a function',
      };

      expect(() => mockOps.spyOn(obj, 'prop' as any)).toThrow();
    });
  });

  describe('mock management', () => {
    it('should clear all mocks', () => {
      const mock1 = mockOps.createFunction();
      const mock2 = mockOps.createFunction();

      mock1('arg1');
      mock2('arg2');

      expect(mock1.mock.calls).toHaveLength(1);
      expect(mock2.mock.calls).toHaveLength(1);

      mockOps.clearAllMocks();

      expect(mock1.mock.calls).toHaveLength(0);
      expect(mock2.mock.calls).toHaveLength(0);
    });

    it('should reset all mocks', () => {
      const mock1 = mockOps.createFunction((x: number) => x + 1);
      const mock2 = mockOps.createFunction((x: string) => x.toUpperCase());

      expect(mock1(5)).toBe(6);
      expect(mock2('hello')).toBe('HELLO');

      mockOps.resetAllMocks();

      expect(mock1.mock.calls).toHaveLength(0);
      expect(mock1(5)).toBeUndefined();
      expect(mock2(5 as any)).toBeUndefined();
    });

    it('should restore all mocks', () => {
      const obj = {
        method1: (x: number) => x * 2,
        method2: (x: string) => x.toUpperCase(),
      };

      const spy1 = mockOps.spyOn(obj, 'method1');
      const spy2 = mockOps.spyOn(obj, 'method2');

      mockOps.restoreAllMocks();

      // Methods should be restored
      expect(obj.method1(5)).toBe(10);
      expect(obj.method2('hello')).toBe('HELLO');

      // Spies should not track calls after restore
      expect(spy1.mock.calls).toHaveLength(0);
      expect(spy2.mock.calls).toHaveLength(0);
    });
  });

  describe('module mocking', () => {
    it('should mock modules', () => {
      const mockFactory = () => ({
        default: 'mocked default',
        namedExport: 'mocked named',
      });

      expect(() => mockOps.mockModule('some-module', mockFactory)).not.toThrow();
    });

    it('should mock modules without factory', () => {
      expect(() => mockOps.mockModule('another-module')).not.toThrow();
    });
  });
});
