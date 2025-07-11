// Core Result type utilities - the foundation of error handling
export { ok, err } from './errors/index.js';
export type { Result, TrailheadResult, TrailheadResultAsync } from './errors/index.js';

// Error system exports
export * from './errors/index.js';

// Functional programming utilities
export * from './functional/composition.js';
export * from './functional/config.js';
// Note: async.js has duplicate exports with errors/utils.ts, so we import selectively
export {
  fromPromise as fromPromiseAsync,
  fromThrowable as fromThrowableAsync,
  parallel,
  sequential,
  mapParallel,
  mapSequential,
  filterAsync,
  reduceAsync,
  withTimeout,
  debounce,
  throttle,
} from './functional/async.js';
