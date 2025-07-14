import type { CoreError } from '@esteban-url/core'
import type { StreamOperations, StreamingConfig } from './types.js'
import { createDataError } from '../errors.js'

// ========================================
// Stream Detection Utilities
// ========================================

let streamOpsCache: StreamOperations | null = null
let streamAvailabilityChecked = false
let isStreamAvailable = false

export const checkStreamAvailability = (): boolean => {
  if (streamAvailabilityChecked) {
    return isStreamAvailable
  }

  try {
    // Try to require @esteban-url/streams (synchronous check)
    const streamModule = require('@esteban-url/streams')
    isStreamAvailable = Boolean(
      streamModule?.createReadableOperations &&
        streamModule?.createWritableOperations &&
        streamModule?.createTransformOperations
    )
  } catch {
    isStreamAvailable = false
  }

  streamAvailabilityChecked = true
  return isStreamAvailable
}

export const getStreamOperations = async (): Promise<StreamOperations | null> => {
  if (streamOpsCache) {
    return streamOpsCache
  }

  if (!checkStreamAvailability()) {
    return null
  }

  try {
    // Dynamic import with proper error handling
    let streamModule: any = null
    try {
      // @ts-ignore - Optional dependency may not exist
      streamModule = await import('@esteban-url/streams')
    } catch {
      return null
    }

    if (!streamModule) {
      return null
    }

    const { createReadableOperations, createWritableOperations, createTransformOperations } =
      streamModule

    if (!createReadableOperations || !createWritableOperations || !createTransformOperations) {
      return null
    }

    const readableOps = createReadableOperations()
    const writableOps = createWritableOperations()
    const transformOps = createTransformOperations()

    // Build stream operations with proper error handling
    streamOpsCache = {
      createReadableFromArray: (data: any[]) => {
        try {
          return readableOps.fromArray(data)
        } catch (error) {
          return {
            isOk: () => false,
            isErr: () => true,
            error: wrapStreamError('createReadableFromArray', error),
          }
        }
      },
      createWritableToArray: () => {
        try {
          return writableOps.toArray()
        } catch (error) {
          return {
            isOk: () => false,
            isErr: () => true,
            error: wrapStreamError('createWritableToArray', error),
          }
        }
      },
      createTransform: (transform: (chunk: any) => any) => {
        try {
          return transformOps.map(transform)
        } catch (error) {
          return {
            isOk: () => false,
            isErr: () => true,
            error: wrapStreamError('createTransform', error),
          }
        }
      },
      pipeline: async (...streams: any[]) => {
        try {
          const { pipeline } = await import('node:stream/promises')
          // Use apply to properly spread the streams array
          await pipeline.apply(null, streams as any)
          return { isOk: () => true, isErr: () => false, value: undefined } as any
        } catch (error) {
          return {
            isOk: () => false,
            isErr: () => true,
            error: wrapStreamError('pipeline', error),
          } as any
        }
      },
    }

    return streamOpsCache
  } catch {
    return null
  }
}

// ========================================
// Configuration Utilities
// ========================================

export const defaultStreamingConfig: Required<
  Pick<StreamingConfig, 'enabled' | 'chunkSize' | 'highWaterMark' | 'objectMode' | 'timeout'>
> = {
  enabled: true,
  chunkSize: 1024,
  highWaterMark: 16,
  objectMode: true,
  timeout: 30000,
} as const

export const mergeStreamingConfig = <T extends StreamingConfig>(
  defaultConfig: T,
  userConfig: Partial<T> = {}
): T => {
  return {
    ...defaultConfig,
    ...userConfig,
  }
}

// ========================================
// Progress Tracking Utilities
// ========================================

export const createProgressTracker = (total?: number) => {
  let processed = 0
  const startTime = new Date()

  return {
    increment: (count = 1) => {
      processed += count
    },
    getProgress: () => {
      const now = new Date()
      const elapsedMs = now.getTime() - startTime.getTime()
      const percentage = total ? Math.round((processed / total) * 100) : undefined
      const estimatedRemainingMs =
        total && processed > 0 ? ((total - processed) / processed) * elapsedMs : undefined

      return {
        processed,
        total,
        percentage,
        bytesProcessed: processed * 64, // Rough estimate
        bytesTotal: total ? total * 64 : undefined,
        startTime,
        elapsedMs,
        estimatedRemainingMs,
      }
    },
  }
}

// ========================================
// Error Handling Utilities
// ========================================

export const wrapStreamError = (operation: string, error: unknown): CoreError => {
  const message = error instanceof Error ? error.message : String(error)
  return createDataError(
    'STREAM_ERROR',
    `Streaming ${operation} failed: ${message}`,
    `operation: ${operation}, originalError: ${message}`,
    { operation, originalError: error }
  )
}

export const convertCoreErrorToError = (coreError: CoreError): Error => {
  const error = new Error(coreError.message)
  error.name = (coreError as any).code || 'UNKNOWN_ERROR'
  return error
}

export const isStreamingEnabled = (config?: StreamingConfig): boolean => {
  return config?.enabled !== false && checkStreamAvailability()
}

// ========================================
// Stream Error Creation Utilities
// ========================================

export const createStreamingNotAvailableError = (
  context: Record<string, unknown> = {}
): CoreError => {
  return createDataError(
    'STREAMING_NOT_AVAILABLE',
    'Streaming operations are not available. Install @esteban-url/streams or enable streaming.',
    'Streaming functionality requires @esteban-url/streams package',
    context
  )
}

export const createStreamOpsUnavailableError = (
  context: Record<string, unknown> = {}
): CoreError => {
  return createDataError(
    'STREAM_OPS_UNAVAILABLE',
    'Unable to create stream operations. Ensure @esteban-url/streams is properly installed.',
    'Stream operations could not be initialized',
    context
  )
}
