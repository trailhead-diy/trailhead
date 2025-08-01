# File Operations APIs

Type-safe file system operations that return Result types.

## Reading Files

### readFile(path, encoding?)

Read entire file contents.

```typescript
import { readFile } from '@esteban-url/fs'

const result = await readFile(
  path: string,              // File path
  encoding?: BufferEncoding  // Default: 'utf8'
)
// Returns: Promise<Result<string, Error>>
```

**Example**:

```typescript
const result = await readFile('config.json', 'utf8')

if (result.isOk()) {
  const config = JSON.parse(result.value)
} else {
  logger.error(`Failed to read: ${result.error.message}`)
}
```

### readFileSync(path, encoding?)

Synchronous file reading.

```typescript
import { readFileSync } from '@esteban-url/fs'

const result = readFileSync(path: string, encoding?: BufferEncoding)
// Returns: Result<string, Error>
```

## Writing Files

### writeFile(path, content, options?)

Write content to file.

```typescript
import { writeFile } from '@esteban-url/fs'

const result = await writeFile(
  path: string,
  content: string | Buffer,
  options?: {
    encoding?: BufferEncoding  // Default: 'utf8'
    mode?: number             // File permissions
    flag?: string             // File system flags
  }
)
// Returns: Promise<Result<void, Error>>
```

**Examples**:

```typescript
// Write text file
const result = await writeFile('output.txt', 'Hello, world!')

// Write JSON
const data = { name: 'test', version: '1.0.0' }
const result = await writeFile(
  'package.json',
  JSON.stringify(data, null, 2)
)

// Write with options
const result = await writeFile('script.sh', '#!/bin/bash\necho "Hello"', {
  mode: 0o755,  // Make executable
})
```

### writeFileSync(path, content, options?)

Synchronous file writing.

```typescript
const result = writeFileSync(path, content, options?)
// Returns: Result<void, Error>
```

## Directory Operations

### mkdir(path, options?)

Create directory.

```typescript
import { mkdir } from '@esteban-url/fs'

const result = await mkdir(
  path: string,
  options?: {
    recursive?: boolean  // Create parent directories
    mode?: number       // Directory permissions
  }
)
// Returns: Promise<Result<void, Error>>
```

**Examples**:

```typescript
// Create single directory
await mkdir('dist')

// Create nested directories
await mkdir('src/components/ui', { recursive: true })

// With permissions
await mkdir('private', { mode: 0o700 })
```

### readdir(path, options?)

List directory contents.

```typescript
import { readdir } from '@esteban-url/fs'

const result = await readdir(
  path: string,
  options?: {
    withFileTypes?: boolean  // Return Dirent objects
  }
)
// Returns: Promise<Result<string[] | Dirent[], Error>>
```

**Examples**:

```typescript
// Get file names
const result = await readdir('src')
if (result.isOk()) {
  console.log(result.value)  // ['index.ts', 'utils.ts']
}

// Get detailed entries
const result = await readdir('src', { withFileTypes: true })
if (result.isOk()) {
  for (const entry of result.value) {
    if (entry.isDirectory()) {
      console.log(`Directory: ${entry.name}`)
    } else if (entry.isFile()) {
      console.log(`File: ${entry.name}`)
    }
  }
}
```

### rmdir(path, options?)

Remove directory.

```typescript
import { rmdir } from '@esteban-url/fs'

const result = await rmdir(
  path: string,
  options?: {
    recursive?: boolean  // Remove contents recursively
  }
)
// Returns: Promise<Result<void, Error>>
```

## File System Checks

### exists(path)

Check if path exists.

```typescript
import { exists } from '@esteban-url/fs'

const result = await exists(path: string)
// Returns: Promise<Result<boolean, Error>>
```

**Example**:

```typescript
const result = await exists('config.json')
if (result.isOk() && result.value) {
  // File exists
  const config = await readFile('config.json')
} else if (result.isOk() && !result.value) {
  // File doesn't exist
  await writeFile('config.json', '{}')
}
```

### stat(path)

Get file/directory information.

```typescript
import { stat } from '@esteban-url/fs'

const result = await stat(path: string)
// Returns: Promise<Result<Stats, Error>>

interface Stats {
  isFile(): boolean
  isDirectory(): boolean
  size: number
  mtime: Date  // Modified time
  ctime: Date  // Created time
  mode: number // Permissions
}
```

**Example**:

```typescript
const result = await stat('package.json')
if (result.isOk()) {
  const stats = result.value
  console.log(`Size: ${stats.size} bytes`)
  console.log(`Modified: ${stats.mtime}`)
  console.log(`Is file: ${stats.isFile()}`)
}
```

## File Manipulation

### unlink(path)

Delete a file.

