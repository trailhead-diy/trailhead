// Re-export all Inquirer.js prompts with enhanced TypeScript support
export * from '@inquirer/prompts'
import { createDefaultLogger } from '../utils/logger.js'

/**
 * Create a confirmation prompt with optional details display
 *
 * Shows a yes/no confirmation prompt with optional bullet points
 * displayed before the question. Useful for confirming destructive
 * operations or important actions.
 *
 * @param message - The confirmation question to ask
 * @param details - Optional array of details to display as bullets
 * @param defaultValue - Default answer (default: true)
 * @returns Async function that shows prompt and returns boolean response
 *
 * @example
 * ```typescript
 * const confirmDelete = createConfirmationPrompt(
 *   'Delete all generated files?',
 *   [
 *     'Remove dist/ directory',
 *     'Clear cache files',
 *     'Delete temporary build artifacts'
 *   ],
 *   false
 * );
 *
 * const shouldDelete = await confirmDelete();
 * ```
 */
export function createConfirmationPrompt(
  message: string,
  details?: string[],
  defaultValue: boolean = true
) {
  return async () => {
    if (details && details.length > 0) {
      const logger = createDefaultLogger()
      logger.info('This will:')
      details.forEach((detail) => logger.info(`  • ${detail}`))
      logger.info('')
    }

    const { confirm } = await import('@inquirer/prompts')
    return confirm({
      message,
      default: defaultValue,
    })
  }
}

/**
 * Create a directory path prompt with validation
 *
 * Shows an input prompt for directory paths with built-in validation
 * to ensure safe relative paths without parent directory traversal.
 * Automatically normalizes path separators.
 *
 * @param message - The prompt message to display
 * @param defaultPath - Default directory path suggestion
 * @returns Async function that shows prompt and returns validated path
 *
 * @example
 * ```typescript
 * const getOutputDir = createDirectoryPrompt(
 *   'Where should we save the output?',
 *   'dist/output'
 * );
 *
 * const outputPath = await getOutputDir();
 * // User input is validated and normalized
 * ```
 */
export function createDirectoryPrompt(message: string, defaultPath?: string) {
  return async () => {
    const { input } = await import('@inquirer/prompts')
    return input({
      message,
      default: defaultPath,
      validate: (answer) => {
        if (!answer || typeof answer !== 'string') {
          return 'Please enter a valid directory path'
        }
        if (answer.includes('..') || answer.startsWith('/')) {
          return 'Please enter a relative path without ".." segments'
        }
        return true
      },
      transformer: (answer) => {
        return String(answer).trim().replace(/\\/g, '/')
      },
    })
  }
}
