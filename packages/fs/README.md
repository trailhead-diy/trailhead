# @trailhead/fs

> Filesystem operations with Result-based error handling

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

## Features

- Result-based error handling for all operations
- Complete filesystem coverage (read, write, copy, move, remove)
- Built-in JSON support
- Mock filesystem for testing
- Path manipulation utilities
- Full TypeScript support

## Installation

```bash
pnpm add @trailhead/fs
# or
npm install @trailhead/fs
```

## Quick Start

```typescript
import { fs } from '@trailhead/fs'

// Read a file
const result = await fs.readFile('./config.json')
if (result.isOk()) {
  console.log('File contents:', result.value)
}

// Write a file
await fs.writeFile('./output.txt', 'Hello, World!')

// JSON operations
const config = await fs.readJson('./config.json')
await fs.writeJson('./data.json', { name: 'My App' })

// Directory operations
await fs.ensureDir('./logs/2024')
await fs.copy('./source', './destination')
await fs.move('./old.txt', './new.txt')
```

## API Reference

### Core Operations

```typescript
import { fs } from '@trailhead/fs'

// File operations
await fs.readFile(path)
await fs.writeFile(path, content)
await fs.exists(path)
await fs.stat(path)

// Directory operations
await fs.mkdir(path, options?)
await fs.readDir(path)
await fs.ensureDir(path)
await fs.emptyDir(path)

// File management
await fs.copy(src, dest, options?)
await fs.move(src, dest, options?)
await fs.remove(path, options?)

// JSON operations
await fs.readJson(path)
await fs.writeJson(path, data, options?)

// Utilities
await fs.outputFile(path, content)
await fs.findFiles(pattern, options?)
```

### Sorting Files and Directories

Both `readDir()` and `findFiles()` support sorting results by multiple criteria:

```typescript
// Sort directory entries by modification time (newest first)
const files = await fs.readDir('./logs', {
  sort: [{ by: 'mtime', order: 'desc' }],
})

// Sort by multiple criteria: directories first, then by name
const entries = await fs.readDir('./src', {
  sort: [
    { by: 'type', order: 'asc' }, // directories first
    { by: 'name', order: 'asc' }, // then alphabetically
  ],
})

// Sort files by size (largest first) then name
const largeFiles = await fs.findFiles('**/*.log', {
  sort: [
    { by: 'size', order: 'desc' },
    { by: 'name', order: 'asc' },
  ],
})

// Available sort fields
type SortBy =
  | 'name' // File/directory name
  | 'size' // File size in bytes
  | 'mtime' // Modification time
  | 'atime' // Access time
  | 'ctime' // Creation/change time
  | 'extension' // File extension
  | 'type' // 'file' or 'directory'

type SortOrder = 'asc' | 'desc'
```

### Path Utilities

```typescript
import { join, resolve, dirname, basename, extname, isAbsolute } from '@trailhead/fs/utils'

const fullPath = join('src', 'components', 'Button.tsx')
const absPath = resolve('./config.json')
const dir = dirname('/path/to/file.txt')
const name = basename('/path/to/file.txt')
const ext = extname('script.ts')
const isAbs = isAbsolute('/home/user')
```

### Testing

```typescript
import { createMockFS } from '@trailhead/fs/testing'

const mockFS = createMockFS({
  '/app/config.json': '{"name": "test"}',
  '/app/data/': null, // directory
})

// Use mockFS exactly like fs
const result = await mockFS.readJson('/app/config.json')
```

## Related Packages

- **@trailhead/core** - Result types and functional utilities
- **@trailhead/data** - Data processing and format conversion
- **@trailhead/validation** - Data validation

## Documentation

- [Tutorials](./docs/README.md)
  - [File Operations Basics](../../docs/tutorials/file-operations-basics.md)
- [How-to Guides](./docs/how-to/file-operations.md)
  - [Perform Atomic File Operations](../../docs/how-to/perform-atomic-file-operations.md)
- [Explanations](./docs/explanation/result-patterns.md)
  - [Result Types Pattern](../../docs/explanation/result-types-pattern.md)
  - [Functional Architecture](../../docs/explanation/functional-architecture.md)
- **[API Documentation](../../docs/@trailhead.fs.md)** - Complete API reference with examples and type information

## License

MIT © [Esteban URL](https://github.com/esteban-url)
