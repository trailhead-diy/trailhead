export {
  chalk,
  success,
  error,
  warning,
  info,
  muted,
  bold,
  dim,
  italic,
  underline,
} from './chalk.js';
export { createSpinner, withSpinner } from './spinner.js';
export { createDefaultLogger, type Logger } from './logger.js';

export {
  createStats,
  updateStats,
  getElapsedTime,
  formatStats,
  type StatsTracker,
} from './stats.js';

export {
  filterUndefined,
  mergeOptionsWithDefaults,
  coerceOptionType,
  processCommandOptions,
} from './options.js';

// Package manager utilities
export {
  detectPackageManager,
  getRunCommand,
  execPackageManagerCommand,
  getPackageManagerInfo,
  clearPackageManagerCache,
  createPackageManagerCache,
  SemVer,
  type PackageManager,
  type DetectOptions,
} from './package-manager.js';
