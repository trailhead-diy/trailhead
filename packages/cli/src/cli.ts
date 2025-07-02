import { Command } from 'commander';
import type {
  Command as CommandInterface,
  CommandContext,
} from './command/index.js';
import { createDefaultLogger } from './core/logger.js';
import { createFileSystem } from './filesystem/index.js';
import { validateCommandOption } from './command/validation.js';
import { processCommandOptionsWithCache } from './command/performance.js';

/**
 * Configuration object for creating a CLI application
 */
export interface CLIConfig {
  /** CLI application name (used in help text and version output) */
  name: string;
  /** Version string for the CLI application */
  version: string;
  /** Description shown in help text */
  description: string;
  /** Array of commands to register with the CLI */
  commands?: CommandInterface<any>[];
}

/**
 * CLI application interface
 */
export interface CLI {
  /** 
   * Run the CLI with provided arguments
   * @param argv - Command line arguments (defaults to process.argv)
   */
  run(argv?: string[]): Promise<void>;
}

/**
 * Create a CLI application with the specified configuration
 * 
 * Creates a complete CLI application that can parse command line arguments,
 * register commands, and execute them with proper error handling and validation.
 * 
 * @param config - CLI configuration object
 * @param config.name - Application name used in help text
 * @param config.version - Version string displayed with --version
 * @param config.description - Description shown in help text
 * @param config.commands - Array of command objects created with createCommand()
 * @returns CLI instance with run() method
 * 
 * @example
 * Basic CLI with single command:
 * ```typescript
 * const testCommand = createCommand({
 *   name: 'test',
 *   description: 'Run tests',
 *   action: async (options, context) => {
 *     context.logger.info('Tests completed');
 *     return { success: true, value: undefined };
 *   }
 * });
 * 
 * const cli = createCLI({
 *   name: 'my-cli',
 *   version: '1.0.0',
 *   description: 'My CLI application',
 *   commands: [testCommand]
 * });
 * 
 * // Run with process arguments
 * await cli.run();
 * 
 * // Or run with custom arguments
 * await cli.run(['node', 'cli.js', 'test', '--verbose']);
 * ```
 * 
 * @example
 * CLI with multiple commands:
 * ```typescript
 * const buildCommand = createCommand({
 *   name: 'build',
 *   description: 'Build the project',
 *   action: async (options, context) => {
 *     // Build implementation
 *     return { success: true, value: undefined };
 *   }
 * });
 * 
 * const testCommand = createCommand({
 *   name: 'test',
 *   description: 'Run tests',
 *   action: async (options, context) => {
 *     // Test implementation
 *     return { success: true, value: undefined };
 *   }
 * });
 * 
 * const cli = createCLI({
 *   name: 'project-tools',
 *   version: '2.1.0',
 *   description: 'Project development tools',
 *   commands: [buildCommand, testCommand]
 * });
 * 
 * await cli.run();
 * ```
 */
export function createCLI(config: CLIConfig): CLI {
  const program = new Command()
    .name(config.name)
    .version(config.version)
    .description(config.description);

  const commands: CommandInterface<any>[] = config.commands || [];

  return {
    async run(argv: string[] = process.argv): Promise<void> {
      // Register all commands
      for (const command of commands) {
        const cmd = program
          .command(command.name)
          .description(command.description);

        // Add arguments if specified
        if (command.arguments) {
          if (typeof command.arguments === 'string') {
            cmd.arguments(command.arguments);
          } else {
            // Handle array of argument definitions
            const argumentsString = command.arguments
              .map(arg => {
                if (arg.variadic) {
                  return arg.required !== false ? `<${arg.name}...>` : `[${arg.name}...]`;
                } else {
                  return arg.required !== false ? `<${arg.name}>` : `[${arg.name}]`;
                }
              })
              .join(' ');
            cmd.arguments(argumentsString);
          }
        }

        // Add options with performance optimization
        if (command.options && command.options.length > 0) {
          // Process all options with caching for better performance
          const processedOptions = processCommandOptionsWithCache(command.options);
          
          for (let i = 0; i < processedOptions.length; i++) {
            const option = command.options[i];
            const processed = processedOptions[i];
            
            // Validate option configuration with enhanced error messages
            const validationResult = validateCommandOption(option, i);
            if (!validationResult.success) {
              const error = validationResult.error;
              console.error(`\n❌ CLI Configuration Error in command '${command.name}':`);
              console.error(`   ${error.message}`);
              if (error.suggestion) {
                console.error(`   💡 Suggestion: ${error.suggestion}`);
              }
              console.error(`   Option configuration:`, JSON.stringify(option, null, 2));
              process.exit(1);
            }

            try {
              if (option.required) {
                cmd.requiredOption(
                  processed.flags,
                  option.description,
                  option.default,
                );
              } else {
                cmd.option(
                  processed.flags,
                  option.description,
                  option.default,
                );
              }
            } catch (commanderError) {
              console.error(`\n❌ Commander.js Error in command '${command.name}', option '${processed.name}':`);
              console.error(`   ${commanderError instanceof Error ? commanderError.message : String(commanderError)}`);
              console.error(`   Flags: ${processed.flags}`);
              console.error(`   Option configuration:`, JSON.stringify(option, null, 2));
              console.error(`   💡 This usually indicates an invalid flags format or conflicting options`);
              process.exit(1);
            }
          }
        }

        // Add verbose flag to all commands
        cmd.option('-v, --verbose', 'show detailed output', false);

        // Set up action handler
        cmd.action(async (...args: any[]) => {
          // Commander passes the Command object as the last argument
          const commandObj = args[args.length - 1];
          // Extract options from the Command object
          const options = commandObj.opts();
          // All arguments before the Command object are positional arguments
          // For variadic arguments, Commander.js passes them as arrays in the args
          let positionalArgs: string[] = [];
          for (let i = 0; i < args.length - 1; i++) {
            const arg = args[i];
            if (Array.isArray(arg)) {
              // Variadic arguments come as arrays
              positionalArgs = positionalArgs.concat(arg.filter(a => typeof a === 'string'));
            } else if (typeof arg === 'string') {
              positionalArgs.push(arg);
            }
          }

          const context: CommandContext = {
            projectRoot: process.cwd(),
            logger: createDefaultLogger(options.verbose),
            verbose: options.verbose,
            fs: createFileSystem(),
            args: positionalArgs,
          };

          try {
            const result = await command.execute(options, context);
            if (!result.success) {
              context.logger.error(result.error.message);
              if (result.error.suggestion) {
                context.logger.info(`💡 ${result.error.suggestion}`);
              }
              process.exit(1);
            }
          } catch (error) {
            context.logger.error(
              error instanceof Error ? error.message : 'Unknown error occurred',
            );
            process.exit(1);
          }
        });
      }

      // Parse arguments
      await program.parseAsync(argv);
    },
  };
}
