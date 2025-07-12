#!/usr/bin/env node

import { generateProject } from './lib/generator.js';
import { parseArguments } from './lib/args-parser.js';
import { createLogger } from './lib/logger.js';

// Export utilities for programmatic use
export { generateProject } from './lib/generator.js';
export { getTemplateFiles } from './lib/template-loader.js';
export {
  createTemplateConfig,
  createTestTemplateConfig,
  createDevTemplateConfig,
  validateTemplateConfig,
  getTemplateConfigSummary,
} from './lib/template-config.js';
export type {
  ProjectConfig,
  TemplateContext,
  TemplateFile,
  TemplateLoaderConfig,
  TemplateVariant,
  PackageManager,
  GeneratorContext,
} from './lib/types.js';

/**
 * Create Trailhead CLI Generator
 *
 * A CLI generator that creates new projects using the new @trailhead/* architecture
 * Built with functional programming principles and explicit error handling
 */
async function main() {
  const logger = createLogger();

  try {
    const args = parseArguments(process.argv.slice(2));

    if (args.isErr()) {
      logger.error(args.error.message);
      process.exit(1);
    }

    const config = args.value;

    if (config.help) {
      showHelp();
      process.exit(0);
    }

    if (config.version) {
      console.log('0.1.0');
      process.exit(0);
    }

    const result = await generateProject(config, { logger, verbose: config.verbose });

    if (result.isErr()) {
      logger.error(`Failed to generate project: ${result.error.message}`);
      process.exit(1);
    }

    if (!config.dryRun) {
      logger.success(`Successfully generated '${config.projectName}'`);
      logger.info('');
      logger.info('Next steps:');
      logger.info(`  cd ${config.projectName}`);
      if (!config.installDependencies) {
        logger.info(`  ${config.packageManager} install`);
      }
      logger.info(`  ${config.packageManager} dev`);
      logger.info('');
      logger.info('Happy coding! 🚀');
    }
  } catch (error) {
    logger.error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
create-trailhead-cli - Generate CLI projects with @trailhead/* architecture

Usage:
  create-trailhead-cli <project-name> [options]

Arguments:
  <project-name>    Name of the project to create

Options:
  -t, --template <type>      Template variant (basic, advanced) [default: basic]
  -p, --package-manager <pm> Package manager (npm, pnpm) [default: pnpm]
  --docs                     Include full documentation structure
  --no-git                   Skip git repository initialization
  --no-install               Skip dependency installation
  --force                    Overwrite existing directory
  --dry-run                  Show what would be generated
  --verbose                  Enable verbose output
  -h, --help                 Show this help message
  -v, --version              Show version number

Examples:
  create-trailhead-cli my-cli
  create-trailhead-cli my-cli --template advanced --docs
  create-trailhead-cli my-cli --package-manager npm --no-git
  create-trailhead-cli my-cli --dry-run
`);
}

// Run the CLI
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
