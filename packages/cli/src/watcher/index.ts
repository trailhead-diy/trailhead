// Delegate to @trailhead/watcher domain package
export * from '@trailhead/watcher/core';

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
