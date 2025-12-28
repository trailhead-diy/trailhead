/**
 * Console color utilities using picocolors.
 *
 * Provides lightweight, fast terminal color support with automatic
 * color detection for CI/TTY environments.
 *
 * @module cli/utils/chalk
 */
import pc from 'picocolors'

/**
 * Full picocolors API for advanced color manipulation.
 *
 * Use this when you need access to all color functions or chaining.
 */
export { pc as colors }

/**
 * Individual color functions for convenient terminal styling.
 *
 * @example
 * ```typescript
 * console.log(red('Error:'), 'Something went wrong');
 * console.log(bold(green('Success!')));
 * ```
 */
export const {
  /** Apply red foreground color */
  red,
  /** Apply green foreground color */
  green,
  /** Apply yellow foreground color */
  yellow,
  /** Apply blue foreground color */
  blue,
  /** Apply cyan foreground color */
  cyan,
  /** Apply magenta foreground color */
  magenta,
  /** Apply white foreground color */
  white,
  /** Apply gray foreground color */
  gray,
  /** Apply bold text styling */
  bold,
  /** Apply dim/faint text styling */
  dim,
  /** Apply underline text styling */
  underline,
  /** Apply italic text styling */
  italic,
  /** Apply strikethrough text styling */
  strikethrough,
  /** Reset all styling */
  reset,
} = pc
