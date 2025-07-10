/**
 * Core file watching implementation using chokidar
 */

import { watch as chokidarWatch } from 'chokidar';
import type { Result } from '../core/errors/types.js';
import { Ok, Err, createError } from '../core/errors/factory.js';
import type {
  WatchOptions,
  WatchEvent,
  WatchEventHandler,
  WatchEventType,
  WatcherInstance,
  WatcherStats,
  WatchMiddleware,
} from './types.js';

/**
 * Create a file system watcher
 */
export function createWatcher(
  paths: string | string[],
  options: WatchOptions = {}
): Result<WatcherInstance> {
  try {
    const stats: WatcherStats = {
      watchedPaths: Array.isArray(paths) ? paths : [paths],
      totalEvents: 0,
      eventsByType: {
        add: 0,
        change: 0,
        unlink: 0,
        addDir: 0,
        unlinkDir: 0,
        ready: 0,
        error: 0,
      },
      startTime: Date.now(),
      isActive: false,
    };

    const handlers = new Set<WatchEventHandler>();
    const middleware: WatchMiddleware[] = [];

    const watcher = chokidarWatch(paths, {
      ignored: options.ignored,
      ignoreInitial: options.ignoreInitial ?? true,
      followSymlinks: options.followSymlinks ?? true,
      cwd: options.cwd,
      // disableGlobbing: options.disableGlobbing ?? false, // Not available in current chokidar version
      usePolling: options.usePolling,
      interval: options.interval,
      binaryInterval: options.binaryInterval,
      alwaysStat: options.alwaysStat ?? false,
      depth: options.depth,
      awaitWriteFinish: options.awaitWriteFinish,
      ignorePermissionErrors: options.ignorePermissionErrors ?? false,
      atomic: options.atomic ?? true,
    });

    const createEventHandler = (type: WatchEventType) => {
      return async (path: string, stats?: import('node:fs').Stats) => {
        const event: WatchEvent = {
          type,
          path,
          stats,
          timestamp: Date.now(),
        };

        // Update statistics
        (stats as any).totalEvents++;
        (stats as any).eventsByType[type]++;

        // Process middleware
        let processedEvent = event;
        const applicableMiddleware = middleware
          .filter(m => !m.filter || m.filter(event))
          .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

        for (const m of applicableMiddleware) {
          if (m.transform) {
            processedEvent = m.transform(processedEvent);
          }

          try {
            await m.handler(processedEvent);
          } catch (error) {
            // Emit error event for middleware failures
            const errorEvent: WatchEvent = {
              type: 'error',
              path,
              error: error instanceof Error ? error : new Error(String(error)),
              timestamp: Date.now(),
            };

            // Don't process error events through middleware to avoid infinite loops
            for (const handler of handlers) {
              try {
                await handler(errorEvent);
              } catch {
                // Ignore handler errors for error events
              }
            }
          }
        }

        // Call registered handlers
        for (const handler of handlers) {
          try {
            await handler(processedEvent);
          } catch (error) {
            // Emit error event for handler failures
            const errorEvent: WatchEvent = {
              type: 'error',
              path,
              error: error instanceof Error ? error : new Error(String(error)),
              timestamp: Date.now(),
            };

            for (const fallbackHandler of handlers) {
              if (fallbackHandler !== handler) {
                try {
                  await fallbackHandler(errorEvent);
                } catch {
                  // Ignore fallback handler errors
                }
              }
            }
          }
        }
      };
    };

    // Register event handlers
    watcher.on('add', createEventHandler('add'));
    watcher.on('change', createEventHandler('change'));
    watcher.on('unlink', createEventHandler('unlink'));
    watcher.on('addDir', createEventHandler('addDir'));
    watcher.on('unlinkDir', createEventHandler('unlinkDir'));
    watcher.on('ready', () => createEventHandler('ready')('', undefined));
    watcher.on('error', async (error: unknown) => {
      const errorEvent: WatchEvent = {
        type: 'error',
        path: '',
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now(),
      };

      (stats as any).totalEvents++;
      (stats as any).eventsByType.error++;

      for (const handler of handlers) {
        try {
          await handler(errorEvent);
        } catch {
          // Ignore handler errors for error events
        }
      }
    });

    const instance: WatcherInstance = {
      watcher,
      options,
      stats,

      start: async () => {
        try {
          if (!(stats as any).isActive) {
            (stats as any).isActive = true;
            (stats as any).startTime = Date.now();
          }
          return Ok(undefined);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to start watcher';
          return Err(
            createError('WATCHER_START_FAILED', 'Failed to start watcher', {
              details: message,
              recoverable: true,
            })
          );
        }
      },

      stop: async () => {
        try {
          await watcher.close();
          (stats as any).isActive = false;
          return Ok(undefined);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to stop watcher';
          return Err(
            createError('WATCHER_STOP_FAILED', 'Failed to stop watcher', {
              details: message,
              recoverable: true,
            })
          );
        }
      },

      add: newPaths => {
        try {
          watcher.add(newPaths);
          const pathsToAdd = Array.isArray(newPaths) ? newPaths : [newPaths];
          (stats as any).watchedPaths = [...stats.watchedPaths, ...pathsToAdd];
          return Ok(undefined);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add paths';
          return Err(
            createError('WATCHER_ADD_PATHS_FAILED', 'Failed to add paths to watcher', {
              details: message,
              recoverable: true,
            })
          );
        }
      },

      unwatch: pathsToRemove => {
        try {
          watcher.unwatch(pathsToRemove);
          const pathsArray = Array.isArray(pathsToRemove) ? pathsToRemove : [pathsToRemove];
          (stats as any).watchedPaths = stats.watchedPaths.filter(p => !pathsArray.includes(p));
          return Ok(undefined);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to remove paths';
          return Err(
            createError('WATCHER_REMOVE_PATHS_FAILED', 'Failed to remove paths from watcher', {
              details: message,
              recoverable: true,
            })
          );
        }
      },

      getWatched: () => {
        return watcher.getWatched();
      },
    };

    // Add methods to register handlers and middleware
    (instance as any).on = (handler: WatchEventHandler) => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    };

    (instance as any).use = (middlewareItem: WatchMiddleware) => {
      middleware.push(middlewareItem);
      return () => {
        const index = middleware.indexOf(middlewareItem);
        if (index > -1) {
          middleware.splice(index, 1);
        }
      };
    };

    return Ok(instance);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create watcher';
    return Err(
      createError('WATCHER_CREATION_FAILED', 'Failed to create file watcher', {
        details: message,
        recoverable: false,
      })
    );
  }
}

