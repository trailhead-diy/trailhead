#!/usr/bin/env node

/**
 * CLI generator for creating new Trailhead-based CLI applications.
 *
 * This package provides a comprehensive generator for creating new CLI applications
 * using the @trailhead/* architecture. It features interactive project setup,
 * template-based generation, and integrated development environment configuration.
 *
 * @example
 * ```bash
 * # Interactive generation
 * npx @trailhead/create-cli
 * npx @trailhead/create-cli my-awesome-cli
 *
 * # Programmatic usage
 * npm install @trailhead/create-cli
 * ```
 *
 * @example
 * ```typescript
 * import { generateProject } from '@trailhead/create-cli'
 *
 * const result = await generateProject({
 *   projectName: 'my-cli',
 *   projectPath: '/path/to/project',
 *   packageManager: 'pnpm',
 *   features: { core: true, config: true },
 *   projectType: 'standalone-cli',
 *   nodeVersion: '18.0.0',
 *   typescript: true,
 *   ide: 'vscode',
 *   dryRun: false,
 *   force: false,
 *   verbose: false
 * }, context)
 * ```
 *
 * @packageDocumentation
 * @module @trailhead/create-cli
 * @since 0.1.0
 */

import { createCLI } from '@trailhead/cli'
import { createDefaultLogger } from '@trailhead/cli/utils'
import { generateCommand } from './commands/generate.js'

// Export utilities for programmatic use
export { generateProject } from './lib/core/generator.js'
export { getTemplateFiles } from './lib/templates/loader.js'
export { getAvailableTemplates } from './lib/templates/utils.js'
export type {
  ProjectConfig,
  TemplateContext,
  TemplateFile,
  TemplateLoaderConfig,
  PackageManager,
  GeneratorContext,
} from './lib/types.js'
export type { TemplateInfo } from './lib/templates/utils.js'

/**
 * Create Trailhead CLI Generator
 *
 * A CLI generator that creates new projects using the @trailhead/* architecture
 * Built with functional programming principles and explicit error handling
 */
async function main() {
  // Check if user provided a project name directly (no command)
  const args = process.argv.slice(2)
  const firstArg = args[0]
  const isCommand =
    firstArg && (firstArg === 'generate' || firstArg === 'help' || firstArg.startsWith('-'))

  // If first argument is not a command and not a flag, treat it as project name
  if (firstArg && !isCommand) {
    // Insert 'generate' command before the project name
    process.argv.splice(2, 0, 'generate')
  }

  const cli = createCLI({
    name: 'create-trailhead-cli',
    version: '0.1.0',
    description: 'Simple CLI generator for @trailhead/* projects',
    commands: [generateCommand],
  })

  await cli.run()
}

// Run the CLI
main().catch((error) => {
  const logger = createDefaultLogger()
  logger.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
