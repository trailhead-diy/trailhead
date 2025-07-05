#!/usr/bin/env node

import { createCLI } from '@esteban-url/trailhead-cli';
import { generateCommand } from './commands/generate.js';

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
 * A CLI generator that creates new projects using @esteban-url/trailhead-cli
 * Built with trailhead-cli framework for consistency and best practices
 */
async function main() {
  const cli = createCLI({
    name: 'create-trailhead-cli',
    version: '0.1.0',
    description: 'Generate CLI projects with @esteban-url/trailhead-cli',
    commands: [generateCommand],
  });

  await cli.run();
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
