/**
 * File watching capabilities for development workflows
 */

import type { FSWatcher } from 'chokidar';
import type { Result } from '../core/index.js';

export type WatchEventType =
  | 'add'
  | 'change'
  | 'unlink'
  | 'addDir'
  | 'unlinkDir'
  | 'ready'
  | 'error';

export interface WatchEvent {
  readonly type: WatchEventType;
  readonly path: string;
  readonly stats?: import('node:fs').Stats;
  readonly error?: Error;
  readonly timestamp: number;
}

export type WatchEventHandler = (event: WatchEvent) => Promise<void> | void;

export interface WatchOptions {
  readonly ignored?: string | string[] | RegExp | ((path: string) => boolean);
  readonly ignoreInitial?: boolean;
  readonly followSymlinks?: boolean;
  readonly cwd?: string;
  // readonly disableGlobbing?: boolean; // Not available in current chokidar version
  readonly usePolling?: boolean;
  readonly interval?: number;
  readonly binaryInterval?: number;
  readonly alwaysStat?: boolean;
  readonly depth?: number;
  readonly awaitWriteFinish?:
    | boolean
    | {
        stabilityThreshold?: number;
        pollInterval?: number;
      };
  readonly ignorePermissionErrors?: boolean;
  readonly atomic?: boolean | number;
}

export interface WatcherStats {
  readonly watchedPaths: readonly string[];
  readonly totalEvents: number;
  readonly eventsByType: Record<WatchEventType, number>;
  readonly startTime: number;
  readonly isActive: boolean;
}

export interface WatcherInstance {
  readonly watcher: FSWatcher;
  readonly options: WatchOptions;
  readonly stats: WatcherStats;
  readonly start: () => Promise<Result<void>>;
  readonly stop: () => Promise<Result<void>>;
  readonly add: (paths: string | string[]) => Result<void>;
  readonly unwatch: (paths: string | string[]) => Result<void>;
  readonly getWatched: () => Record<string, string[]>;
}

export interface BatchWatchOptions extends WatchOptions {
  readonly batchDelay?: number;
  readonly maxBatchSize?: number;
}

export interface ThrottleWatchOptions extends WatchOptions {
  readonly throttleDelay?: number;
}

export interface PatternWatchOptions extends WatchOptions {
  readonly patterns: string[];
  readonly baseDir?: string;
}

export type WatchEventFilter = (event: WatchEvent) => boolean;
export type WatchEventTransformer = (event: WatchEvent) => WatchEvent;

export interface WatchMiddleware {
  readonly filter?: WatchEventFilter;
  readonly transform?: WatchEventTransformer;
  readonly handler: WatchEventHandler;
  readonly priority?: number;
}
