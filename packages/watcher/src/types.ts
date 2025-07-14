import type { Result, CoreError } from '@esteban-url/core';

// ========================================
// Result Type Alias
// ========================================

export type WatcherResult<T> = Result<T, CoreError>;

// ========================================
// File System Event Types
// ========================================

export type FileEventType =
  | 'add' // File added
  | 'change' // File changed
  | 'unlink' // File removed
  | 'addDir' // Directory added
  | 'unlinkDir' // Directory removed
  | 'ready' // Initial scan complete
  | 'error' // Error occurred
  | 'raw'; // Raw platform event

export interface FileEvent {
  readonly type: FileEventType;
  readonly path: string;
  readonly stats?: FileStats;
  readonly timestamp: number;
  readonly details?: EventDetails;
}

export interface FileStats {
  readonly size: number;
  readonly birthtime: Date;
  readonly mtime: Date;
  readonly atime: Date;
  readonly ctime: Date;
  readonly isFile: boolean;
  readonly isDirectory: boolean;
  readonly mode: number;
  readonly uid: number;
  readonly gid: number;
}

export interface EventDetails {
  readonly previousStats?: FileStats;
  readonly raw?: unknown;
  readonly watchedPath?: string;
  readonly eventId?: string;
}

// ========================================
// Watcher Configuration Types
// ========================================

export interface WatcherConfig {
  readonly ignored?:
    | string
    | RegExp
    | ((path: string) => boolean)
    | Array<string | RegExp | ((path: string) => boolean)>;
  readonly ignoreInitial?: boolean;
  readonly followSymlinks?: boolean;
  readonly cwd?: string;
  readonly disableGlobbing?: boolean;
  readonly usePolling?: boolean;
  readonly interval?: number;
  readonly binaryInterval?: number;
  readonly alwaysStat?: boolean;
  readonly depth?: number;
  readonly awaitWriteFinish?:
    | boolean
    | {
        readonly stabilityThreshold?: number;
        readonly pollInterval?: number;
      };
  readonly ignorePermissionErrors?: boolean;
  readonly atomic?: boolean | number;
  readonly persistent?: boolean;
  readonly useFsEvents?: boolean;
}

export interface WatcherOptions extends WatcherConfig {
  readonly debounceMs?: number;
  readonly throttleMs?: number;
  readonly batchSize?: number;
  readonly batchTimeoutMs?: number;
  readonly enableMetrics?: boolean;
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
}

// ========================================
// Event Handler Types
// ========================================

export type EventHandler<T = void> = (event: FileEvent) => T | Promise<T>;
export type EventFilter = (event: FileEvent) => boolean;
export type EventTransformer<T> = (event: FileEvent) => T | Promise<T>;

export type TypedEventHandler<T extends FileEventType, R = void> = (
  event: FileEvent & { type: T }
) => R | Promise<R>;

// ========================================
// Pattern Matching Types
// ========================================

export interface GlobPattern {
  readonly pattern: string;
  readonly options?: {
    readonly dot?: boolean;
    readonly noglobstar?: boolean;
    readonly matchBase?: boolean;
    readonly nocase?: boolean;
  };
}

export interface PathMatcher {
  readonly includes?: Array<string | RegExp | GlobPattern>;
  readonly excludes?: Array<string | RegExp | GlobPattern>;
  readonly extensions?: string[];
  readonly directories?: string[];
  readonly caseSensitive?: boolean;
}

// ========================================
// Filtering Types
// ========================================

export interface FilterConfig {
  readonly events?: FileEventType[];
  readonly paths?: PathMatcher;
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly modifiedAfter?: Date;
  readonly modifiedBefore?: Date;
  readonly extensions?: string[];
  readonly directories?: boolean;
  readonly files?: boolean;
  readonly custom?: EventFilter[];
}

// ========================================
// Batch Processing Types
// ========================================

export interface EventBatch {
  readonly events: readonly FileEvent[];
  readonly size: number;
  readonly timestamp: number;
  readonly duration: number;
}

export interface BatchProcessor<T> {
  readonly process: (batch: EventBatch) => T | Promise<T>;
  readonly onError?: (error: unknown, batch: EventBatch) => void;
}

// ========================================
// Watcher State Types
// ========================================

