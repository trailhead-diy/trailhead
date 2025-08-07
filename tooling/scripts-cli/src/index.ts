// Export all commands for programmatic use
export { npmAuthCommand } from './commands/npm-auth.js'
export { ciCommand } from './commands/ci.js'
export { testRunnerCommand } from './commands/test-runner.js'
export { fixImportsCommand } from './commands/fix-imports.js'
export { validateDepsCommand } from './commands/validate-deps.js'

// Export the CLI instance
export { default as cli } from './cli.js'

// Export utilities for external use
export { colorize, withIcon, colors, icons } from './utils/colors.js'
export {
  execCommand,
  execSequence,
  execParallel,
  createTimer,
  getElapsedSeconds,
  measureExecution,
} from './utils/subprocess.js'

// Export CLI creation function from cli.ts
export { default as createScriptsCLI } from './cli.js'
