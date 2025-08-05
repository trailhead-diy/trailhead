---
type: reference
title: 'FileSystem Package API Reference'
description: 'Complete API reference for filesystem operations with Result-based error handling and functional programming patterns'
related:
  - /docs/reference/core-api
  - /packages/fs/docs/explanation/result-patterns.md
  - /packages/fs/docs/how-to/file-operations
---

# FileSystem Package API Reference

Complete API reference for `@esteban-url/fs` package providing filesystem operations with Result-based error handling.

## Core Types

### `FSResult<T>`

Result type for filesystem operations.

```typescript
type FSResult<T> = Result<T, FileSystemError>
```

### `FileSystemError`

Specialized error type for filesystem operations.

```typescript
interface FileSystemError extends CoreError {
  readonly type: 'FILESYSTEM_ERROR'
  readonly code: string
  readonly path?: string
  readonly component: 'filesystem'
  readonly operation: string
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
  readonly recoverable: boolean
  readonly timestamp: Date
}
```

### `FileStats`

File or directory statistics.

```typescript
interface FileStats {
  readonly size: number
  readonly isFile: boolean
  readonly isDirectory: boolean
  readonly isSymbolicLink: boolean
  readonly mtime: Date
}
```

### `FSConfig`

Configuration for filesystem operations.

```typescript
interface FSConfig {
  readonly encoding?: BufferEncoding
  readonly defaultMode?: number
  readonly jsonSpaces?: number
}
```

## Function Types

The package exports operation type definitions for functional composition:

```typescript
export type ReadFileOp = (path: string) => Promise<FSResult<string>>
export type WriteFileOp = (path: string, content: string) => Promise<FSResult<void>>
export type ExistsOp = (path: string) => Promise<FSResult<boolean>>
export type StatOp = (path: string) => Promise<FSResult<FileStats>>
export type MkdirOp = (path: string, options?: MkdirOptions) => Promise<FSResult<void>>
export type ReadDirOp = (path: string) => Promise<FSResult<string[]>>
export type CopyOp = (src: string, dest: string, options?: CopyOptions) => Promise<FSResult<void>>
export type MoveOp = (src: string, dest: string, options?: MoveOptions) => Promise<FSResult<void>>
export type RemoveOp = (path: string, options?: RmOptions) => Promise<FSResult<void>>
export type ReadJsonOp = <T = any>(path: string) => Promise<FSResult<T>>
export type WriteJsonOp = <T = any>(
  path: string,
  data: T,
  options?: { spaces?: number }
) => Promise<FSResult<void>>
```

## Main API

### `fs`

Pre-configured filesystem operations instance.

```typescript
const fs: {
  readFile: ReadFileOp
  writeFile: WriteFileOp
  exists: ExistsOp
  stat: StatOp
  mkdir: MkdirOp
  readDir: ReadDirOp
  copy: CopyOp
  move: MoveOp
  remove: RemoveOp
  readJson: ReadJsonOp
  writeJson: WriteJsonOp
  ensureDir: (path: string) => Promise<FSResult<void>>
  outputFile: (path: string, content: string) => Promise<FSResult<void>>
  emptyDir: (path: string) => Promise<FSResult<void>>
  findFiles: (
    pattern: string,
    options?: { cwd?: string; ignore?: string[] }
  ) => Promise<FSResult<string[]>>
  readIfExists: (path: string) => Promise<FSResult<string | null>>
  copyIfExists: (src: string, dest: string, options?: CopyOptions) => Promise<FSResult<boolean>>
}
```

**Usage**:

```typescript
import { fs } from '@esteban-url/fs'

const result = await fs.readFile('/path/to/file.txt')
```

## Core Operations

### `readFile()`

Creates a function to read file contents.

```typescript
function readFile(config?: FSConfig): ReadFileOp
```

**Returns**: Function with signature:

```typescript
;(path: string) => Promise<FSResult<string>>
```

**Usage**:

```typescript
const readFileOp = readFile({ encoding: 'utf8' })
const result = await readFileOp('./file.txt')
```

### `writeFile()`

Creates a function to write file contents.

```typescript
function writeFile(config?: FSConfig): WriteFileOp
```

**Returns**: Function with signature:

```typescript
;(path: string, content: string) => Promise<FSResult<void>>
```

### `exists()`

Creates a function to check if path exists.

```typescript
function exists(config?: FSConfig): ExistsOp
```

**Returns**: Function with signature:

```typescript
;(path: string) => Promise<FSResult<boolean>>
```

### `stat()`

Creates a function to get file statistics.

