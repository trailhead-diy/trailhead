export type {
  FileSystem,
  FileSystemAdapter,
  FileSystemError,
  FileStats,
  CopyOptions,
  MoveOptions,
  MkdirOptions,
} from './types.js';

export { createFileSystem } from './factory.js';
export { createNodeFileSystem } from './node.js';
export { createMemoryFileSystem } from './memory.js';

export {
  findFiles,
  readFile,
  writeFile,
  fileExists,
  pathExists,
  ensureDirectory,
  compareFiles,
  getRelativePath,
  createTimestamp,
  createBackupName,
  createFileStats,
  updateFileStats,
  type FileComparison,
  type FileStats as FileStatsTracker,
} from './file-utils.js';
