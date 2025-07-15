/**
 * @esteban-url/streams/testing
 *
 * Stream testing utilities for stream processing, pipeline testing, and stream validation.
 * Provides domain-focused utilities for testing readable, writable, transform, and duplex streams.
 *
 * @example
 * ```typescript
 * import {
 *   createMockStreamProcessor,
 *   streamFixtures,
 *   assertStreamProcessing,
 *   testStreamPipeline,
 * } from '@esteban-url/streams/testing'
 * 
 * // Create mock stream processor
 * const processor = createMockStreamProcessor()
 * processor.mockStream('csv-parser', streamFixtures.transforms.csvToJson)
 * 
 * // Test stream processing
 * const result = await processor.processStream('input.csv', ['csv-parser', 'validator'])
 * assertStreamProcessing(result, 'json', 3) // Expect 3 processed items
 * ```
 */

import { ok, err, type Result } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'
import { Readable, Writable, Transform } from 'stream'
import { pipeline } from 'stream/promises'

// ========================================
// Enhanced Stream Types and Interfaces
// ========================================

export type StreamType = 'readable' | 'writable' | 'transform' | 'duplex' | 'passthrough'

export interface StreamMetrics {
  readonly bytesProcessed: number
  readonly itemsProcessed: number
  readonly processingTime: number
  readonly errorCount: number
  readonly throughput: number // items per second
}

export interface StreamProcessingResult<T = any> {
  readonly success: boolean
  readonly processedItems: T[]
  readonly metrics: StreamMetrics
  readonly errors: Array<{
    stage: string
    error: Error
    timestamp: number
  }>
}

export interface StreamTransform<TInput = any, TOutput = any> {
  readonly id: string
  readonly name: string
  readonly type: 'map' | 'filter' | 'reduce' | 'parse' | 'validate' | 'custom'
  readonly transform: (chunk: TInput) => TOutput | Promise<TOutput>
  readonly validate?: (chunk: TInput) => boolean
  readonly options: {
    readonly objectMode?: boolean
    readonly highWaterMark?: number
    readonly parallel?: boolean
    readonly batchSize?: number
  }
}

export interface MockStreamProcessor {
  readonly registeredTransforms: Map<string, StreamTransform>
  readonly processingHistory: Array<{
    input: any
    transforms: string[]
    result: StreamProcessingResult
    timestamp: number
  }>
  registerTransform(transform: StreamTransform): void
  unregisterTransform(transformId: string): void
  processStream<T>(input: any, transformIds: string[]): Promise<Result<StreamProcessingResult<T>, CoreError>>
  createPipeline(transformIds: string[]): Result<Transform[], CoreError>
  mockStreamResult(input: any, transforms: string[], result: StreamProcessingResult): void
  validateStreamFlow(readable: Readable, writable: Writable): Promise<Result<StreamMetrics, CoreError>>
  getProcessingHistory(): Array<{ input: any; transforms: string[]; result: StreamProcessingResult; timestamp: number }>
  clearMocks(): void
}

// ========================================
// Enhanced Mock Stream Classes
// ========================================

/**
 * Enhanced mock readable stream with advanced features
 */
export class EnhancedMockReadable extends Readable {
  private items: any[]
  private index = 0
  private shouldError = false
  private errorAfter = -1
  private delay = 0
  private backpressure = false
  private metrics: StreamMetrics

  constructor(items: any[] = [], options: any = {}) {
    super({ objectMode: true, ...options })
    this.items = items
    this.delay = options.delay || 0
    this.metrics = {
      bytesProcessed: 0,
      itemsProcessed: 0,
      processingTime: 0,
      errorCount: 0,
      throughput: 0,
    }
  }

  async _read() {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }

    if (this.shouldError && this.index === this.errorAfter) {
      this.metrics = { ...this.metrics, errorCount: this.metrics.errorCount + 1 }
      this.emit('error', new Error(`Mock stream error at item ${this.index}`))
      return
    }

