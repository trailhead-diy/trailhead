import type { Result } from 'neverthrow';
import type { CLIError } from '../core/errors/index.js';

export interface FileStats {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  mtime: Date;
}

export interface FileSystemError {
  code: string;
  message: string;
  operation: string;
  path?: string;
  recoverable: boolean;
  originalError?: any;
}

export interface CopyOptions {
  overwrite?: boolean;
  recursive?: boolean;
}

export interface MoveOptions {
  overwrite?: boolean;
}

export interface MkdirOptions {
  recursive?: boolean;
}

export interface RmOptions {
  recursive?: boolean;
  force?: boolean;
}

export interface FileSystem {
  // node:fs/promises compatible operations
  access(path: string, mode?: number): Promise<Result<void, CLIError>>;
  readFile(path: string, encoding?: string): Promise<Result<string, CLIError>>;
  writeFile(path: string, content: string): Promise<Result<void, CLIError>>;
  mkdir(path: string, options?: MkdirOptions): Promise<Result<void, CLIError>>;
  readdir(path: string): Promise<Result<string[], CLIError>>;
  stat(path: string): Promise<Result<FileStats, CLIError>>;
  rm(path: string, options?: RmOptions): Promise<Result<void, CLIError>>;
  cp(src: string, dest: string, options?: CopyOptions): Promise<Result<void, CLIError>>;
  rename(src: string, dest: string): Promise<Result<void, CLIError>>;

  // Custom convenience operations (built on native fs)
  ensureDir(path: string): Promise<Result<void, CLIError>>;
  readJson<T = any>(path: string): Promise<Result<T, CLIError>>;
  writeJson<T = any>(
    path: string,
    data: T,
    options?: { spaces?: number }
  ): Promise<Result<void, CLIError>>;
  emptyDir(path: string): Promise<Result<void, CLIError>>;
  outputFile(path: string, content: string): Promise<Result<void, CLIError>>;

  // For testing
  getFiles?: () => Map<string, string>;
  getDirectories?: () => Set<string>;
  clear?: () => void;
}

export interface FileSystemAdapter {
  readFile(path: string, encoding?: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  access(path: string, mode?: number): Promise<void>;
  mkdir(path: string, options?: MkdirOptions): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<FileStats>;
  cp(src: string, dest: string, options?: CopyOptions): Promise<void>;
  rm(path: string, options?: RmOptions): Promise<void>;
  rename(src: string, dest: string): Promise<void>;
}
