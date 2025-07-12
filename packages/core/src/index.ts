// Foundation package for Trailhead System
// Minimal, focused utilities for Result types and error handling

// Core Result type utilities - the foundation of error handling
export { ok, err } from './errors/index.js';
export type { Result, CoreResult, CoreResultAsync } from './errors/index.js';

// Error system exports - foundation level only
export * from './errors/index.js';

// Functional programming utilities - using fp-ts foundation
export * from './functional/composition.js';

// Async utilities - selective export to avoid conflicts
export {
  fromPromise as fromPromiseAsync,
  fromThrowable as fromThrowableAsync,
  fromThrowableAsync as fromThrowableAsyncFunc,
} from './functional/async.js';
