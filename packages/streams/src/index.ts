// ========================================
// Main Stream Operations Exports
// ========================================

export { createReadableOperations } from './readable/index.js';
export { createWritableOperations } from './writable/index.js';
export { createTransformOperations } from './transform/index.js';
export { createDuplexOperations } from './duplex/index.js';

// ========================================
// Configuration Defaults
// ========================================

export { defaultReadableConfig } from './readable/index.js';
export { defaultWritableConfig } from './writable/index.js';
export { defaultTransformConfig } from './transform/index.js';
export { defaultDuplexConfig } from './duplex/index.js';

// ========================================
// Error Utilities
// ========================================

export {
  createStreamError,
  createStreamTimeoutError,
  createStreamClosedError,
  createInvalidStreamError,
  createPipelineError,
  createBackpressureError,
  mapStreamError,
  mapLibraryError,
} from './errors.js';

// ========================================
// Type Exports
// ========================================

export type {
  // Core types
  StreamResult,
  StreamConfig,
  ReadableConfig,
  WritableConfig,
  TransformConfig,
  DuplexConfig,

  // Stream operations
  StreamProcessor,
  AsyncStreamProcessor,
  StreamPredicate,
  AsyncStreamPredicate,
  StreamAccumulator,
  AsyncStreamAccumulator,

  // Stream information
  StreamInfo,
  StreamMetrics,

  // Pipeline types
  PipelineOptions,
  PipelineStream,

  // Batch processing
  BatchConfig,

  // Operations interfaces
  ReadableOperations,
  WritableOperations,
  TransformOperations,
  DuplexOperations,
  PipelineOperations,
} from './types.js';

// ========================================
// Readable Stream Types
// ========================================

export type {
  CreateReadableOperations,
  ReadableStreamOptions,
  ReadableStreamInfo,
  ReadableMetrics,
  StreamSource,
  IteratorSource,
  AsyncIteratorSource,
  ArraySource,
  GeneratorSource,
  AsyncGeneratorSource,
  ReadableFromArrayOp,
  ReadableFromIteratorOp,
  ReadableFromAsyncIteratorOp,
  ReadableToArrayOp,
  ReadableForEachOp,
  ReadableFilterOp,
  ReadableMapOp,
  ReadableReduceOp,
} from './readable/index.js';

// ========================================
// Writable Stream Types
// ========================================

export type {
  CreateWritableOperations,
  WritableStreamOptions,
  WritableStreamInfo,
  WritableMetrics,
  StreamSink,
  ArraySink,
  CallbackSink,
  FileSink,
  BufferSink,
  WritableToArrayOp,
  WritableToCallbackOp,
  WritableWriteAllOp,
  WritableEndOp,
} from './writable/index.js';

// ========================================
// Transform Stream Types
// ========================================

export type {
  CreateTransformOperations,
  TransformMapOp,
  TransformFilterOp,
  TransformBatchOp,
  TransformDebounceOp,
  TransformThrottleOp,
  TransformCompressOp,
  TransformDecompressOp,
  BatchState,
  ThrottleState,
  DebounceState,
  TransformStreamInfo,
  TransformMetrics,
} from './transform/index.js';

// ========================================
// Duplex Stream Types
// ========================================

export type {
  CreateDuplexOperations,
  DuplexEchoOp,
  DuplexBufferOp,
  DuplexPassThroughOp,
  DuplexStreamInfo,
  DuplexMetrics,
} from './duplex/index.js';
