// Types
export type {
  FileStats,
  FileSystemError,
  CopyOptions,
  MoveOptions,
  MkdirOptions,
  RmOptions,
  FSConfig,
  FSResult,
  ReadFileOp,
  WriteFileOp,
  ExistsOp,
  StatOp,
  MkdirOp,
  ReadDirOp,
  CopyOp,
  MoveOp,
  RemoveOp,
  ReadJsonOp,
  WriteJsonOp,
} from './types.js';

// Error utilities
export { createFileSystemError, mapNodeError } from './errors.js';

// Core operations (with dependency injection)
export {
  defaultFSConfig,
  readFile,
  writeFile,
  exists,
  stat,
  mkdir,
  readDir,
  copy,
  move,
  remove,
  readJson,
  writeJson,
  ensureDir,
  outputFile,
  emptyDir,
  findFiles,
  readIfExists,
  copyIfExists,
} from './core.js';

// Import for convenience object
import {
  readFile,
  writeFile,
  exists,
  stat,
  mkdir,
  readDir,
  copy,
  move,
  remove,
  readJson,
  writeJson,
  ensureDir,
  outputFile,
  emptyDir,
  findFiles,
  readIfExists,
  copyIfExists,
} from './core.js';

// Convenience exports with default config (for drop-in replacement)
export const fs = {
  readFile: readFile(),
  writeFile: writeFile(),
  exists: exists(),
  stat: stat(),
  mkdir: mkdir(),
  readDir: readDir(),
  copy: copy(),
  move: move(),
  remove: remove(),
  readJson: readJson(),
  writeJson: writeJson(),
  ensureDir: ensureDir(),
  outputFile: outputFile(),
  emptyDir: emptyDir(),
  findFiles: findFiles(),
  readIfExists: readIfExists(),
  copyIfExists: copyIfExists(),
};
