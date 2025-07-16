/**
 * Statistics tracking interface for CLI operations
 * @template T - Type for custom data
 */
export interface StatsTracker<T extends Record<string, any> = Record<string, any>> {
  /** Number of files that have been processed */
  readonly filesProcessed: number
  /** Number of files that have been modified */
  readonly filesModified: number
  /** Total number of operations performed */
  readonly totalOperations: number
  /** Map of operation types to their counts */
  readonly operationsByType: Map<string, number>
  /** Timestamp when tracking started (milliseconds) */
  readonly startTime: number
  /** Optional custom data for application-specific tracking */
  readonly custom?: T
}

/**
 * Create initial statistics tracking object
 * Pure function with performance tracking
 * @param custom - Optional custom data to include in stats
 * @returns New stats tracker initialized to zero
 * @example
 * ```typescript
 * const stats = createStats();
 * console.log(stats.filesProcessed); // 0
 *
 * const customStats = createStats({ errors: [], warnings: 0 });
 * console.log(customStats.custom?.errors); // []
 * ```
 */
export function createStats<T extends Record<string, any> = Record<string, any>>(
  custom?: T
): StatsTracker<T> {
  return {
    filesProcessed: 0,
    filesModified: 0,
    totalOperations: 0,
    operationsByType: new Map(),
    startTime: Date.now(),
    custom,
  }
}

/**
 * Update statistics with operation results
 * Pure function for immutable updates
 * @param stats - Current stats tracker
 * @param update - Updates to apply (all fields are optional)
 * @returns New stats tracker with updates applied
 * @example
 * ```typescript
 * let stats = createStats();
 * stats = updateStats(stats, {
 *   filesProcessed: 5,
 *   operations: 10,
 *   operationTypes: [{ type: 'read', count: 3 }, { type: 'write', count: 2 }]
 * });
 * console.log(stats.filesProcessed); // 5
 * console.log(stats.operationsByType.get('read')); // 3
 * ```
 */
export function updateStats<T extends Record<string, any> = Record<string, any>>(
  stats: StatsTracker<T>,
  update: {
    filesProcessed?: number
    filesModified?: number
    operations?: number
    operationTypes?: Array<{ type: string; count?: number }>
    custom?: Partial<T>
  }
): StatsTracker<T> {
  const newOperationsByType = new Map(stats.operationsByType)

  // Update operation type counts
  if (update.operationTypes) {
    update.operationTypes.forEach(({ type, count = 1 }) => {
      const currentCount = newOperationsByType.get(type) || 0
      newOperationsByType.set(type, currentCount + count)
    })
  }

  return {
    ...stats,
    filesProcessed: stats.filesProcessed + (update.filesProcessed || 0),
    filesModified: stats.filesModified + (update.filesModified || 0),
    totalOperations: stats.totalOperations + (update.operations || 0),
    operationsByType: newOperationsByType,
    custom: update.custom ? ({ ...stats.custom, ...update.custom } as T) : stats.custom,
  }
}

/**
 * Get elapsed time since stats tracking started
 * @param stats - Stats tracker to calculate elapsed time for
 * @returns Elapsed time in milliseconds
 * @example
 * ```typescript
 * const stats = createStats();
 * // ... do some work ...
 * const elapsed = getElapsedTime(stats);
 * console.log(`Took ${elapsed}ms`);
 * ```
 */
export function getElapsedTime(stats: StatsTracker): number {
  return Date.now() - stats.startTime
}

/**
 * Format statistics into a human-readable string
 * @param stats - Stats tracker to format
 * @returns Formatted stats string
 * @example
 * ```typescript
 * const stats = updateStats(createStats(), {
 *   filesProcessed: 10,
 *   filesModified: 3,
 *   totalOperations: 25
 * });
 * console.log(formatStats(stats));
 * // Output:
 * // Files processed: 10
 * // Files modified: 3
 * // Total operations: 25
 * // Time elapsed: 1.23s
 * ```
 */
export function formatStats(stats: StatsTracker): string {
  const elapsed = getElapsedTime(stats)
  const seconds = (elapsed / 1000).toFixed(2)

  const lines = [
    `Files processed: ${stats.filesProcessed}`,
    `Files modified: ${stats.filesModified}`,
    `Total operations: ${stats.totalOperations}`,
    `Time elapsed: ${seconds}s`,
  ]

  if (stats.operationsByType.size > 0) {
    lines.push('\nOperations by type:')
    stats.operationsByType.forEach((count, type) => {
      lines.push(`  ${type}: ${count}`)
    })
  }

  return lines.join('\n')
}
