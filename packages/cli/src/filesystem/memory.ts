import type { FileSystem } from './types.js';
import { Ok, Err } from '../core/errors/index.js';
import { posix, win32 } from 'path';

/**
 * Normalizes paths for internal storage (always use forward slashes)
 * @param path - Path to normalize
 * @returns Normalized path with forward slashes
 */
function normalizePath(path: string): string {
  // Convert any backslashes to forward slashes for consistent storage
  return path.split(win32.sep).join(posix.sep);
}

/**
 * Create an in-memory filesystem for testing
 *
 * Automatically handles cross-platform path differences by normalizing
 * all paths to forward slashes internally, while accepting both forward
 * and backward slashes in input paths.
 *
 * @param initialFiles - Optional initial files to populate the filesystem
 * @returns FileSystem implementation backed by memory
 * @example
 * ```typescript
 * const fs = createMemoryFileSystem({
 *   'src/index.ts': 'export default {};',
 *   'package.json': JSON.stringify({ name: 'test' })
 * });
 *
 * const result = await fs.readFile('src/index.ts');
 * if (result.success) {
 *   console.log(result.value); // 'export default {};'
 * }
 * ```
 */
export function createMemoryFileSystem(
  initialFiles: Record<string, string> = {},
): FileSystem {
  // Normalize all initial file paths
  const files = new Map<string, string>();
  for (const [path, content] of Object.entries(initialFiles)) {
    files.set(normalizePath(path), content);
  }

  const directories = new Set<string>();

  // Extract directories from initial files
  for (const filePath of files.keys()) {
    const parts = filePath.split('/');
    for (let i = 1; i < parts.length; i++) {
      directories.add(parts.slice(0, i).join('/'));
    }
  }

  return {
    async readFile(path: string) {
      const normalizedPath = normalizePath(path);
      const content = files.get(normalizedPath);
      if (content === undefined) {
        return Err({
          code: 'ENOENT',
          message: `File not found: ${path}`,
          path,
          recoverable: true,
        });
      }
      return Ok(content);
    },

    async writeFile(path: string, content: string) {
      const normalizedPath = normalizePath(path);
      files.set(normalizedPath, content);

      // Add parent directories
      const parts = normalizedPath.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return Ok(undefined);
    },

    async mkdir(path: string) {
      const normalizedPath = normalizePath(path);
      directories.add(normalizedPath);

      // Add parent directories
      const parts = normalizedPath.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return Ok(undefined);
    },

    async readdir(path: string) {
      const normalizedPath = normalizePath(path);
      if (!directories.has(normalizedPath) && normalizedPath !== '.') {
        return Err({
          code: 'ENOENT',
          message: `Directory not found: ${path}`,
          path,
          recoverable: true,
        });
      }

      const entries: string[] = [];
      const prefix = normalizedPath === '.' ? '' : normalizedPath + '/';

      // Find all direct children
      for (const filePath of files.keys()) {
        if (filePath.startsWith(prefix)) {
          const relative = filePath.slice(prefix.length);
          const firstSlash = relative.indexOf('/');
          if (firstSlash === -1) {
            entries.push(relative);
          } else {
            const dir = relative.substring(0, firstSlash);
            if (!entries.includes(dir)) {
              entries.push(dir);
            }
          }
        }
      }

      for (const dirPath of directories) {
        if (dirPath.startsWith(prefix) && dirPath !== normalizedPath) {
          const relative = dirPath.slice(prefix.length);
          if (!relative.includes('/') && !entries.includes(relative)) {
            entries.push(relative);
          }
        }
      }

      return Ok(entries);
    },

    async ensureDir(path: string) {
      return this.mkdir(path, { recursive: true });
    },

    async readJson<T = any>(path: string) {
      const result = await this.readFile(path);
      if (!result.success) {
        return result;
      }

      try {
        const data = JSON.parse(result.value) as T;
        return Ok(data);
      } catch {
        return Err({
          code: 'JSON_PARSE_ERROR',
          message: `Failed to parse JSON in ${path}`,
          path,
          recoverable: false,
        });
      }
    },

    async writeJson<T = any>(
      path: string,
      data: T,
      options?: { spaces?: number },
    ) {
      const spaces = options?.spaces ?? 2;
      const content = JSON.stringify(data, null, spaces);
      return this.writeFile(path, content);
    },

    async emptyDir(path: string) {
      const normalizedPath = normalizePath(path);

      // Create directory if it doesn't exist
      directories.add(normalizedPath);

      // Remove all files in this directory
      const prefix = normalizedPath + '/';
      for (const filePath of files.keys()) {
        if (filePath.startsWith(prefix)) {
          files.delete(filePath);
        }
      }

      // Remove all subdirectories
      for (const dir of directories) {
        if (dir.startsWith(prefix)) {
          directories.delete(dir);
        }
      }

      return Ok(undefined);
    },

    async outputFile(path: string, content: string) {
      // This is just like writeFile but ensures parent directories exist
      return this.writeFile(path, content);
    },

    // New node:fs/promises compatible methods
    async access(path: string, _mode?: number) {
      const normalizedPath = normalizePath(path);
      if (files.has(normalizedPath) || directories.has(normalizedPath)) {
        return Ok(undefined);
      }
      return Err({
        code: 'ENOENT',
        message: `Path not found: ${path}`,
        path,
        recoverable: true,
      });
    },

    async stat(path: string) {
      const normalizedPath = normalizePath(path);
      if (files.has(normalizedPath)) {
        const content = files.get(normalizedPath) || '';
        return Ok({
          size: content.length,
          isFile: true,
          isDirectory: false,
          mtime: new Date(),
        });
      } else if (directories.has(normalizedPath)) {
        return Ok({
          size: 0,
          isFile: false,
          isDirectory: true,
          mtime: new Date(),
        });
      }
      return Err({
        code: 'ENOENT',
        message: `Path not found: ${path}`,
        path,
        recoverable: true,
      });
    },

    async rm(
      path: string,
      _options?: { recursive?: boolean; force?: boolean },
    ) {
      const normalizedPath = normalizePath(path);

      // Remove file if it exists
      if (files.has(normalizedPath)) {
        files.delete(normalizedPath);
        return Ok(undefined);
      }

      // Remove directory and all its contents
      if (directories.has(normalizedPath)) {
        directories.delete(normalizedPath);

        // Remove all files in this directory
        const prefix = normalizedPath + '/';
        for (const filePath of files.keys()) {
          if (filePath.startsWith(prefix)) {
            files.delete(filePath);
          }
        }

        // Remove all subdirectories
        for (const dir of directories) {
          if (dir.startsWith(prefix)) {
            directories.delete(dir);
          }
        }

        return Ok(undefined);
      }

      return Err({
        code: 'ENOENT',
        message: `Path not found: ${path}`,
        path,
        recoverable: true,
      });
    },

    async cp(src: string, dest: string, _options?: any) {
      const normalizedSrc = normalizePath(src);
      const normalizedDest = normalizePath(dest);
      const content = files.get(normalizedSrc);
      if (content === undefined) {
        return Err({
          code: 'ENOENT',
          message: `Source file not found: ${src}`,
          path: src,
          recoverable: true,
        });
      }
      files.set(normalizedDest, content);

      // Add parent directories for dest
      const parts = normalizedDest.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return Ok(undefined);
    },

    async rename(src: string, dest: string) {
      const normalizedSrc = normalizePath(src);
      const normalizedDest = normalizePath(dest);
      const content = files.get(normalizedSrc);
      if (content === undefined) {
        return Err({
          code: 'ENOENT',
          message: `Source file not found: ${src}`,
          path: src,
          recoverable: true,
        });
      }
      files.set(normalizedDest, content);
      files.delete(normalizedSrc);

      // Add parent directories for dest
      const parts = normalizedDest.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return Ok(undefined);
    },

    // Test helpers
    getFiles: () => new Map(files),
    getDirectories: () => new Set(directories),
    clear: () => {
      files.clear();
      directories.clear();
    },
  };
}
