---
type: reference
title: "FileSystem Module API Reference"
description: "File system abstraction layer with consistent error handling and memory implementations"
related:
  - /docs/reference/api/core
  - /docs/reference/api/testing
  - /docs/how-to/file-operations
---

# FileSystem Module API Reference

Abstraction layer for file system operations with consistent error handling and support for both real and in-memory implementations.

## Overview

| Property | Value |
|----------|-------|
| **Package** | `@esteban-url/trailhead-cli` |
| **Module** | `@esteban-url/trailhead-cli/filesystem` |
| **Since** | `v1.0.0` |

## Import

```typescript
import { createFileSystem } from "@esteban-url/trailhead-cli/filesystem";
import type { FileSystem } from "@esteban-url/trailhead-cli/filesystem";
```

## Basic Usage

```typescript
import { createFileSystem } from "@esteban-url/trailhead-cli/filesystem";
import type { FileSystem } from "@esteban-url/trailhead-cli/filesystem";

const fs = createFileSystem();
```

## FileSystem Interface

### Core Operations

```typescript
interface FileSystem {
  // Check existence
  exists(path: string): Promise<Result<boolean>>;
  
  // Read operations
  readFile(path: string, encoding?: string): Promise<Result<string>>;
  readdir(path: string): Promise<Result<string[]>>;
  stat(path: string): Promise<Result<FileStats>>;
  
  // Write operations
  writeFile(path: string, content: string): Promise<Result<void>>;
  mkdir(path: string, options?: MkdirOptions): Promise<Result<void>>;
  
  // File operations
  copy(src: string, dest: string, options?: CopyOptions): Promise<Result<void>>;
  move(src: string, dest: string, options?: { overwrite?: boolean }): Promise<Result<void>>;
  remove(path: string): Promise<Result<void>>;
  
  // Utility operations
  ensureDir(path: string): Promise<Result<void>>;
  emptyDir(path: string): Promise<Result<void>>;
  outputFile(path: string, content: string): Promise<Result<void>>;
  readJson<T = any>(path: string): Promise<Result<T>>;
  writeJson<T = any>(path: string, data: T, options?: JsonOptions): Promise<Result<void>>;
}
```

### FileStats Interface

```typescript
interface FileStats {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  mtime: Date;
}
```

### Options Types

```typescript
interface MkdirOptions {
  recursive?: boolean;
}

interface CopyOptions {
  overwrite?: boolean;
  recursive?: boolean;
}

interface RemoveOptions {
  recursive?: boolean;
  force?: boolean;
}

interface JsonOptions {
  spaces?: number;
}
```

## Creating FileSystems

### Real FileSystem (Default)

```typescript
import { createFileSystem, createNodeFileSystem } from "@esteban-url/trailhead-cli/filesystem";

// Using factory (recommended)
const fs = createFileSystem();

// Explicit node filesystem
const nodeFs = createNodeFileSystem();
```

### Memory FileSystem (Testing)

```typescript
import { createMemoryFileSystem } from "@esteban-url/trailhead-cli/filesystem";

// Empty memory filesystem
const fs = createMemoryFileSystem();

// With initial files
const fs = createMemoryFileSystem({
  "/config.json": '{"name": "test"}',
  "/src/index.js": 'console.log("Hello")',
  "/data/users.csv": "id,name\n1,John",
});
```

## Common Operations

### Reading Files

```typescript
const result = await fs.readFile("/path/to/file.txt");
if (result.success) {
  console.log(result.value);
} else {
  console.error(`Error: ${result.error.message}`);
}

// With encoding
const utf16Result = await fs.readFile("/path/to/file.txt", "utf16le");
```

### Writing Files

```typescript
const result = await fs.writeFile("/path/to/output.txt", "Hello, World!");
if (!result.success) {
  console.error(`Failed to write: ${result.error.message}`);
}
```

### JSON Operations

```typescript
// Read JSON
const configResult = await fs.readJson<Config>("/config.json");
if (configResult.success) {
  const config = configResult.value;
  console.log(config.name);
}

// Write JSON
const data = { name: "my-app", version: "1.0.0" };
const writeResult = await fs.writeJson("/config.json", data, { spaces: 2 });
```

### Directory Operations

```typescript
// Create directory
await fs.mkdir("/new/directory", { recursive: true });

// Ensure directory exists
await fs.ensureDir("/path/to/dir");

// List directory contents
const result = await fs.readdir("/src");
if (result.success) {
  console.log(result.value); // ['file1.js', 'file2.js']
}
```

### File Operations

```typescript
// Copy file
await fs.copy("/src/file.txt", "/dest/file.txt");

// Copy directory
await fs.copy("/src/dir", "/dest/dir", { 
  recursive: true,
  overwrite: false 
});

// Move file or directory
await fs.move("/src/file.txt", "/dest/file.txt");
await fs.move("/old/dir", "/new/dir", { overwrite: true });

// Remove file or directory (recursive by default)
await fs.remove("/old/file.txt");
await fs.remove("/old/directory"); // Removes recursively

// Empty directory contents (keeps the directory)
await fs.emptyDir("/temp");

// Output file with automatic directory creation
await fs.outputFile("/deep/nested/path/file.txt", "content");
```

### Enhanced Operations (fs-extra powered)

These methods provide additional functionality powered by the fs-extra library:

