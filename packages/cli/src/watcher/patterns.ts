/**
 * Pattern-based watching utilities for common development workflows
 */

import { join } from 'node:path';
import type { Result } from 'neverthrow';
import { ok, err } from 'neverthrow';
import type { CLIError } from '../core/errors/types.js';
import { createError } from '../core/errors/factory.js';
import type {
  WatchOptions,
  WatchEvent,
  WatchEventHandler,
  WatcherInstance,
  PatternWatchOptions,
  BatchWatchOptions,
  ThrottleWatchOptions,
} from './types.js';
import { createWatcher } from './core.js';

/**
 * Watch files matching specific patterns
 */
export function createPatternWatcher(
  options: PatternWatchOptions
): Result<WatcherInstance, CLIError> {
  const { patterns, baseDir = process.cwd(), ...watchOptions } = options;

  if (patterns.length === 0) {
    return err(
      createError('WATCHER_NO_PATTERNS', 'At least one pattern must be provided', {
        recoverable: true,
        suggestion: 'Add at least one file pattern to watch',
      })
    );
  }

  const fullPaths = patterns.map(pattern => {
    if (pattern.startsWith('/')) {
      return pattern;
    }
    return join(baseDir, pattern);
  });

  return createWatcher(fullPaths, {
    ...watchOptions,
    cwd: baseDir,
  });
}

/**
 * Create a watcher that batches events to reduce noise
 */
export function createBatchWatcher(
  paths: string | string[],
  handler: WatchEventHandler,
  options: BatchWatchOptions = {}
): Result<WatcherInstance, CLIError> {
  const { batchDelay = 100, maxBatchSize = 50, ...watchOptions } = options;

  const batchedEvents: WatchEvent[] = [];
  let batchTimeout: NodeJS.Timeout | null = null;

  const flushBatch = async () => {
    if (batchedEvents.length === 0) return;

    const eventsToProcess = [...batchedEvents];
    batchedEvents.length = 0;

    // Create a synthetic batch event
    const batchEvent: WatchEvent = {
      type: 'change',
      path: eventsToProcess.map(e => e.path).join(', '),
      timestamp: Date.now(),
    };

    // Add batch metadata
    (batchEvent as any).batch = eventsToProcess;
    (batchEvent as any).batchSize = eventsToProcess.length;

    try {
      await handler(batchEvent);
    } catch {
      // Individual event processing if batch fails
      for (const event of eventsToProcess) {
        try {
          await handler(event);
        } catch {
          // Ignore individual event errors in batch mode
        }
      }
    }
  };

  const batchHandler = async (event: WatchEvent) => {
    // Don't batch error or ready events
    if (event.type === 'error' || event.type === 'ready') {
      await handler(event);
      return;
    }

    batchedEvents.push(event);

    // Clear existing timeout
    if (batchTimeout) {
      clearTimeout(batchTimeout);
    }

    // Flush immediately if batch is full
    if (batchedEvents.length >= maxBatchSize) {
      await flushBatch();
      return;
    }

    // Set new timeout for batch delay
    batchTimeout = setTimeout(async () => {
      await flushBatch();
      batchTimeout = null;
    }, batchDelay);
  };

  const watcherResult = createWatcher(paths, watchOptions);

  if (watcherResult.isErr()) {
    return watcherResult;
  }

  const watcher = watcherResult.value;
  (watcher as any).on(batchHandler);

  // Override stop method to clear timeouts
  const originalStop = watcher.stop;
  (watcher as any).stop = async () => {
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      await flushBatch(); // Flush any remaining events
    }
    return originalStop();
  };

  return ok(watcher);
}

/**
 * Create a watcher that throttles events to reduce frequency
 */
