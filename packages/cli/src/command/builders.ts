/**
 * Common Options Utilities
 *
 * Pre-configured common options for consistent CLI behavior.
 * These utilities help maintain consistency across commands without
 * the overhead of abstraction builders.
 *
 * With citty's clean API, most builders are unnecessary overhead.
 * Use defineCommand directly and these utilities for common patterns.
 */

/**
 * Pre-configured common command option patterns
 *
 * Provides standard configurations for frequently used CLI options.
 * Use these for consistency across your commands.
 *
 * @example
 * ```typescript
 * import { defineCommand } from '@trailhead/cli/command'
 * import { commonOptions } from '@trailhead/cli/command'
 *
 * const myCommand = defineCommand({
 *   meta: {
 *     name: 'convert',
 *     description: 'Convert files'
 *   },
 *   args: {
 *     output: {
 *       type: 'string',
 *       description: 'Output file path',
 *       alias: 'o'
 *     },
 *     format: {
 *       type: 'string',
 *       description: commonOptions.formatDescription(['json', 'yaml']),
 *       default: 'json'
 *     },
 *     verbose: commonOptions.verboseArg,
 *     dryRun: commonOptions.dryRunArg
 *   },
 *   run: async (args, context) => { ... }
 * })
 * ```
 */
export const commonOptions = {
  /**
   * Standard verbose logging argument
   */
  verboseArg: {
    type: 'boolean' as const,
    description: 'Enable verbose logging',
    alias: 'v',
  },

  /**
   * Standard dry-run preview argument
   */
  dryRunArg: {
    type: 'boolean' as const,
    description: 'Preview changes without executing',
    alias: 'd',
  },

  /**
   * Standard force overwrite argument
   */
  forceArg: {
    type: 'boolean' as const,
    description: 'Overwrite existing files',
  },

  /**
   * Standard interactive mode argument
   */
  interactiveArg: {
    type: 'boolean' as const,
    description: 'Run in interactive mode',
    alias: 'i',
  },

  /**
   * Generate format description with choices
   */
  formatDescription: (choices: string[]): string => {
    return `Output format (${choices.join(', ')})`
  },
}