    if (this.backpressure && this.index % 10 === 0) {
      // Simulate backpressure
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    if (this.index < this.items.length) {
      const item = this.items[this.index++]
      this.metrics = {
        ...this.metrics,
        itemsProcessed: this.metrics.itemsProcessed + 1,
        bytesProcessed: this.metrics.bytesProcessed + JSON.stringify(item).length,
      }
      this.push(item)
    } else {
      this.push(null)
    }
  }

  setError(afterItems: number = 0): void {
    this.shouldError = true
    this.errorAfter = afterItems
  }

  setDelay(ms: number): void {
    this.delay = ms
  }

  enableBackpressure(): void {
    this.backpressure = true
  }

  getMetrics(): StreamMetrics {
    const endTime = Date.now()
    const duration = endTime - (this.metrics.processingTime || Date.now())
    return {
      ...this.metrics,
      processingTime: duration,
      throughput: duration > 0 ? (this.metrics.itemsProcessed / duration) * 1000 : 0,
    }
  }
}

/**
 * Enhanced mock writable stream with collection and validation
 */
export class EnhancedMockWritable extends Writable {
  public written: any[] = []
  private shouldError = false
  private errorAfter = -1
  private validator?: (chunk: any) => boolean
  private metrics: StreamMetrics

  constructor(options: any = {}) {
    super({ objectMode: true, ...options })
    this.validator = options.validator
    this.metrics = {
      bytesProcessed: 0,
      itemsProcessed: 0,
      processingTime: Date.now(),
      errorCount: 0,
      throughput: 0,
    }
  }

  _write(chunk: any, encoding: string, callback: Function): void {
    if (this.shouldError && this.written.length === this.errorAfter) {
      this.metrics = { ...this.metrics, errorCount: this.metrics.errorCount + 1 }
      callback(new Error(`Mock stream error at item ${this.written.length}`))
      return
    }

    if (this.validator && !this.validator(chunk)) {
      this.metrics = { ...this.metrics, errorCount: this.metrics.errorCount + 1 }
      callback(new Error(`Validation failed for chunk: ${JSON.stringify(chunk)}`))
      return
    }

    this.written.push(chunk)
    this.metrics = {
      ...this.metrics,
      itemsProcessed: this.metrics.itemsProcessed + 1,
      bytesProcessed: this.metrics.bytesProcessed + JSON.stringify(chunk).length,
    }
    callback()
  }

  setError(afterItems: number = 0): void {
    this.shouldError = true
    this.errorAfter = afterItems
  }

  setValidator(validator: (chunk: any) => boolean): void {
    this.validator = validator
  }

  getMetrics(): StreamMetrics {
    const endTime = Date.now()
    const duration = endTime - this.metrics.processingTime
    return {
      ...this.metrics,
      processingTime: duration,
      throughput: duration > 0 ? (this.metrics.itemsProcessed / duration) * 1000 : 0,
    }
  }
}

/**
 * Enhanced mock transform stream with advanced processing
 */
export class EnhancedMockTransform extends Transform {
  private transformFn: (chunk: any) => any | Promise<any>
  private shouldError = false
  private errorAfter = -1
  private processedCount = 0
  private batchSize = 1
  private batch: any[] = []
  private metrics: StreamMetrics

  constructor(transformFn: (chunk: any) => any | Promise<any>, options: any = {}) {
    super({ objectMode: true, ...options })
    this.transformFn = transformFn
    this.batchSize = options.batchSize || 1
    this.metrics = {
      bytesProcessed: 0,
      itemsProcessed: 0,
      processingTime: Date.now(),
      errorCount: 0,
      throughput: 0,
    }
  }

