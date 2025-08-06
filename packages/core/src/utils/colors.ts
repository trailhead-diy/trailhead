/**
 * @module utils/colors
 * @description Color utilities for consistent CLI styling across Trailhead applications.
 * Re-exports chalk and provides semantic color functions for common use cases.
 */

import chalk from 'chalk'

/**
 * Re-export chalk for advanced color manipulation.
 * Provides access to all chalk functionality.
 *
 * @example
 * ```typescript
 * import { chalk } from '@esteban-url/core'
 *
 * console.log(chalk.bgRed.white.bold('ERROR!'))
 * console.log(chalk.rgb(123, 45, 67)('Custom color'))
 * console.log(chalk.hex('#ff6b6b')('Hex color'))
 * ```
 * @see {@link https://github.com/chalk/chalk} Chalk documentation
 */
export { default as chalk } from 'chalk'

/**
 * Format success messages in green.
 * Use for positive confirmations, successful operations, and completion messages.
 *
 * @example
 * ```typescript
 * console.log(success('✓ Build completed successfully'))
 * console.log(success(`Created ${fileCount} files`))
 * ```
 */
export const success = chalk.green

/**
 * Format error messages in red.
 * Use for errors, failures, and critical issues.
 *
 * @example
 * ```typescript
 * console.error(error('✗ Build failed'))
 * console.error(error(`Error: ${err.message}`))
 * ```
 */
export const error = chalk.red

/**
 * Format warning messages in yellow.
 * Use for warnings, cautions, and important notices.
 *
 * @example
 * ```typescript
 * console.warn(warning('⚠ Deprecated API usage detected'))
 * console.warn(warning('This operation may take a while...'))
 * ```
 */
export const warning = chalk.yellow

/**
 * Format informational messages in blue.
 * Use for general information, status updates, and neutral messages.
 *
 * @example
 * ```typescript
 * console.log(info('ℹ Starting development server...'))
 * console.log(info(`Connected to database at ${host}:${port}`))
 * ```
 */
export const info = chalk.blue

/**
 * Format muted/secondary text in gray.
 * Use for less important information, timestamps, and metadata.
 *
 * @example
 * ```typescript
 * console.log(muted('Last updated: 2 hours ago'))
 * console.log(`${bold('Name:')} John Doe ${muted('(admin)')}`)
 * ```
 */
export const muted = chalk.gray

/**
 * Format text in bold.
 * Use for emphasis, headers, and important labels.
 *
 * @example
 * ```typescript
 * console.log(bold('Configuration Options:'))
 * console.log(`${bold('Status:')} ${success('Active')}`)
 * ```
 */
export const bold = chalk.bold

/**
 * Format text dimmed/faded.
 * Use for debug information, verbose output, and de-emphasized content.
 *
 * @example
 * ```typescript
 * console.log(dim('Debug: Processing file 1 of 100...'))
 * console.log(dim(`[${timestamp}] Request received`))
 * ```
 */
export const dim = chalk.dim

/**
 * Format text in italic.
 * Use for quotes, citations, and stylistic emphasis.
 *
 * @example
 * ```typescript
 * console.log(italic('"Code is poetry"'))
 * console.log(`See ${italic('README.md')} for more information`)
 * ```
 */
export const italic = chalk.italic

/**
 * Format text with underline.
 * Use for links, important values, and visual separation.
 *
 * @example
 * ```typescript
 * console.log(underline('https://example.com'))
 * console.log(`Run ${underline('npm install')} to get started`)
 * ```
 */
export const underline = chalk.underline
