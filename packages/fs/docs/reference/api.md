---
type: reference
title: 'FileSystem Package API Reference'
description: 'Complete API reference for filesystem operations with Result-based error handling and functional programming patterns'
related:
  - /docs/reference/core-api.md
  - /packages/fs/docs/explanation/result-patterns.md
  - /packages/fs/docs/how-to/file-operations.md
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
  readonly type: 'FileSystemError'
  readonly path?: string
  readonly operation: string
  readonly syscall?: string
  readonly errno?: number
}
```

### `FileStats`

File or directory statistics.

```typescript
interface FileStats {
  readonly isFile: boolean
  readonly isDirectory: boolean
  readonly isSymbolicLink: boolean
  readonly size: number
  readonly mtime: Date
  readonly atime: Date
  readonly ctime: Date
  readonly birthtime: Date
  readonly mode: number
  readonly uid: number
  readonly gid: number
}
```

### `FSConfig`

Configuration for filesystem operations.

```typescript
interface FSConfig {
  readonly encoding?: BufferEncoding
  readonly recursive?: boolean
  readonly overwrite?: boolean
  readonly preserveTimestamps?: boolean
  readonly dereference?: boolean
  readonly errorOnExist?: boolean
  readonly mode?: number
}
```

## Main API

### `fs`

Pre-configured filesystem operations instance.

```typescript
const fs: {
  readFile: ReadFileFunction
  writeFile: WriteFileFunction
  exists: ExistsFunction
  stat: StatFunction
  mkdir: MkdirFunction
  readDir: ReadDirFunction
  copy: CopyFunction
  move: MoveFunction
  remove: RemoveFunction
  readJson: ReadJsonFunction
  writeJson: WriteJsonFunction
  ensureDir: EnsureDirFunction
  outputFile: OutputFileFunction
  emptyDir: EmptyDirFunction
  findFiles: FindFilesFunction
  readIfExists: ReadIfExistsFunction
  copyIfExists: CopyIfExistsFunction
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
;(filePath: string, options?: ReadFileOptions) => Promise<FSResult<string | Buffer>>
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
;(filePath: string, data: string | Buffer, options?: WriteFileOptions) => Promise<FSResult<void>>
```

### `exists()`

Creates a function to check if path exists.

```typescript
function exists(config?: FSConfig): ExistsOp
```

**Returns**: Function with signature:

```typescript
;(filePath: string) => Promise<FSResult<boolean>>
```

### `stat()`

Creates a function to get file statistics.

```typescript
function stat(config?: FSConfig): StatOp
```

**Returns**: Function with signature:

```typescript
;(filePath: string) => Promise<FSResult<FileStats>>
```

### `mkdir()`

Creates a function to create directories.

```typescript
function mkdir(config?: FSConfig): MkdirOp
```

**Returns**: Function with signature:

```typescript
;(dirPath: string, options?: MkdirOptions) => Promise<FSResult<void>>
```

### `readDir()`

Creates a function to read directory contents.

```typescript
function readDir(config?: FSConfig): ReadDirOp
```

**Returns**: Function with signature:

```typescript
;(dirPath: string, options?: ReadDirOptions) => Promise<FSResult<string[]>>
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
;(filePath: string, options?: ReadJsonOptions) => Promise<FSResult<unknown>>
```

### `writeJson()`

Creates a function to write JSON files.

```typescript
function writeJson(config?: FSConfig): WriteJsonOp
```

**Returns**: Function with signature:

```typescript
;(filePath: string, data: unknown, options?: WriteJsonOptions) => Promise<FSResult<void>>
```

## Utility Operations

### `ensureDir()`

Creates a function to ensure directory exists.

```typescript
function ensureDir(config?: FSConfig): EnsureDirFunction
```

**Returns**: Function with signature:

```typescript
;(dirPath: string) => Promise<FSResult<void>>
```

**Usage**:

```typescript
const ensureDirOp = ensureDir()
const result = await ensureDirOp('./new/nested/directory')
```

### `outputFile()`

Creates a function to write file, ensuring parent directories exist.

```typescript
function outputFile(config?: FSConfig): OutputFileFunction
```

**Returns**: Function with signature:

```typescript
;(filePath: string, data: string | Buffer) => Promise<FSResult<void>>
```

### `emptyDir()`

Creates a function to empty directory contents.

```typescript
function emptyDir(config?: FSConfig): EmptyDirFunction
```

**Returns**: Function with signature:

```typescript
;(dirPath: string) => Promise<FSResult<void>>
```

### `findFiles()`

Creates a function to find files matching patterns.

```typescript
function findFiles(config?: FSConfig): FindFilesFunction
```

**Returns**: Function with signature:

```typescript
;(pattern: string | string[], options?: FindOptions) => Promise<FSResult<string[]>>
```

### `readIfExists()`

Creates a function to read file only if it exists.

```typescript
function readIfExists(config?: FSConfig): ReadIfExistsFunction
```

**Returns**: Function with signature:

```typescript
;(filePath: string, options?: ReadFileOptions) => Promise<FSResult<string | null>>
```

### `copyIfExists()`

Creates a function to copy file only if source exists.

```typescript
function copyIfExists(config?: FSConfig): CopyIfExistsFunction
```

**Returns**: Function with signature:

```typescript
;(src: string, dest: string, options?: CopyOptions) => Promise<FSResult<boolean>>
```

## Options Types

### `ReadFileOptions`

Options for reading files.

```typescript
interface ReadFileOptions {
  readonly encoding?: BufferEncoding
  readonly flag?: string
}
```

### `WriteFileOptions`

Options for writing files.

```typescript
interface WriteFileOptions {
  readonly encoding?: BufferEncoding
  readonly mode?: number
  readonly flag?: string
}
```

### `MkdirOptions`

Options for creating directories.

```typescript
interface MkdirOptions {
  readonly recursive?: boolean
  readonly mode?: number
}
```

### `CopyOptions`

Options for copying files/directories.

```typescript
interface CopyOptions {
  readonly overwrite?: boolean
  readonly preserveTimestamps?: boolean
  readonly recursive?: boolean
  readonly dereference?: boolean
  readonly filter?: (src: string, dest: string) => boolean
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

### `FindOptions`

Options for finding files.

```typescript
interface FindOptions {
  readonly cwd?: string
  readonly ignore?: string[]
  readonly absolute?: boolean
  readonly onlyFiles?: boolean
  readonly onlyDirectories?: boolean
  readonly followSymbolicLinks?: boolean
}
```

## Error Handling

### `createFileSystemError()`

Creates filesystem-specific errors.

```typescript
function createFileSystemError(
  operation: string,
  path: string,
  message: string,
  options?: {
    cause?: unknown
    syscall?: string
    errno?: number
    details?: string
  }
): FileSystemError
```

### `mapNodeError()`

Maps Node.js filesystem errors to structured errors.

```typescript
function mapNodeError(operation: string, path: string, error: unknown): FileSystemError
```

## Path Utilities

### `normalizePath()`

Normalizes file paths for cross-platform compatibility.

```typescript
function normalizePath(filePath: string): string
```

### `isAbsolute()`

Checks if path is absolute.

```typescript
function isAbsolute(filePath: string): boolean
```

### `resolve()`

Resolves path components to absolute path.

```typescript
function resolve(...pathSegments: string[]): string
```

### `join()`

Joins path components.

```typescript
function join(...pathSegments: string[]): string
```

### `dirname()`

Gets directory name of path.

```typescript
function dirname(filePath: string): string
```

### `basename()`

Gets base name of path.

```typescript
function basename(filePath: string, ext?: string): string
```

### `extname()`

Gets file extension.

```typescript
function extname(filePath: string): string
```

### `relative()`

Gets relative path from one path to another.

```typescript
function relative(from: string, to: string): string
```

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
  preserveTimestamps: true,
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

// Chain filesystem operations
const result = await fs
  .readJson('./input.json')
  .andThen((data) => {
    // Process data
    const processed = { ...data, processed: true }
    return fs.writeJson('./output.json', processed)
  })
  .andThen(() => fs.copy('./output.json', './backup.json'))

if (result.isOk()) {
  console.log('All operations completed successfully')
}
```

## Related APIs

- [Core API Reference](/docs/reference/core-api.md) - Base Result types and error handling
- [Data API](/packages/data/docs/reference/api.md) - Data processing operations
- [Validation API](/packages/validation/docs/reference/api.md) - Data validation
