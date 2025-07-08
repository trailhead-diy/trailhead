import { promises as fs, constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type {
  FileSystem,
  FileSystemError,
  FileStats,
  CopyOptions,
  MkdirOptions,
  RmOptions,
} from './types.js';
import { Ok, Err } from '../core/errors/index.js';

export function createNodeFileSystem(): FileSystem {
  const createError = (operation: string, filePath: string, error: any): FileSystemError => {
    // Map fs-extra/Node.js error codes to more descriptive messages
    const errorCode = error.code || 'FS_ERROR';
    let message: string;
    let recoverable: boolean;

    switch (errorCode) {
      case 'ENOENT':
        message = `${operation} failed: File or directory '${filePath}' does not exist`;
        recoverable = true;
        break;
      case 'EEXIST':
        message = `${operation} failed: File or directory '${filePath}' already exists`;
        recoverable = true;
        break;
      case 'EACCES':
      case 'EPERM':
        message = `${operation} failed: Permission denied for '${filePath}'`;
        recoverable = false;
        break;
      case 'EISDIR':
        message = `${operation} failed: Expected file but '${filePath}' is a directory`;
        recoverable = false;
        break;
      case 'ENOTDIR':
        message = `${operation} failed: Expected directory but '${filePath}' is a file`;
        recoverable = false;
        break;
      case 'ENOTEMPTY':
        message = `${operation} failed: Directory '${filePath}' is not empty`;
        recoverable = true;
        break;
      case 'EMFILE':
      case 'ENFILE':
        message = `${operation} failed: Too many open files (system limit reached)`;
        recoverable = true; // Can be retried after closing files
        break;
      case 'ENOSPC':
        message = `${operation} failed: No space left on device for '${filePath}'`;
        recoverable = false;
        break;
      case 'EROFS':
        message = `${operation} failed: File system is read-only for '${filePath}'`;
        recoverable = false;
        break;
      default:
        message = `${operation} failed for '${filePath}': ${error.message || 'Unknown error'}`;
        recoverable = ['ENOENT', 'EAGAIN', 'EBUSY'].includes(errorCode);
    }

    return {
      code: errorCode,
      message,
      path: filePath,
      recoverable,
    };
  };

  return {
    async access(filePath: string, mode: number = constants.F_OK) {
      try {
        await fs.access(filePath, mode);
        return Ok(undefined);
      } catch (error) {
        return Err(createError('Access check', filePath, error));
      }
    },

    async readFile(filePath: string, encoding = 'utf-8') {
      try {
        const content = await fs.readFile(filePath, {
          encoding: encoding as BufferEncoding,
        });
        return Ok(content);
      } catch (error) {
        return Err(createError('Read file', filePath, error));
      }
    },

    async writeFile(filePath: string, content: string) {
      try {
        await fs.writeFile(filePath, content, 'utf-8');
        return Ok(undefined);
      } catch (error) {
        return Err(createError('Write file', filePath, error));
      }
    },

    async mkdir(dirPath: string, options: MkdirOptions = {}) {
      try {
        await fs.mkdir(dirPath, { recursive: options.recursive });
        return Ok(undefined);
      } catch (error) {
        return Err(createError('Create directory', dirPath, error));
      }
    },

    async readdir(dirPath: string) {
      try {
        const entries = await fs.readdir(dirPath);
        return Ok(entries);
      } catch (error) {
        return Err(createError('Read directory', dirPath, error));
      }
    },

    async stat(filePath: string) {
      try {
        const stats = await fs.stat(filePath);
        const fileStats: FileStats = {
          size: stats.size,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          mtime: stats.mtime,
        };
        return Ok(fileStats);
      } catch (error) {
        return Err(createError('Stat file', filePath, error));
      }
    },

    async rm(filePath: string, options: RmOptions = {}) {
      try {
        await fs.rm(filePath, {
          recursive: options.recursive,
          force: options.force,
        });
        return Ok(undefined);
      } catch (error) {
        return Err(createError('Remove', filePath, error));
      }
    },

    async cp(src: string, dest: string, options: CopyOptions = {}) {
      try {
        // Use fs.cp for Node.js 16.7+
        await fs.cp(src, dest, {
          recursive: options.recursive ?? false,
          force: options.overwrite !== false,
        });
        return Ok(undefined);
      } catch (error) {
        return Err(createError('Copy', `${src} to ${dest}`, error));
      }
    },

    async rename(src: string, dest: string) {
      try {
        await fs.rename(src, dest);
        return Ok(undefined);
      } catch (error) {
        return Err(createError('Rename', `${src} to ${dest}`, error));
      }
    },

    async ensureDir(dirPath: string) {
      try {
        await fs.mkdir(dirPath, { recursive: true });
        return Ok(undefined);
      } catch (error) {
        return Err(createError('Ensure directory', dirPath, error));
      }
    },

    async readJson<T = any>(filePath: string) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content) as T;
        return Ok(data);
      } catch (error) {
        if ((error as any).code === 'ENOENT') {
          return Err(createError('Read JSON', filePath, error));
        }
        return Err({
          code: 'JSON_PARSE_ERROR',
          message: `Failed to parse JSON in ${filePath}: ${(error as Error).message}`,
          path: filePath,
          recoverable: false,
        });
      }
    },

    async writeJson<T = any>(filePath: string, data: T, options?: { spaces?: number }) {
      try {
        const content = JSON.stringify(data, null, options?.spaces ?? 2);
        // Ensure directory exists before writing
        await fs.mkdir(dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        return Ok(undefined);
      } catch (error) {
        return Err(createError('Write JSON', filePath, error));
      }
    },

    async emptyDir(dirPath: string) {
      try {
        // Read directory contents and remove each item
        const entries = await fs.readdir(dirPath);
        await Promise.all(
          entries.map(entry => fs.rm(resolve(dirPath, entry), { recursive: true, force: true }))
        );
        return Ok(undefined);
      } catch (error) {
        return Err(createError('Empty directory', dirPath, error));
      }
    },

    async outputFile(filePath: string, content: string) {
      try {
        // Ensure directory exists before writing
        await fs.mkdir(dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        return Ok(undefined);
      } catch (error) {
        return Err(createError('Output file', filePath, error));
      }
    },
  };
}
