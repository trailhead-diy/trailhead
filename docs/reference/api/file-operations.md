# File Operations APIs

Type-safe file system operations that return Result types. The `@esteban-url/fs` package provides two ways to use file operations:

1. **Convenience object** (`fs`) - Pre-configured with defaults (recommended)
2. **Factory functions** - For custom configuration

## Usage Patterns

### Using the Convenience Object (Recommended)

```typescript
import { fs } from '@esteban-url/fs'

// All operations are pre-configured with defaults
const result = await fs.readFile('config.json')
if (result.isOk()) {
  console.log(result.value)
}
```

### Using Factory Functions

```typescript
import { readFile, FSConfig } from '@esteban-url/fs'

// Create custom configured operations
const customConfig: FSConfig = { encoding: 'latin1' }
const customRead = readFile(customConfig)

// Use the configured function
const result = await customRead('file.txt')
```

## Reading Files

### fs.readFile

Read entire file contents using the convenience object.

```typescript
import { fs } from '@esteban-url/fs'

const result = await fs.readFile('config.json')
// Returns: Promise<Result<string, FileSystemError>>

if (result.isOk()) {
  const content = result.value
  const config = JSON.parse(content)
} else {
  console.error(`Failed: ${result.error.message}`)
}
```

### readFile() Factory

Create a custom file reader with specific configuration.

```typescript
import { readFile, FSConfig } from '@esteban-url/fs'

// Create with custom encoding
const readLatin1 = readFile({ encoding: 'latin1' })
const result = await readLatin1('legacy.txt')

// Or use with defaults
const defaultRead = readFile()
const result2 = await defaultRead('file.txt')
```

## Writing Files

### fs.writeFile

Write content to file using the convenience object.

```typescript
import { fs } from '@esteban-url/fs'

// Write text
const result = await fs.writeFile('output.txt', 'Hello, world!')
// Returns: Promise<Result<void, FileSystemError>>

// Write JSON
const data = { name: 'test', version: '1.0.0' }
const jsonResult = await fs.writeFile('package.json', JSON.stringify(data, null, 2))

if (jsonResult.isErr()) {
  console.error(`Write failed: ${jsonResult.error.message}`)
}
```

### writeFile() Factory

Create a custom file writer.

```typescript
import { writeFile } from '@esteban-url/fs'

// Create with custom configuration
const writeCustom = writeFile({ encoding: 'utf16le' })
const result = await writeCustom('unicode.txt', 'Hello 世界')
```

## Directory Operations

### fs.mkdir

Create directories using the convenience object.

```typescript
import { fs } from '@esteban-url/fs'

// Create single directory
const result = await fs.mkdir('new-dir')

// Create with parents (like mkdir -p)
const deepResult = await fs.mkdir('path/to/deep/dir', {
  recursive: true,
})

if (deepResult.isErr()) {
  console.error(`Failed to create: ${deepResult.error.message}`)
}
```

### fs.readDir

Read directory contents.

```typescript
import { fs } from '@esteban-url/fs'

const result = await fs.readDir('src')
// Returns: Promise<Result<string[], FileSystemError>>

if (result.isOk()) {
  const files = result.value
  console.log(`Found ${files.length} entries`)
  files.forEach((file) => console.log(`  - ${file}`))
}
```

## File Existence

### fs.exists

Check if a file or directory exists.

```typescript
import { fs } from '@esteban-url/fs'

const result = await fs.exists('config.json')
// Returns: Promise<Result<boolean, FileSystemError>>

if (result.isOk() && result.value) {
  console.log('File exists')
  const content = await fs.readFile('config.json')
}
```

## JSON Operations

### fs.readJson

Read and parse JSON files.

```typescript
import { fs } from '@esteban-url/fs'

const result = await fs.readJson('package.json')
// Returns: Promise<Result<any, FileSystemError>>

if (result.isOk()) {
  const pkg = result.value
  console.log(`Package: ${pkg.name}@${pkg.version}`)
}
```

### fs.writeJson

Write JavaScript objects as formatted JSON.