  async _transform(chunk: any, encoding: string, callback: Function): Promise<void> {
    if (this.shouldError && this.processedCount === this.errorAfter) {
      this.metrics = { ...this.metrics, errorCount: this.metrics.errorCount + 1 }
      callback(new Error(`Mock transform error at item ${this.processedCount}`))
      return
    }

    try {
      if (this.batchSize > 1) {
        this.batch.push(chunk)
        if (this.batch.length >= this.batchSize) {
          const results = await Promise.all(this.batch.map(item => this.transformFn(item)))
          for (const result of results) {
            this.push(result)
          }
          this.processedCount += this.batch.length
          this.metrics = {
            ...this.metrics,
            itemsProcessed: this.metrics.itemsProcessed + this.batch.length,
            bytesProcessed: this.metrics.bytesProcessed + JSON.stringify(this.batch).length,
          }
          this.batch = []
        }
      } else {
        const result = await this.transformFn(chunk)
        this.processedCount++
        this.metrics = {
          ...this.metrics,
          itemsProcessed: this.metrics.itemsProcessed + 1,
          bytesProcessed: this.metrics.bytesProcessed + JSON.stringify(chunk).length,
        }
        this.push(result)
      }
      callback()
    } catch (error) {
      this.metrics = { ...this.metrics, errorCount: this.metrics.errorCount + 1 }
      callback(error as Error)
    }
  }

  _flush(callback: Function): void {
    // Process remaining items in batch
    if (this.batch.length > 0) {
      Promise.all(this.batch.map(item => this.transformFn(item)))
        .then(results => {
          for (const result of results) {
            this.push(result)
          }
          this.processedCount += this.batch.length
          this.metrics = {
            ...this.metrics,
            itemsProcessed: this.metrics.itemsProcessed + this.batch.length,
          }
          this.batch = []
          callback()
        })
        .catch(error => {
          this.metrics = { ...this.metrics, errorCount: this.metrics.errorCount + 1 }
          callback(error)
        })
    } else {
      callback()
    }
  }

  setError(afterItems: number = 0): void {
    this.shouldError = true
    this.errorAfter = afterItems
  }

  setBatchSize(size: number): void {
    this.batchSize = size
  }

  getMetrics(): StreamMetrics {
    const endTime = Date.now()
    const duration = endTime - this.metrics.processingTime
    return {
      ...this.metrics,
      processingTime: duration,
      throughput: duration > 0 ? (this.metrics.itemsProcessed / duration) * 1000 : 0,
    }
  }
}

// ========================================
// Enhanced Mock Stream Processor Creation
// ========================================

/**
 * Creates a comprehensive mock stream processor for testing
 */