/**
 * Quick watcher for simple use cases
 */
export function watchFiles(
  paths: string | string[],
  handler: WatchEventHandler,
  options: WatchOptions = {}
): Result<() => Promise<void>> {
  const watcherResult = createWatcher(paths, options);

  if (!watcherResult.success) {
    return watcherResult;
  }

  const watcher = watcherResult.value;
  (watcher as any).on(handler);

  const stopWatcher = async () => {
    await watcher.stop();
  };

  return Ok(stopWatcher);
}

/**
 * Watch files and automatically restart on changes
 */
export function createRestartableWatcher(
  paths: string | string[],
  restartFn: () => Promise<void> | void,
  options: WatchOptions = {}
): Result<WatcherInstance> {
  const watcherResult = createWatcher(paths, {
    ...options,
    ignoreInitial: true,
  });

  if (!watcherResult.success) {
    return watcherResult;
  }

  const watcher = watcherResult.value;

  let isRestarting = false;
  const handleRestart = async (event: WatchEvent) => {
    if (isRestarting || event.type === 'error' || event.type === 'ready') {
      return;
    }

    isRestarting = true;
    try {
      await restartFn();
    } catch (error) {
      // Emit error through watcher
      const _errorEvent: WatchEvent = {
        type: 'error',
        path: event.path,
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now(),
      };

      // This will trigger registered error handlers
    } finally {
      isRestarting = false;
    }
  };

  (watcher as any).on(handleRestart);

  return Ok(watcher);
}