```typescript
import { fs } from '@esteban-url/fs'

const data = {
  name: 'my-app',
  version: '1.0.0',
  dependencies: {},
}

const result = await fs.writeJson('package.json', data)
// Automatically formats with 2-space indentation

if (result.isErr()) {
  console.error(`Failed to write JSON: ${result.error.message}`)
}
```

## File Operations

### fs.copy

Copy files or directories.

```typescript
import { fs } from '@esteban-url/fs'

// Copy file
const result = await fs.copy('source.txt', 'dest.txt')

// Copy directory recursively
const dirResult = await fs.copy('src', 'dist', {
  overwrite: true,
  recursive: true,
})
```

### fs.move

Move or rename files and directories.

```typescript
import { fs } from '@esteban-url/fs'

// Rename file
const result = await fs.move('old.txt', 'new.txt')

// Move to different directory
const moveResult = await fs.move('file.txt', 'archive/file.txt')
```

### fs.remove

Delete files or directories.

```typescript
import { fs } from '@esteban-url/fs'

// Remove file
const result = await fs.remove('temp.txt')

// Remove directory and contents
const dirResult = await fs.remove('temp-dir', {
  recursive: true,
  force: true,
})
```

## Utility Operations

### fs.ensureDir

Ensure a directory exists (create if needed).

```typescript
import { fs } from '@esteban-url/fs'

// Creates directory if it doesn't exist
const result = await fs.ensureDir('logs')

// Creates nested directories
const deepResult = await fs.ensureDir('data/cache/temp')
```

### fs.emptyDir

Empty a directory without removing it.

```typescript
import { fs } from '@esteban-url/fs'

// Remove all contents but keep the directory
const result = await fs.emptyDir('temp')
```

### fs.outputFile

Write file and create parent directories if needed.

```typescript
import { fs } from '@esteban-url/fs'

// Creates 'path/to' directories if they don't exist
const result = await fs.outputFile('path/to/file.txt', 'content')
```

## Error Handling

All operations return `Result<T, FileSystemError>` for safe error handling:

```typescript
import { fs } from '@esteban-url/fs'
import type { FileSystemError } from '@esteban-url/fs'

const result = await fs.readFile('may-not-exist.txt')

if (result.isOk()) {
  // Success case
  const content: string = result.value
  console.log(content)
} else {
  // Error case
  const error: FileSystemError = result.error
  console.error(`Operation failed: ${error.message}`)
  console.error(`Error code: ${error.code}`)
  console.error(`Path: ${error.path}`)
}
```

## Type Definitions

```typescript
// Main configuration type
interface FSConfig {
  encoding?: BufferEncoding // Default: 'utf8'
  cwd?: string // Working directory
}

// Error type returned by all operations
interface FileSystemError extends Error {
  code: string // Error code (e.g., 'ENOENT', 'EACCES')
  path?: string // File path that caused the error
  syscall?: string // System call that failed
}

// Common option types
interface MkdirOptions {
  recursive?: boolean // Create parent directories
  mode?: number // Directory permissions
}

interface CopyOptions {
  overwrite?: boolean // Overwrite existing files
  recursive?: boolean // Copy directories recursively
  errorOnExist?: boolean // Error if destination exists
}

interface RemoveOptions {
  recursive?: boolean // Remove directories and contents
  force?: boolean // Ignore errors
}
```

## Complete Example

```typescript
import { fs } from '@esteban-url/fs'
import { ok, err } from '@esteban-url/core'

async function processConfigFile() {
  // Check if config exists
  const exists = await fs.exists('config.json')
  if (exists.isErr()) {
    return err(exists.error)
  }

  if (!exists.value) {
    // Create default config
    const defaultConfig = { version: '1.0.0', settings: {} }
    const writeResult = await fs.writeJson('config.json', defaultConfig)
    if (writeResult.isErr()) {
      return err(writeResult.error)
    }
  }

  // Read and process config
  const configResult = await fs.readJson('config.json')
  if (configResult.isErr()) {
    return err(configResult.error)
  }

  const config = configResult.value
  console.log(`Loaded config version ${config.version}`)

  // Backup existing config
  const backupResult = await fs.copy('config.json', `config.backup.${Date.now()}.json`)
  if (backupResult.isErr()) {
    console.warn('Failed to create backup')
  }

  return ok(config)
}
```
