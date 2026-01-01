// Core citty-based CLI creation
export { defineCommand, runMain } from './command/index.js'

// Types
export type {
  CommandContext,
  CommandAction,
  TrailheadCommandDef,
  CommandPhase,
  InteractiveOptions,
  CommandDef,
  ParsedArgs,
  ArgsDef,
} from './command/index.js'

// Command patterns and utilities
export {
  executeInteractive,
  executeWithValidation,
  executeFileSystemOperations,
  executeSubprocess,
  executeBatch,
  executeWithConfiguration,
  executeWithPhases,
  executeWithDryRun,
  displaySummary,
  commonOptions,
} from './command/index.js'

export type {
  InteractiveCommandOptions,
  FileSystemOperation,
  SubprocessConfig,
  ConfigurationOptions,
} from './command/index.js'

// Git hooks (note: requires migration to citty - currently deprecated)
// export { createGitHooksCommand } from './command/index.js'

// Re-export core Result types for convenience
export type { Result, CoreError } from '@trailhead/core'
export { ok, err, createCoreError } from '@trailhead/core'
