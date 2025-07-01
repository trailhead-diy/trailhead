import type { FileSystem } from '../filesystem/index.js';
import type { Logger } from '../core/logger.js';
import { ok, err } from '../core/errors/index.js';
import type { Result } from '../core/errors/index.js';
import { normalizePath } from './path-utils.js';

/**
 * Create a mock filesystem for testing
 */
export function mockFileSystem(
  initialFiles: Record<string, string> = {},
): FileSystem {
  // Normalize all initial file paths for cross-platform compatibility
  const normalizedFiles = new Map<string, string>();
  for (const [path, content] of Object.entries(initialFiles)) {
    normalizedFiles.set(normalizePath(path), content);
  }
  
  const files = normalizedFiles;
  const directories = new Set<string>();

  // Extract directories from file paths using normalized paths
  for (const filePath of files.keys()) {
    const parts = filePath.split('/');
    for (let i = 1; i < parts.length; i++) {
      directories.add(parts.slice(0, i).join('/'));
    }
  }

  return {
    exists: async (path: string): Promise<Result<boolean>> => {
      const normalized = normalizePath(path);
      return ok(files.has(normalized) || directories.has(normalized));
    },

    readFile: async (path: string): Promise<Result<string>> => {
      const normalized = normalizePath(path);
      const content = files.get(normalized);
      if (content === undefined) {
        return err({
          code: 'FILE_NOT_FOUND',
          message: `File not found: ${path}`,
          path,
          recoverable: false,
        });
      }
      return ok(content);
    },

    writeFile: async (path: string, content: string): Promise<Result<void>> => {
      const normalized = normalizePath(path);
      files.set(normalized, content);

      // Add parent directories using normalized paths
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return ok(undefined);
    },

    mkdir: async (path: string): Promise<Result<void>> => {
      const normalized = normalizePath(path);
      directories.add(normalized);
      return ok(undefined);
    },

    readdir: async (path: string): Promise<Result<string[]>> => {
      const normalized = normalizePath(path);
      if (!directories.has(normalized) && !files.has(normalized)) {
        return err({
          code: 'DIR_NOT_FOUND',
          message: `Directory not found: ${path}`,
          path,
          recoverable: false,
        });
      }

      const entries: string[] = [];
      const prefix = normalized === '.' ? '' : normalized + '/';

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

      return ok(entries);
    },

    copy: async (src: string, dest: string): Promise<Result<void>> => {
      const normalizedSrc = normalizePath(src);
      const normalizedDest = normalizePath(dest);
      const content = files.get(normalizedSrc);
      if (content === undefined) {
        return err({
          code: 'FILE_NOT_FOUND',
          message: `Source file not found: ${src}`,
          path: src,
          recoverable: false,
        });
      }
      files.set(normalizedDest, content);
      return ok(undefined);
    },

    ensureDir: async (path: string): Promise<Result<void>> => {
      const normalized = normalizePath(path);
      directories.add(normalized);

      // Add all parent directories using normalized paths
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return ok(undefined);
    },

    readJson: async <T = any>(path: string): Promise<Result<T>> => {
      const normalized = normalizePath(path);
      const content = files.get(normalized);
      if (content === undefined) {
        return err({
          code: 'FILE_NOT_FOUND',
          message: `File not found: ${path}`,
          path,
          recoverable: false,
        });
      }

      try {
        const data = JSON.parse(content);
        return ok(data as T);
      } catch {
        return err({
          code: 'PARSE_ERROR',
          message: `Failed to parse JSON in ${path}`,
          path,
          recoverable: false,
        });
      }
    },

    writeJson: async <T = any>(
      path: string,
      data: T,
    ): Promise<Result<void>> => {
      const content = JSON.stringify(data, null, 2);
      const normalized = normalizePath(path);
      files.set(normalized, content);
      
      // Add parent directories
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }
      
      return ok(undefined);
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

/**
 * Create a mock logger for testing
 */
export function mockLogger(): Logger & {
  logs: Array<{ level: string; message: string }>;
} {
  const logs: Array<{ level: string; message: string }> = [];

  return {
    logs,
    info: (message: string) => {
      logs.push({ level: 'info', message });
      console.info(message);
    },
    success: (message: string) => {
      logs.push({ level: 'success', message });
      console.log(message);
    },
    warning: (message: string) => {
      logs.push({ level: 'warning', message });
      console.warn(message);
    },
    error: (message: string) => {
      logs.push({ level: 'error', message });
      console.error(message);
    },
    debug: (message: string) => {
      logs.push({ level: 'debug', message });
      console.debug(message);
    },
    step: (message: string) => {
      logs.push({ level: 'step', message });
      console.log(message);
    },
  };
}

/**
 * Create mock prompts for testing
 */
export function mockPrompts(responses: Record<string, any> = {}) {
  return {
    responses,
    prompt: async ({ message }: { message: string }) => {
      const response = responses[message];
      if (response === undefined) {
        throw new Error(`No mock response for prompt: ${message}`);
      }
      return response;
    },
    select: async ({ message }: { message: string }) => {
      const response = responses[message];
      if (response === undefined) {
        throw new Error(`No mock response for select: ${message}`);
      }
      return response;
    },
    confirm: async ({ message }: { message: string }) => {
      const response = responses[message];
      if (response === undefined) {
        throw new Error(`No mock response for confirm: ${message}`);
      }
      return response;
    },
    multiselect: async ({ message }: { message: string }) => {
      const response = responses[message];
      if (response === undefined) {
        throw new Error(`No mock response for multiselect: ${message}`);
      }
      return response;
    },
  };
}
