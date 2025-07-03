import type { FileSystem, MoveOptions } from '../filesystem/index.js';
import type { Logger } from '../core/logger.js';
import { Ok, Err } from '../core/errors/index.js';
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

  // Always ensure root directory exists
  if (files.size > 0 || directories.size > 0) {
    directories.add('.');
  }

  return {
    exists: async (path: string): Promise<Result<boolean>> => {
      const normalized = normalizePath(path);
      return Ok(files.has(normalized) || directories.has(normalized));
    },

    readFile: async (path: string): Promise<Result<string>> => {
      const normalized = normalizePath(path);
      const content = files.get(normalized);
      if (content === undefined) {
        return Err({
          code: 'FILE_NOT_FOUND',
          message: `File not found: ${path}`,
          path,
          recoverable: false,
        });
      }
      return Ok(content);
    },

    writeFile: async (path: string, content: string): Promise<Result<void>> => {
      const normalized = normalizePath(path);
      files.set(normalized, content);

      // Add parent directories using normalized paths
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return Ok(undefined);
    },

    mkdir: async (path: string): Promise<Result<void>> => {
      const normalized = normalizePath(path);
      directories.add(normalized);
      return Ok(undefined);
    },

    readdir: async (path: string): Promise<Result<string[]>> => {
      const normalized = normalizePath(path);
      if (!directories.has(normalized) && !files.has(normalized)) {
        return Err({
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

      return Ok(entries);
    },

    copy: async (src: string, dest: string): Promise<Result<void>> => {
      const normalizedSrc = normalizePath(src);
      const normalizedDest = normalizePath(dest);
      const content = files.get(normalizedSrc);
      if (content === undefined) {
        return Err({
          code: 'FILE_NOT_FOUND',
          message: `Source file not found: ${src}`,
          path: src,
          recoverable: false,
        });
      }
      files.set(normalizedDest, content);
      return Ok(undefined);
    },

    ensureDir: async (path: string): Promise<Result<void>> => {
      const normalized = normalizePath(path);
      directories.add(normalized);

      // Add all parent directories using normalized paths
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return Ok(undefined);
    },

    readJson: async <T = any>(path: string): Promise<Result<T>> => {
      const normalized = normalizePath(path);
      const content = files.get(normalized);
      if (content === undefined) {
        return Err({
          code: 'FILE_NOT_FOUND',
          message: `File not found: ${path}`,
          path,
          recoverable: false,
        });
      }

      try {
        const data = JSON.parse(content);
        return Ok(data as T);
      } catch {
        return Err({
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

      return Ok(undefined);
    },

    // Test helpers
    getFiles: () => new Map(files),
    getDirectories: () => new Set(directories),
    move: async (
      src: string,
      dest: string,
      _options?: MoveOptions,
    ): Promise<Result<void>> => {
      const normalizedSrc = normalizePath(src);
      const normalizedDest = normalizePath(dest);
      const content = files.get(normalizedSrc);
      if (content === undefined) {
        return Err({
          code: 'FILE_NOT_FOUND',
          message: `Source file not found: ${src}`,
          path: src,
          recoverable: false,
        });
      }
      files.set(normalizedDest, content);
      files.delete(normalizedSrc);
      return Ok(undefined);
    },

    remove: async (path: string): Promise<Result<void>> => {
      const normalized = normalizePath(path);
      files.delete(normalized);
      directories.delete(normalized);
      return Ok(undefined);
    },

    emptyDir: async (path: string): Promise<Result<void>> => {
      const normalized = normalizePath(path);
      directories.add(normalized);
      // Remove all files in this directory
      const prefix = normalized + '/';
      for (const filePath of files.keys()) {
        if (filePath.startsWith(prefix)) {
          files.delete(filePath);
        }
      }
      return Ok(undefined);
    },

    outputFile: async (
      path: string,
      content: string,
    ): Promise<Result<void>> => {
      const normalized = normalizePath(path);
      files.set(normalized, content);
      // Add parent directories
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }
      return Ok(undefined);
    },

    clear: () => {
      files.clear();
      directories.clear();
    },
  };
}

export interface MockFileSystemOptions {
  /**
   * Initial files to populate the mock filesystem with
   * Keys should use forward slashes for consistency
   */
  initialFiles?: Record<string, string>;

  /**
   * Initial directories to create
   * Will be created with forward slashes and normalized
   */
  initialDirectories?: string[];

  /**
   * Whether to simulate filesystem errors
   */
  simulateErrors?: boolean;

  /**
   * Case sensitivity (Windows is case-insensitive)
   */
  caseSensitive?: boolean;
}

export interface EnhancedMockFileSystem extends FileSystem {
  // Additional methods for test control
  addFile: (path: string, content: string) => void;
  addDirectory: (path: string) => void;
  simulateError: (operation: string, path: string, error: any) => void;
  getStoredPaths: () => string[];
}

/**
 * Create an enhanced mock filesystem with additional testing features
 *
 * @example
 * ```ts
 * const fs = createEnhancedMockFileSystem({
 *   initialFiles: {
 *     'project/package.json': JSON.stringify({ name: 'test' }),
 *     'project/src/index.ts': 'console.log("Hello")'
 *   },
 *   simulateErrors: true
 * });
 *
 * // Add files dynamically
 * fs.addFile('project/new-file.ts', 'export const newFile = true;');
 *
 * // Simulate errors
 * fs.simulateError('readFile', 'project/error.txt', { code: 'PERMISSION_DENIED' });
 * ```
 */
export function createEnhancedMockFileSystem(
  options: MockFileSystemOptions = {},
): EnhancedMockFileSystem {
  const {
    initialFiles = {},
    initialDirectories = [],
    simulateErrors = false,
    caseSensitive = process.platform !== 'win32',
  } = options;

  // Start with the basic mock filesystem
  const basicFs = mockFileSystem(initialFiles);

  // Get the internal maps (assuming they're accessible)
  const files = basicFs.getFiles!();
  const directories = basicFs.getDirectories!();

  // Add initial directories
  for (const dir of initialDirectories) {
    directories.add(normalizePath(dir));
  }

  // Error simulation
  const errorSimulations = new Map<string, any>();

  const simulateError = (operation: string, path: string, error: any) => {
    const normalizedPath = caseSensitive
      ? normalizePath(path)
      : normalizePath(path).toLowerCase();
    errorSimulations.set(`${operation}:${normalizedPath}`, error);
  };

  const checkForSimulatedError = (
    operation: string,
    path: string,
  ): any | null => {
    if (!simulateErrors) return null;
    const normalizedPath = caseSensitive
      ? normalizePath(path)
      : normalizePath(path).toLowerCase();
    return errorSimulations.get(`${operation}:${normalizedPath}`) || null;
  };

  // Override filesystem methods to include error simulation
  const enhancedFs: EnhancedMockFileSystem = {
    ...basicFs,

    exists: async (path: string): Promise<Result<boolean>> => {
      const error = checkForSimulatedError('exists', path);
      if (error) return Err(error);
      const normalized = caseSensitive
        ? normalizePath(path)
        : normalizePath(path).toLowerCase();

      if (!caseSensitive) {
        // Check if any file or directory matches case-insensitively
        const lowerFiles = Array.from(files.keys()).map((k) => k.toLowerCase());
        const lowerDirs = Array.from(directories).map((d) => d.toLowerCase());
        return Ok(
          lowerFiles.includes(normalized) || lowerDirs.includes(normalized),
        );
      }

      return Ok(files.has(normalized) || directories.has(normalized));
    },

    readFile: async (path: string): Promise<Result<string>> => {
      const error = checkForSimulatedError('readFile', path);
      if (error) return Err(error);
      const normalized = caseSensitive
        ? normalizePath(path)
        : normalizePath(path).toLowerCase();

      let content: string | undefined;

      if (!caseSensitive) {
        // Find the actual file with case-insensitive search
        for (const [filePath, fileContent] of files.entries()) {
          if (filePath.toLowerCase() === normalized) {
            content = fileContent;
            break;
          }
        }
      } else {
        content = files.get(normalized);
      }

      if (content === undefined) {
        return Err({
          code: 'FILE_NOT_FOUND',
          message: `File not found: ${path}`,
          path,
          recoverable: false,
        });
      }
      return Ok(content);
    },

    writeFile: async (path: string, content: string): Promise<Result<void>> => {
      const error = checkForSimulatedError('writeFile', path);
      if (error) return Err(error);
      const normalized = normalizePath(path);
      files.set(normalized, content);

      // Add parent directories
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return Ok(undefined);
    },

    // Enhanced test utilities
    addFile: (path: string, content: string) => {
      const normalized = normalizePath(path);
      files.set(normalized, content);

      // Add parent directories
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }
    },

    addDirectory: (path: string) => {
      const normalized = normalizePath(path);
      directories.add(normalized);

      // Add parent directories
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }
    },

    simulateError,

    getStoredPaths: () => {
      const allPaths = new Set<string>();
      for (const path of files.keys()) {
        allPaths.add(path);
      }
      for (const path of directories) {
        allPaths.add(path);
      }
      return Array.from(allPaths).sort();
    },

    clear: () => {
      files.clear();
      directories.clear();
      errorSimulations.clear();
    },
  };

  return enhancedFs;
}

/**
 * Create a mock filesystem with common test files
 */
export function createTestMockFileSystem(): EnhancedMockFileSystem {
  return createEnhancedMockFileSystem({
    initialFiles: {
      'project/package.json': JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: { react: '^18.0.0' },
      }),
      'project/src/index.ts': 'console.log("Hello World");',
      'project/src/components/button.tsx':
        'export const Button = () => <button />;',
      'project/README.md':
        '# Test Project\n\nA test project for mock filesystem.',
    },
    initialDirectories: ['project/dist', 'project/node_modules'],
  });
}

