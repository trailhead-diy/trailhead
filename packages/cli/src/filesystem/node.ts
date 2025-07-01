import fs from 'fs/promises';
import path from 'path';
import type { FileSystem, FileSystemError } from './types.js';
import { Ok, Err } from '../core/errors/index.js';

export function createNodeFileSystem(): FileSystem {
  const createError = (
    operation: string,
    filePath: string,
    error: any,
  ): FileSystemError => ({
    code: error.code || 'FS_ERROR',
    message: `${operation} failed for ${filePath}: ${error.message}`,
    path: filePath,
    recoverable: error.code === 'ENOENT',
  });

  return {
    async exists(filePath: string) {
      try {
        await fs.access(filePath);
        return Ok(true);
      } catch {
        return Ok(false);
      }
    },

    async readFile(filePath: string, encoding = 'utf-8') {
      try {
        const content = await fs.readFile(filePath, encoding as BufferEncoding);
        return Ok(content as string);
      } catch (error) {
        return Err(createError('Read file', filePath, error));
      }
    },

    async writeFile(filePath: string, content: string) {
      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        return Ok(undefined);
      } catch (error) {
        return Err(createError('Write file', filePath, error));
      }
    },

    async mkdir(dirPath: string, options = {}) {
      try {
        await fs.mkdir(dirPath, { recursive: (options as any).recursive });
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

    async copy(src: string, dest: string, _options = {}) {
      try {
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(src, dest);
        return Ok(undefined);
      } catch (error) {
        return Err(createError('Copy file', `${src} to ${dest}`, error));
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
      const result = await this.readFile(filePath);
      if (!result.success) {
        return result;
      }

      try {
        const data = JSON.parse(result.value) as T;
        return Ok(data);
      } catch (error) {
        return Err({
          code: 'JSON_PARSE_ERROR',
          message: `Failed to parse JSON in ${filePath}: ${(error as Error).message}`,
          path: filePath,
          recoverable: false,
        });
      }
    },

    async writeJson<T = any>(
      filePath: string,
      data: T,
      options?: { spaces?: number },
    ) {
      const spaces = options?.spaces ?? 2;
      const content = JSON.stringify(data, null, spaces);
      return this.writeFile(filePath, content);
    },
  };
}
