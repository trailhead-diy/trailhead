/**
 * File watching capabilities for development workflows
 *
 * This module provides utilities for:
 * - Creating file system watchers with chokidar integration
 * - Pattern-based watching for common development workflows
 * - Batched and throttled event handling
 * - Restartable watchers for development servers
 * - Middleware support for event processing
 */

// Types
export type {
  WatchEventType,
  WatchEvent,
  WatchEventHandler,
  WatchOptions,
  WatcherStats,
  WatcherInstance,
  BatchWatchOptions,
  ThrottleWatchOptions,
  PatternWatchOptions,
  WatchEventFilter,
  WatchEventTransformer,
  WatchMiddleware,
} from './types.js';

// Core watcher functionality
export { createWatcher, watchFiles, createRestartableWatcher } from './core.js';

// Pattern-based and specialized watchers
export {
  createPatternWatcher,
  createBatchWatcher,
  createThrottledWatcher,
  watchPatterns,
  createDevWatcher,
} from './patterns.js';

// Import functions for the convenience object
import { createWatcher, watchFiles, createRestartableWatcher } from './core.js';

import {
  createPatternWatcher,
  createBatchWatcher,
  createThrottledWatcher,
  watchPatterns,
  createDevWatcher,
} from './patterns.js';

// Convenience object for cleaner imports
export const watcherUtils = {
  // Core
  createWatcher,
  watchFiles,
  createRestartableWatcher,

  // Patterns
  createPatternWatcher,
  createBatchWatcher,
  createThrottledWatcher,
  createDevWatcher,

  // Pattern helpers
  patterns: watchPatterns,
} as const;
