import { promises as fs, constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { ok, err } from '@trailhead/core';
import { glob } from 'glob';
import { mapNodeError, createFileSystemError } from './errors.js';
import type {
  FSConfig,
  FSResult,
  FileStats,
  CopyOptions,
  MoveOptions,
  MkdirOptions,
  RmOptions,
  ReadFileOp,
  WriteFileOp,
  ExistsOp,
  StatOp,
  MkdirOp,
  ReadDirOp,
  CopyOp,
  MoveOp,
  RemoveOp,
  ReadJsonOp,
  WriteJsonOp,
} from './types.js';

// Default configuration
export const defaultFSConfig: FSConfig = {
  encoding: 'utf8',
  defaultMode: constants.F_OK,
  jsonSpaces: 2,
} as const;

// Core filesystem operations with dependency injection
export const readFile =
  (_config: FSConfig = defaultFSConfig): ReadFileOp =>
  async (path: string): Promise<FSResult<string>> => {
    try {
      const content = await fs.readFile(path, _config.encoding || 'utf8');
      return ok(String(content));
    } catch (error) {
      return err(mapNodeError('Read file', path, error));
    }
  };

export const writeFile =
  (_config: FSConfig = defaultFSConfig): WriteFileOp =>
  async (path: string, content: string): Promise<FSResult<void>> => {
    try {
      await fs.writeFile(path, content, _config.encoding || 'utf8');
      return ok(undefined);
    } catch (error) {
      return err(mapNodeError('Write file', path, error));
    }
  };

export const exists =
  (_config: FSConfig = defaultFSConfig): ExistsOp =>
  async (path: string): Promise<FSResult<boolean>> => {
    try {
      await fs.access(path, _config.defaultMode);
      return ok(true);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return ok(false);
      }
      return err(mapNodeError('Check existence', path, error));
    }
  };

export const stat =
  (_config: FSConfig = defaultFSConfig): StatOp =>
  async (path: string): Promise<FSResult<FileStats>> => {
    try {
      const stats = await fs.stat(path);
      const fileStats: FileStats = {
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        mtime: stats.mtime,
      };
      return ok(fileStats);
    } catch (error) {
      return err(mapNodeError('Get stats', path, error));
    }
  };

export const mkdir =
  (_config: FSConfig = defaultFSConfig): MkdirOp =>
  async (path: string, options: MkdirOptions = {}): Promise<FSResult<void>> => {
    try {
      await fs.mkdir(path, { recursive: options.recursive });
      return ok(undefined);
    } catch (error) {
      return err(mapNodeError('Create directory', path, error));
    }
  };

export const readDir =
  (_config: FSConfig = defaultFSConfig): ReadDirOp =>
  async (path: string): Promise<FSResult<string[]>> => {
    try {
      const entries = await fs.readdir(path);
      return ok(entries);
    } catch (error) {
      return err(mapNodeError('Read directory', path, error));
    }
  };

export const copy =
  (_config: FSConfig = defaultFSConfig): CopyOp =>
  async (src: string, dest: string, options: CopyOptions = {}): Promise<FSResult<void>> => {
    try {
      await fs.cp(src, dest, {
        recursive: options.recursive ?? false,
        force: options.overwrite !== false,
      });
      return ok(undefined);
    } catch (error) {
      return err(mapNodeError('Copy', `${src} to ${dest}`, error));
    }
  };

export const move =
  (_config: FSConfig = defaultFSConfig): MoveOp =>
  async (src: string, dest: string, options: MoveOptions = {}): Promise<FSResult<void>> => {
    try {
      // Check if destination exists and overwrite is disabled
      if (!options.overwrite) {
        try {
          await fs.access(dest);
          return err(
            createFileSystemError('Move', `Destination '${dest}' already exists`, {
              path: dest,
              code: 'EEXIST',
              recoverable: true,
              suggestion: 'Enable overwrite option or use a different destination',
            })
          );
        } catch (error: any) {
          if (error.code !== 'ENOENT') {
            return err(mapNodeError('Move', dest, error));
          }
        }
      }

      await fs.rename(src, dest);
      return ok(undefined);
    } catch (error) {
      return err(mapNodeError('Move', `${src} to ${dest}`, error));
    }
  };