export function createMockStreamProcessor(): MockStreamProcessor {
  const transforms = new Map<string, StreamTransform>()
  const streamMocks = new Map<string, StreamProcessingResult>()
  const processingHistory: Array<{
    input: any
    transforms: string[]
    result: StreamProcessingResult
    timestamp: number
  }> = []

  return {
    registeredTransforms: transforms,
    processingHistory,

    registerTransform(transform: StreamTransform): void {
      transforms.set(transform.id, transform)
    },

    unregisterTransform(transformId: string): void {
      transforms.delete(transformId)
    },

    async processStream<T>(input: any, transformIds: string[]): Promise<Result<StreamProcessingResult<T>, CoreError>> {
      const timestamp = Date.now()
      const startTime = Date.now()

      // Check for mocked result
      const mockKey = `${JSON.stringify(input)}:${transformIds.join(',')}`
      const mockedResult = streamMocks.get(mockKey)
      if (mockedResult) {
        processingHistory.push({ input, transforms: transformIds, result: mockedResult, timestamp })
        return ok(mockedResult as StreamProcessingResult<T>)
      }

      try {
        // Create pipeline
        const pipelineResult = this.createPipeline(transformIds)
        if (pipelineResult.isErr()) {
          return err(pipelineResult.error)
        }

        const transforms = pipelineResult.value
        const processedItems: T[] = []
        const errors: Array<{ stage: string; error: Error; timestamp: number }> = []

        // Create input stream
        const inputData = Array.isArray(input) ? input : [input]
        const readable = new EnhancedMockReadable(inputData)

        // Create output collector
        const writable = new EnhancedMockWritable()

        try {
          // Build pipeline - cast to any to work around TypeScript pipeline typing issues
          if (transforms.length === 0) {
            await pipeline(readable as any, writable as any)
          } else if (transforms.length === 1) {
            await pipeline(readable as any, transforms[0] as any, writable as any)
          } else {
            await (pipeline as any)(readable, ...transforms, writable)
          }

          // Collect results
          processedItems.push(...writable.written)

          const endTime = Date.now()
          const processingTime = endTime - startTime

          const metrics: StreamMetrics = {
            bytesProcessed: readable.getMetrics().bytesProcessed,
            itemsProcessed: processedItems.length,
            processingTime,
            errorCount: errors.length,
            throughput: processingTime > 0 ? (processedItems.length / processingTime) * 1000 : 0,
          }

          const result: StreamProcessingResult<T> = {
            success: errors.length === 0,
            processedItems,
            metrics,
            errors,
          }

          processingHistory.push({ input, transforms: transformIds, result, timestamp })
          return ok(result)
        } catch (error) {
          errors.push({
            stage: 'pipeline',
            error: error as Error,
            timestamp: Date.now(),
          })

          const result: StreamProcessingResult<T> = {
            success: false,
            processedItems,
            metrics: {
              bytesProcessed: 0,
              itemsProcessed: processedItems.length,
              processingTime: Date.now() - startTime,
              errorCount: errors.length,
              throughput: 0,
            },
            errors,
          }

          processingHistory.push({ input, transforms: transformIds, result, timestamp })
          return ok(result)
        }
      } catch (error) {
        return err({
          type: 'StreamError',
          code: 'STREAM_PROCESSING_FAILED',
          message: `Stream processing failed: ${error}`,
          recoverable: false,
          component: 'streams',
          operation: 'stream-processing',
          timestamp: new Date(),
          severity: 'high' as const,
        } satisfies CoreError)
      }
    },

    createPipeline(transformIds: string[]): Result<Transform[], CoreError> {
      const pipeline: Transform[] = []

      for (const transformId of transformIds) {
        const transform = transforms.get(transformId)
        if (!transform) {
          return err({
            type: 'StreamError',
            code: 'TRANSFORM_NOT_FOUND',
            message: `Stream transform '${transformId}' not found`,
            recoverable: true,
            component: 'streams',
            operation: 'pipeline-creation',
            timestamp: new Date(),
            severity: 'medium' as const,
          } satisfies CoreError)
        }

        const streamTransform = new EnhancedMockTransform(
          transform.transform,
          transform.options
        )
        pipeline.push(streamTransform)
      }

      return ok(pipeline)
    },

    mockStreamResult(input: any, transforms: string[], result: StreamProcessingResult): void {
      const mockKey = `${JSON.stringify(input)}:${transforms.join(',')}`
      streamMocks.set(mockKey, result)
    },

    async validateStreamFlow(readable: Readable, writable: Writable): Promise<Result<StreamMetrics, CoreError>> {
      const startTime = Date.now()
      let itemsProcessed = 0
      let bytesProcessed = 0
      let errorCount = 0

      return new Promise((resolve) => {
        readable.on('data', (chunk) => {
          itemsProcessed++
          bytesProcessed += JSON.stringify(chunk).length
        })

        readable.on('error', () => {
          errorCount++
        })

        writable.on('error', () => {
          errorCount++
        })

        writable.on('finish', () => {
          const endTime = Date.now()
          const processingTime = endTime - startTime

          resolve(ok({
            bytesProcessed,
            itemsProcessed,
            processingTime,
            errorCount,
            throughput: processingTime > 0 ? (itemsProcessed / processingTime) * 1000 : 0,
          }))
        })

        readable.pipe(writable)
      })
    },

    getProcessingHistory(): Array<{ input: any; transforms: string[]; result: StreamProcessingResult; timestamp: number }> {
      return [...processingHistory]
    },

    clearMocks(): void {
      transforms.clear()
      streamMocks.clear()
      processingHistory.length = 0
    },
  }
}

