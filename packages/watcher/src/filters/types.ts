import type { FilterOperations, EventFilter } from '../types.js'

// ========================================
// Filter Configuration Defaults
// ========================================

export const defaultFilterConfig = {
  enableCaching: true,
  cacheSize: 50,
  caseSensitive: true,
  invertResults: false,
} as const

// ========================================
// Filter Creation Types
// ========================================

export type CreateFilterOperations = (
  config?: Partial<typeof defaultFilterConfig>
) => FilterOperations

export interface LocalFilterConfig {
  readonly enableCaching?: boolean
  readonly cacheSize?: number
  readonly caseSensitive?: boolean
  readonly invertResults?: boolean
}

// ========================================
// Filter Composition Types
// ========================================

export interface FilterChain {
  readonly filters: readonly EventFilter[]
  readonly operator: 'and' | 'or'
}

export interface ConditionalFilter {
  readonly condition: EventFilter
  readonly thenFilter: EventFilter
  readonly elseFilter?: EventFilter
}

// ========================================
// Filter Performance Types
// ========================================

export interface FilterMetrics {
  readonly executionTime: number
  readonly cacheHits: number
  readonly cacheMisses: number
  readonly totalExecutions: number
  readonly averageExecutionTime: number
}

export interface FilterCache {
  readonly get: (key: string) => boolean | undefined
  readonly set: (key: string, result: boolean) => void
  readonly clear: () => void
  readonly size: number
  readonly metrics: FilterMetrics
}

// ========================================
// Specialized Filter Types
// ========================================

export interface TimeRangeFilter {
  readonly start: Date
  readonly end: Date
  readonly inclusive?: boolean
}

export interface SizeRangeFilter {
  readonly min?: number
  readonly max?: number
  readonly unit?: 'bytes' | 'kb' | 'mb' | 'gb'
}

export interface ExtensionFilter {
  readonly extensions: readonly string[]
  readonly caseSensitive?: boolean
  readonly allowEmpty?: boolean
}

export interface DirectoryFilter {
  readonly directories: readonly string[]
  readonly recursive?: boolean
  readonly caseSensitive?: boolean
}
