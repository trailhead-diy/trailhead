import type { TrailheadCommandDef, CommandAction } from './types.js'
import { defineCommand as cittyDefineCommand } from 'citty'
import { createDefaultLogger } from '../utils/logger.js'
import { fs } from '../fs/index.js'
import type { CommandContext } from './types.js'

/**
 * Define a command with trailhead context and Result types
 *
 * Wraps citty's defineCommand to inject CommandContext and handle Result types.
 * Commands receive parsed args and context, return Result<void, CoreError>.
 *
 * @param config - Command configuration with meta, args, and run function
 * @returns Citty command definition ready for runMain
 *
 * @example
 * ```typescript
 * import { defineCommand } from '@trailhead/cli/command'
 * import { ok, err } from '@trailhead/core'
 *
 * export const greetCommand = defineCommand({
 *   meta: {
 *     name: 'greet',
 *     description: 'Greet someone'
 *   },
 *   args: {
 *     name: {
 *       type: 'positional',
 *       required: true,
 *       description: 'Name to greet'
 *     },
 *     loud: {
 *       type: 'boolean',
 *       description: 'Use loud greeting',
 *       alias: 'l'
 *     }
 *   },
 *   run: async (args, context) => {
 *     const greeting = args.loud
 *       ? `HELLO ${args.name}!`.toUpperCase()
 *       : `Hello ${args.name}!`
 *
 *     context.logger.info(greeting)
 *     return ok(undefined)
 *   }
 * })
 * ```
 */
export function defineCommand(config: TrailheadCommandDef) {
  const action: CommandAction = config.run

  return cittyDefineCommand({
    ...config,
    run: async ({ args, rawArgs }) => {
      // Create command context
      const verbose = Boolean(args.verbose || args.v)
      const logger = createDefaultLogger(verbose)

      const context: CommandContext = {
        projectRoot: process.cwd(),
        logger,
        verbose,
        fs: fs as any,
        args,
      }

      // Execute command action with Result type handling
      const result = await action(args, context)

      if (result.isErr()) {
        const error = result.error
        context.logger.error(error.message)
        if (error.suggestion) {
          context.logger.info(`💡 ${error.suggestion}`)
        }
        process.exit(1)
      }

      // Success - citty will handle normal exit
      return
    },
  })
}

/**
 * Re-export citty's runMain for convenience
 *
 * @example
 * ```typescript
 * import { defineCommand, runMain } from '@trailhead/cli/command'
 *
 * const cli = defineCommand({
 *   meta: { name: 'my-cli', version: '1.0.0' },
 *   args: {},
 *   run: async (args, context) => ok(undefined)
 * })
 *
 * runMain(cli)
 * ```
 */
export { runMain } from 'citty'
