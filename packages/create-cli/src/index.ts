#!/usr/bin/env node

import { createCLI } from '@esteban-url/cli'
import { createDefaultLogger } from '@esteban-url/cli/utils'
import { generateCommand } from './commands/generate.js'
import { configCommand } from './commands/config.js'

// Export utilities for programmatic use
export { generateProject } from './lib/core/generator.js'
export { getTemplateFiles } from './lib/templates/loader.js'
export type {
  ProjectConfig,
  TemplateContext,
  TemplateFile,
  TemplateLoaderConfig,
  PackageManager,
  GeneratorContext,
} from './lib/types.js'

/**
 * Create Trailhead CLI Generator
 *
 * A CLI generator that creates new projects using the @esteban-url/* architecture
 * Built with functional programming principles and explicit error handling
 */
async function main() {
  // Check if user provided a project name directly (no command)
  const args = process.argv.slice(2)
  const firstArg = args[0]
  const isCommand =
    firstArg &&
    (firstArg === 'generate' ||
      firstArg === 'config' ||
      firstArg === 'help' ||
      firstArg.startsWith('-'))

  // If first argument is not a command and not a flag, treat it as project name
  if (firstArg && !isCommand) {
    // Insert 'generate' command before the project name
    process.argv.splice(2, 0, 'generate')
  }

  const cli = createCLI({
    name: 'create-trailhead-cli',
    version: '0.1.0',
    description: 'Modern CLI generator with interactive setup and configuration management',
    commands: [generateCommand, configCommand],
  })

  await cli.run()
}

// Run the CLI
main().catch((error) => {
  const logger = createDefaultLogger()
  logger.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
