#!/usr/bin/env node

import { generateProject } from './lib/generator.js'
import { parseArgumentsModern, gatherProjectConfig } from './lib/interactive-prompts.js'
import { createLogger } from './lib/logger.js'
import { configCommand } from './commands/config.js'

// Export utilities for programmatic use
export { generateProject } from './lib/generator.js'
export { getTemplateFiles } from './lib/template-loader.js'
export {
  createTemplateConfig,
  createTestTemplateConfig,
  createDevTemplateConfig,
  validateTemplateConfig,
  getTemplateConfigSummary,
} from './lib/template-config.js'
export type {
  ProjectConfig,
  TemplateContext,
  TemplateFile,
  TemplateLoaderConfig,
  TemplateVariant,
  PackageManager,
  GeneratorContext,
} from './lib/types.js'
export type { ModernProjectConfig } from './lib/interactive-prompts.js'

/**
 * Create Trailhead CLI Generator
 *
 * A CLI generator that creates new projects using the new @esteban-url/* architecture
 * Built with functional programming principles and explicit error handling
 */
async function main() {
  const logger = createLogger()

  try {
    const args = process.argv.slice(2)

    // Handle config command separately
    if (args.length > 0 && args[0] === 'config') {
      const configResult = await configCommand.handler({
        args: args.slice(1),
        flags: parseConfigFlags(args.slice(1)),
        context: {},
      })

      if (configResult.isErr()) {
        logger.error(configResult.error.message)
        process.exit(1)
      }

      process.exit(0)
    }

    const parseResult = parseArgumentsModern(args)

    if (parseResult.isErr()) {
      logger.error(parseResult.error.message)
      process.exit(1)
    }

    const { projectName, flags, interactive, help, version } = parseResult.value

    if (help) {
      showHelp()
      process.exit(0)
    }

    if (version) {
      console.log('0.1.0')
      process.exit(0)
    }

    // Validate project name if not interactive
    if (!interactive && !projectName) {
      logger.error('Project name is required when not in interactive mode')
      process.exit(1)
    }

    // Gather configuration (interactive or from flags)
    const configResult = await gatherProjectConfig(projectName, flags)

    if (configResult.isErr()) {
      logger.error(`Failed to configure project: ${configResult.error.message}`)
      process.exit(1)
    }

    const config = configResult.value

    // Show configuration summary
    if (!config.dryRun) {
      logger.info('')
      logger.info('📋 Project Configuration:')
      logger.info(`   Name: ${config.projectName}`)
      logger.info(`   Type: ${config.projectType}`)
      logger.info(`   Template: ${config.template}`)
      logger.info(`   Package Manager: ${config.packageManager}`)
      logger.info(`   Author: ${config.author.name} <${config.author.email}>`)
      logger.info(`   License: ${config.license}`)
      logger.info(
        `   Features: ${Object.entries(config.features)
          .filter(([, enabled]) => enabled)
          .map(([name]) => name)
          .join(', ')}`
      )
      logger.info('')
    }

    const result = await generateProject(config, {
      logger,
      verbose: config.verbose,
      templateConfig: undefined,
    })

    if (result.isErr()) {
      logger.error(`Failed to generate project: ${result.error.message}`)
      process.exit(1)
    }

    if (!config.dryRun) {
      logger.success(`Successfully generated '${config.projectName}' 🎉`)
      logger.info('')
      logger.info('🚀 Next steps:')
      logger.info(`   cd ${config.projectName}`)
      if (!config.installDependencies) {
        logger.info(`   ${config.packageManager} install`)
      }
      logger.info(`   ${config.packageManager} dev`)
      if (config.features.testing) {
        logger.info(`   ${config.packageManager} test`)
      }
      logger.info('')
      logger.info('Happy coding! ✨')
    }
  } catch (error) {
    logger.error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

function showHelp() {
  console.log(`
create-trailhead-cli - Modern CLI generator with interactive setup and configuration management

Usage:
  create-trailhead-cli [project-name] [options]
  create-trailhead-cli config [config-options]

Commands:
  config                     Manage configuration files and presets

Arguments:
  [project-name]             Name of the project to create (optional - will prompt if not provided)

Project Generation Options:
  -t, --template <type>      Template variant (basic, advanced) - skips interactive mode
  -p, --package-manager <pm> Package manager (npm, pnpm) 
  --docs                     Include documentation features
  --no-git                   Skip git repository initialization
  --no-install               Skip dependency installation
  --non-interactive          Skip interactive prompts (requires project name)
  --force                    Overwrite existing directory
  --dry-run                  Show what would be generated without creating files
  --verbose                  Enable verbose output
  -h, --help                 Show this help message
  -v, --version              Show version number

Configuration Management:
  config --list-presets      List available configuration presets
  config --preset <name>     Show details of a specific preset
  config --generate-schema   Generate JSON schema for IDE support
  config --cleanup           Clean up old configuration files

Interactive Mode (default):
  The CLI includes an interactive setup process with preset support.
  You can use built-in presets or create custom ones for common configurations.

Examples:
  create-trailhead-cli                              # Full interactive setup with presets
  create-trailhead-cli my-cli                       # Interactive with pre-filled name
  create-trailhead-cli my-cli --template basic --non-interactive
  create-trailhead-cli my-cli --template advanced --docs --package-manager npm
  create-trailhead-cli my-cli --dry-run

  create-trailhead-cli config --list-presets        # Show available presets
  create-trailhead-cli config --preset advanced-cli # Show preset details
  create-trailhead-cli config --generate-schema     # Generate JSON schema
`)
}

/**
 * Parse config command flags
 */
function parseConfigFlags(args: string[]): Record<string, any> {
  const flags: Record<string, any> = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--list':
      case '--list-presets':
        flags['list-presets'] = true
        break
      case '--generate-schema':
        flags['generate-schema'] = true
        break
      case '--cleanup':
        flags.cleanup = true
        break
      case '--verbose':
        flags.verbose = true
        break
      case '--preset':
        if (i + 1 < args.length) {
          flags.preset = args[i + 1]
          i++ // Skip next arg
        }
        break
      case '--config-dir':
        if (i + 1 < args.length) {
          flags['config-dir'] = args[i + 1]
          i++ // Skip next arg
        }
        break
    }
  }

  return flags
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
