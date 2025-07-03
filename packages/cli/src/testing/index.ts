export {
  mockFileSystem,
  mockLogger,
  mockPrompts,
  createEnhancedMockFileSystem,
  createTestMockFileSystem,
  createCLIMockFileSystem,
  createCrossPlatformMockFileSystem,
} from './mocks.js';
export { createTestContext, createTestContextWithFiles } from './context.js';
export { runCommand, CommandTestRunner } from './runner.js';

export type { TestContextOptions } from './context.js';
export type { MockFileSystemOptions, EnhancedMockFileSystem } from './mocks.js';

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

// Package manager utilities
export {
  detectPackageManager,
  getRunCommand,
  execPackageManagerCommand,
  getPackageManagerInfo,
  clearPackageManagerCache,
  createPackageManagerCache,
  SemVer,
  type PackageManager,
  type DetectOptions,
} from './package-manager.js';
