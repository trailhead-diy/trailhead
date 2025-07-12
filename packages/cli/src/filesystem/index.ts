// Pure delegation to @trailhead/fs domain package
export * from '@trailhead/fs';

import type { Result } from 'neverthrow';
import type { CoreError } from '@trailhead/core';

// FileSystem interface for backward compatibility
export interface FileSystem {
  readFile: (path: string) => Promise<Result<string, CoreError>>;
  writeFile: (path: string, content: string) => Promise<Result<void, CoreError>>;
  mkdir: (path: string) => Promise<Result<void, CoreError>>;
  readdir: (path: string) => Promise<Result<string[], CoreError>>;
  access: (path: string) => Promise<Result<void, CoreError>>;
  exists: (path: string) => Promise<Result<boolean, CoreError>>;
  stat: (path: string) => Promise<Result<any, CoreError>>;
  rm: (path: string) => Promise<Result<void, CoreError>>;
  cp: (src: string, dest: string) => Promise<Result<void, CoreError>>;
  rename: (src: string, dest: string) => Promise<Result<void, CoreError>>;
  readJson: <T>(path: string) => Promise<Result<T, CoreError>>;
  writeJson: <T>(path: string, data: T) => Promise<Result<void, CoreError>>;
  ensureDir: (path: string) => Promise<Result<void, CoreError>>;
  emptyDir: (path: string) => Promise<Result<void, CoreError>>;
  outputFile: (path: string, content: string) => Promise<Result<void, CoreError>>;
}

// Re-export for backward compatibility
import { fs } from '@trailhead/fs';
export { fs };
export { fs as createFileSystem };
export { fs as createNodeFileSystem };

// Legacy type compatibility
export type { FSResult as FileSystemResult } from '@trailhead/fs';

// Backward compatibility aliases
import { ensureDir, exists, readFile, defaultFSConfig } from '@trailhead/fs';
import { ok, err } from '@trailhead/core';
export { ensureDir as ensureDirectory };
export { exists as pathExists };

// File comparison utilities
export interface FileComparison {
  identical: boolean;
  differences?: string[];
}

export const compareFiles = async (
  path1: string,
  path2: string
): Promise<Result<FileComparison, CoreError>> => {
  try {
    const file1Result = await readFile(defaultFSConfig)(path1);
    const file2Result = await readFile(defaultFSConfig)(path2);

    if (file1Result.isErr()) return err(file1Result.error);
    if (file2Result.isErr()) return err(file2Result.error);

    const content1 = file1Result.value;
    const content2 = file2Result.value;

    const identical = content1 === content2;

    return ok({
      identical,
      differences: identical ? undefined : ['Content differs'],
    });
  } catch (error) {
    return err({
      type: 'FILESYSTEM_ERROR',
      message: `Failed to compare files: ${path1} and ${path2}`,
      recoverable: false,
      cause: error,
    } as any);
  }
};

// Legacy filesystem utilities for tests
// Note: These imports are currently unused but kept for future legacy support

// Helper function for path normalization
const normalizePath = (path: string) => {
  return path.startsWith('/') ? path : `/${path}`;
};

export const createMemoryFileSystemLegacy = () => {
  const files = new Map<string, string>();
  const directories = new Set<string>(['/']);

  return {
    async readFile(path: string) {
      const normalized = normalizePath(path);
      const content = files.get(normalized);
      if (content === undefined) {
        return { isOk: () => false, error: new Error(`File not found: ${path}`) };
      }
      return { isOk: () => true, value: content };
    },

    async writeFile(path: string, content: string) {
      const normalized = normalizePath(path);
      files.set(normalized, content);

      // Add parent directories
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/') || '/');
      }

      return { isOk: () => true, value: undefined };
    },

    async access(path: string) {
      const normalized = normalizePath(path);
      if (files.has(normalized) || directories.has(normalized)) {
        return { isOk: () => true, value: undefined };
      }
      return { isOk: () => false, error: new Error(`Path not found: ${path}`) };
    },

    async exists(path: string) {
      const normalized = normalizePath(path);
      return { isOk: () => true, value: files.has(normalized) || directories.has(normalized) };
    },

    async mkdir(path: string) {
      const normalized = normalizePath(path);
      directories.add(normalized);
      return { isOk: () => true, value: undefined };
    },

    async readdir(path: string) {
      const normalized = normalizePath(path);
      if (!directories.has(normalized)) {
        return { isOk: () => false, error: new Error(`Directory not found: ${path}`) };
      }

      const entries: string[] = [];
      const prefix = normalized === '/' ? '' : normalized + '/';

      for (const filePath of files.keys()) {
        if (filePath.startsWith(prefix)) {
          const relativePath = filePath.slice(prefix.length);
          if (relativePath && !relativePath.includes('/')) {
            entries.push(relativePath);
          }
        }
      }

      for (const dirPath of directories) {
        if (dirPath.startsWith(prefix) && dirPath !== normalized) {
          const relativePath = dirPath.slice(prefix.length);
          if (relativePath && !relativePath.includes('/')) {
            entries.push(relativePath);
          }
        }
      }

      return { isOk: () => true, value: entries };
    },

    async readJson(path: string) {
      const result = await this.readFile(path);
      if (!result.isOk()) return result;

      try {
        const data = JSON.parse(result.value || '{}');
        return { isOk: () => true, value: data };
      } catch (error) {
        return { isOk: () => false, error };
      }
    },

    async writeJson(path: string, data: any, options?: { spaces?: number }) {
      const content = JSON.stringify(data, null, options?.spaces ?? 2);
      return this.writeFile(path, content);
    },

    // Legacy compatibility methods
    async ensureDir(path: string) {
      return this.mkdir(path);
    },
    async cp(src: string, dest: string) {
      const result = await this.readFile(src);
      if (!result.isOk()) return result as any;
      return this.writeFile(dest, result.value || '');
    },
    async rm(path: string) {
      const normalized = normalizePath(path);
      files.delete(normalized);
      directories.delete(normalized);
      return { isOk: () => true, value: undefined };
    },
    async rename(src: string, dest: string) {
      const result = await this.readFile(src);
      if (!result.isOk()) return result as any;
      await this.writeFile(dest, result.value || '');
      await this.rm(src);
      return { isOk: () => true, value: undefined };
    },
    async stat(path: string) {
      const normalized = normalizePath(path);
      if (files.has(normalized)) {
        const content = files.get(normalized) || '';
        return {
          isOk: () => true,
          value: { size: content.length, isFile: true, isDirectory: false, mtime: new Date() },
        };
      }
      if (directories.has(normalized)) {
        return {
          isOk: () => true,
          value: { size: 0, isFile: false, isDirectory: true, mtime: new Date() },
        };
      }
      return { isOk: () => false, error: new Error(`Path not found: ${path}`) };
    },
    async emptyDir(path: string) {
      return this.mkdir(path);
    },
    async outputFile(path: string, content: string) {
      return this.writeFile(path, content);
    },

    // Test helpers
    getFiles: () => new Map(files),
    getDirectories: () => new Set(directories),
    clear: () => {
      files.clear();
      directories.clear();
      directories.add('/');
    },
  };
};
