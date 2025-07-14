#!/usr/bin/env node

import { createCLI } from '@esteban-url/cli';
import { chalk } from '@esteban-url/cli/utils';
import { createCLIContext, getScriptDir } from './cli/utils/context.js';
import { createEnhanceCommand } from './cli/commands/enhance.js';
import { createTransformsCommand } from './cli/commands/transforms.js';
import { createDevRefreshCommand } from './cli/commands/dev-refresh.js';
import { createInitCommand } from './cli/commands/init.js';
import { createAddCommand } from './cli/commands/add.js';
process.on('uncaughtException', error => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    console.log(chalk.gray('\n👋 Installation cancelled'));
    process.exit(0);
  } else {
    console.error(chalk.red('❌ Unexpected error:'), error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
});
async function main(): Promise<void> {
  try {
    const context = await createCLIContext(getScriptDir());

    const cli = createCLI({
      name: 'trailhead-ui',
      description: 'Trailhead UI - Catalyst UI with advanced theming system',
      version: context.version,
      commands: [
        createEnhanceCommand(),
        createTransformsCommand(),
        createDevRefreshCommand(),
        createInitCommand(),
        createAddCommand(),
      ],
    });

    await cli.run(process.argv);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(chalk.red('❌ Unexpected error:'), errorMessage);

    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}
main().catch(error => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});
