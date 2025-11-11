# @trailhead/fs

> Filesystem operations with Result-based error handling

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

Complete filesystem operations with Result-based error handling, built-in JSON support, and mock filesystem for testing.

## Installation

```bash
pnpm add @trailhead/fs
```

## Quick Example

```typescript
import { fs } from '@trailhead/fs'

// Read a file
const result = await fs.readFile('./config.json')
if (result.isOk()) {
  console.log('File contents:', result.value)
}

// JSON operations
const config = await fs.readJson('./config.json')
await fs.writeJson('./data.json', { name: 'My App' })

// Directory operations
await fs.ensureDir('./logs/2024')
await fs.copy('./source', './destination')
await fs.move('./old.txt', './new.txt')
```

## Key Features

- **Result-based** - Explicit error handling for all filesystem operations
- **Complete coverage** - Read, write, copy, move, remove operations
- **JSON support** - Built-in JSON reading and writing
- **Mock filesystem** - Testing utilities with in-memory filesystem
- **Path utilities** - Helper functions for path manipulation

## Documentation

- **[API Documentation](../../docs/@trailhead.fs.md)** - Complete API reference
- **[File Operations Basics](../../docs/tutorials/file-operations-basics.md)** - Tutorial
- **[Perform Atomic Operations](../../docs/how-to/perform-atomic-file-operations.md)** - How-to guide

## License

MIT © [Esteban URL](https://github.com/esteban-url)
