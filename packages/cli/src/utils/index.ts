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
export { ora, createSpinner, withSpinner } from './spinner.js';
export { createDefaultLogger } from '../core/logger.js';

export {
  createStats,
  updateStats,
  getElapsedTime,
  formatStats,
  type StatsTracker,
} from './stats.js';

export type { Logger } from '../core/logger.js';

export {
  filterUndefined,
  mergeOptionsWithDefaults,
  coerceOptionType,
  processCommandOptions,
} from './options.js';
