// ========================================
// Main Watcher Operations Exports
// ========================================

export { createWatcherOperations } from './core.js';

// ========================================
// Sub-module Exports
// ========================================

export { createEventOperations } from './events/index.js';
export { createPatternOperations } from './patterns/index.js';
export { createFilterOperations } from './filters/index.js';

// ========================================
// Configuration Defaults
// ========================================

export { defaultEventConfig } from './events/index.js';
export { defaultPatternConfig } from './patterns/index.js';
export { defaultFilterConfig } from './filters/index.js';

// ========================================
// Error Utilities
// ========================================

export {
  createWatcherError,
  createWatcherInitError,
  createWatcherPermissionError,
  createWatcherPathError,
  createWatcherEventError,
  createWatcherFilterError,
  createPatternError,
  mapChokidarError,
  mapLibraryError,
} from './errors.js';

// ========================================
// Type Exports
// ========================================

export type {
  // Core types
  WatcherResult,
  FileEventType,
  FileEvent,
  FileStats,
  EventDetails,

  // Configuration types
  WatcherConfig,
  WatcherOptions,

  // Handler types
  EventHandler,
  EventFilter,
  EventTransformer,
  TypedEventHandler,

  // Pattern types
  GlobPattern,
  PathMatcher,

  // Filter types
  FilterConfig,

  // Batch processing
  EventBatch,
  BatchProcessor,

  // Watcher state
  WatcherState,
  WatcherMetrics,

  // File watcher interface
  FileWatcher,

  // Operations interfaces
  WatcherOperations,
  EventOperations,
  PatternOperations,
  FilterOperations,

  // Operation types
  CreateWatcherOp,
  WatchOp,
  WatchWithFilterOp,
  WatchBatchOp,
} from './types.js';

// ========================================
// Event Types
// ========================================

export type {
  CreateEventOperations,
  EventConfig,
  EventProcessor,
  EventAggregator,
  EventStream,
  EventMetrics,
} from './events/index.js';

// ========================================
// Pattern Types
// ========================================

export type {
  CreatePatternOperations,
  PatternConfig,
  CompiledPattern,
  PatternCache,
  GlobOptions,
  PathNormalizer,
  PatternAnalysis,
} from './patterns/index.js';

// ========================================
// Filter Types
// ========================================

export type {
  CreateFilterOperations,
  FilterChain,
  ConditionalFilter,
  FilterMetrics,
  FilterCache,
  TimeRangeFilter,
  SizeRangeFilter,
  ExtensionFilter,
  DirectoryFilter,
} from './filters/index.js';