```typescript
function stat(config?: FSConfig): StatOp
```

**Returns**: Function with signature:

```typescript
;(path: string) => Promise<FSResult<FileStats>>
```

### `mkdir()`

Creates a function to create directories.

```typescript
function mkdir(config?: FSConfig): MkdirOp
```

**Returns**: Function with signature:

```typescript
;(path: string, options?: MkdirOptions) => Promise<FSResult<void>>
```

### `readDir()`

Creates a function to read directory contents.

```typescript
function readDir(config?: FSConfig): ReadDirOp
```

**Returns**: Function with signature:

```typescript
;(path: string) => Promise<FSResult<string[]>>
```

### `copy()`

Creates a function to copy files or directories.

```typescript
function copy(config?: FSConfig): CopyOp
```

**Returns**: Function with signature:

```typescript
;(src: string, dest: string, options?: CopyOptions) => Promise<FSResult<void>>
```

### `move()`

Creates a function to move/rename files or directories.

```typescript
function move(config?: FSConfig): MoveOp
```

**Returns**: Function with signature:

```typescript
;(src: string, dest: string, options?: MoveOptions) => Promise<FSResult<void>>
```

### `remove()`

Creates a function to remove files or directories.

```typescript
function remove(config?: FSConfig): RemoveOp
```

**Returns**: Function with signature:

```typescript
;(filePath: string, options?: RmOptions) => Promise<FSResult<void>>
```

### `readJson()`

Creates a function to read and parse JSON files.

```typescript
function readJson(config?: FSConfig): ReadJsonOp
```

**Returns**: Function with signature:

```typescript
;<T = any>(path: string) => Promise<FSResult<T>>
```

### `writeJson()`

Creates a function to write JSON files.

```typescript
function writeJson(config?: FSConfig): WriteJsonOp
```

**Returns**: Function with signature:

```typescript
;<T = any>(path: string, data: T, options?: { spaces?: number }) => Promise<FSResult<void>>
```

## Utility Operations

### `ensureDir()`

Creates a function to ensure directory exists (creates directory recursively).

```typescript
function ensureDir(config?: FSConfig): (path: string) => Promise<FSResult<void>>
```

**Returns**: Function that creates directories recursively.

**Usage**:

```typescript
const ensureDirOp = ensureDir()
const result = await ensureDirOp('./new/nested/directory')

// Or use the pre-configured instance
const result = await fs.ensureDir('./new/nested/directory')
```

### `outputFile()`

Creates a function to write file, ensuring parent directories exist.

```typescript
function outputFile(config?: FSConfig): (path: string, content: string) => Promise<FSResult<void>>
```

**Returns**: Function that writes content to file, creating directories as needed.

**Usage**:

```typescript
const outputFileOp = outputFile()
const result = await outputFileOp('./nested/path/file.txt', 'content')

// Or use the pre-configured instance
const result = await fs.outputFile('./nested/path/file.txt', 'content')
```

### `emptyDir()`

Creates a function to empty directory contents (removes all files and subdirectories).

```typescript
function emptyDir(config?: FSConfig): (path: string) => Promise<FSResult<void>>
```

**Returns**: Function that removes all contents from a directory.

**Usage**:

```typescript
const emptyDirOp = emptyDir()
const result = await emptyDirOp('./temp-directory')

// Or use the pre-configured instance
const result = await fs.emptyDir('./temp-directory')
```

### `findFiles()`

Creates a function to find files matching glob patterns.

```typescript
function findFiles(
  config?: FSConfig
): (pattern: string, options?: { cwd?: string; ignore?: string[] }) => Promise<FSResult<string[]>>
```

**Returns**: Function that finds files matching glob patterns.

**Usage**:

```typescript
const findFilesOp = findFiles()
const result = await findFilesOp('**/*.ts', {
  cwd: './src',
  ignore: ['**/*.test.ts'],
})

// Or use the pre-configured instance
const result = await fs.findFiles('**/*.ts', {
  cwd: './src',
  ignore: ['**/*.test.ts'],
})
```

### `readIfExists()`

Creates a function to read file only if it exists (returns null if not found).

```typescript
function readIfExists(config?: FSConfig): (path: string) => Promise<FSResult<string | null>>
```

**Returns**: Function that reads file content or returns null if file doesn't exist.

**Usage**:

```typescript
const readIfExistsOp = readIfExists()
const result = await readIfExistsOp('./optional-config.json')
if (result.isOk() && result.value !== null) {
  console.log('File content:', result.value)
} else if (result.isOk() && result.value === null) {
  console.log('File does not exist')
}

// Or use the pre-configured instance
const result = await fs.readIfExists('./optional-config.json')
```

