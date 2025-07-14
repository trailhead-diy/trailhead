import type {
  TransformConfig,
  TransformOperations,
  StreamResult,
  StreamProcessor,
  AsyncStreamProcessor,
  StreamPredicate,
  AsyncStreamPredicate,
  BatchConfig,
} from '../types.js'
import type { Transform } from 'node:stream'

// ========================================
// Transform Configuration Defaults
// ========================================

export const defaultTransformConfig: Required<TransformConfig> = {
  timeout: 30000,
  highWaterMark: 16384,
  objectMode: true, // Transform streams often work with objects
  encoding: 'utf8',
  autoDestroy: true,
  transform: (chunk, encoding, callback) => callback(null, chunk), // Pass-through by default
  flush: (callback) => callback(), // No-op flush by default
}

// ========================================
// Transform Stream Creation Types
// ========================================

export type CreateTransformOperations = (config?: TransformConfig) => TransformOperations

// ========================================
// Transform Stream Operation Types
// ========================================

export type TransformMapOp = <T, R>(
  mapper: StreamProcessor<T, R> | AsyncStreamProcessor<T, R>,
  config?: TransformConfig
) => StreamResult<Transform>

export type TransformFilterOp = <T>(
  predicate: StreamPredicate<T> | AsyncStreamPredicate<T>,
  config?: TransformConfig
) => StreamResult<Transform>

export type TransformBatchOp = <_T>(
  batchConfig: BatchConfig,
  config?: TransformConfig
) => StreamResult<Transform>

export type TransformDebounceOp = <_T>(
  delayMs: number,
  config?: TransformConfig
) => StreamResult<Transform>

export type TransformThrottleOp = <_T>(
  intervalMs: number,
  config?: TransformConfig
) => StreamResult<Transform>

export type TransformCompressOp = (config?: TransformConfig) => StreamResult<Transform>
export type TransformDecompressOp = (config?: TransformConfig) => StreamResult<Transform>

// ========================================
// Batch Processing Types
// ========================================

export interface BatchState<T> {
  items: T[]
  size: number
  lastFlush: number
  timeoutId?: NodeJS.Timeout
}

// ========================================
// Throttle and Debounce Types
// ========================================

export interface ThrottleState<T> {
  lastEmit: number
  pending?: T
  timeoutId?: NodeJS.Timeout
}

export interface DebounceState<T> {
  pending?: T
  timeoutId?: NodeJS.Timeout
}

// ========================================
// Transform Stream Utilities
// ========================================

export interface TransformStreamInfo {
  readonly readable: boolean
  readonly writable: boolean
  readonly readableEnded: boolean
  readonly writableEnded: boolean
  readonly destroyed: boolean
  readonly allowHalfOpen: boolean
}

export interface TransformMetrics {
  readonly chunksTransformed: number
  readonly transformOperations: number
  readonly averageTransformTime: number
  readonly transformThroughput: number // chunks per second
  readonly errorsEncountered: number
}
