#!/usr/bin/env node

import { createCLI } from '@esteban-url/cli'
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
  console.error('Fatal error:', error)
  process.exit(1)
})
