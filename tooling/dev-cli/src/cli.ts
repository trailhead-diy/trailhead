import { createCLI } from '@esteban-url/cli'
// Development commands
import { freshStartCommand } from './commands/dev/fresh-start.js'
import { testRunnerCommand } from './commands/dev/test-runner.js'
// Dependency commands
import { fixImportsCommand } from './commands/deps/fix-imports.js'
import { validateDepsCommand } from './commands/deps/validate-deps.js'
import { validateInterdepsCommand } from './commands/deps/validate-interdeps.js'
// Documentation commands
import { generateApiCommand } from './commands/docs/generate-api.js'
import { fixLinksCommand } from './commands/docs/fix-links.js'
import { fixDeclarationsCommand } from './commands/docs/fix-declarations.js'
import { setupIntegrationCommand } from './commands/docs/setup-integration.js'
// CI/CD commands
import { npmAuthCommand } from './commands/ci/npm-auth.js'
import { ciCommand } from './commands/ci/ci.js'
import { coverageCheckCommand } from './commands/ci/coverage-check.js'

const cli = createCLI({
  name: 'dev-cli',
  version: '0.1.0',
  description: 'Development operations CLI for Trailhead monorepo',
  commands: [
    // Development workflow commands
    freshStartCommand,
    testRunnerCommand,
    // Dependency management commands
    fixImportsCommand,
    validateDepsCommand,
    validateInterdepsCommand,
    // Documentation commands
    generateApiCommand,
    fixLinksCommand,
    fixDeclarationsCommand,
    setupIntegrationCommand,
    // CI/CD commands
    npmAuthCommand,
    ciCommand,
    coverageCheckCommand,
  ],
})

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cli.run().catch((error) => {
    console.error('CLI Error:', error)
    process.exit(1)
  })
}

export default cli