// ========================================
// Enhanced Stream Test Fixtures
// ========================================

export const streamFixtures = {
  /**
   * Sample stream data
   */
  data: {
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    strings: ['hello', 'world', 'stream', 'processing', 'test'],
    objects: [
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'user' },
      { id: 3, name: 'Carol', role: 'moderator' },
    ],
    csvData: [
      'id,name,email',
      '1,Alice,alice@example.com',
      '2,Bob,bob@example.com',
      '3,Carol,carol@example.com',
    ],
    jsonLines: [
      '{"id":1,"name":"Alice","email":"alice@example.com"}',
      '{"id":2,"name":"Bob","email":"bob@example.com"}',
      '{"id":3,"name":"Carol","email":"carol@example.com"}',
    ],
    binaryData: Buffer.from('test binary data for stream processing'),
  },

  /**
   * Common stream transforms
   */
  transforms: {
    double: {
      id: 'double',
      name: 'Double Numbers',
      type: 'map' as const,
      transform: (x: number) => x * 2,
      options: { objectMode: true },
    } satisfies StreamTransform,

    uppercase: {
      id: 'uppercase',
      name: 'Uppercase Strings',
      type: 'map' as const,
      transform: (s: string) => s.toUpperCase(),
      options: { objectMode: true },
    } satisfies StreamTransform,

    filterEven: {
      id: 'filterEven',
      name: 'Filter Even Numbers',
      type: 'filter' as const,
      transform: (x: number) => x % 2 === 0 ? x : null,
      validate: (x: number) => x % 2 === 0,
      options: { objectMode: true },
    } satisfies StreamTransform,

    csvToJson: {
      id: 'csvToJson',
      name: 'CSV to JSON Parser',
      type: 'parse' as const,
      transform: (line: string) => {
        const [id, name, email] = line.split(',')
        return { id: parseInt(id), name, email }
      },
      options: { objectMode: true },
    } satisfies StreamTransform,

    jsonParser: {
      id: 'jsonParser',
      name: 'JSON Line Parser',
      type: 'parse' as const,
      transform: (line: string) => JSON.parse(line),
      options: { objectMode: true },
    } satisfies StreamTransform,

    validateUser: {
      id: 'validateUser',
      name: 'User Validator',
      type: 'validate' as const,
      transform: (user: any) => user,
      validate: (user: any) => user.id && user.name && user.email,
      options: { objectMode: true },
    } satisfies StreamTransform,

    addTimestamp: {
      id: 'addTimestamp',
      name: 'Add Timestamp',
      type: 'map' as const,
      transform: (obj: any) => ({ ...obj, timestamp: Date.now() }),
      options: { objectMode: true },
    } satisfies StreamTransform,

    batch: {
      id: 'batch',
      name: 'Batch Processor',
      type: 'custom' as const,
      transform: (items: any[]) => ({ batch: items, count: items.length }),
      options: { objectMode: true, batchSize: 3 },
    } satisfies StreamTransform,
  },

  /**
   * Stream pipeline configurations
   */
  pipelines: {
    numberProcessing: ['double', 'filterEven'],
    stringProcessing: ['uppercase'],
    csvProcessing: ['csvToJson', 'validateUser', 'addTimestamp'],
    jsonProcessing: ['jsonParser', 'validateUser'],
    batchProcessing: ['addTimestamp', 'batch'],
    complexProcessing: ['csvToJson', 'validateUser', 'addTimestamp', 'batch'],
  },

  /**
   * Expected processing results
   */
  expectedResults: {
    doubledNumbers: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
    evenNumbers: [2, 4, 6, 8, 10],
    uppercaseStrings: ['HELLO', 'WORLD', 'STREAM', 'PROCESSING', 'TEST'],
    parsedUsers: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
      { id: 3, name: 'Carol', email: 'carol@example.com' },
    ],
  },

  /**
   * Stream error scenarios
   */
  errorScenarios: {
    malformedJson: ['{"id":1,"name":"Alice"}', '{"id":2,"invalid":"json"'],
    malformedCsv: ['id,name,email', '1,Alice', '2,Bob,bob@example.com,extra'],
    invalidNumbers: [1, 2, 'not-a-number', 4, 5],
    emptyData: [],
    nullData: [null, undefined, '', 0, false],
  },
}

