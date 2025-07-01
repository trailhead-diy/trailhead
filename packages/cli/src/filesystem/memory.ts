import type { FileSystem } from './types.js';
import { ok, err } from '../core/errors/index.js';

/**
 * Create an in-memory filesystem for testing
 */
export function createMemoryFileSystem(
  initialFiles: Record<string, string> = {},
): FileSystem {
  const files = new Map(Object.entries(initialFiles));
  const directories = new Set<string>();

  // Extract directories from initial files
  for (const filePath of files.keys()) {
    const parts = filePath.split('/');
    for (let i = 1; i < parts.length; i++) {
      directories.add(parts.slice(0, i).join('/'));
    }
  }

  return {
    async exists(path: string) {
      return ok(files.has(path) || directories.has(path));
    },

    async readFile(path: string) {
      const content = files.get(path);
      if (content === undefined) {
        return err({
          code: 'ENOENT',
          message: `File not found: ${path}`,
          path,
          recoverable: true,
        });
      }
      return ok(content);
    },

    async writeFile(path: string, content: string) {
      files.set(path, content);

      // Add parent directories
      const parts = path.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return ok(undefined);
    },

    async mkdir(path: string) {
      directories.add(path);

      // Add parent directories
      const parts = path.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return ok(undefined);
    },

    async readdir(path: string) {
      if (!directories.has(path) && path !== '.') {
        return err({
          code: 'ENOENT',
          message: `Directory not found: ${path}`,
          path,
          recoverable: true,
        });
      }

      const entries: string[] = [];
      const prefix = path === '.' ? '' : path + '/';

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
        if (dirPath.startsWith(prefix) && dirPath !== path) {
          const relative = dirPath.slice(prefix.length);
          if (!relative.includes('/') && !entries.includes(relative)) {
            entries.push(relative);
          }
        }
      }

      return ok(entries);
    },

    async copy(src: string, dest: string) {
      const content = files.get(src);
      if (content === undefined) {
        return err({
          code: 'ENOENT',
          message: `Source file not found: ${src}`,
          path: src,
          recoverable: true,
        });
      }
      files.set(dest, content);

      // Add parent directories for dest
      const parts = dest.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return ok(undefined);
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
        return ok(data);
      } catch {
        return err({
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

    // Test helpers
    getFiles: () => new Map(files),
    getDirectories: () => new Set(directories),
    clear: () => {
      files.clear();
      directories.clear();
    },
  };
}
