import { ok, err } from '@trailhead/core';
import { watch as chokidarWatch, FSWatcher } from 'chokidar';
import type {
  WatcherOperations,
  WatcherResult,
  FileWatcher,
  WatcherOptions,
  EventHandler,
  FilterConfig,
  BatchProcessor,
  WatcherState,
  FileEvent,
  FileEventType,
  FileStats,
  TypedEventHandler,
} from './types.js';
import { createEventOperations } from './events/core.js';
import { createFilterOperations } from './filters/core.js';
import { createWatcherError, mapChokidarError } from './errors.js';

// ========================================
// Default Configuration
// ========================================

const defaultWatcherOptions: Required<WatcherOptions> = {
  ignored: /node_modules|\.git/,
  ignoreInitial: false,
  followSymlinks: true,
  cwd: process.cwd(),
  disableGlobbing: false,
  usePolling: false,
  interval: 100,
  binaryInterval: 300,
  alwaysStat: false,
  depth: 99,
  awaitWriteFinish: false,
  ignorePermissionErrors: false,
  atomic: true,
  persistent: true,
  useFsEvents: true,
  debounceMs: 0,
  throttleMs: 0,
  batchSize: 1,
  batchTimeoutMs: 1000,
  enableMetrics: false,
  maxRetries: 3,
  retryDelayMs: 1000,
};

// ========================================
// Active Watchers Registry
// ========================================

const activeWatchers = new Set<FileWatcher>();

// ========================================
// Watcher Operations
// ========================================

export const createWatcherOperations = (
  config: Partial<WatcherOptions> = {}
): WatcherOperations => {
  const watcherConfig = { ...defaultWatcherOptions, ...config };
  const _eventOps = createEventOperations();
  const _filterOps = createFilterOperations();

  const create = (
    paths: string | readonly string[],
    options: WatcherOptions = {}
  ): WatcherResult<FileWatcher> => {
    try {
      const mergedOptions = { ...watcherConfig, ...options };
      const pathArray = Array.isArray(paths) ? paths : [paths];

      const chokidarOptions = {
        ignored: mergedOptions.ignored,
        ignoreInitial: mergedOptions.ignoreInitial,
        followSymlinks: mergedOptions.followSymlinks,
        cwd: mergedOptions.cwd,
        disableGlobbing: mergedOptions.disableGlobbing,
        usePolling: mergedOptions.usePolling,
        interval: mergedOptions.interval,
        binaryInterval: mergedOptions.binaryInterval,
        alwaysStat: mergedOptions.alwaysStat,
        depth: mergedOptions.depth,
        awaitWriteFinish: mergedOptions.awaitWriteFinish,
        ignorePermissionErrors: mergedOptions.ignorePermissionErrors,
        atomic: mergedOptions.atomic,
        persistent: mergedOptions.persistent,
        useFsEvents: mergedOptions.useFsEvents,
      };

      const chokidarWatcher = chokidarWatch(pathArray, chokidarOptions);
      const fileWatcher = createFileWatcher(chokidarWatcher, mergedOptions, pathArray);

      activeWatchers.add(fileWatcher);
      return ok(fileWatcher);
    } catch (error) {
      const pathStr = Array.isArray(paths) ? paths.join(', ') : paths;
      return err(mapChokidarError('create', pathStr as string, error));
    }
  };

  const watch = async (
    paths: string | readonly string[],
    handler: EventHandler,
    options: WatcherOptions = {}
  ): Promise<WatcherResult<void>> => {
    try {
      const watcherResult = create(paths, options);
      if (watcherResult.isErr()) {
        return err(watcherResult.error);
      }

      const watcher = watcherResult.value;

      // Set up event handlers
      watcher.on('add', handler as TypedEventHandler<'add'>);
      watcher.on('change', handler as TypedEventHandler<'change'>);
      watcher.on('unlink', handler as TypedEventHandler<'unlink'>);
      watcher.on('addDir', handler as TypedEventHandler<'addDir'>);
      watcher.on('unlinkDir', handler as TypedEventHandler<'unlinkDir'>);

      return ok(undefined);
    } catch (error) {
      const pathStr = Array.isArray(paths) ? paths.join(', ') : paths;
      return err(mapChokidarError('watch', pathStr as string, error));
    }
  };

  const watchWithFilter = async (
    paths: string | readonly string[],
    filter: FilterConfig,
    handler: EventHandler,
    options: WatcherOptions = {}
  ): Promise<WatcherResult<void>> => {
    try {
      const eventFilter = _filterOps.createFilter(filter);

      const filteredHandler: EventHandler = event => {
        if (eventFilter(event)) {
          return handler(event);
        }
      };

      return watch(paths, filteredHandler, options);
    } catch (error) {
      const pathStr = Array.isArray(paths) ? paths.join(', ') : paths;
      return err(mapChokidarError('watchWithFilter', pathStr as string, error));
    }
  };

  const watchBatch = async <T>(
    paths: string | readonly string[],
    processor: BatchProcessor<T>,
    options?: WatcherOptions & { batchSize: number }
  ): Promise<WatcherResult<void>> => {
    try {
      const events: FileEvent[] = [];
      let batchTimeout: NodeJS.Timeout | null = null;

      const processBatch = async () => {
        if (events.length === 0) return;

        const batch = {
          events: [...events],
          size: events.length,
          timestamp: Date.now(),
          duration: 0,
        };

        events.length = 0; // Clear the batch

        try {
          const startTime = Date.now();
          await processor.process(batch);
          batch.duration = Date.now() - startTime;
        } catch (error) {
          if (processor.onError) {
            processor.onError(error, batch);
          }
        }
      };

      const batchHandler: EventHandler = event => {
        events.push(event);

        if (events.length >= (options?.batchSize || 1)) {
          if (batchTimeout) {
            clearTimeout(batchTimeout);
            batchTimeout = null;
          }
          processBatch();
        } else if (!batchTimeout) {
          batchTimeout = setTimeout(processBatch, options?.batchTimeoutMs || 1000);
        }
      };

      return watch(paths, batchHandler, options);
    } catch (error) {
      const pathStr = Array.isArray(paths) ? paths.join(', ') : paths;
      return err(mapChokidarError('watchBatch', pathStr as string, error));
    }
  };

  const isWatching = (path: string): boolean => {
    return Array.from(activeWatchers).some(watcher => {
      const state = watcher.getState();
      return state.watchedPaths.some(watchedPath => path.startsWith(watchedPath));
    });
  };

  const getActiveWatchers = (): readonly FileWatcher[] => {
    return Array.from(activeWatchers);
  };

  const closeAll = async (): Promise<WatcherResult<void>> => {
    try {
      const closePromises = Array.from(activeWatchers).map(watcher => watcher.close());

      const results = await Promise.all(closePromises);
      const errors = results.filter(result => result.isErr());

      if (errors.length > 0) {
        return err(
          createWatcherError(
            `Failed to close ${errors.length} watchers`,
            'Some watchers could not be closed properly',
            undefined,
            { errorCount: errors.length, totalWatchers: activeWatchers.size }
          )
        );
      }

      activeWatchers.clear();
      return ok(undefined);
    } catch (error) {
      return err(
        createWatcherError(
          'Failed to close all watchers',
          'An error occurred while closing active watchers',
          error
        )
      );
    }
  };

  return {
    create,
    watch,
    watchWithFilter,
    watchBatch,
    isWatching,
    getActiveWatchers,
    closeAll,
  };
};

