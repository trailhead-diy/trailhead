import type { Result, CoreError } from '@trailhead/core';
import type { Logger } from '../utils/logger.js';

// Simple FileSystem interface for CLI context
interface FileSystem {
  readFile: (path: string) => Promise<Result<string, CoreError>>;
  writeFile: (path: string, content: string) => Promise<Result<void, CoreError>>;
  exists: (path: string) => Promise<Result<boolean, CoreError>>;
  [key: string]: any; // Allow additional fs methods
}

/**
 * Context object provided to command actions during execution
 *
 * Contains all the runtime context needed for command execution including
 * project information, logging utilities, filesystem access, and parsed arguments.
 */
export interface CommandContext {
  /** Absolute path to the project root directory */
  readonly projectRoot: string;
  /** Logger instance for command output */
  readonly logger: Logger;
  /** Whether verbose logging is enabled */
  readonly verbose: boolean;
  /** Filesystem abstraction for file operations */
  readonly fs: FileSystem;
  /** Positional arguments passed to the command */
  readonly args: string[];
}

/**
 * Configuration for a command option/flag
 *
 * Defines the structure for command-line options that can be passed to commands.
 * Supports both Commander.js style flags and programmatic name/alias definitions.
 */
export interface CommandOption {
  /** Option name for programmatic access (extracted from flags if not provided) */
  name?: string;
  /** Single character alias for the option (e.g., 'v' for verbose) */
  alias?: string;
  /** Commander.js style flags string (e.g., '-v, --verbose' or '--output <dir>') */
  flags?: string;
  /** Description shown in help text */
  description: string;
  /** Expected value type for the option */
  type?: 'string' | 'boolean' | 'number';
  /** Whether the option is required */
  required?: boolean;
  /** Default value when option is not provided */
  default?: any;
}

/**
 * Configuration for a command argument
 */
export interface CommandArgument {
  /** Argument name used for help text and validation */
  name: string;
  /** Description shown in help text */
  description: string;
  /** Whether this argument accepts multiple values */
  variadic?: boolean;
  /** Whether this argument is required */
  required?: boolean;
}

/**
 * Command interface object for CLI registration
 *
 * Represents a complete command that can be registered with a CLI instance.
 * Created by the createCommand() function and consumed by createCLI().
 *
 * @template T - Type of options object passed to the execute function
 */
export interface Command<T = any> {
  /** Command name used for CLI invocation */
  name: string;
  /** Description shown in help text */
  description: string;
  /** Commander.js style arguments specification (e.g., '<input> [output]') */
  arguments?: string | CommandArgument[];
  /** Array of command options/flags */
  options?: CommandOption[];
  /** Function that implements the command logic */
  execute: (options: T, context: CommandContext) => Promise<Result<void, CoreError>>;
}

/**
 * Phase definition for multi-phase command execution
 *
 * Represents a single phase in a multi-step command execution process.
 * Each phase receives data from the previous phase and can transform it.
 *
 * REQUIRED BY WEB-UI: Used by @esteban-url/trailhead-web-ui transforms command for
 * multi-step file transformation workflows (validate → prepare → execute).
 *
 * @template T - Type of data passed between phases
 */
export interface CommandPhase<T> {
  /** Human-readable name of the phase for logging */
  name: string;
  /** Function that executes the phase logic */
  execute: (data: T, context: CommandContext) => Promise<Result<T, CoreError>>;
}

/**
 * Options for interactive command behavior
 *
 * Configuration for commands that support interactive mode with user prompts.
 */
export interface InteractiveOptions {
  /** Whether to run in interactive mode with prompts */
  interactive?: boolean;
}