```typescript
// Move operations - atomically move files/directories
const moveResult = await fs.move("/source/file.txt", "/destination/file.txt");
if (moveResult.success) {
  console.log("File moved successfully");
}

// Move with overwrite protection
const safeMove = await fs.move("/src", "/dest", { overwrite: false });

// Remove operations - safely remove any file/directory
await fs.remove("/temporary-file.txt");      // Remove file
await fs.remove("/temporary-directory");     // Remove directory recursively
await fs.remove("/path/that/might/not/exist"); // Safe - won't error if missing

// Empty directory - clear contents but keep directory
await fs.emptyDir("/cache");           // Empties /cache but keeps the directory
await fs.emptyDir("/logs");            // Clears all log files
await fs.emptyDir("/temp/downloads");   // Cleans download directory

// Output file - write with automatic parent directory creation
await fs.outputFile("/deep/nested/structure/config.json", '{"key": "value"}');
// Creates /deep, /deep/nested, /deep/nested/structure automatically

// Practical examples

// Backup and replace pattern
const backupPath = `/backups/${Date.now()}-config.json`;
await fs.move("/app/config.json", backupPath);  // Backup original
await fs.outputFile("/app/config.json", newConfig); // Write new config

// Clean and recreate pattern
await fs.remove("/build");              // Remove old build
await fs.ensureDir("/build");           // Ensure build directory exists
await fs.outputFile("/build/index.js", bundledCode); // Output new build

// Safe cleanup pattern
await fs.emptyDir("/temp");             // Clear temp files but keep directory
await fs.remove("/cache/expired");      // Remove expired cache entries
```

## Error Handling

All FileSystem operations return Results with detailed error information:

```typescript
interface FileSystemError {
  code: string;
  message: string;
  path?: string;
  recoverable: boolean;
}
```

### Common Error Codes

- `ENOENT` - File or directory not found
- `EEXIST` - File or directory already exists
- `EACCES` - Permission denied
- `EISDIR` - Expected file but found directory
- `ENOTDIR` - Expected directory but found file
- `ENOTEMPTY` - Directory not empty

### Error Handling Example

```typescript
const result = await fs.readFile("/protected/file.txt");

if (!result.success) {
  switch (result.error.code) {
    case "ENOENT":
      console.log("File not found, creating default...");
      await fs.writeFile("/protected/file.txt", "default content");
      break;
      
    case "EACCES":
      console.error("Permission denied");
      break;
      
    default:
      console.error(`Unexpected error: ${result.error.message}`);
  }
}
```

## Testing with Memory FileSystem

```typescript
import { createMemoryFileSystem } from "@esteban-url/trailhead-cli/filesystem";
import { createTestContext } from "@esteban-url/trailhead-cli/testing";

test("file processing", async () => {
  // Create memory filesystem with test data
  const fs = createMemoryFileSystem({
    "/input.txt": "test content",
    "/config.json": '{"enabled": true}',
  });
  
  // Use in test context
  const context = createTestContext({ filesystem: fs });
  
  // Run command
  const result = await myCommand.execute({}, context);
  expect(result.success).toBe(true);
  
  // Verify output
  const output = await fs.readFile("/output.txt");
  expect(output.success).toBe(true);
  expect(output.value).toBe("processed content");
});
```

### Memory FileSystem Special Methods

```typescript
const fs = createMemoryFileSystem();

// Get all files (testing only)
const files = fs.getFiles();
// Map { '/test.txt' => 'content', '/data.json' => '{}' }

// Get all directories (testing only)
const dirs = fs.getDirectories();
// Set { '/', '/src', '/src/commands' }

// Clear all content (testing only)
fs.clear();
```

## Utility Functions

### File Utilities

```typescript
import { 
  findFiles,
  fileExists,
  readFile,
  writeFile,
  ensureDirectory 
} from "@esteban-url/trailhead-cli/filesystem";

// Find files matching pattern
const tsFiles = await findFiles("/src", "**/*.ts");

// Check existence
const exists = await fileExists(fs, "/config.json");

// Read with default
const content = await readFile(fs, "/config.json", "{}");

// Write with backup
await writeFile(fs, "/data.json", content, { backup: true });
```

### Path Utilities

```typescript
import { getRelativePath, compareFiles } from "@esteban-url/trailhead-cli/filesystem";

// Get relative path
const relative = getRelativePath("/home/user", "/home/user/project/src");
// "project/src"

// Compare file contents
const areEqual = await compareFiles(fs, "/file1.txt", "/file2.txt");
```

## Best Practices

1. **Always check Results** - Never assume operations succeed
2. **Use ensureDir** - For robust directory creation
3. **Handle specific errors** - Check error codes for recovery
4. **Use memory filesystem for tests** - Fast and isolated
5. **Prefer JSON methods** - For structured data

## Type Reference

```typescript
// FileSystem factory
function createFileSystem(adapter?: FileSystemAdapter): FileSystem;

// Memory filesystem factory
function createMemoryFileSystem(
  initialFiles?: Record<string, string>
): FileSystem & {
  getFiles(): Map<string, string>;
  getDirectories(): Set<string>;
  clear(): void;
};

// Adapter interface for custom implementations
interface FileSystemAdapter {
  readFile(path: string, encoding?: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: MkdirOptions): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<FileStats>;
  copyFile(src: string, dest: string): Promise<void>;
  rm(path: string, options?: RemoveOptions): Promise<void>;
}
```

## See Also

- [Testing Guide](../how-to/testing-guide.md) - Testing with memory filesystem
- [Common Patterns](../how-to/common-patterns.md) - File operation patterns
- [Error Handling](../guides/error-handling.md) - Handling filesystem errors