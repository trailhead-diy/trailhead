import type { Result } from '../core/errors/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { Logger } from '../core/logger.js';

export interface CommandContext {
  readonly projectRoot: string;
  readonly logger: Logger;
  readonly verbose: boolean;
  readonly fs: FileSystem;
}

export interface CommandOption {
  name: string;
  alias?: string;
  description: string;
  type?: 'string' | 'boolean' | 'number';
  required?: boolean;
  default?: any;
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