### `copyIfExists()`

Creates a function to copy file only if source exists (returns boolean indicating if copy occurred).

```typescript
function copyIfExists(
  config?: FSConfig
): (src: string, dest: string, options?: CopyOptions) => Promise<FSResult<boolean>>
```

**Returns**: Function that copies file if source exists, returns boolean indicating success.

**Usage**:

```typescript
const copyIfExistsOp = copyIfExists()
const result = await copyIfExistsOp('./optional-file.txt', './backup.txt')
if (result.isOk() && result.value) {
  console.log('File copied successfully')
} else if (result.isOk() && !result.value) {
  console.log('Source file does not exist')
}

// Or use the pre-configured instance
const result = await fs.copyIfExists('./optional-file.txt', './backup.txt')
```

## Options Types

### `MkdirOptions`

Options for creating directories.

```typescript
interface MkdirOptions {
  readonly recursive?: boolean
}
```

### `CopyOptions`

Options for copying files/directories.

```typescript
interface CopyOptions {
  readonly overwrite?: boolean
  readonly recursive?: boolean
}
```

### `MoveOptions`

Options for moving files/directories.

```typescript
interface MoveOptions {
  readonly overwrite?: boolean
}
```

### `RmOptions`

Options for removing files/directories.

```typescript
interface RmOptions {
  readonly recursive?: boolean
  readonly force?: boolean
}
```

## Error Handling

### `createFileSystemError()`

Creates filesystem-specific errors with structured metadata.

```typescript
function createFileSystemError(
  operation: string,
  message: string,
  options?: {
    path?: string
    code?: string
    cause?: unknown
    suggestion?: string
    recoverable?: boolean
    severity?: 'low' | 'medium' | 'high' | 'critical'
    context?: Record<string, unknown>
  }
): FileSystemError
```

**Usage**:

```typescript
const error = createFileSystemError('Read file', 'Failed to read configuration file', {
  path: './config.json',
  code: 'CONFIG_READ_ERROR',
  recoverable: true,
  suggestion: 'Check if the file exists and has proper permissions',
})
```

### `mapNodeError()`

Maps Node.js filesystem errors to structured errors.

```typescript
function mapNodeError(operation: string, path: string, error: unknown): FileSystemError
```

## Path Utilities

Comprehensive path utilities are available from `@esteban-url/fs/utils`:

```typescript
import {
  // Basic path operations
  normalizePath,
  createPath,
  createTestPath,
  createAbsolutePath,
  joinPaths,
  safeJoin,
  resolvePath,
  createRelativePath,
  safeRelative,
  // Path information
  getDirectoryName,
  getBaseName,
  getExtension,
  isAbsolutePath,
  isRelativePath,
  // Platform utilities
  isWindows,
  pathSep,
  // Path conversion
  toForwardSlashes,
  toBackslashes,
  toPosixPath,
  toWindowsPath,
  normalizeMockPath,
  // Temporary paths
  getTempDir,
  createTempPath,
  // Validation
  isSafePath,
  isValidName,
  isAllowedPath,
  // Path matching
  createPathRegex,
  pathMatchers,
  pathAssertions,
  // Project structure utilities
  createProjectStructure,
  createTestConfig,
  testPaths,
} from '@esteban-url/fs/utils'
```

For detailed documentation of path utilities, see the [path utilities guide](/packages/fs/docs/how-to/path-operations.md).

## Configuration

### `defaultFSConfig`

Default configuration for filesystem operations.

```typescript
const defaultFSConfig: FSConfig
```

## Usage Examples

### Basic File Operations

```typescript
import { fs } from '@esteban-url/fs'

// Read file
const readResult = await fs.readFile('./config.json')
if (readResult.isOk()) {
  const content = readResult.value
  console.log('File content:', content)
}

// Write file
const writeResult = await fs.writeFile('./output.txt', 'Hello, World!')
if (writeResult.isOk()) {
  console.log('File written successfully')
}

// Check if file exists
const existsResult = await fs.exists('./file.txt')
if (existsResult.isOk() && existsResult.value) {
  console.log('File exists')
}
```

### JSON Operations

```typescript
import { fs } from '@esteban-url/fs'

// Read JSON file
const jsonResult = await fs.readJson('./package.json')
if (jsonResult.isOk()) {
  const packageInfo = jsonResult.value
  console.log('Package name:', packageInfo.name)
}

// Write JSON file
const data = { name: 'My App', version: '1.0.0' }
const writeJsonResult = await fs.writeJson('./config.json', data)
```

