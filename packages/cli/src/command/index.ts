export type {
  Command,
  CommandContext,
  CommandOption,
  CommandPhase,
  InteractiveOptions,
} from './types.js';

export {
  createCommand,
  executeWithPhases,
  executeWithProgress,
  executeWithDryRun,
  composeCommands,
  withGlobalOptions,
  displaySummary,
  confirmAction,
} from './base.js';

export {
  executeInteractiveCommand as executeInteractive,
  executeWithValidation,
  executeFileSystemOperations,
  executeSubprocess,
  executeBatch,
  executeWithConfiguration,
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
