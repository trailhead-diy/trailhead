import { createCoreError } from '@esteban-url/core';
import type { CoreError } from '@esteban-url/core';

// ========================================
// Watcher Error Factories
// ========================================

export const createWatcherError = (
  message: string,
  details?: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError('WatcherError', message, {
    details,
    cause,
    recoverable: true,
    context: metadata,
  });

export const createWatcherInitError = (
  path: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError('WatcherInitError', `Failed to initialize watcher for path: ${path}`, {
    details: `The file system watcher could not be started for the specified path`,
    cause,
    recoverable: false,
    context: { path, ...metadata },
  });

export const createWatcherPermissionError = (
  path: string,
  operation: string = 'watch',
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError('WatcherPermissionError', `Permission denied: cannot ${operation} ${path}`, {
    details: `Insufficient permissions to perform ${operation} operation on the specified path`,
    recoverable: false,
    context: { path, operation, ...metadata },
  });

export const createWatcherPathError = (
  path: string,
  reason: string = 'path does not exist',
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError('WatcherPathError', `Invalid watch path: ${path}`, {
    details: `Cannot watch path because ${reason}`,
    recoverable: false,
    context: { path, reason, ...metadata },
  });

export const createWatcherEventError = (
  eventType: string,
  path: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError('WatcherEventError', `Error processing ${eventType} event for ${path}`, {
    details: `An error occurred while handling the file system event`,
    cause,
    recoverable: true,
    context: { eventType, path, ...metadata },
  });

export const createWatcherFilterError = (
  filterType: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError('WatcherFilterError', `Filter error: ${filterType} filter failed`, {
    details: `An error occurred while applying the event filter`,
    cause,
    recoverable: true,
    context: { filterType, ...metadata },
  });

export const createPatternError = (
  pattern: string,
  operation: string = 'match',
  cause?: unknown,
  metadata?: Record<string, unknown>
): CoreError =>
  createCoreError('PatternError', `Pattern ${operation} failed: ${pattern}`, {
    details: `The pattern could not be processed for the ${operation} operation`,
    cause,
    recoverable: true,
    context: { pattern, operation, ...metadata },
  });

// ========================================
// Error Mapping Utilities
// ========================================

export const mapChokidarError = (operation: string, path: string, error: unknown): CoreError => {
  if (error instanceof Error) {
    // Map common chokidar/fs errors
    if (error.message.includes('ENOENT')) {
      return createWatcherPathError(path, 'path does not exist', {
        operation,
        originalError: error.message,
      });
    }

    if (error.message.includes('EACCES') || error.message.includes('EPERM')) {
      return createWatcherPermissionError(path, operation, { originalError: error.message });
    }

    if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
      return createWatcherError(
        'Too many open files',
        'The system has reached the maximum number of open file descriptors',
        error,
        { operation, path }
      );
    }

    if (error.message.includes('ENOSPC')) {
      return createWatcherError(
        'No space left on device',
        'The file system watcher cannot allocate resources due to insufficient space',
        error,
        { operation, path }
      );
    }

    // Generic chokidar error mapping
    return createWatcherError(
      `Watcher ${operation} failed: ${error.message}`,
      `File system watcher operation "${operation}" encountered an error`,
      error,
      { operation, path }
    );
  }

  return createWatcherError(
    `Watcher ${operation} failed with unknown error`,
    `File system watcher operation "${operation}" failed`,
    error,
    { operation, path }
  );
};

export const mapLibraryError = (library: string, operation: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return createWatcherError(
    `${library} operation failed`,
    `Library "${library}" failed during "${operation}": ${errorMessage}`,
    error,
    { library, operation }
  );
};
