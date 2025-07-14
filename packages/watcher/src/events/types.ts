import type { EventOperations, FileEvent, FileEventType } from '../types.js'

// ========================================
// Event Configuration Defaults
// ========================================

export const defaultEventConfig = {
  enableTimestamps: true,
  includeStats: true,
  includeDetails: false,
  generateEventIds: false,
  maxBatchSize: 100,
  batchTimeoutMs: 1000,
} as const

// ========================================
// Event Creation Types
// ========================================

export type CreateEventOperations = (config?: Partial<typeof defaultEventConfig>) => EventOperations

export interface EventConfig {
  readonly enableTimestamps?: boolean
  readonly includeStats?: boolean
  readonly includeDetails?: boolean
  readonly generateEventIds?: boolean
  readonly maxBatchSize?: number
  readonly batchTimeoutMs?: number
}

// ========================================
// Event Processing Types
// ========================================

export interface EventProcessor<T> {
  readonly process: (event: FileEvent) => T | Promise<T>
  readonly filter?: (event: FileEvent) => boolean
  readonly onError?: (error: unknown, event: FileEvent) => void
}

export interface EventAggregator<T> {
  readonly aggregate: (events: readonly FileEvent[]) => T
  readonly reset: () => void
  readonly getResult: () => T
}

// ========================================
// Event Stream Types
// ========================================

export interface EventStream {
  readonly subscribe: (handler: (event: FileEvent) => void) => () => void
  readonly filter: (predicate: (event: FileEvent) => boolean) => EventStream
  readonly map: <T>(transformer: (event: FileEvent) => T) => EventStream
  readonly batch: (size: number, timeoutMs?: number) => EventStream
  readonly debounce: (ms: number) => EventStream
  readonly throttle: (ms: number) => EventStream
  readonly close: () => void
}

// ========================================
// Event Metrics Types
// ========================================

export interface EventMetrics {
  readonly totalEvents: number
  readonly eventsByType: Record<FileEventType, number>
  readonly averageProcessingTime: number
  readonly eventsPerSecond: number
  readonly lastEventTime?: number
  readonly errorCount: number
}
