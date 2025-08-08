// Export CLI instance
export { default as cli } from './cli.js'

// Export all commands for programmatic use
// Development commands
export { freshStartCommand } from './commands/dev/fresh-start.js'
export { testRunnerCommand } from './commands/dev/test-runner.js'
// Dependency commands
export { fixImportsCommand } from './commands/deps/fix-imports.js'
export { validateDepsCommand } from './commands/deps/validate-deps.js'
export { validateInterdepsCommand } from './commands/deps/validate-interdeps.js'
// Documentation commands
export { generateApiCommand } from './commands/docs/generate-api.js'
export { fixLinksCommand } from './commands/docs/fix-links.js'
export { fixDeclarationsCommand } from './commands/docs/fix-declarations.js'
export { setupIntegrationCommand } from './commands/docs/setup-integration.js'
export { checkSyntaxCommand } from './commands/docs/check-syntax.js'
// CI/CD commands
export { npmAuthCommand } from './commands/ci/npm-auth.js'
export { ciCommand } from './commands/ci/ci.js'
export { coverageCheckCommand } from './commands/ci/coverage-check.js'

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

// Export shared utilities
export { gitOperations } from './utils/git.js'
export { fsOperations } from './utils/fs.js'
export { docsOperations } from './utils/docs.js'
