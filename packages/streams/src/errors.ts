import { createCoreError } from '@esteban-url/core/errors'
import type { CoreError } from '@esteban-url/core/errors'

// ========================================
// Stream Error Factories
// ========================================

export const createStreamError = (
  message: string,
  details?: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError('StreamError', message, {
    details,
    cause,
    recoverable: true,
    context: metadata,
  })

export const createStreamTimeoutError = (
  timeout: number,
  operation: string = 'stream operation',
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError('StreamTimeoutError', `Stream operation timed out after ${timeout}ms`, {
    details: `The ${operation} did not complete within the specified timeout period`,
    recoverable: false,
    context: { timeout, operation, ...metadata },
  })

export const createStreamClosedError = (
  streamType: string = 'stream',
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError('StreamClosedError', `Cannot operate on closed ${streamType}`, {
    details: `The ${streamType} has been closed or destroyed and cannot accept new operations`,
    recoverable: false,
    context: { streamType, ...metadata },
  })

export const createInvalidStreamError = (
  expected: string,
  actual: string = 'unknown',
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError(
    'InvalidStreamError',
    `Invalid stream type: expected ${expected}, got ${actual}`,
    {
      details: `The provided stream does not meet the requirements for this operation`,
      recoverable: false,
      context: { expected, actual, ...metadata },
    }
  )

export const createPipelineError = (
  message: string,
  stageIndex?: number,
  cause?: unknown,
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError('PipelineError', message, {
    details:
      stageIndex !== undefined
        ? `Pipeline failed at stage ${stageIndex}`
        : 'Pipeline operation failed',
    cause,
    recoverable: false,
    context: { stageIndex, ...metadata },
  })

export const createBackpressureError = (
  streamType: string,
  bufferSize: number,
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError('BackpressureError', `Backpressure detected in ${streamType}`, {
    details: `Stream buffer is full (${bufferSize} bytes), write operation would block`,
    recoverable: true,
    context: { streamType, bufferSize, ...metadata },
  })

// ========================================
// Error Mapping Utilities
// ========================================

export const mapStreamError = (
  operation: string,
  streamType: string,
  error: unknown
): CoreError => {
  if (error instanceof Error) {
    // Map common Node.js stream errors
    if (error.message.includes('write after end')) {
      return createStreamClosedError(streamType, { operation, originalError: error.message })
    }

    if (error.message.includes('Cannot pipe')) {
      return createInvalidStreamError('pipeable stream', streamType, {
        operation,
        originalError: error.message,
      })
    }

    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return createStreamTimeoutError(0, operation, { streamType, originalError: error.message })
    }

    if (error.message.includes('EPIPE') || error.message.includes('broken pipe')) {
      return createStreamClosedError(streamType, { operation, originalError: error.message })
    }

    // Generic stream error mapping
    return createStreamError(
      `${operation} failed: ${error.message}`,
      `Stream operation "${operation}" on ${streamType} encountered an error`,
      error,
      { operation, streamType }
    )
  }

  return createStreamError(
    `${operation} failed with unknown error`,
    `Stream operation "${operation}" on ${streamType} failed`,
    error,
    { operation, streamType }
  )
}

export const mapLibraryError = (library: string, operation: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createStreamError(
    `${library} operation failed`,
    `Library "${library}" failed during "${operation}": ${errorMessage}`,
    error,
    { library, operation }
  )
}