// ========================================
// File Watcher Implementation
// ========================================

const createFileWatcher = (
  chokidarWatcher: FSWatcher,
  options: WatcherOptions,
  initialPaths: string[] = []
): FileWatcher => {
  const _eventOps = createEventOperations();
  const _filterOps = createFilterOperations();
  const eventHandlers = new Map<FileEventType, Set<TypedEventHandler<any>>>();

  let state: WatcherState = {
    isReady: false,
    isWatching: true,
    watchedPaths: initialPaths,
    eventCount: 0,
    errorCount: 0,
    startTime: Date.now(),
  };

  let metrics = {
    eventsPerSecond: 0,
    averageEventSize: 0,
    totalEvents: 0,
    totalErrors: 0,
    uptime: 0,
    memoryUsage: 0,
    eventTypeDistribution: {
      add: 0,
      change: 0,
      unlink: 0,
      addDir: 0,
      unlinkDir: 0,
      ready: 0,
      error: 0,
      raw: 0,
    },
  };

  // Set up chokidar event listeners
  const setupChokidarListeners = () => {
    chokidarWatcher.on('add', (path, stats) => {
      const event = _eventOps.createEvent('add', path, stats ? mapStats(stats) : undefined);
      emitEvent(event);
    });

    chokidarWatcher.on('change', (path, stats) => {
      const event = _eventOps.createEvent('change', path, stats ? mapStats(stats) : undefined);
      emitEvent(event);
    });

    chokidarWatcher.on('unlink', path => {
      const event = _eventOps.createEvent('unlink', path);
      emitEvent(event);
    });

    chokidarWatcher.on('addDir', (path, stats) => {
      const event = _eventOps.createEvent('addDir', path, stats ? mapStats(stats) : undefined);
      emitEvent(event);
    });

    chokidarWatcher.on('unlinkDir', path => {
      const event = _eventOps.createEvent('unlinkDir', path);
      emitEvent(event);
    });

    chokidarWatcher.on('ready', () => {
      state = { ...state, isReady: true };
      const event = _eventOps.createEvent('ready', '');
      emitEvent(event);
    });

    chokidarWatcher.on('error', error => {
      state = { ...state, errorCount: state.errorCount + 1 };
      metrics.totalErrors++;
      const event = _eventOps.createEvent('error', '', undefined, { raw: error });
      emitEvent(event);
    });
  };

  const emitEvent = (event: FileEvent) => {
    state = {
      ...state,
      eventCount: state.eventCount + 1,
      lastEventTime: event.timestamp,
    };
    metrics.totalEvents++;
    metrics.eventTypeDistribution[event.type]++;

    const handlers = eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event as any);
        } catch {
          // Silently handle handler errors
        }
      });
    }
  };

  const fileWatcher: FileWatcher = {
    on: <T extends FileEventType>(event: T, handler: TypedEventHandler<T>) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, new Set());
      }
      eventHandlers.get(event)!.add(handler);
      return fileWatcher;
    },

    off: <T extends FileEventType>(event: T, handler?: TypedEventHandler<T>) => {
      const handlers = eventHandlers.get(event);
      if (handlers) {
        if (handler) {
          handlers.delete(handler);
        } else {
          handlers.clear();
        }
      }
      return fileWatcher;
    },

    add: (paths: string | readonly string[]) => {
      try {
        const pathArray = Array.isArray(paths) ? [...paths] : [paths];
        chokidarWatcher.add(pathArray);
        return ok(fileWatcher);
      } catch (error) {
        const pathStr = Array.isArray(paths) ? paths.join(', ') : paths;
        return err(mapChokidarError('add', pathStr as string, error));
      }
    },

    unwatch: (paths: string | readonly string[]) => {
      try {
        const pathArray = Array.isArray(paths) ? [...paths] : [paths];
        chokidarWatcher.unwatch(pathArray);
        return ok(fileWatcher);
      } catch (error) {
        const pathStr = Array.isArray(paths) ? paths.join(', ') : paths;
        return err(mapChokidarError('unwatch', pathStr as string, error));
      }
    },

    getWatched: () => chokidarWatcher.getWatched(),

    getState: () => ({ ...state }),

    getMetrics: () => {
      const now = Date.now();
      const uptime = now - state.startTime;
      const eventsPerSecond = uptime > 0 ? (metrics.totalEvents / uptime) * 1000 : 0;

      return {
        ...metrics,
        uptime,
        eventsPerSecond,
        memoryUsage: process.memoryUsage().heapUsed,
      };
    },

    close: async () => {
      try {
        await chokidarWatcher.close();
        activeWatchers.delete(fileWatcher);
        state = { ...state, isWatching: false };
        return ok(undefined);
      } catch (error) {
        return err(mapChokidarError('close', '', error));
      }
    },

    pause: () => {
      // Chokidar doesn't have native pause, so we'll track it internally
      state = { ...state, isWatching: false };
      return fileWatcher;
    },

    resume: () => {
      state = { ...state, isWatching: true };
      return fileWatcher;
    },

    filter: (_config: FilterConfig) => {
      // This would return a new filtered watcher
      // For now, return the same watcher
      return fileWatcher;
    },

    debounce: (_ms: number) => {
      // This would return a debounced watcher
      // For now, return the same watcher
      return fileWatcher;
    },

    throttle: (_ms: number) => {
      // This would return a throttled watcher
      // For now, return the same watcher
      return fileWatcher;
    },

    batch: (_size: number, _timeoutMs?: number) => {
      // This would return a batched watcher
      // For now, return the same watcher
      return fileWatcher;
    },
  };

  setupChokidarListeners();
  return fileWatcher;
};

// ========================================
// Helper Functions
// ========================================

const mapStats = (stats: any): FileStats => ({
  size: stats.size || 0,
  birthtime: stats.birthtime || new Date(),
  mtime: stats.mtime || new Date(),
  atime: stats.atime || new Date(),
  ctime: stats.ctime || new Date(),
  isFile: stats.isFile?.() || false,
  isDirectory: stats.isDirectory?.() || false,
  mode: stats.mode || 0,
  uid: stats.uid || 0,
  gid: stats.gid || 0,
});
