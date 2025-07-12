import type { Logger } from '../core/logger.js';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { CoreError } from '@trailhead/core';

// Local test-specific error interface that extends CoreError
interface TestCoreError extends CoreError {
  readonly code?: string;
}

// Local error creation function for testing
function createMockError(message: string, code: string, context?: any): TestCoreError {
  return {
    type: 'CLI_ERROR',
    message,
    recoverable: false,
    context,
    code,
  };
}
import { normalizePath } from './path-utils.js';
import { vi } from 'vitest';

/**
 * Create a mock filesystem for testing
 */
// Internal mock filesystem with test helpers
interface MockFileSystemInternal {
  // Standard filesystem methods (only ones actually implemented)
  readFile: (path: string) => Promise<Result<string, TestCoreError>>;
  writeFile: (path: string, content: string) => Promise<Result<void, TestCoreError>>;
  mkdir: (path: string) => Promise<Result<void, TestCoreError>>;
  readdir: (path: string) => Promise<Result<string[], TestCoreError>>;
  ensureDir: (path: string) => Promise<Result<void, TestCoreError>>;
  readJson: <T>(path: string) => Promise<Result<T, TestCoreError>>;
  writeJson: <T>(path: string, data: T) => Promise<Result<void, TestCoreError>>;
  access: (path: string, mode?: number) => Promise<Result<void, TestCoreError>>;
  stat: (path: string) => Promise<Result<any, TestCoreError>>;
  rm: (path: string, options?: any) => Promise<Result<void, TestCoreError>>;
  cp: (src: string, dest: string, options?: any) => Promise<Result<void, TestCoreError>>;
  rename: (src: string, dest: string) => Promise<Result<void, TestCoreError>>;
  emptyDir: (path: string) => Promise<Result<void, TestCoreError>>;
  outputFile: (path: string, content: string) => Promise<Result<void, TestCoreError>>;
  clear: () => void;

  // Internal test helpers
  _files: Map<string, string>;
  _directories: Set<string>;

  // Test helper methods
  getFiles?: () => Map<string, string>;
  getDirectories?: () => Set<string>;
}

