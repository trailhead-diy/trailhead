export interface StatsTracker<
  T extends Record<string, any> = Record<string, any>,
> {
  readonly filesProcessed: number;
  readonly filesModified: number;
  readonly totalOperations: number;
  readonly operationsByType: Map<string, number>;
  readonly startTime: number;
  readonly custom?: T;
}

/**
 * Create initial statistics tracking object
 * Pure function with performance tracking
 */
export function createStats<
  T extends Record<string, any> = Record<string, any>,
>(custom?: T): StatsTracker<T> {
  return {
    filesProcessed: 0,
    filesModified: 0,
    totalOperations: 0,
    operationsByType: new Map(),
    startTime: Date.now(),
    custom,
  };
}

/**
 * Update statistics with operation results
 * Pure function for immutable updates
 */
export function updateStats<
  T extends Record<string, any> = Record<string, any>,
>(
  stats: StatsTracker<T>,
  update: {
    filesProcessed?: number;
    filesModified?: number;
    operations?: number;
    operationTypes?: Array<{ type: string; count?: number }>;
    custom?: Partial<T>;
  },
): StatsTracker<T> {
  const newOperationsByType = new Map(stats.operationsByType);

  // Update operation type counts
  if (update.operationTypes) {
    update.operationTypes.forEach(({ type, count = 1 }) => {
      const currentCount = newOperationsByType.get(type) || 0;
      newOperationsByType.set(type, currentCount + count);
    });
  }

  return {
    ...stats,
    filesProcessed: stats.filesProcessed + (update.filesProcessed || 0),
    filesModified: stats.filesModified + (update.filesModified || 0),
    totalOperations: stats.totalOperations + (update.operations || 0),
    operationsByType: newOperationsByType,
    custom: update.custom
      ? ({ ...stats.custom, ...update.custom } as T)
      : stats.custom,
  };
}

export function getElapsedTime(stats: StatsTracker): number {
  return Date.now() - stats.startTime;
}

export function formatStats(stats: StatsTracker): string {
  const elapsed = getElapsedTime(stats);
  const seconds = (elapsed / 1000).toFixed(2);

  const lines = [
    `Files processed: ${stats.filesProcessed}`,
    `Files modified: ${stats.filesModified}`,
    `Total operations: ${stats.totalOperations}`,
    `Time elapsed: ${seconds}s`,
  ];

  if (stats.operationsByType.size > 0) {
    lines.push('\nOperations by type:');
    stats.operationsByType.forEach((count, type) => {
      lines.push(`  ${type}: ${count}`);
    });
  }

  return lines.join('\n');
}
