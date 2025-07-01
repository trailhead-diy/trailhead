import { Command } from 'commander'
import type { Command as CommandInterface, CommandContext } from './command/index.js'
import { createLogger } from './core/logger.js'
import { createFileSystem } from './filesystem/index.js'

export interface CLIConfig {
  name: string
  version: string
  description: string
  commands?: CommandInterface<any>[]
}

export interface CLI {
  addCommand(command: CommandInterface<any>): CLI
  run(argv: string[]): Promise<void>
}

export function createCLI(config: CLIConfig): CLI {
  const program = new Command()
    .name(config.name)
    .version(config.version)
    .description(config.description)

  const commands: CommandInterface<any>[] = config.commands || []

  return {
    addCommand(command: CommandInterface<any>): CLI {
      commands.push(command)
      return this
    },

    async run(argv: string[]): Promise<void> {
      // Register all commands
      for (const command of commands) {
        const cmd = program.command(command.name).description(command.description)

        // Add options
        if (command.options) {
          for (const option of command.options) {
            const flags = option.alias ? `-${option.alias}, --${option.name}` : `--${option.name}`

            if (option.required) {
              cmd.requiredOption(`${flags} <value>`, option.description, option.default)
            } else {
              cmd.option(
                option.type === 'boolean' ? flags : `${flags} <value>`,
                option.description,
                option.default
              )
            }
          }
        }

        // Add verbose flag to all commands
        cmd.option('-v, --verbose', 'show detailed output', false)

        // Set up action handler
        cmd.action(async (options) => {
          const context: CommandContext = {
            projectRoot: process.cwd(),
            logger: createLogger(options.verbose),
            verbose: options.verbose,
            fs: createFileSystem(),
          }

          try {
            const result = await command.execute(options, context)
            if (!result.success) {
              context.logger.error(result.error.message)
              if (result.error.suggestion) {
                context.logger.info(`💡 ${result.error.suggestion}`)
              }
              process.exit(1)
            }
          } catch (error) {
            context.logger.error(error instanceof Error ? error.message : 'Unknown error occurred')
            process.exit(1)
          }
        })
      }

      // Parse arguments
      await program.parseAsync(argv)
    },
  }
}
