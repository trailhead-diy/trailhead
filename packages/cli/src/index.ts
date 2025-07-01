export { createCLI } from './cli.js';
export type { CLI, CLIConfig } from './cli.js';

export { Ok, Err, isOk, isErr } from './core/errors/index.js';
export type { Result } from './core/errors/index.js';

export {
  createCommand,
  executeWithPhases,
  executeInteractive,
} from './command/index.js';
export type {
  Command,
  CommandContext,
  CommandOptions,
  CommandOption,
  CommandPhase,
  InteractiveOptions,
} from './command/index.js';

export {
  createValidationPipeline,
  createRule,
  createAsyncRule,
} from './core/validation/index.js';
export type {
  ValidationPipeline,
  ValidationRule,
  ValidationResult,
  ValidationSummary,
} from './core/validation/index.js';

export { createFileSystem } from './filesystem/index.js';
export type { FileSystem, FileSystemAdapter } from './filesystem/index.js';

export { defineConfig, loadConfig } from './config/index.js';
export type { ConfigSchema } from './config/index.js';

export { createLogger, chalk, ora, createSpinner } from './utils/index.js';
export type { Logger } from './utils/index.js';

export {
  createStats,
  updateStats,
  getElapsedTime,
  formatStats,
} from './utils/index.js';
export type { StatsTracker } from './utils/index.js';

export { prompt, select, confirm, multiselect } from './prompts/index.js';

export type { CLIError } from './core/errors/index.js';