export function createThrottledWatcher(
  paths: string | string[],
  handler: WatchEventHandler,
  options: ThrottleWatchOptions = {}
): Result<WatcherInstance, CLIError> {
  const { throttleDelay = 200, ...watchOptions } = options;

  const lastEventTime = new Map<string, number>();
  const pendingEvents = new Map<string, WatchEvent>();
  const eventTimeouts = new Map<string, NodeJS.Timeout>();

  const throttledHandler = async (event: WatchEvent) => {
    // Don't throttle error or ready events
    if (event.type === 'error' || event.type === 'ready') {
      await handler(event);
      return;
    }

    const { path, type } = event;
    const eventKey = `${path}:${type}`;
    const now = Date.now();
    const lastTime = lastEventTime.get(eventKey) || 0;

    // Clear existing timeout for this event
    const existingTimeout = eventTimeouts.get(eventKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Store the latest event
    pendingEvents.set(eventKey, event);

    // If enough time has passed, handle immediately
    if (now - lastTime >= throttleDelay) {
      lastEventTime.set(eventKey, now);
      pendingEvents.delete(eventKey);
      eventTimeouts.delete(eventKey);
      await handler(event);
      return;
    }

    // Otherwise, schedule for later
    const timeout = setTimeout(
      async () => {
        const pendingEvent = pendingEvents.get(eventKey);
        if (pendingEvent) {
          lastEventTime.set(eventKey, Date.now());
          pendingEvents.delete(eventKey);
          eventTimeouts.delete(eventKey);
          await handler(pendingEvent);
        }
      },
      throttleDelay - (now - lastTime)
    );

    eventTimeouts.set(eventKey, timeout);
  };

  const watcherResult = createWatcher(paths, watchOptions);

  if (watcherResult.isErr()) {
    return watcherResult;
  }

  const watcher = watcherResult.value;
  (watcher as any).on(throttledHandler);

  // Override stop method to clear timeouts
  const originalStop = watcher.stop;
  (watcher as any).stop = async () => {
    // Clear all pending timeouts and handle remaining events
    for (const [eventKey, timeout] of eventTimeouts) {
      clearTimeout(timeout);
      const pendingEvent = pendingEvents.get(eventKey);
      if (pendingEvent) {
        try {
          await handler(pendingEvent);
        } catch {
          // Ignore errors during cleanup
        }
      }
    }

    lastEventTime.clear();
    pendingEvents.clear();
    eventTimeouts.clear();

    return originalStop();
  };

  return ok(watcher);
}

/**
 * Common file watching patterns for development
 */
export const watchPatterns = {
  /**
   * Watch TypeScript source files
   */
  typescript: (baseDir = 'src'): string[] => [`${baseDir}/**/*.ts`, `${baseDir}/**/*.tsx`],

  /**
   * Watch JavaScript source files
   */
  javascript: (baseDir = 'src'): string[] => [
    `${baseDir}/**/*.js`,
    `${baseDir}/**/*.jsx`,
    `${baseDir}/**/*.mjs`,
  ],

  /**
   * Watch configuration files
   */
  config: (): string[] => ['*.config.{js,ts,mjs,json}', 'package.json', 'tsconfig.json', '.env*'],

  /**
   * Watch test files
   */
  tests: (baseDir = '.'): string[] => [
    `${baseDir}/**/*.test.{js,ts,jsx,tsx}`,
    `${baseDir}/**/*.spec.{js,ts,jsx,tsx}`,
    `${baseDir}/**/__tests__/**/*.{js,ts,jsx,tsx}`,
  ],

  /**
   * Watch documentation files
   */
  docs: (): string[] => ['**/*.md', 'docs/**/*', 'README*', 'CHANGELOG*'],

  /**
   * Watch all source and config files
   */
  all: (baseDir = 'src'): string[] => [
    ...watchPatterns.typescript(baseDir),
    ...watchPatterns.javascript(baseDir),
    ...watchPatterns.config(),
  ],
} as const;

/**
 * Create a development watcher with common patterns
 */
export function createDevWatcher(
  handler: WatchEventHandler,
  options: {
    baseDir?: string;
    include?: string[];
    exclude?: string[];
    throttle?: number;
    batch?: boolean;
  } = {}
): Result<WatcherInstance, CLIError> {
  const {
    baseDir = 'src',
    include = watchPatterns.all(baseDir),
    exclude = ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    throttle = 200,
    batch = false,
  } = options;

  const watchOptions: WatchOptions = {
    ignored: exclude,
    ignoreInitial: true,
  };

  if (batch) {
    return createBatchWatcher(include, handler, {
      ...watchOptions,
      batchDelay: throttle,
    });
  }

  return createThrottledWatcher(include, handler, {
    ...watchOptions,
    throttleDelay: throttle,
  });
}
