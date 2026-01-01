// Core citty integration with trailhead patterns
export { defineCommand, runMain } from './base.js'

// Types
export type {
  CommandContext,
  CommandAction,
  TrailheadCommandDef,
  CommandPhase,
  InteractiveOptions,
  // Re-export citty types for convenience
  CommandDef,
  ParsedArgs,
  ArgsDef,
} from './types.js'

// Git hooks command (deprecated in v4.0.0 - needs migration to citty)
// export { createGitHooksCommand } from './git-hooks.js'

// Command patterns for advanced workflows
export {
  executeInteractiveCommand as executeInteractive,
  executeWithValidation,
  executeFileSystemOperations,
  executeSubprocess,
  executeBatch,
  executeWithConfiguration,
  executeWithPhases, // Multi-step transformation workflows
  executeWithDryRun, // Safe preview of file operations
  displaySummary, // Formatted configuration/result display
} from './patterns.js'

// Common options utilities
export { commonOptions } from './builders.js'

export type {
  InteractiveCommandOptions,
  FileSystemOperation,
  SubprocessConfig,
  ConfigurationOptions,
} from './patterns.js'
