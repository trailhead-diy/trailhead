import type { WritableConfig, WritableOperations, StreamResult } from '../types.js'
import type { Writable } from 'node:stream'

// ========================================
// Writable Configuration Defaults
// ========================================

export const defaultWritableConfig: Required<WritableConfig> = {
  timeout: 30000,
  highWaterMark: 16384,
  objectMode: true,
  encoding: 'utf8',
  autoDestroy: true,
  write: (chunk, encoding, callback) => callback(), // Default no-op write
  final: (callback) => callback(), // Default no-op final
}

// ========================================
// Writable Stream Creation Types
// ========================================

export type CreateWritableOperations = (config?: WritableConfig) => WritableOperations

export interface WritableStreamOptions {
  readonly highWaterMark?: number
  readonly objectMode?: boolean
  readonly autoDestroy?: boolean
  readonly signal?: AbortSignal
}

// ========================================
// Data Sink Types
// ========================================

export interface ArraySink<T> {
  readonly type: 'array'
  readonly target: T[]
}

export interface CallbackSink<T> {
  readonly type: 'callback'
  readonly callback: (data: T) => void | Promise<void>
}

export interface FileSink {
  readonly type: 'file'
  readonly path: string
  readonly options?: {
    readonly encoding?: BufferEncoding
    readonly mode?: number
    readonly flag?: string
  }
}

export interface BufferSink {
  readonly type: 'buffer'
  readonly buffer: Buffer[]
}

export type StreamSink<T> = ArraySink<T> | CallbackSink<T> | FileSink | BufferSink

// ========================================
// Writable Stream Operation Types
// ========================================

export type WritableToArrayOp = <T>(target: T[], config?: WritableConfig) => StreamResult<Writable>
export type WritableToCallbackOp = <T>(
  callback: (data: T) => void | Promise<void>,
  config?: WritableConfig
) => StreamResult<Writable>

export type WritableWriteAllOp = <T>(stream: Writable, data: T[]) => Promise<StreamResult<void>>
export type WritableEndOp = (stream: Writable) => Promise<StreamResult<void>>

// ========================================
// Writable Stream Utilities
// ========================================

export interface WritableStreamInfo {
  readonly writable: boolean
  readonly writableEnded: boolean
  readonly writableFinished: boolean
  readonly writableLength: number
  readonly writableHighWaterMark: number
  readonly writableObjectMode: boolean
  readonly destroyed: boolean
}

export interface WritableMetrics {
  readonly chunksWritten: number
  readonly bytesWritten: number
  readonly writeOperations: number
  readonly averageChunkSize: number
  readonly writeThroughput: number // bytes per second
  readonly backpressureEvents: number
}
