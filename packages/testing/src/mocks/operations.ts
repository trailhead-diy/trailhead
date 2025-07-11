import { ok, err } from '@trailhead/core';
import type {
  MockOperations,
  MockFunction,
  MockImplementation,
  TestResult,
} from '../types.js';

// ========================================
// Mock Operations
// ========================================

export const createMockOperations = (): MockOperations => {
  const activeMocks = new Set<MockFunction<any[], any>>();
  const moduleRegistry = new Map<string, unknown>();

  const createFunction = <TArgs extends readonly unknown[], TReturn>(
    implementation?: MockImplementation<TArgs, TReturn>
  ): MockFunction<TArgs, TReturn> => {
    const mockFn = createMockFunction(implementation);
    activeMocks.add(mockFn);
    return mockFn;
  };

  const spyOn = <T, K extends keyof T>(object: T, method: K): MockFunction<any[], any> => {
    const original = object[method];
    
    if (typeof original !== 'function') {
      throw new Error(`Cannot spy on ${String(method)} - not a function`);
    }

    const spy = createMockFunction(original as any);
    (object as any)[method] = spy;
    
    // Override restore to put back original
    const originalRestore = spy.mock.restore;
    spy.mock.restore = () => {
      (object as any)[method] = original;
      originalRestore();
    };

    activeMocks.add(spy);
    return spy;
  };

  const mockModule = (modulePath: string, factory?: () => unknown): void => {
    const mockExports = factory ? factory() : {};
    moduleRegistry.set(modulePath, mockExports);
  };

  const clearAllMocks = (): void => {
    for (const mock of activeMocks) {
      mock.mock.clear();
    }
  };

  const resetAllMocks = (): void => {
    for (const mock of activeMocks) {
      mock.mock.reset();
    }
  };

  const restoreAllMocks = (): void => {
    for (const mock of activeMocks) {
      mock.mock.restore();
    }
    activeMocks.clear();
    moduleRegistry.clear();
  };

  return {
    createFunction,
    spyOn,
    mockModule,
    clearAllMocks,
    resetAllMocks,
    restoreAllMocks,
  };
};

// ========================================
// Mock Function Implementation
// ========================================

const createMockFunction = <TArgs extends readonly unknown[], TReturn>(
  implementation?: MockImplementation<TArgs, TReturn>
): MockFunction<TArgs, TReturn> => {
  const calls: TArgs[] = [];
  const results: Array<{ type: 'return' | 'throw' | 'incomplete'; value?: TReturn; error?: Error }> = [];
  const instances: unknown[] = [];
  const invocationCallOrder: number[] = [];
  let callCount = 0;
  let currentImplementation = implementation;

  const mockFn = ((...args: TArgs): TReturn => {
    const callIndex = callCount++;
    calls.push(args);
    instances.push(undefined);
    invocationCallOrder.push(callIndex);

    try {
      if (currentImplementation) {
        const result = currentImplementation(...args);
        results.push({ type: 'return', value: result });
        return result;
      } else {
        const result = undefined as TReturn;
        results.push({ type: 'return', value: result });
        return result;
      }
    } catch (error) {
      results.push({ type: 'throw', error: error as Error });
      throw error;
    }
  }) as MockFunction<TArgs, TReturn>;

  mockFn.mock = {
    calls,
    results,
    instances,
    invocationCallOrder,
    get lastCall() {
      return calls[calls.length - 1];
    },
    get lastResult() {
      return results[results.length - 1];
    },
    clear: () => {
      calls.length = 0;
      results.length = 0;
      instances.length = 0;
      invocationCallOrder.length = 0;
    },
    reset: () => {
      calls.length = 0;
      results.length = 0;
      instances.length = 0;
      invocationCallOrder.length = 0;
      currentImplementation = undefined;
    },
    restore: () => {
      // Default implementation - can be overridden by spyOn
    },
  };

  return mockFn;
};