### Directory Operations

```typescript
import { fs } from '@esteban-url/fs'

// Create directory
const mkdirResult = await fs.mkdir('./new-directory', { recursive: true })

// Read directory contents
const readDirResult = await fs.readDir('./src')
if (readDirResult.isOk()) {
  const files = readDirResult.value
  console.log('Files:', files)
}

// Empty directory
const emptyResult = await fs.emptyDir('./temp')
```

### Advanced Operations

```typescript
import { fs } from '@esteban-url/fs'

// Copy with options
const copyResult = await fs.copy('./src', './backup', {
  recursive: true,
  overwrite: true,
})

// Find files
const findResult = await fs.findFiles('**/*.ts', {
  cwd: './src',
  ignore: ['**/*.test.ts'],
})

// Output file (creates directories if needed)
const outputResult = await fs.outputFile('./deep/nested/file.txt', 'content')
```

### Custom Configuration

```typescript
import { readFile, writeFile } from '@esteban-url/fs'

// Create operations with custom config
const customRead = readFile({ encoding: 'utf8' })
const customWrite = writeFile({ mode: 0o644 })

const result = await customRead('./file.txt')
```

### Error Handling

```typescript
import { fs, createFileSystemError } from '@esteban-url/fs'

const result = await fs.readFile('./nonexistent.txt')
if (result.isErr()) {
  const error = result.error
  console.error(`Error: ${error.message}`)
  console.error(`Path: ${error.path}`)
  console.error(`Operation: ${error.operation}`)
  console.error(`System call: ${error.syscall}`)
}
```

### Chaining Operations

```typescript
import { fs } from '@esteban-url/fs'
import { ok, err } from '@esteban-url/core'

// Chain filesystem operations using Result methods
const processConfig = async () => {
  const readResult = await fs.readJson('./input.json')
  if (readResult.isErr()) {
    return err(readResult.error)
  }

  // Process data
  const processed = { ...readResult.value, processed: true }
  const writeResult = await fs.writeJson('./output.json', processed)
  if (writeResult.isErr()) {
    return err(writeResult.error)
  }

  // Create backup
  const backupResult = await fs.copy('./output.json', './backup.json')
  return backupResult
}

const result = await processConfig()
if (result.isOk()) {
  console.log('All operations completed successfully')
}
```

## Testing Utilities

The package provides comprehensive testing utilities via `@esteban-url/fs/testing`:

### Mock Filesystem

```typescript
import { createMockFileSystem, createTestFileSystem, MockFileSystem } from '@esteban-url/fs/testing'

// Create mock filesystem with initial structure
const mockFs = createMockFileSystem({
  'package.json': JSON.stringify({ name: 'test' }),
  'src/index.ts': 'export const hello = "world"',
  'README.md': '# Test Project',
})

// Use mock filesystem with fs operations
const content = await mockFs.readFile('package.json')
const exists = await mockFs.exists('src/index.ts')
```

### Path Testing Utilities

All path utilities from `@esteban-url/fs/utils` are re-exported for testing:

```typescript
import {
  normalizePath,
  createPath,
  createAbsolutePath,
  joinPaths,
  safeJoin,
  resolvePath,
  createRelativePath,
  getDirectoryName,
  getBaseName,
  getExtension,
  isAbsolutePath,
  isRelativePath,
  // Platform utilities
  isWindows,
  pathSep,
  // Path conversion
  toForwardSlashes,
  toBackslashes,
  toPosixPath,
  toWindowsPath,
  // Validation
  isSafePath,
  isValidName,
  isAllowedPath,
  // Path matching
  createPathRegex,
  pathMatchers,
  pathAssertions,
  // Test utilities
  createProjectStructure,
  createTempPath,
  getTempDir,
  testPaths,
} from '@esteban-url/fs/testing'
```

### Test Fixtures

Pre-built project structures for testing:

```typescript
import { basicProject, configFiles, monorepoStructure } from '@esteban-url/fs/testing'

// Use fixtures with mock filesystem
const projectFs = createMockFileSystem(basicProject)
const configFs = createMockFileSystem(configFiles)
```

For detailed testing documentation, see [Testing Guide](/packages/fs/docs/how-to/testing.md).

## Related APIs

- [Core API Reference](/docs/reference/core-api.md) - Base Result types and error handling
- [Data API](/packages/data/docs/reference/api.md) - Data processing operations
- [Validation API](/packages/validation/docs/reference/api.md) - Data validation
