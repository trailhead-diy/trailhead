export { mockFileSystem, mockLogger, mockPrompts } from './mocks.js';
export { createTestContext, createTestContextWithFiles } from './context.js';
export { runCommand, CommandTestRunner } from './runner.js';

export type { TestContextOptions } from './context.js';

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
  isWindows
} from './path-utils.js';