export const remove =
  (_config: FSConfig = defaultFSConfig): RemoveOp =>
  async (path: string, options: RmOptions = {}): Promise<FSResult<void>> => {
    try {
      await fs.rm(path, {
        recursive: options.recursive ?? false,
        force: options.force ?? false,
      });
      return ok(undefined);
    } catch (error) {
      return err(mapNodeError('Remove', path, error));
    }
  };

export const readJson =
  (_config: FSConfig = defaultFSConfig): ReadJsonOp =>
  async <T = any>(path: string): Promise<FSResult<T>> => {
    try {
      const content = await fs.readFile(path, _config.encoding || 'utf8');
      const data = JSON.parse(String(content)) as T;
      return ok(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return err(mapNodeError('Read JSON', path, error));
      }
      return err(
        createFileSystemError('Read JSON', `Failed to parse JSON: ${error.message}`, {
          path,
          code: 'JSON_PARSE_ERROR',
          cause: error,
          recoverable: false,
          suggestion: 'Check if the file contains valid JSON',
        })
      );
    }
  };

export const writeJson =
  (_config: FSConfig = defaultFSConfig): WriteJsonOp =>
  async <T = any>(
    path: string,
    data: T,
    options?: { spaces?: number }
  ): Promise<FSResult<void>> => {
    try {
      const content = JSON.stringify(data, null, options?.spaces ?? _config.jsonSpaces);
      // Ensure directory exists before writing
      await fs.mkdir(dirname(path), { recursive: true });
      await fs.writeFile(path, content, _config.encoding || 'utf8');
      return ok(undefined);
    } catch (error) {
      return err(mapNodeError('Write JSON', path, error));
    }
  };

// Higher-level composed operations
export const ensureDir =
  (_config: FSConfig = defaultFSConfig) =>
  async (path: string): Promise<FSResult<void>> => {
    const mkdirOp = mkdir(_config);
    return mkdirOp(path, { recursive: true });
  };

export const outputFile =
  (_config: FSConfig = defaultFSConfig) =>
  async (path: string, content: string): Promise<FSResult<void>> => {
    try {
      // Ensure directory exists before writing
      await fs.mkdir(dirname(path), { recursive: true });
      await fs.writeFile(path, content, _config.encoding || 'utf8');
      return ok(undefined);
    } catch (error) {
      return err(mapNodeError('Output file', path, error));
    }
  };

export const emptyDir =
  (_config: FSConfig = defaultFSConfig) =>
  async (path: string): Promise<FSResult<void>> => {
    try {
      const entries = await fs.readdir(path);
      await Promise.all(
        entries.map(entry => fs.rm(resolve(path, entry), { recursive: true, force: true }))
      );
      return ok(undefined);
    } catch (error) {
      return err(mapNodeError('Empty directory', path, error));
    }
  };

export const findFiles =
  (_config: FSConfig = defaultFSConfig) =>
  async (
    pattern: string,
    options?: { cwd?: string; ignore?: string[] }
  ): Promise<FSResult<string[]>> => {
    try {
      const files = await glob(pattern, {
        cwd: options?.cwd,
        ignore: options?.ignore,
      });
      return ok(files);
    } catch (error) {
      return err(
        createFileSystemError('Find files', `Pattern matching failed: ${error}`, {
          cause: error,
          context: { pattern, options },
          recoverable: true,
          suggestion: 'Check if the glob pattern is valid',
        })
      );
    }
  };

// Composition utilities
export const readIfExists =
  (_config: FSConfig = defaultFSConfig) =>
  async (path: string): Promise<FSResult<string | null>> => {
    const existsOp = exists(_config);
    const readOp = readFile(_config);

    const existsResult = await existsOp(path);
    if (existsResult.isErr()) return err(existsResult.error);

    if (!existsResult.value) return ok(null);

    const readResult = await readOp(path);
    return readResult.isOk() ? ok(readResult.value) : err(readResult.error);
  };

export const copyIfExists =
  (_config: FSConfig = defaultFSConfig) =>
  async (src: string, dest: string, options: CopyOptions = {}): Promise<FSResult<boolean>> => {
    const existsOp = exists(_config);
    const copyOp = copy(_config);

    const existsResult = await existsOp(src);
    if (existsResult.isErr()) return err(existsResult.error);

    if (!existsResult.value) return ok(false);

    const copyResult = await copyOp(src, dest, options);
    return copyResult.isOk() ? ok(true) : err(copyResult.error);
  };
