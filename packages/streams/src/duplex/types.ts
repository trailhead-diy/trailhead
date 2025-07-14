import type { DuplexConfig, DuplexOperations, StreamResult } from '../types.js'
import type { Duplex } from 'node:stream'

// ========================================
// Duplex Configuration Defaults
// ========================================

export const defaultDuplexConfig: Required<DuplexConfig> = {
  timeout: 30000,
  highWaterMark: 16384,
  objectMode: true,
  encoding: 'utf8',
  autoDestroy: true,
  allowHalfOpen: false,
  read: () => {}, // Default no-op read implementation
  write: (chunk, encoding, callback) => callback(), // Default no-op write
  final: (callback) => callback(), // Default no-op final
}

// ========================================
// Duplex Stream Creation Types
// ========================================

export type CreateDuplexOperations = (config?: DuplexConfig) => DuplexOperations

// ========================================
// Duplex Stream Operation Types
// ========================================

export type DuplexEchoOp = (config?: DuplexConfig) => StreamResult<Duplex>
export type DuplexBufferOp = <_T>(bufferSize: number, config?: DuplexConfig) => StreamResult<Duplex>
export type DuplexPassThroughOp = (config?: DuplexConfig) => StreamResult<Duplex>

// ========================================
// Duplex Stream Utilities
// ========================================

export interface DuplexStreamInfo {
  readonly readable: boolean
  readonly writable: boolean
  readonly readableEnded: boolean
  readonly writableEnded: boolean
  readonly readableFlowing: boolean | null
  readonly destroyed: boolean
  readonly allowHalfOpen: boolean
  readonly readableLength: number
  readonly writableLength: number
}

export interface DuplexMetrics {
  readonly chunksRead: number
  readonly chunksWritten: number
  readonly bytesRead: number
  readonly bytesWritten: number
  readonly readOperations: number
  readonly writeOperations: number
  readonly readThroughput: number // bytes per second
  readonly writeThroughput: number // bytes per second
}
