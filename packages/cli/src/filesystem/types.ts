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

export interface FileSystem {
  // Basic operations
  exists(path: string): Promise<Result<boolean>>;
  readFile(path: string, encoding?: string): Promise<Result<string>>;
  writeFile(path: string, content: string): Promise<Result<void>>;
  mkdir(path: string, options?: MkdirOptions): Promise<Result<void>>;
  readdir(path: string): Promise<Result<string[]>>;

  // Extended operations
  copy(src: string, dest: string, options?: CopyOptions): Promise<Result<void>>;
  ensureDir(path: string): Promise<Result<void>>;
  readJson<T = any>(path: string): Promise<Result<T>>;
  writeJson<T = any>(
    path: string,
    data: T,
    options?: { spaces?: number },
  ): Promise<Result<void>>;

  // New fs-extra powered operations
  move(src: string, dest: string, options?: MoveOptions): Promise<Result<void>>;
  remove(path: string): Promise<Result<void>>;
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
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: MkdirOptions): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<FileStats>;
  copyFile(src: string, dest: string): Promise<void>;
  rm(
    path: string,
    options?: { recursive?: boolean; force?: boolean },
  ): Promise<void>;
}
