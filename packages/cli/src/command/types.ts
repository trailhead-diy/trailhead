import type { Result } from '../core/errors/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { Logger } from '../core/index.js';

export interface CommandContext {
  readonly projectRoot: string;
  readonly logger: Logger;
  readonly verbose: boolean;
  readonly fs: FileSystem;
  readonly args: string[];  // Positional arguments
}

export interface CommandOption {
  name?: string;  // Will be extracted from flags if not provided
  alias?: string;
  flags?: string;  // Commander.js style flags like '-c, --confidence <number>'
  description: string;
  type?: 'string' | 'boolean' | 'number';
  required?: boolean;
  default?: any;
  defaultValue?: any;  // Alias for default for compatibility
}

export interface Command<T = any> {
  name: string;
  description: string;
  options?: CommandOption[];
  execute: (options: T, context: CommandContext) => Promise<Result<void>>;
}

export interface CommandPhase<T> {
  name: string;
  execute: (data: T, context: CommandContext) => Promise<Result<T>>;
}

export interface InteractiveOptions {
  interactive?: boolean;
}
