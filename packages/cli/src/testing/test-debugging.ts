import type { Result } from 'neverthrow';

/**
 * Test debugging and profiling utilities
 * Provides tools for debugging test failures and performance analysis
 */

/**
 * Performance monitor state
 */
export interface PerformanceMonitorState {
  readonly measurements: Map<string, number[]>;
}

/**
 * Create performance monitor state
 */
export function createPerformanceMonitor(): PerformanceMonitorState {
  return { measurements: new Map() };
}

/**
 * Measure the execution time of an operation
 */
export async function measure<T>(
  state: PerformanceMonitorState,
  name: string,
  operation: () => Promise<T> | T
): Promise<{ result: T; newState: PerformanceMonitorState }> {
  const start = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - start;

    const newMeasurements = new Map(state.measurements);
    if (!newMeasurements.has(name)) {
      newMeasurements.set(name, []);
    }
    newMeasurements.get(name)!.push(duration);

    return {
      result,
      newState: { measurements: newMeasurements },
    };
  } catch (error) {
    const duration = performance.now() - start;

    const newMeasurements = new Map(state.measurements);
    if (!newMeasurements.has(name)) {
      newMeasurements.set(name, []);
    }
    newMeasurements.get(name)!.push(duration);

    throw error;
  }
}

/**
 * Get performance statistics for an operation
 */
export function getPerformanceStats(state: PerformanceMonitorState, name: string) {
  const times = state.measurements.get(name);
  if (!times || times.length === 0) {
    return null;
  }

  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);

  return {
    count: times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    avg: sum / times.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    total: sum,
  };
}

/**
 * Get all performance statistics
 */
export function getAllPerformanceStats(state: PerformanceMonitorState) {
  const stats: Record<string, any> = {};
  for (const name of state.measurements.keys()) {
    stats[name] = getPerformanceStats(state, name);
  }
  return stats;
}

/**
 * Clear all measurements
 */
export function clearPerformanceStats(_state: PerformanceMonitorState): PerformanceMonitorState {
  return { measurements: new Map() };
}

/**
 * Print performance report to console
 */
export function printPerformanceReport(state: PerformanceMonitorState) {
  const stats = getAllPerformanceStats(state);

  console.log('\n📊 Test Performance Report');
  console.log('='.repeat(50));

  for (const [name, stat] of Object.entries(stats)) {
    if (stat) {
      console.log(`\n${name}:`);
      console.log(`  Count: ${stat.count}`);
      console.log(`  Average: ${stat.avg.toFixed(2)}ms`);
      console.log(`  Median: ${stat.median.toFixed(2)}ms`);
      console.log(`  Min: ${stat.min.toFixed(2)}ms`);
      console.log(`  Max: ${stat.max.toFixed(2)}ms`);
      console.log(`  P95: ${stat.p95.toFixed(2)}ms`);
      console.log(`  Total: ${stat.total.toFixed(2)}ms`);
    }
  }

  console.log('='.repeat(50));
}

/**
 * Test debugger state
 */
export interface TestDebuggerState {
  readonly logs: Array<{ timestamp: number; level: string; message: string; data?: any }>;
  readonly enabled: boolean;
}

/**
 * Create test debugger state
 */
export function createTestDebugger(
  enabled: boolean = process.env.NODE_ENV === 'test' && process.env.DEBUG_TESTS === 'true'
): TestDebuggerState {
  return { logs: [], enabled };
}

/**
 * Enable debugging
 */
export function enableDebugger(state: TestDebuggerState): TestDebuggerState {
  return { ...state, enabled: true };
}

/**
 * Disable debugging
 */
export function disableDebugger(state: TestDebuggerState): TestDebuggerState {
  return { ...state, enabled: false };
}

/**
 * Log debug information
 */