export interface WatcherState {
  readonly isReady: boolean;
  readonly isWatching: boolean;
  readonly watchedPaths: readonly string[];
  readonly eventCount: number;
  readonly errorCount: number;
  readonly startTime: number;
  readonly lastEventTime?: number;
}

export interface WatcherMetrics {
  readonly eventsPerSecond: number;
  readonly averageEventSize: number;
  readonly totalEvents: number;
  readonly totalErrors: number;
  readonly uptime: number;
  readonly memoryUsage: number;
  readonly eventTypeDistribution: Record<FileEventType, number>;
}

// ========================================
// Watcher Operations Types
// ========================================

export type CreateWatcherOp = (
  paths: string | readonly string[],
  options?: WatcherOptions
) => WatcherResult<FileWatcher>;

export type WatchOp = (
  paths: string | readonly string[],
  handler: EventHandler,
  options?: WatcherOptions
) => Promise<WatcherResult<void>>;

export type WatchWithFilterOp = (
  paths: string | readonly string[],
  filter: FilterConfig,
  handler: EventHandler,
  options?: WatcherOptions
) => Promise<WatcherResult<void>>;

export type WatchBatchOp = <T>(
  paths: string | readonly string[],
  processor: BatchProcessor<T>,
  options?: WatcherOptions & { batchSize: number }
) => Promise<WatcherResult<void>>;

// ========================================
// File Watcher Interface
// ========================================

export interface FileWatcher {
  readonly on: <T extends FileEventType>(event: T, handler: TypedEventHandler<T>) => FileWatcher;

  readonly off: <T extends FileEventType>(event: T, handler?: TypedEventHandler<T>) => FileWatcher;

  readonly add: (paths: string | readonly string[]) => WatcherResult<FileWatcher>;
  readonly unwatch: (paths: string | readonly string[]) => WatcherResult<FileWatcher>;

  readonly getWatched: () => Record<string, string[]>;
  readonly getState: () => WatcherState;
  readonly getMetrics: () => WatcherMetrics;

  readonly close: () => Promise<WatcherResult<void>>;

  readonly pause: () => FileWatcher;
  readonly resume: () => FileWatcher;

  readonly filter: (config: FilterConfig) => FileWatcher;
  readonly debounce: (ms: number) => FileWatcher;
  readonly throttle: (ms: number) => FileWatcher;
  readonly batch: (size: number, timeoutMs?: number) => FileWatcher;
}

// ========================================
// Operations Interfaces
// ========================================

export interface WatcherOperations {
  readonly create: CreateWatcherOp;
  readonly watch: WatchOp;
  readonly watchWithFilter: WatchWithFilterOp;
  readonly watchBatch: WatchBatchOp;
  readonly isWatching: (path: string) => boolean;
  readonly getActiveWatchers: () => readonly FileWatcher[];
  readonly closeAll: () => Promise<WatcherResult<void>>;
}

export interface EventOperations {
  readonly createEvent: (
    type: FileEventType,
    path: string,
    stats?: FileStats,
    details?: EventDetails
  ) => FileEvent;
  readonly filterEvents: (
    events: readonly FileEvent[],
    filter: FilterConfig
  ) => readonly FileEvent[];
  readonly transformEvent: <T>(event: FileEvent, transformer: EventTransformer<T>) => Promise<T>;
  readonly batchEvents: (events: readonly FileEvent[], size: number) => readonly EventBatch[];
}

export interface PatternOperations {
  readonly match: (path: string, pattern: string | RegExp | GlobPattern) => boolean;
  readonly matchAny: (
    path: string,
    patterns: ReadonlyArray<string | RegExp | GlobPattern>
  ) => boolean;
  readonly createMatcher: (config: PathMatcher) => (path: string) => boolean;
  readonly globToRegex: (pattern: string) => RegExp;
  readonly isGlobPattern: (pattern: string) => boolean;
}

export interface FilterOperations {
  readonly createFilter: (config: FilterConfig) => EventFilter;
  readonly combineFilters: (...filters: EventFilter[]) => EventFilter;
  readonly invertFilter: (filter: EventFilter) => EventFilter;
  readonly eventTypeFilter: (types: FileEventType[]) => EventFilter;
  readonly pathFilter: (matcher: PathMatcher) => EventFilter;
  readonly sizeFilter: (minSize?: number, maxSize?: number) => EventFilter;
  readonly timeFilter: (after?: Date, before?: Date) => EventFilter;
}
