#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { createCLIContext, getScriptDir } from './cli/utils/context.js'
import { createInstallCommand } from './cli/commands/install.js'
import { createTransformsCommand } from './cli/commands/transforms.js'
import { createProfileCommand } from './cli/commands/profile.js'
import { createDevRefreshCommand } from './cli/commands/dev-refresh.js'
process.on('uncaughtException', (error) => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    console.log(chalk.gray('\n👋 Installation cancelled'))
    process.exit(0)
  } else {
    console.error(chalk.red('❌ Unexpected error:'), error.message)
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack)
    }
    process.exit(1)
  }
})
async function main(): Promise<void> {
  try {
    const context = createCLIContext(getScriptDir())

    const program = new Command()
      .name('trailhead-ui')
      .description('Trailhead UI - Catalyst UI with advanced theming system')
      .version(context.version)
    program.addCommand(createInstallCommand(context))
    program.addCommand(createTransformsCommand(context))
    program.addCommand(createProfileCommand(context))
    program.addCommand(createDevRefreshCommand(context))
    program
      .command('init')
      .description('Initialize a new Trailhead UI project')
      .option('-n, --name <name>', 'project name')
      .option('-t, --template <template>', 'project template')
      .action(async (_options) => {
        console.log(chalk.yellow('🚧 Init command coming soon!'))
        console.log('For now, use:', chalk.cyan('trailhead-ui install'))
      })

    program
      .command('add')
      .description('Add individual components')
      .argument('[components...]', 'component names to add')
      .option('-f, --force', 'overwrite existing files')
      .action(async (_components, _options) => {
        console.log(chalk.yellow('🚧 Add command coming soon!'))
        console.log('For now, use:', chalk.cyan('trailhead-ui install'))
      })

    if (process.argv.length <= 2) {
      program.help()
    }
    await program.parseAsync(process.argv)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error(chalk.red('❌ CLI Error:'), errorMessage)

    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      console.error(error.stack)
    }

    process.exit(1)
  }
}
main().catch((error) => {
  console.error(chalk.red('Unhandled error:'), error)
  process.exit(1)
})
