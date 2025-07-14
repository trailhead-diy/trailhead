import { ok, err } from '@esteban-url/core'
import { Duplex, PassThrough } from 'node:stream'
import type { DuplexConfig, StreamResult } from '../types.js'
import type { CreateDuplexOperations } from './types.js'
import { defaultDuplexConfig } from './types.js'
import { mapStreamError } from '../errors.js'

// ========================================
// Duplex Stream Operations
// ========================================

export const createDuplexOperations: CreateDuplexOperations = (config = {}) => {
  const duplexConfig = { ...defaultDuplexConfig, ...config }

  const createEcho = (options: DuplexConfig = {}): StreamResult<Duplex> => {
    try {
      const mergedOptions = { ...duplexConfig, ...options }

      const stream = new Duplex({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        allowHalfOpen: mergedOptions.allowHalfOpen,
        read() {
          // Echo streams read from their internal buffer
        },
        write(chunk, encoding, callback) {
          // Echo the written data back to the readable side
          this.push(chunk)
          callback()
        },
        final(callback) {
          // When writable side ends, signal end of readable side
          this.push(null)
          callback()
        },
      })

      return ok(stream)
    } catch (error) {
      return err(mapStreamError('createEcho', 'duplex', error))
    }
  }

  const createBuffer = <T>(
    bufferSize: number,
    options: DuplexConfig = {}
  ): StreamResult<Duplex> => {
    try {
      const mergedOptions = { ...duplexConfig, ...options }
      const buffer: T[] = []
      let readIndex = 0

      const stream = new Duplex({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        allowHalfOpen: mergedOptions.allowHalfOpen,
        read() {
          // Read from buffer
          if (readIndex < buffer.length) {
            this.push(buffer[readIndex++])
          } else {
            // No more data to read, push null to end readable side
            this.push(null)
          }
        },
        write(chunk: T, encoding, callback) {
          if (buffer.length < bufferSize) {
            buffer.push(chunk)
            callback()
          } else {
            // Buffer is full, apply backpressure
            callback(new Error('Buffer overflow: maximum buffer size exceeded'))
          }
        },
        final(callback) {
          // When writable side ends, make buffered data available for reading
          readIndex = 0
          callback()
        },
      })

      return ok(stream)
    } catch (error) {
      return err(mapStreamError('createBuffer', 'duplex', error))
    }
  }

  const createPassThrough = (options: DuplexConfig = {}): StreamResult<Duplex> => {
    try {
      const mergedOptions = { ...duplexConfig, ...options }

      const stream = new PassThrough({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        allowHalfOpen: mergedOptions.allowHalfOpen,
      })

      return ok(stream)
    } catch (error) {
      return err(mapStreamError('createPassThrough', 'duplex', error))
    }
  }

  return {
    createEcho,
    createBuffer,
    createPassThrough,
  }
}
