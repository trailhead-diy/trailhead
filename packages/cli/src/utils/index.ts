export {
  colors,
  red,
  green,
  yellow,
  blue,
  cyan,
  magenta,
  white,
  gray,
  bold,
  dim,
  underline,
  italic,
  strikethrough,
  reset,
} from './chalk.js'
export { createSpinner, withSpinner, type Spinner } from './spinner.js'
export { createDefaultLogger, logger, type Logger } from './logger.js'

export {
  createStats,
  updateStats,
  getElapsedTime,
  formatStats,
  type StatsTracker,
} from './stats.js'

export {
  filterUndefined,
  mergeOptionsWithDefaults,
  coerceOptionType,
  processCommandOptions,
} from './options.js'

// Package manager utilities
export {
  detectPackageManager,
  getRunCommand,
  execPackageManagerCommand,
  clearPackageManagerCache,
  createPackageManagerCache,
  parseSemVer,
  compareSemVer,
  isGreaterThanOrEqual,
  type SemVer,
  type PackageManager,
  type DetectOptions,
  type PackageManagerCache,
} from './package-manager.js'