// ========================================
// Enhanced Stream Testing Assertions
// ========================================

/**
 * Asserts that stream processing succeeded with expected results
 */
export function assertStreamProcessing<T>(
  result: Result<StreamProcessingResult<T>, CoreError>,
  expectedItemCount?: number,
  expectedItemType?: string
): void {
  if (result.isErr()) {
    throw new Error(`Expected stream processing to succeed, but got error: ${result.error.message}`)
  }

  const processing = result.value
  if (!processing.success) {
    const errorMessages = processing.errors.map(e => `${e.stage}: ${e.error.message}`).join(', ')
    throw new Error(`Expected stream processing to succeed, but got errors: ${errorMessages}`)
  }

  if (expectedItemCount !== undefined && processing.processedItems.length !== expectedItemCount) {
    throw new Error(
      `Expected ${expectedItemCount} processed items, but got ${processing.processedItems.length}`
    )
  }

  if (expectedItemType && processing.processedItems.length > 0) {
    const firstItem = processing.processedItems[0]
    const actualType = typeof firstItem
    if (actualType !== expectedItemType) {
      throw new Error(`Expected processed items to be of type '${expectedItemType}', but got '${actualType}'`)
    }
  }
}

/**
 * Asserts that stream processing failed with expected errors
 */
export function assertStreamProcessingFailure<T>(
  result: Result<StreamProcessingResult<T>, CoreError>,
  expectedErrorStages?: string[]
): void {
  if (result.isErr()) {
    // Stream system error - this might be expected
    return
  }

  const processing = result.value
  if (processing.success) {
    throw new Error(`Expected stream processing to fail, but it succeeded`)
  }

  if (expectedErrorStages) {
    for (const stage of expectedErrorStages) {
      const hasStageError = processing.errors.some(e => e.stage === stage)
      if (!hasStageError) {
        throw new Error(`Expected stream processing error at stage '${stage}'`)
      }
    }
  }
}

/**
 * Asserts that stream metrics meet performance expectations
 */
export function assertStreamPerformance(
  metrics: StreamMetrics,
  expectations: {
    minThroughput?: number
    maxProcessingTime?: number
    maxErrorRate?: number
  }
): void {
  if (expectations.minThroughput && metrics.throughput < expectations.minThroughput) {
    throw new Error(
      `Stream throughput ${metrics.throughput} items/sec is below minimum ${expectations.minThroughput} items/sec`
    )
  }

  if (expectations.maxProcessingTime && metrics.processingTime > expectations.maxProcessingTime) {
    throw new Error(
      `Stream processing time ${metrics.processingTime}ms exceeds maximum ${expectations.maxProcessingTime}ms`
    )
  }

  if (expectations.maxErrorRate) {
    const errorRate = metrics.itemsProcessed > 0 ? metrics.errorCount / metrics.itemsProcessed : 0
    if (errorRate > expectations.maxErrorRate) {
      throw new Error(
        `Stream error rate ${errorRate} exceeds maximum ${expectations.maxErrorRate}`
      )
    }
  }
}

/**
 * Asserts that stream pipeline produces expected output
 */
