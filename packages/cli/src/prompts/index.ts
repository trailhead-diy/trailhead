/**
 * @module cli/prompts
 * @description Interactive prompts built on Clack for beautiful CLI experiences.
 *
 * Re-exports Clack prompts with custom helpers for common patterns.
 *
 * @since 2.0.0
 */
import {
  text,
  confirm,
  select,
  multiselect,
  group,
  groupMultiselect,
  isCancel,
  cancel,
  intro,
  outro,
  log,
  spinner,
  note,
  password,
  selectKey,
} from '@clack/prompts'

// Re-export all Clack primitives
export {
  text,
  confirm,
  select,
  multiselect,
  group,
  groupMultiselect,
  isCancel,
  cancel,
  intro,
  outro,
  log,
  spinner,
  note,
  password,
  selectKey,
}

/**
 * Confirmation prompt with optional details display
 *
 * Shows a yes/no confirmation prompt with optional bullet points
 * displayed before the question. Useful for confirming destructive
 * operations or important actions.
 *
 * @param message - The confirmation question to ask
 * @param details - Optional array of details to display as bullets
 * @param defaultValue - Default answer (default: true)
 * @returns Promise that resolves to boolean response
 *
 * @example
 * ```typescript
 * const shouldDelete = await confirmWithDetails(
 *   'Delete all generated files?',
 *   [
 *     'Remove dist/ directory',
 *     'Clear cache files',
 *     'Delete temporary build artifacts'
 *   ],
 *   false
 * );
 * ```
 */
export async function confirmWithDetails(
  message: string,
  details?: string[],
  defaultValue = true
): Promise<boolean> {
  if (details && details.length > 0) {
    log.info('This will:')
    for (const detail of details) {
      log.message(`  • ${detail}`, { symbol: '' })
    }
    log.message('', { symbol: '' })
  }

  const result = await confirm({
    message,
    initialValue: defaultValue,
  })

  if (isCancel(result)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return result
}

/**
 * Directory path prompt with validation
 *
 * Shows an input prompt for directory paths with built-in validation
 * to ensure safe relative paths without parent directory traversal.
 * Automatically normalizes path separators.
 *
 * @param message - The prompt message to display
 * @param defaultPath - Default directory path suggestion
 * @returns Promise that resolves to validated path
 *
 * @example
 * ```typescript
 * const outputPath = await directoryPrompt(
 *   'Where should we save the output?',
 *   'dist/output'
 * );
 * // User input is validated and normalized
 * ```
 */
export async function directoryPrompt(message: string, defaultPath?: string): Promise<string> {
  const result = await text({
    message,
    placeholder: defaultPath,
    initialValue: defaultPath,
    validate: (value) => {
      if (!value?.trim()) {
        return 'Please enter a valid directory path'
      }
      if (value.includes('..') || value.startsWith('/')) {
        return 'Please enter a relative path without ".." segments'
      }
    },
  })

  if (isCancel(result)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return String(result).trim().replace(/\\/g, '/')
}

// Legacy aliases for backward compatibility (deprecated)
/**
 * @deprecated Use `confirmWithDetails` instead. Will be removed in v3.0.0.
 */
export function createConfirmationPrompt(message: string, details?: string[], defaultValue = true) {
  return () => confirmWithDetails(message, details, defaultValue)
}

/**
 * @deprecated Use `directoryPrompt` instead. Will be removed in v3.0.0.
 */
export function createDirectoryPrompt(message: string, defaultPath?: string) {
  return () => directoryPrompt(message, defaultPath)
}
