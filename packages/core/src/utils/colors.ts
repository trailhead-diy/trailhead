/**
 * Color utilities for consistent CLI styling
 * Re-exports chalk and provides semantic color functions
 */
import chalk from 'chalk'

// Re-export chalk as default to avoid tsup declaration issues
export { default as chalk } from 'chalk'

/** Format success messages in green */
export const success = chalk.green

/** Format error messages in red */
export const error = chalk.red

/** Format warning messages in yellow */
export const warning = chalk.yellow

/** Format info messages in blue */
export const info = chalk.blue

/** Format muted/secondary text in gray */
export const muted = chalk.gray

/** Format text in bold */
export const bold = chalk.bold

/** Format text dimmed/faded */
export const dim = chalk.dim

/** Format text in italic */
export const italic = chalk.italic

/** Format text with underline */
export const underline = chalk.underline