export function assertStreamPipelineOutput<T>(
  processedItems: T[],
  expectedItems: T[],
  compareFn?: (a: T, b: T) => boolean
): void {
  if (processedItems.length !== expectedItems.length) {
    throw new Error(
      `Pipeline output length mismatch: expected ${expectedItems.length}, got ${processedItems.length}`
    )
  }

  for (let i = 0; i < expectedItems.length; i++) {
    const actual = processedItems[i]
    const expected = expectedItems[i]

    if (compareFn) {
      if (!compareFn(actual, expected)) {
        throw new Error(`Pipeline output mismatch at index ${i}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
      }
    } else {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Pipeline output mismatch at index ${i}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
      }
    }
  }
}

// ========================================
// Enhanced Stream Testing Utilities
// ========================================

/**
 * Tests stream pipeline processing with multiple transforms
 */
export async function testStreamPipeline<T>(
  processor: MockStreamProcessor,
  input: any,
  transformIds: string[]
): Promise<Result<StreamProcessingResult<T>, CoreError>> {
  return processor.processStream<T>(input, transformIds)
}

/**
 * Tests stream processing with different data sets
 */
export async function testStreamBatch<T>(
  processor: MockStreamProcessor,
  testCases: Array<{
    name: string
    input: any
    transforms: string[]
    expectedSuccess: boolean
  }>
): Promise<Array<{
  name: string
  input: any
  transforms: string[]
  expectedSuccess: boolean
  actualResult: Result<StreamProcessingResult<T>, CoreError>
  passed: boolean
}>> {
  const results = []

  for (const testCase of testCases) {
    const result = await processor.processStream<T>(testCase.input, testCase.transforms)
    const actualSuccess = result.isOk() && result.value.success

    results.push({
      name: testCase.name,
      input: testCase.input,
      transforms: testCase.transforms,
      expectedSuccess: testCase.expectedSuccess,
      actualResult: result,
      passed: actualSuccess === testCase.expectedSuccess,
    })
  }

  return results
}

/**
 * Creates a stream processing test scenario
 */
export function createStreamTestScenario(options: {
  transforms?: StreamTransform[]
  mockResults?: Array<{
    input: any
    transforms: string[]
    result: StreamProcessingResult
  }>
} = {}): {
  processor: MockStreamProcessor
  testProcessing: <T>(input: any, transforms: string[]) => Promise<Result<StreamProcessingResult<T>, CoreError>>
  testPipeline: <T>(input: any, transforms: string[]) => Promise<Result<StreamProcessingResult<T>, CoreError>>
  validateFlow: (readable: Readable, writable: Writable) => Promise<Result<StreamMetrics, CoreError>>
  cleanup: () => void
} {
  const processor = createMockStreamProcessor()

  // Setup transforms
  if (options.transforms) {
    for (const transform of options.transforms) {
      processor.registerTransform(transform)
    }
  }

  // Setup mock results
  if (options.mockResults) {
    for (const mock of options.mockResults) {
      processor.mockStreamResult(mock.input, mock.transforms, mock.result)
    }
  }

  return {
    processor,

    async testProcessing<T>(input: any, transforms: string[]): Promise<Result<StreamProcessingResult<T>, CoreError>> {
      return processor.processStream<T>(input, transforms)
    },

    async testPipeline<T>(input: any, transforms: string[]): Promise<Result<StreamProcessingResult<T>, CoreError>> {
      return testStreamPipeline<T>(processor, input, transforms)
    },

    validateFlow(readable: Readable, writable: Writable): Promise<Result<StreamMetrics, CoreError>> {
      return processor.validateStreamFlow(readable, writable)
    },

    cleanup(): void {
      processor.clearMocks()
    },
  }
}

// Keep existing exports for backward compatibility
export * from './stream-helpers.js'
export * from './mock-streams.js'

// ========================================
// Export Collections
// ========================================

/**
 * Stream testing utilities grouped by functionality
 */
export const streamTesting = {
  // Stream processor creation
  createMockStreamProcessor,
  createStreamTestScenario,

  // Enhanced mock classes
  EnhancedMockReadable,
  EnhancedMockWritable,
  EnhancedMockTransform,

  // Testing utilities
  testStreamPipeline,
  testStreamBatch,

  // Fixtures and test data
  fixtures: streamFixtures,

  // Assertions
  assertStreamProcessing,
  assertStreamProcessingFailure,
  assertStreamPerformance,
  assertStreamPipelineOutput,
}