export function mockFileSystem(initialFiles: Record<string, string> = {}): MockFileSystemInternal {
  // Normalize all initial file paths for cross-platform compatibility
  const normalizedFiles = new Map<string, string>();
  for (const [path, content] of Object.entries(initialFiles)) {
    normalizedFiles.set(normalizePath(path), content);
  }

  const files = normalizedFiles;
  const directories = new Set<string>();

  // Extract directories from file paths using normalized paths
  for (const filePath of Array.from(files.keys())) {
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
    readFile: async (path: string): Promise<Result<string, TestCoreError>> => {
      const normalized = normalizePath(path);
      const content = files.get(normalized);
      if (content === undefined) {
        return err(
          createMockError(`File not found: ${path}`, 'FILE_NOT_FOUND', {
            suggestion: 'Check if the file exists and the path is correct',
            context: { path, errno: -2 },
          })
        );
      }
      return ok(content);
    },

    writeFile: async (path: string, content: string): Promise<Result<void, TestCoreError>> => {
      const normalized = normalizePath(path);
      files.set(normalized, content);

      // Add parent directories using normalized paths
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return ok(undefined);
    },

    mkdir: async (path: string): Promise<Result<void, TestCoreError>> => {
      const normalized = normalizePath(path);
      directories.add(normalized);
      return ok(undefined);
    },

    readdir: async (path: string): Promise<Result<string[], TestCoreError>> => {
      const normalized = normalizePath(path);
      if (!directories.has(normalized) && !files.has(normalized)) {
        return err(
          createMockError(`Directory not found: ${path}`, 'DIRECTORY_NOT_FOUND', {
            suggestion: 'Check if the directory exists and the path is correct',
            context: { path, errno: -2 },
          })
        );
      }

      const entries: string[] = [];
      const prefix = normalized === '.' ? '' : normalized + '/';

      // Find all direct children
      for (const filePath of Array.from(files.keys())) {
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

    ensureDir: async (path: string): Promise<Result<void, TestCoreError>> => {
      const normalized = normalizePath(path);
      directories.add(normalized);

      // Add all parent directories using normalized paths
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return ok(undefined);
    },

    readJson: async <T = any>(path: string): Promise<Result<T, TestCoreError>> => {
      const normalized = normalizePath(path);
      const content = files.get(normalized);
      if (content === undefined) {
        return err(
          createMockError(`File not found: ${path}`, 'FILE_NOT_FOUND', {
            suggestion: 'Check if the file exists and the path is correct',
            context: { path, errno: -2 },
          })
        );
      }

      try {
        const data = JSON.parse(content);
        return ok(data as T);
      } catch {
        return err(
          createMockError(`Failed to parse JSON in ${path}`, 'PARSE_ERROR', {
            suggestion: 'Check if the file contains valid JSON',
            context: { path },
          })
        );
      }
    },

    writeJson: async <T = any>(path: string, data: T): Promise<Result<void, TestCoreError>> => {
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

    // New node:fs/promises compatible methods
    access: async (path: string, _mode?: number): Promise<Result<void, TestCoreError>> => {
      const normalized = normalizePath(path);
      if (files.has(normalized) || directories.has(normalized)) {
        return ok(undefined);
      }
      return err(
        createMockError(`Path not found: ${path}`, 'PATH_NOT_FOUND', {
          suggestion: 'Check if the path exists',
          context: { path, errno: -2 },
        })
      );
    },

    stat: async (path: string): Promise<Result<any, TestCoreError>> => {
      const normalized = normalizePath(path);
      if (files.has(normalized)) {
        const content = files.get(normalized) || '';
        return ok({
          size: content.length,
          isFile: true,
          isDirectory: false,
          mtime: new Date(),
        });
      } else if (directories.has(normalized)) {
        return ok({
          size: 0,
          isFile: false,
          isDirectory: true,
          mtime: new Date(),
        });
      }
      return err(
        createMockError(`Path not found: ${path}`, 'PATH_NOT_FOUND', {
          suggestion: 'Check if the path exists',
          context: { path, errno: -2 },
        })
      );
    },

    rm: async (
      path: string,
      _options?: { recursive?: boolean; force?: boolean }
    ): Promise<Result<void, TestCoreError>> => {
      const normalized = normalizePath(path);
      files.delete(normalized);
      directories.delete(normalized);
      return ok(undefined);
    },

    cp: async (src: string, dest: string, _options?: any): Promise<Result<void, TestCoreError>> => {
      const normalizedSrc = normalizePath(src);
      const normalizedDest = normalizePath(dest);
      const content = files.get(normalizedSrc);
      if (content === undefined) {
        return err(
          createMockError(`Source file not found: ${src}`, 'FILE_NOT_FOUND', {
            suggestion: 'Check if the source file exists',
            context: { src, errno: -2 },
          })
        );
      }
      files.set(normalizedDest, content);
      return ok(undefined);
    },

    rename: async (src: string, dest: string): Promise<Result<void, TestCoreError>> => {
      const normalizedSrc = normalizePath(src);
      const normalizedDest = normalizePath(dest);
      const content = files.get(normalizedSrc);
      if (content === undefined) {
        return err(
          createMockError(`Source file not found: ${src}`, 'FILE_NOT_FOUND', {
            suggestion: 'Check if the source file exists',
            context: { src, errno: -2 },
          })
        );
      }
      files.set(normalizedDest, content);
      files.delete(normalizedSrc);
      return ok(undefined);
    },

    // Standard FileSystem methods end here

    emptyDir: async (path: string): Promise<Result<void, TestCoreError>> => {
      const normalized = normalizePath(path);
      directories.add(normalized);
      // Remove all files in this directory
      const prefix = normalized + '/';
      for (const filePath of Array.from(files.keys())) {
        if (filePath.startsWith(prefix)) {
          files.delete(filePath);
        }
      }
      return ok(undefined);
    },

    outputFile: async (path: string, content: string): Promise<Result<void, TestCoreError>> => {
      const normalized = normalizePath(path);
      files.set(normalized, content);
      // Add parent directories
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }
      return ok(undefined);
    },

    clear: () => {
      files.clear();
      directories.clear();
    },

    // Internal test helpers
    _files: files,
    _directories: directories,

    // Test helper methods
    getFiles: () => files,
    getDirectories: () => directories,
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

export interface EnhancedMockFileSystem extends MockFileSystemInternal {
  // Additional methods for test control
  addFile: (path: string, content: string) => void;
  addDirectory: (path: string) => void;
  simulateError: (operation: string, path: string, error: any) => void;
  getStoredPaths: () => string[];
  access: (path: string, mode?: number) => Promise<Result<void, TestCoreError>>;
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
  options: MockFileSystemOptions = {}
): EnhancedMockFileSystem {
  const {
    initialFiles = {},
    initialDirectories = [],
    simulateErrors = false,
    caseSensitive = process.platform !== 'win32',
  } = options;

  // Start with the basic mock filesystem
  const basicFs = mockFileSystem(initialFiles);

  // Get the internal maps
  const files = basicFs._files;
  const directories = basicFs._directories;

  // Add initial directories
  for (const dir of initialDirectories) {
    directories.add(normalizePath(dir));
  }

  // Error simulation
  const errorSimulations = new Map<string, any>();

  const simulateError = (operation: string, path: string, error: any) => {
    const normalizedPath = caseSensitive ? normalizePath(path) : normalizePath(path).toLowerCase();
    errorSimulations.set(`${operation}:${normalizedPath}`, error);
  };

  const checkForSimulatedError = (operation: string, path: string): any | null => {
    if (!simulateErrors) return null;
    const normalizedPath = caseSensitive ? normalizePath(path) : normalizePath(path).toLowerCase();
    return errorSimulations.get(`${operation}:${normalizedPath}`) || null;
  };

  // Override filesystem methods to include error simulation
  const enhancedFs: EnhancedMockFileSystem = {
    ...basicFs,

    readFile: async (path: string): Promise<Result<string, TestCoreError>> => {
      const simulatedError = checkForSimulatedError('readFile', path);
      if (simulatedError) return err(simulatedError);
      const normalized = caseSensitive ? normalizePath(path) : normalizePath(path).toLowerCase();

      let content: string | undefined;

      if (!caseSensitive) {
        // Find the actual file with case-insensitive search
        for (const [filePath, fileContent] of Array.from(files.entries())) {
          if (filePath.toLowerCase() === normalized) {
            content = fileContent;
            break;
          }
        }
      } else {
        content = files.get(normalized);
      }

      if (content === undefined) {
        return err(
          createMockError(`File not found: ${path}`, 'FILE_NOT_FOUND', {
            suggestion: 'Check if the file exists and the path is correct',
            context: { path, errno: -2 },
          })
        );
      }
      return ok(content);
    },

    writeFile: async (path: string, content: string): Promise<Result<void, TestCoreError>> => {
      const simulatedError = checkForSimulatedError('writeFile', path);
      if (simulatedError) return err(simulatedError);
      const normalized = normalizePath(path);
      files.set(normalized, content);

      // Add parent directories
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }

      return ok(undefined);
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
      for (const path of Array.from(files.keys())) {
        allPaths.add(path);
      }
      for (const path of Array.from(directories)) {
        allPaths.add(path);
      }
      return Array.from(allPaths).sort();
    },

    access: async (path: string, _mode?: number): Promise<Result<void, TestCoreError>> => {
      const simulatedError = checkForSimulatedError('access', path);
      if (simulatedError) return err(simulatedError);
      const normalized = caseSensitive ? normalizePath(path) : normalizePath(path).toLowerCase();

      if (!caseSensitive) {
        // Check if any file or directory matches case-insensitively
        const lowerFiles = Array.from(files.keys()).map(k => k.toLowerCase());
        const lowerDirs = Array.from(directories).map(d => d.toLowerCase());
        if (lowerFiles.includes(normalized) || lowerDirs.includes(normalized)) {
          return ok(undefined);
        }
      } else {
        if (files.has(normalized) || directories.has(normalized)) {
          return ok(undefined);
        }
      }

      return err(
        createMockError(`Path not found: ${path}`, 'PATH_NOT_FOUND', {
          suggestion: 'Check if the path exists',
          context: { path, errno: -2 },
        })
      );
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
      'project/src/components/button.tsx': 'export const Button = () => <button />;',
      'project/README.md': '# Test Project\n\nA test project for mock filesystem.',
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
      'cli-project/src/index.ts': 'import { createCommand } from "@esteban-url/trailhead-cli";',
      'cli-project/src/commands/build.ts': 'export const buildCommand = createCommand();',
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

/**
 * Configuration for mocking cosmiconfig
 */
export interface MockConfigOptions {
  /**
   * Mock configurations to return for different scenarios
   * Key format: "configName:scenario" or just "configName" for default
   */
  configurations?: Record<
    string,
    {
      config?: any;
      filepath?: string | null;
      source?: 'file' | 'package.json' | 'defaults';
    }
  >;

  /**
   * Default configuration to return when no specific mock is set
   */
  defaultConfig?: any;

  /**
   * Simulate errors for specific config names or scenarios
   */
  errors?: Record<string, Error>;
}

/**
 * Create comprehensive mocks for the cosmiconfig system used by createConfig
 *
 * This utility provides a complete mocking solution for configuration testing
 * that follows the CLI framework's established patterns.
 *
 * @example
 * ```ts
 * import { vi } from 'vitest';
 * import { mockConfig } from '@esteban-url/trailhead-cli/testing';
 *
 * const configMocks = mockConfig({
 *   configurations: {
 *     'myapp': {
 *       config: { verbose: true, theme: 'dark' },
 *       filepath: '/project/.myapprc.json',
 *       source: 'file'
 *     },
 *     'myapp:no-config': {
 *       config: null,
 *       filepath: null,
 *       source: 'defaults'
 *     }
 *   },
 *   defaultConfig: { verbose: false, theme: 'light' },
 *   errors: {
 *     'myapp:error': new Error('Permission denied')
 *   }
 * });
 *
 * // Apply the mocks
 * vi.mock('cosmiconfig', () => configMocks.cosmiconfigMock);
 *
 * // In your tests
 * describe('Config Tests', () => {
 *   beforeEach(() => {
 *     configMocks.reset();
 *   });
 *
 *   it('should load config from file', async () => {
 *     configMocks.setScenario('myapp', 'default');
 *     const result = await loadConfig();
 *     expect(result.config.verbose).toBe(true);
 *   });
 *
 *   it('should handle no config found', async () => {
 *     configMocks.setScenario('myapp', 'no-config');
 *     const result = await loadConfig();
 *     expect(result.source).toBe('defaults');
 *   });
 *
 *   it('should handle errors', async () => {
 *     configMocks.setScenario('myapp', 'error');
 *     await expect(loadConfig()).rejects.toThrow('Permission denied');
 *   });
 * });
 * ```
 */
export function mockConfig(options: MockConfigOptions = {}) {
  const { configurations = {}, defaultConfig = {}, errors = {} } = options;

  // Track current scenario for each config name
  const currentScenarios = new Map<string, string>();

  // Mock functions that will be used by cosmiconfig
  const mockSearch = vi.fn();
  const mockSearchSync = vi.fn();
  const mockClearCaches = vi.fn();

  const mockCosmiconfig = vi.fn(() => ({
    search: mockSearch,
    clearCaches: mockClearCaches,
  }));

  const mockCosmiconfigSync = vi.fn(() => ({
    search: mockSearchSync,
    clearCaches: mockClearCaches,
  }));

  // Helper to get configuration for a scenario
  const getConfigForScenario = (configName: string, scenario?: string) => {
    const key = scenario ? `${configName}:${scenario}` : configName;
    const config = configurations[key] || configurations[configName];

    if (!config) {
      // Return default config if no specific configuration is set
      return {
        config: defaultConfig,
        filepath: null,
        source: 'defaults' as const,
      };
    }

    return config;
  };

  // Helper to check for errors
  const getErrorForScenario = (configName: string, scenario?: string) => {
    const key = scenario ? `${configName}:${scenario}` : configName;
    return errors[key] || errors[configName];
  };

  // Implementation for search methods
  const searchImpl = (configName: string, isSync: boolean) => {
    const currentScenario = currentScenarios.get(configName);
    const error = getErrorForScenario(configName, currentScenario);

    if (error) {
      if (isSync) {
        throw error;
      } else {
        return Promise.reject(error);
      }
    }

    const result = getConfigForScenario(configName, currentScenario);

    // If config is null, cosmiconfig returns null (no config found)
    if (result.config === null || result.config === undefined) {
      return isSync ? null : Promise.resolve(null);
    }

    // Return cosmiconfig-style result
    const cosmiconfigResult = {
      config: result.config,
      filepath: result.filepath || null,
    };

    return isSync ? cosmiconfigResult : Promise.resolve(cosmiconfigResult);
  };

  // Set up the mock implementations
  mockSearch.mockImplementation(() => searchImpl('current', false));
  mockSearchSync.mockImplementation(() => searchImpl('current', true));

  return {
    // The mock objects to use with vi.mock()
    cosmiconfigMock: {
      cosmiconfig: mockCosmiconfig,
      cosmiconfigSync: mockCosmiconfigSync,
    },

    // Mock function references for direct testing
    mockSearch,
    mockSearchSync,
    mockClearCaches,
    mockCosmiconfig,
    mockCosmiconfigSync,

    /**
     * Set the scenario for a specific config name
     */
    setScenario: (configName: string, scenario?: string) => {
      currentScenarios.set(configName, scenario || 'default');

      // Update mock implementations to use the specific config name
      mockSearch.mockImplementation(() => searchImpl(configName, false));
      mockSearchSync.mockImplementation(() => searchImpl(configName, true));
    },

    /**
     * Add or update a configuration scenario
     */
    addConfiguration: (
      key: string,
      config: {
        config?: any;
        filepath?: string | null;
        source?: 'file' | 'package.json' | 'defaults';
      }
    ) => {
      configurations[key] = config;
    },

    /**
     * Add an error scenario
     */
    addError: (key: string, error: Error) => {
      errors[key] = error;
    },

    /**
     * Reset all mocks and scenarios
     */
    reset: () => {
      vi.clearAllMocks();
      currentScenarios.clear();
    },

    /**
     * Get call history for debugging
     */
    getCallHistory: () => ({
      search: mockSearch.mock.calls,
      searchSync: mockSearchSync.mock.calls,
      clearCaches: mockClearCaches.mock.calls,
    }),

    /**
     * Helper to create a complete test setup with beforeEach/afterEach
     */
    createTestSetup: () => ({
      beforeEach: () => {
        vi.clearAllMocks();
        currentScenarios.clear();
      },
      afterEach: () => {
        vi.restoreAllMocks();
      },
    }),
  };
}

/**
 * Enhanced configuration for CLI framework createConfig testing
 */
export interface CreateConfigMockOptions<T = any> {
  /**
   * Mock configuration scenarios
   */
  scenarios?: Record<
    string,
    {
      config?: T;
      filepath?: string | null;
      source?: 'file' | 'package.json' | 'defaults';
      error?: Error;
    }
  >;

  /**
   * Default configuration to return when no scenario matches
   */
  defaultConfig?: T;

  /**
   * Default scenario to use if none specified
   */
  defaultScenario?: string;
}

/**
 * Create a comprehensive mock for CLI framework's createConfig function
 *
 * This provides a higher-level mocking approach specifically designed for
 * testing code that uses the CLI framework's createConfig function.
 *
 * @example
 * ```ts
 * import { vi } from 'vitest';
 * import { createConfigMock } from '@esteban-url/trailhead-cli/testing';
 * import { z } from 'zod';
 *
 * const schema = z.object({
 *   verbose: z.boolean(),
 *   theme: z.string(),
 * });
 *
 * const defaultConfig = { verbose: false, theme: 'light' };
 *
 * const configMock = createConfigMock({
 *   scenarios: {
 *     'file-found': {
 *       config: { verbose: true, theme: 'dark' },
 *       filepath: '/project/.myapprc.json',
 *       source: 'file'
 *     },
 *     'no-config': {
 *       config: null,
 *       filepath: null,
 *       source: 'defaults'
 *     },
 *     'invalid-config': {
 *       error: new Error('Invalid configuration')
 *     }
 *   },
 *   defaultConfig,
 *   defaultScenario: 'no-config'
 * });
 *
 * // Mock the createConfig module
 * vi.mock('@esteban-url/trailhead-cli/config', () => ({
 *   createConfig: configMock.createConfig,
 *   z: vi.fn() // re-export z if needed
 * }));
 *
 * // In your tests
 * describe('Config Tests', () => {
 *   beforeEach(() => {
 *     configMock.reset();
 *   });
 *
 *   it('should load config from file', async () => {
 *     configMock.setScenario('file-found');
 *     const configLoader = createConfig({ name: 'myapp', schema, defaultConfig });
 *     const result = await configLoader.load();
 *     expect(result.config.verbose).toBe(true);
 *   });
 * });
 * ```
 */
export function createConfigMock<T = any>(options: CreateConfigMockOptions<T> = {}) {
  const { scenarios = {}, defaultConfig, defaultScenario = 'no-config' } = options;

  // Track current scenario
  let currentScenario = defaultScenario;

  // Mock createConfig function
  const mockCreateConfig = vi.fn().mockImplementation((configOptions: any) => {
    const { schema, defaults } = configOptions;

    return {
      async load(_searchFrom?: string) {
        const scenario = scenarios[currentScenario];

        if (scenario?.error) {
          throw scenario.error;
        }

        if (!scenario || scenario.config === null) {
          // No config found - use defaults
          if (!defaults && !defaultConfig) {
            throw new Error('No configuration found and no defaults provided');
          }

          const finalDefaults = defaults || defaultConfig;
          return {
            config: schema ? schema.parse(finalDefaults) : finalDefaults,
            filepath: null,
            source: 'defaults' as const,
          };
        }

        // Config found - merge with defaults first, then validate
        const mergedConfig = defaults
          ? mergeWithDefaults(defaults, scenario.config)
          : scenario.config;
        const finalConfig = schema ? schema.parse(mergedConfig) : mergedConfig;

        return {
          config: finalConfig,
          filepath: scenario.filepath || null,
          source: scenario.source || ('file' as const),
        };
      },

      loadSync(_searchFrom?: string) {
        const scenario = scenarios[currentScenario];

        if (scenario?.error) {
          throw scenario.error;
        }

        if (!scenario || scenario.config === null) {
          // No config found - use defaults
          if (!defaults && !defaultConfig) {
            throw new Error('No configuration found and no defaults provided');
          }

          const finalDefaults = defaults || defaultConfig;
          return {
            config: schema ? schema.parse(finalDefaults) : finalDefaults,
            filepath: null,
            source: 'defaults' as const,
          };
        }

        // Config found - merge with defaults first, then validate
        const mergedConfig = defaults
          ? mergeWithDefaults(defaults, scenario.config)
          : scenario.config;
        const finalConfig = schema ? schema.parse(mergedConfig) : mergedConfig;

        return {
          config: finalConfig,
          filepath: scenario.filepath || null,
          source: scenario.source || ('file' as const),
        };
      },

      clearCache() {
        // Mock clearCache - no-op for testing
      },
    };
  });

  // Helper to merge configs (simplified version of CLI framework's logic)
  function mergeWithDefaults<T>(defaults: T, userConfig: T): T {
    if (typeof defaults !== 'object' || defaults === null) {
      return userConfig;
    }

    if (typeof userConfig !== 'object' || userConfig === null) {
      return defaults;
    }

    const result = { ...defaults };

    for (const key in userConfig) {
      if (Object.prototype.hasOwnProperty.call(userConfig, key)) {
        const userValue = userConfig[key];
        const defaultValue = (defaults as any)[key];

        if (
          typeof defaultValue === 'object' &&
          defaultValue !== null &&
          !Array.isArray(defaultValue) &&
          typeof userValue === 'object' &&
          userValue !== null &&
          !Array.isArray(userValue)
        ) {
          // Recursively merge objects
          (result as any)[key] = mergeWithDefaults(defaultValue, userValue);
        } else {
          // Override with user value
          (result as any)[key] = userValue;
        }
      }
    }

    return result;
  }

  return {
    /**
     * Mock createConfig function to use in vi.mock()
     */
    createConfig: mockCreateConfig,

    /**
     * Set the current scenario for testing
     */
    setScenario: (scenario: string) => {
      currentScenario = scenario;
    },

    /**
     * Add a new scenario dynamically
     */
    addScenario: (
      name: string,
      scenario: NonNullable<CreateConfigMockOptions<T>['scenarios']>[string]
    ) => {
      scenarios[name] = scenario;
    },

    /**
     * Reset the mock state
     */
    reset: () => {
      currentScenario = defaultScenario;
      vi.clearAllMocks();
    },

    /**
     * Get call history for debugging
     */
    getCallHistory: () => mockCreateConfig.mock.calls,

    /**
     * Get current scenario for debugging
     */
    getCurrentScenario: () => currentScenario,
  };
}