export function debugLog(state: TestDebuggerState, message: string, data?: any): TestDebuggerState {
  if (state.enabled) {
    const newLog = {
      timestamp: Date.now(),
      level: 'DEBUG',
      message,
      data,
    };
    console.debug(`🐛 [DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    return { ...state, logs: [...state.logs, newLog] };
  }
  return state;
}

/**
 * Log info information
 */
export function infoLog(state: TestDebuggerState, message: string, data?: any): TestDebuggerState {
  if (state.enabled) {
    const newLog = {
      timestamp: Date.now(),
      level: 'INFO',
      message,
      data,
    };
    console.info(`ℹ️  [INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    return { ...state, logs: [...state.logs, newLog] };
  }
  return state;
}

/**
 * Log warning information
 */
export function warnLog(state: TestDebuggerState, message: string, data?: any): TestDebuggerState {
  if (state.enabled) {
    const newLog = {
      timestamp: Date.now(),
      level: 'WARN',
      message,
      data,
    };
    console.warn(`⚠️  [WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    return { ...state, logs: [...state.logs, newLog] };
  }
  return state;
}

/**
 * Log error information
 */
export function errorLog(state: TestDebuggerState, message: string, data?: any): TestDebuggerState {
  if (state.enabled) {
    const newLog = {
      timestamp: Date.now(),
      level: 'ERROR',
      message,
      data,
    };
    console.error(`❌ [ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    return { ...state, logs: [...state.logs, newLog] };
  }
  return state;
}

/**
 * Trace Result operations
 */
export function traceResult<T, E>(
  state: TestDebuggerState,
  name: string,
  result: Result<T, E>
): { result: Result<T, E>; newState: TestDebuggerState } {
  if (state.enabled) {
    const newState = result.isOk()
      ? debugLog(state, `${name} succeeded`, { value: result.value })
      : debugLog(state, `${name} failed`, { error: result.error });
    return { result, newState };
  }
  return { result, newState: state };
}

/**
 * Get all logs
 */
export function getDebugLogs(state: TestDebuggerState) {
  return [...state.logs];
}

/**
 * Clear logs
 */
export function clearDebugLogs(state: TestDebuggerState): TestDebuggerState {
  return { ...state, logs: [] };
}

/**
 * Print debug report
 */
export function printDebugReport(state: TestDebuggerState) {
  if (!state.enabled || state.logs.length === 0) {
    console.log('🐛 No debug logs available');
    return;
  }

  console.log('\n🐛 Test Debug Report');
  console.log('='.repeat(50));

  state.logs.forEach(log => {
    const time = new Date(log.timestamp).toISOString();
    console.log(`[${time}] ${log.level}: ${log.message}`);
    if (log.data) {
      console.log('  Data:', JSON.stringify(log.data, null, 2));
    }
  });

  console.log('='.repeat(50));
}

/**
 * Test state inspector state
 */
export interface TestStateInspectorState {
  readonly snapshots: Map<string, any>;
}

/**
 * Create test state inspector
 */
export function createTestStateInspector(): TestStateInspectorState {
  return { snapshots: new Map() };
}

/**
 * Capture state snapshot
 */
export function captureSnapshot(
  state: TestStateInspectorState,
  name: string,
  snapshot: any
): TestStateInspectorState {
  const newSnapshots = new Map(state.snapshots);
  newSnapshots.set(name, JSON.parse(JSON.stringify(snapshot)));
  return { snapshots: newSnapshots };
}

/**
 * Compare two state snapshots
 */
export function compareSnapshots(
  state: TestStateInspectorState,
  snapshot1: string,
  snapshot2: string
) {
  const state1 = state.snapshots.get(snapshot1);
  const state2 = state.snapshots.get(snapshot2);

  if (!state1 || !state2) {
    throw new Error(`Snapshot not found: ${!state1 ? snapshot1 : snapshot2}`);
  }

  return deepCompare(state1, state2);
}

/**
 * Deep compare two objects
 */
function deepCompare(
  obj1: any,
  obj2: any,
  path: string = ''
): Array<{ path: string; expected: any; actual: any }> {
  const differences: Array<{ path: string; expected: any; actual: any }> = [];

  if (obj1 === obj2) {
    return differences;
  }

  if (typeof obj1 !== typeof obj2) {
    differences.push({ path, expected: obj1, actual: obj2 });
    return differences;
  }

  if (obj1 === null || obj2 === null) {
    differences.push({ path, expected: obj1, actual: obj2 });
    return differences;
  }

  if (typeof obj1 === 'object') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;

      if (!(key in obj1)) {
        differences.push({ path: newPath, expected: undefined, actual: obj2[key] });
      } else if (!(key in obj2)) {
        differences.push({ path: newPath, expected: obj1[key], actual: undefined });
      } else {
        differences.push(...deepCompare(obj1[key], obj2[key], newPath));
      }
    }
  } else {
    differences.push({ path, expected: obj1, actual: obj2 });
  }

  return differences;
}

/**
 * Get snapshot
 */
export function getSnapshot(state: TestStateInspectorState, name: string) {
  return state.snapshots.get(name);
}

/**
 * Clear all snapshots
 */
export function clearSnapshots(_state: TestStateInspectorState): TestStateInspectorState {
  return { snapshots: new Map() };
}

/**
 * Print state comparison report
 */
export function printSnapshotComparison(
  state: TestStateInspectorState,
  snapshot1: string,
  snapshot2: string
) {
  const differences = compareSnapshots(state, snapshot1, snapshot2);

  if (differences.length === 0) {
    console.log(`✅ States ${snapshot1} and ${snapshot2} are identical`);
    return;
  }

  console.log(`\n🔍 State Comparison: ${snapshot1} vs ${snapshot2}`);
  console.log('='.repeat(50));

  differences.forEach(diff => {
    console.log(`Path: ${diff.path}`);
    console.log(`  Expected: ${JSON.stringify(diff.expected)}`);
    console.log(`  Actual: ${JSON.stringify(diff.actual)}`);
    console.log('');
  });

  console.log('='.repeat(50));
}

/**
 * Global test utilities state
 */
export interface TestUtilsState {
  readonly performance: PerformanceMonitorState;
  readonly debugger: TestDebuggerState;
  readonly inspector: TestStateInspectorState;
}

/**
 * Create test utilities state
 */
function createTestUtilsState(): TestUtilsState {
  return {
    performance: createPerformanceMonitor(),
    debugger: createTestDebugger(),
    inspector: createTestStateInspector(),
  };
}

/**
 * Global test utilities instance
 */
let globalTestUtils = createTestUtilsState();

/**
 * Get current test utilities state
 */
export function getTestUtils(): TestUtilsState {
  return globalTestUtils;
}

/**
 * Update test utilities state
 */
export function updateTestUtils(updater: (state: TestUtilsState) => TestUtilsState): void {
  globalTestUtils = updater(globalTestUtils);
}

/**
 * Test utilities API
 */
export const testUtils = {
  /**
   * Setup debugging for tests
   */
  setupDebugging() {
    updateTestUtils(state => ({
      ...state,
      debugger: enableDebugger(state.debugger),
    }));

    // Add global error handler for unhandled promises
    process.on('unhandledRejection', error => {
      updateTestUtils(state => ({
        ...state,
        debugger: errorLog(state.debugger, 'Unhandled promise rejection', error),
      }));
    });
  },

  /**
   * Print comprehensive test report
   */
  printTestReport() {
    const state = getTestUtils();
    printPerformanceReport(state.performance);
    printDebugReport(state.debugger);
  },

  /**
   * Clear all debugging data
   */
  clearAll() {
    updateTestUtils(state => ({
      performance: clearPerformanceStats(state.performance),
      debugger: clearDebugLogs(state.debugger),
      inspector: clearSnapshots(state.inspector),
    }));
  },

  /**
   * Performance utilities
   */
  performance: {
    async measure<T>(name: string, operation: () => Promise<T> | T): Promise<T> {
      const state = getTestUtils();
      const { result, newState } = await measure(state.performance, name, operation);
      updateTestUtils(s => ({ ...s, performance: newState }));
      return result;
    },

    getStats(name: string) {
      const state = getTestUtils();
      return getPerformanceStats(state.performance, name);
    },

    getAllStats() {
      const state = getTestUtils();
      return getAllPerformanceStats(state.performance);
    },
  },

  /**
   * Debug utilities
   */
  debugger: {
    enable() {
      updateTestUtils(state => ({
        ...state,
        debugger: enableDebugger(state.debugger),
      }));
    },

    disable() {
      updateTestUtils(state => ({
        ...state,
        debugger: disableDebugger(state.debugger),
      }));
    },

    debug(message: string, data?: any) {
      updateTestUtils(state => ({
        ...state,
        debugger: debugLog(state.debugger, message, data),
      }));
    },

    info(message: string, data?: any) {
      updateTestUtils(state => ({
        ...state,
        debugger: infoLog(state.debugger, message, data),
      }));
    },

    warn(message: string, data?: any) {
      updateTestUtils(state => ({
        ...state,
        debugger: warnLog(state.debugger, message, data),
      }));
    },

    error(message: string, data?: any) {
      updateTestUtils(state => ({
        ...state,
        debugger: errorLog(state.debugger, message, data),
      }));
    },

    traceResult<T, E>(name: string, result: Result<T, E>) {
      const state = getTestUtils();
      const { result: tracedResult, newState } = traceResult(state.debugger, name, result);
      updateTestUtils(s => ({ ...s, debugger: newState }));
      return tracedResult;
    },

    getLogs() {
      const state = getTestUtils();
      return getDebugLogs(state.debugger);
    },
  },

  /**
   * Inspector utilities
   */
  inspector: {
    capture(name: string, snapshot: any) {
      updateTestUtils(state => ({
        ...state,
        inspector: captureSnapshot(state.inspector, name, snapshot),
      }));
    },

    compare(snapshot1: string, snapshot2: string) {
      const state = getTestUtils();
      return compareSnapshots(state.inspector, snapshot1, snapshot2);
    },

    get(name: string) {
      const state = getTestUtils();
      return getSnapshot(state.inspector, name);
    },

    printComparison(snapshot1: string, snapshot2: string) {
      const state = getTestUtils();
      printSnapshotComparison(state.inspector, snapshot1, snapshot2);
    },
  },
};

/**
 * Test profiler for analyzing test performance bottlenecks
 */
export function profileTest<T>(name: string, testFn: () => Promise<T> | T): () => Promise<T> | T {
  return async () => {
    return testUtils.performance.measure(name, testFn);
  };
}

/**
 * Higher-order function for automatic test debugging
 */
export function debugTest<T extends (...args: any[]) => any>(name: string, testFn: T): T {
  return (async (...args: any[]) => {
    testUtils.debugger.debug(`Starting test: ${name}`);

    try {
      const result = await testFn(...args);
      testUtils.debugger.debug(`Test completed: ${name}`);
      return result;
    } catch (error) {
      testUtils.debugger.error(`Test failed: ${name}`, error);
      throw error;
    }
  }) as T;
}
