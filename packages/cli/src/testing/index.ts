export {
  mockFileSystem,
  mockLogger,
  mockPrompts,
  mockConfig,
  createConfigMock,
  createEnhancedMockFileSystem,
  createTestMockFileSystem,
  createCLIMockFileSystem,
  createCrossPlatformMockFileSystem,
} from './mocks.js';
export { createTestContext, createTestContextWithFiles } from './context.js';
export { runCommand, CommandTestRunner } from './runner.js';

export type { TestContextOptions } from './context.js';
export type {
  MockFileSystemOptions,
  EnhancedMockFileSystem,
  MockConfigOptions,
  CreateConfigMockOptions,
} from './mocks.js';

export { expectResult, expectError } from './assertions.js';

// Cross-platform path utilities
export {
  normalizePath,
  toPosixPath,
  toWindowsPath,
  createTestPath,
  createPathRegex,
  pathAssertions,
  testPaths,
  isWindows,
} from './path-utils.js';
