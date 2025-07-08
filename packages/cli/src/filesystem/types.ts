import type { Result } from '../core/errors/index.js';

export interface FileStats {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  mtime: Date;
}

export interface FileSystemError {
  code: string;
  message: string;
  path?: string;
  recoverable: boolean;
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
  access(path: string, mode?: number): Promise<Result<void>>;
  readFile(path: string, encoding?: string): Promise<Result<string>>;
  writeFile(path: string, content: string): Promise<Result<void>>;
  mkdir(path: string, options?: MkdirOptions): Promise<Result<void>>;
  readdir(path: string): Promise<Result<string[]>>;
  stat(path: string): Promise<Result<FileStats>>;
  rm(path: string, options?: RmOptions): Promise<Result<void>>;
  cp(src: string, dest: string, options?: CopyOptions): Promise<Result<void>>;
  rename(src: string, dest: string): Promise<Result<void>>;

  // Custom convenience operations (built on native fs)
  ensureDir(path: string): Promise<Result<void>>;
  readJson<T = any>(path: string): Promise<Result<T>>;
  writeJson<T = any>(path: string, data: T, options?: { spaces?: number }): Promise<Result<void>>;
  emptyDir(path: string): Promise<Result<void>>;
  outputFile(path: string, content: string): Promise<Result<void>>;

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