/**
 * Create a mock filesystem for CLI package testing
 */
export function createCLIMockFileSystem(): EnhancedMockFileSystem {
  return createEnhancedMockFileSystem({
    initialFiles: {
      'cli-project/package.json': JSON.stringify({
        name: 'test-cli',
        version: '1.0.0',
        bin: { 'test-cli': './dist/index.js' },
        dependencies: { '@esteban-url/trailhead-cli': 'workspace:*' },
      }),
      'cli-project/src/index.ts':
        'import { createCommand } from "@esteban-url/trailhead-cli";',
      'cli-project/src/commands/build.ts':
        'export const buildCommand = createCommand();',
      'cli-project/tsconfig.json': JSON.stringify({
        compilerOptions: { target: 'es2020' },
      }),
    },
  });
}

/**
 * Create a mock filesystem with cross-platform path testing
 */
export function createCrossPlatformMockFileSystem(): EnhancedMockFileSystem {
  return createEnhancedMockFileSystem({
    initialFiles: {
      // Unix-style paths
      'unix/project/src/index.ts': 'console.log("Unix");',
      // Windows-style paths (will be normalized)
      'windows\\project\\src\\index.ts': 'console.log("Windows");',
      // Mixed separators
      'mixed/project\\src/index.ts': 'console.log("Mixed");',
    },
    caseSensitive: false, // Test Windows behavior
  });
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
