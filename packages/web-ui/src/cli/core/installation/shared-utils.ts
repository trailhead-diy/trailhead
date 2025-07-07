/**
 * Shared utilities for installation modules
 */

import type { InstallError } from './types.js';
import { createError } from '@esteban-url/trailhead-cli/core';

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Create a simple error object
 */
export const createSimpleError = (
  type: 'DependencyError' | 'ValidationError',
  baseMessage: string,
  error: unknown
): InstallError =>
  createError(
    type === 'DependencyError' ? 'DEPENDENCY_ERROR' : 'VALIDATION_ERROR',
    `${baseMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    { cause: error instanceof Error ? error : undefined }
  );

// Async error handling wrappers removed - use CLI framework Result patterns directly

// ============================================================================
// FILE PATTERN UTILITIES
// ============================================================================

/**
 * Count files matching a pattern
 */
export const countFilesByPattern = (files: readonly string[], pattern: string): number =>
  files.filter(file => file.includes(pattern)).length;

/**
 * Group files by pattern
 */
export const groupFilesByPattern = (
  files: readonly string[],
  patterns: readonly { name: string; pattern: string | RegExp }[]
): Record<string, readonly string[]> => {
  const groups: Record<string, string[]> = {};

  patterns.forEach(({ name }) => {
    groups[name] = [];
  });

  files.forEach(file => {
    patterns.forEach(({ name, pattern }) => {
      const matches = typeof pattern === 'string' ? file.includes(pattern) : pattern.test(file);

      if (matches) {
        groups[name].push(file);
      }
    });
  });

  return Object.fromEntries(
    Object.entries(groups).map(([key, value]) => [key, Object.freeze(value)])
  );
};

// ============================================================================
// STATE UPDATE UTILITIES
// ============================================================================

/**
 * Generic immutable state updater
 */
export const updateState = <T extends object>(state: T, updates: Partial<T>): T =>
  Object.freeze({ ...state, ...updates });

/**
 * Update nested state immutably
 */
export const updateNestedState = <T extends object, K extends keyof T>(
  state: T,
  key: K,
  updates: Partial<T[K]>
): T =>
  updateState(state, {
    [key]: updateState(state[key] as object, updates),
  } as Partial<T>);

/**
 * Append to array in state immutably
 */
export const appendToState = <T extends object, K extends keyof T>(
  state: T,
  key: K,
  items: T[K] extends readonly unknown[] ? T[K][number][] : never
): T => {
  const currentArray = state[key] as readonly unknown[];
  return updateState(state, {
    [key]: Object.freeze([...currentArray, ...items]),
  } as Partial<T>);
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

// Validation utilities removed - use CLI framework validation patterns instead
// Import from '@esteban-url/trailhead-cli/core': createValidationPipeline, createRule, etc.

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format dependency for display
 */
export const formatDependency = (name: string, version: string, current?: string): string =>
  current ? `${name} (${current} → ${version})` : `${name}@${version}`;

/**
 * Format file count summary
 */
export const formatFileSummary = (
  files: readonly string[],
  categories: readonly { name: string; pattern: string }[]
): readonly string[] =>
  categories.map(
    ({ name, pattern }) => `  • ${name}: ${countFilesByPattern(files, pattern)} files`
  );

/**
 * Format list with bullet points
 */
export const formatBulletList = (items: readonly string[], indent: number = 2): readonly string[] =>
  items.map(item => `${' '.repeat(indent)}• ${item}`);

/**
 * Format command for display
 */
export const formatCommand = (command: string, indent: number = 2): string =>
  `${' '.repeat(indent)}${command}`;

// ============================================================================
// COMPARISON UTILITIES
// ============================================================================

// Array utility wrappers removed - use standard JavaScript Array methods directly

// ============================================================================
// TIMING UTILITIES
// ============================================================================

// Retry and timeout utilities removed - use CLI framework error recovery instead
// Import from '@esteban-url/trailhead-cli/error-recovery': retryableOperation, pRetry, etc.
