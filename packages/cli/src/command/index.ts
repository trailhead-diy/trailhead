export type {
  Command,
  CommandContext,
  CommandOption,
  CommandArgument,
  CommandPhase,
  InteractiveOptions,
} from './types.js';

export {
  createCommand,
} from './base.js';

export {
  validateCommandOption,
  validateCommandConfig,
  validateCommandConfigWithCache,
} from './validation.js';

export {
  processOptionWithCache,
  processCommandOptionsWithCache,
} from './performance.js';

export {
  executeInteractiveCommand as executeInteractive,
  executeWithValidation,
  executeFileSystemOperations,
  executeSubprocess,
  executeBatch,
  executeWithConfiguration,
  // Requiered by @trailhead/web-ui
  executeWithPhases,      // Multi-step transformation workflows
  executeWithDryRun,      // Safe preview of file operations  
  displaySummary,         // Formatted configuration/result display
} from './patterns.js';

export type {
  CommandOptions,
  CommandConfig,
  CommandAction,
  CommandValidator,
} from './base.js';

export type {
  InteractiveCommandOptions,
  FileSystemOperation,
  SubprocessConfig,
  ConfigurationOptions,
} from './patterns.js';
