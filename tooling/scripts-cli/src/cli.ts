import { createCLI } from '@esteban-url/cli'
import { npmAuthCommand } from './commands/npm-auth.js'
import { ciOptimalCommand } from './commands/ci-optimal.js'
import { testRunnerCommand } from './commands/test-runner.js'
import { fixImportsCommand } from './commands/fix-imports.js'
import { validateDepsCommand } from './commands/validate-deps.js'

const cli = createCLI({
  name: 'scripts-cli',
  version: '0.1.0',
  description: 'TypeScript CLI tools for Trailhead monorepo operations',
  commands: [
    npmAuthCommand,
    ciOptimalCommand,
    testRunnerCommand,
    fixImportsCommand,
    validateDepsCommand,
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
