import { createCLI } from '@esteban-url/cli'
import { npmAuthCommand } from './commands/npm-auth.js'
import { ciCommand } from './commands/ci.js'
import { testRunnerCommand } from './commands/test-runner.js'
import { fixImportsCommand } from './commands/fix-imports.js'
import { validateDepsCommand } from './commands/validate-deps.js'
import { coverageCheckCommand } from './commands/coverage-check.js'

const cli = createCLI({
  name: 'scripts-cli',
  version: '0.1.0',
  description: 'TypeScript CLI tools for Trailhead monorepo operations',
  commands: [
    npmAuthCommand,
    ciCommand,
    testRunnerCommand,
    fixImportsCommand,
    validateDepsCommand,
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