```typescript
import { unlink } from '@esteban-url/fs'

const result = await unlink(path: string)
// Returns: Promise<Result<void, Error>>
```

### rename(oldPath, newPath)

Rename or move file/directory.

```typescript
import { rename } from '@esteban-url/fs'

const result = await rename(
  oldPath: string,
  newPath: string
)
// Returns: Promise<Result<void, Error>>
```

**Examples**:

```typescript
// Rename file
await rename('old-name.txt', 'new-name.txt')

// Move file
await rename('src/temp.ts', 'dist/final.ts')

// Move and rename
await rename('downloads/file.zip', 'archive/backup-2024.zip')
```

### copyFile(src, dest, flags?)

Copy file from source to destination.

```typescript
import { copyFile } from '@esteban-url/fs'

const result = await copyFile(
  src: string,
  dest: string,
  flags?: number  // Copy behavior flags
)
// Returns: Promise<Result<void, Error>>
```

## Path Utilities

### resolve(...paths)

Resolve to absolute path.

```typescript
import { resolve } from '@esteban-url/fs'

const absolutePath = resolve('src', 'utils', 'index.ts')
// Returns: '/absolute/path/to/src/utils/index.ts'
```

### join(...paths)

Join path segments.

```typescript
import { join } from '@esteban-url/fs'

const path = join('src', 'components', 'Button.tsx')
// Returns: 'src/components/Button.tsx'
```

### dirname(path)

Get directory name.

```typescript
import { dirname } from '@esteban-url/fs'

dirname('/src/utils/index.ts')  // '/src/utils'
dirname('file.txt')             // '.'
```

### basename(path, ext?)

Get file name.

```typescript
import { basename } from '@esteban-url/fs'

basename('/src/utils/index.ts')       // 'index.ts'
basename('/src/utils/index.ts', '.ts') // 'index'
```

### extname(path)

Get file extension.

```typescript
import { extname } from '@esteban-url/fs'

extname('file.txt')     // '.txt'
extname('image.png')    // '.png'
extname('archive.tar.gz') // '.gz'
```

## Working with Streams

### createReadStream(path, options?)

Create readable stream.

```typescript
import { createReadStream } from '@esteban-url/fs'

const stream = createReadStream(path: string, options?: {
  encoding?: BufferEncoding
  start?: number
  end?: number
  highWaterMark?: number
})

// Process stream
for await (const chunk of stream) {
  // Process chunk
}
```

### createWriteStream(path, options?)

Create writable stream.

```typescript
import { createWriteStream } from '@esteban-url/fs'

const stream = createWriteStream(path: string, options?: {
  encoding?: BufferEncoding
  flags?: string
  mode?: number
})

// Write data
stream.write('Hello ')
stream.write('World!')
stream.end()
```

## Advanced Patterns

### Safe File Updates

Update file with automatic backup:

```typescript
async function safeUpdate(path: string, content: string) {
  // Create backup
  const backupPath = `${path}.backup`
  const copyResult = await copyFile(path, backupPath)
  if (copyResult.isError()) {
    return copyResult
  }
  
  // Write new content
  const writeResult = await writeFile(path, content)
  if (writeResult.isError()) {
    // Restore backup on failure
    await rename(backupPath, path)
    return writeResult
  }
  
  // Clean up backup
  await unlink(backupPath)
  return ok(undefined)
}
```

### Directory Walking

Recursively process directory:

```typescript
async function* walkDirectory(dir: string): AsyncGenerator<string> {
  const result = await readdir(dir, { withFileTypes: true })
  if (result.isError()) return
  
  for (const entry of result.value) {
    const path = join(dir, entry.name)
    
    if (entry.isDirectory()) {
      yield* walkDirectory(path)
    } else {
      yield path
    }
  }
}

// Usage
for await (const file of walkDirectory('src')) {
  console.log(file)
}
```

### Atomic Writes

Write with temporary file:

```typescript
async function atomicWrite(path: string, content: string) {
  const tmpPath = `${path}.tmp.${Date.now()}`
  
  // Write to temporary file
  const writeResult = await writeFile(tmpPath, content)
  if (writeResult.isError()) {
    await unlink(tmpPath)  // Clean up
    return writeResult
  }
  
  // Atomically rename
  return rename(tmpPath, path)
}
```

## Error Handling

Common error patterns:

```typescript
// File not found
const result = await readFile('missing.txt')
if (result.isError() && result.error.code === 'ENOENT') {
  console.log('File not found')
}

// Permission denied
if (result.isError() && result.error.code === 'EACCES') {
  console.log('Permission denied')
}

// Directory not empty
if (result.isError() && result.error.code === 'ENOTEMPTY') {
  console.log('Directory not empty')
}
```