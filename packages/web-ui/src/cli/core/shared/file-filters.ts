/**
 * Shared file filter predicates for consistent file filtering across the codebase
 */

import type { FileFilterPredicate } from '../installation/types.js';

// Basic file type filters
export const isTsxFile: FileFilterPredicate = file => file.endsWith('.tsx');
export const isTsFile: FileFilterPredicate = file => file.endsWith('.ts');
export const isJsFile: FileFilterPredicate = file => file.endsWith('.js');
export const isJsxFile: FileFilterPredicate = file => file.endsWith('.jsx');

// Component-specific filters
export const isCatalystComponent: FileFilterPredicate = file =>
  file.startsWith('catalyst-') && file.endsWith('.tsx');

// Wrapper components are TSX files that:
// - Are not theme-related (don't start with 'theme')
// - Are not the index file
// - Are at the root level (no path separators)
export const isWrapperComponent: FileFilterPredicate = file =>
  file.endsWith('.tsx') && !file.startsWith('theme') && file !== 'index.tsx' && !file.includes('/');

// Test file and directory filters
export const isTestFile: FileFilterPredicate = file =>
  file.includes('.test.') || file.includes('.spec.');

export const isTestDirectory: FileFilterPredicate = file =>
  file.includes('__tests__') || file.includes('tests/');

export const isTestRelated: FileFilterPredicate = file => isTestFile(file) || isTestDirectory(file);

// Exclude test files from operations
export const isNotTestRelated: FileFilterPredicate = file => !isTestRelated(file);

// Utility functions for combining filters
export const combineFilters = <T = string>(
  ...filters: FileFilterPredicate<T>[]
): FileFilterPredicate<T> => {
  return (file: T) => filters.every(filter => filter(file));
};

export const anyFilter = <T = string>(
  ...filters: FileFilterPredicate<T>[]
): FileFilterPredicate<T> => {
  return (file: T) => filters.some(filter => filter(file));
};
