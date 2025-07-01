# FileSystem Module API Reference

The filesystem module provides an abstraction layer for file system operations with consistent error handling and support for both real and in-memory implementations.

## Import

```typescript
import { createFileSystem } from "@trailhead/cli/filesystem";
import type { FileSystem, FileSystemAdapter } from "@trailhead/cli/filesystem";
```

## Core Types

### FileSystem Interface

The main interface for all file system operations.

```typescript
interface FileSystem {
  // Basic operations
  exists(path: string): Promise<Result<boolean>>;
  readFile(path: string, encoding?: string): Promise<Result<string>>;
  writeFile(path: string, content: string): Promise<Result<void>>;
  mkdir(path: string, options?: MkdirOptions): Promise<Result<void>>;
  readdir(path: string): Promise<Result<string[]>>;

  // Extended operations
  copy(src: string, dest: string, options?: CopyOptions): Promise<Result<void>>;
  ensureDir(path: string): Promise<Result<void>>;
  readJson<T = any>(path: string): Promise<Result<T>>;
  writeJson<T = any>(
    path: string,
    data: T,
    options?: { spaces?: number },
  ): Promise<Result<void>>;

  // For testing
  getFiles?: () => Map<string, string>;
  getDirectories?: () => Set<string>;
  clear?: () => void;
}
```

### FileStats

Information about a file or directory.

```typescript
interface FileStats {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  mtime: Date;
}
```

### Options

```typescript
interface MkdirOptions {
  recursive?: boolean;
}

interface CopyOptions {
  overwrite?: boolean;
  recursive?: boolean;
}
```

## Creating a FileSystem

### `createFileSystem(adapter?: FileSystemAdapter): FileSystem`

Creates a file system instance. If no adapter is provided, uses the Node.js file system.

```typescript
// Real file system (default)
const fs = createFileSystem();

// With custom adapter
const customFs = createFileSystem(myAdapter);

// For testing - use memory filesystem
import { createMemoryFileSystem } from "@trailhead/cli/filesystem";
const memFs = createMemoryFileSystem();
```

## Basic Operations

### Checking File Existence

```typescript
const result = await fs.exists("/path/to/file.txt");
if (result.success && result.value) {
  console.log("File exists");
} else if (result.success && !result.value) {
  console.log("File does not exist");
} else {
  console.error("Error checking file:", result.error.message);
}
```

### Reading Files

```typescript
// Read text file
const result = await fs.readFile("/path/to/file.txt");
if (result.success) {
  console.log("Content:", result.value);
} else {
  console.error("Failed to read file:", result.error.message);
}

// Read with specific encoding
const utf16Result = await fs.readFile("/path/to/file.txt", "utf16le");
```

### Writing Files

```typescript
const content = "Hello, World!";
const result = await fs.writeFile("/path/to/output.txt", content);

if (result.success) {
  console.log("File written successfully");
} else {
  console.error("Failed to write file:", result.error.message);
}
```

### Creating Directories

```typescript
// Create single directory
const result = await fs.mkdir("/path/to/new-dir");

// Create nested directories
const nestedResult = await fs.mkdir("/path/to/nested/dirs", {
  recursive: true,
});

// Ensure directory exists (creates if needed)
const ensureResult = await fs.ensureDir("/path/to/ensure");
```

### Listing Directory Contents

```typescript
const result = await fs.readdir("/path/to/directory");
if (result.success) {
  console.log("Files:", result.value);
  // ['file1.txt', 'file2.js', 'subdir']
} else {
  console.error("Failed to read directory:", result.error.message);
}
```

## Extended Operations

### JSON Operations

Read and write JSON files with automatic parsing/stringification.

```typescript
interface Config {
  name: string;
  version: string;
  settings: {
    port: number;
    debug: boolean;
  };
}

// Read JSON
const configResult = await fs.readJson<Config>("/path/to/config.json");
if (configResult.success) {
  console.log("Port:", configResult.value.settings.port);
}

// Write JSON
const config: Config = {
  name: "my-app",
  version: "1.0.0",
  settings: {
    port: 3000,
    debug: true,
  },
};

const writeResult = await fs.writeJson("/path/to/config.json", config, {
  spaces: 2, // Pretty print with 2 spaces
});
```

### Copying Files

```typescript
// Copy single file
const copyResult = await fs.copy("/src/file.txt", "/dest/file.txt");

// Copy with overwrite
const overwriteResult = await fs.copy("/src/file.txt", "/dest/file.txt", {
  overwrite: true,
});

// Copy directory recursively
const dirCopyResult = await fs.copy("/src/dir", "/dest/dir", {
  recursive: true,
  overwrite: false,
});
```

## Memory FileSystem

Perfect for testing without touching the real file system.

### Creating a Memory FileSystem

```typescript
import { createMemoryFileSystem } from "@trailhead/cli/filesystem";

// Empty memory filesystem
const memFs = createMemoryFileSystem();

// With initial files
const memFsWithFiles = createMemoryFileSystem({
  "/config.json": JSON.stringify({ name: "test" }),
  "/src/index.js": 'console.log("Hello")',
  "/data/users.csv": "id,name\n1,John\n2,Jane",
});
```

### Testing with Memory FileSystem

```typescript
import { createMemoryFileSystem } from "@trailhead/cli/filesystem";
import { createTestContext } from "@trailhead/cli/testing";

describe("File Processing", () => {
  it("should process configuration file", async () => {
    // Arrange
    const fs = createMemoryFileSystem({
      "/app/config.json": JSON.stringify({
        name: "test-app",
        port: 3000,
      }),
    });

    const context = createTestContext({ filesystem: fs });

    // Act
    const result = await processConfig("/app/config.json", context);

    // Assert
    expect(result.success).toBe(true);

    // Check generated files
    const files = fs.getFiles();
    expect(files.has("/app/config.processed.json")).toBe(true);
  });
});
```

### Memory FileSystem Special Methods

```typescript
const memFs = createMemoryFileSystem();

// Write some files
await memFs.writeFile("/test.txt", "content");
await memFs.mkdir("/subdir");
await memFs.writeFile("/subdir/file.txt", "nested");

// Get all files (for testing)
const files = memFs.getFiles();
// Map { '/test.txt' => 'content', '/subdir/file.txt' => 'nested' }

// Get all directories
const dirs = memFs.getDirectories();
// Set { '/', '/subdir' }

// Clear all content
memFs.clear();
```

## Error Handling

All FileSystem operations return Results with detailed error information.

### FileSystem Error Types

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

### Error Handling Examples

```typescript
const result = await fs.readFile("/protected/file.txt");

if (!result.success) {
  switch (result.error.code) {
    case "ENOENT":
      console.log("File not found, creating default...");
      await fs.writeFile("/protected/file.txt", "default content");
      break;

    case "EACCES":
      console.error("Permission denied. Try running with sudo.");
      break;

    default:
      console.error(`Unexpected error: ${result.error.message}`);
  }
}
```

## Patterns and Best Practices

### 1. Always Check Results

Never assume operations succeed:

```typescript
// ❌ Bad
const content = (await fs.readFile("config.json")).value; // Might crash!

// ✅ Good
const result = await fs.readFile("config.json");
if (!result.success) {
  return result; // Propagate error
}
const content = result.value;
```

### 2. Use ensureDir for Robust Directory Creation

```typescript
// ❌ Bad - Multiple checks
const exists = await fs.exists("/path/to/dir");
if (!exists.success) return exists;
if (!exists.value) {
  const mkdir = await fs.mkdir("/path/to/dir", { recursive: true });
  if (!mkdir.success) return mkdir;
}

// ✅ Good - Single operation
const result = await fs.ensureDir("/path/to/dir");
if (!result.success) return result;
```

### 3. Atomic File Operations

Write to temporary file and rename for atomicity:

```typescript
async function writeFileAtomic(
  fs: FileSystem,
  path: string,
  content: string,
): Promise<Result<void>> {
  const tempPath = `${path}.tmp`;

  // Write to temp file
  const writeResult = await fs.writeFile(tempPath, content);
  if (!writeResult.success) {
    return writeResult;
  }

  // Copy to final location
  const copyResult = await fs.copy(tempPath, path, { overwrite: true });
  if (!copyResult.success) {
    // Clean up temp file
    await fs.delete(tempPath);
    return copyResult;
  }

  // Remove temp file
  return fs.delete(tempPath);
}
```

### 4. Batch Operations

Process multiple files efficiently:

```typescript
async function processFiles(
  fs: FileSystem,
  files: string[],
  processor: (content: string) => string,
): Promise<Result<number>> {
  let processed = 0;

  for (const file of files) {
    // Read file
    const readResult = await fs.readFile(file);
    if (!readResult.success) {
      console.error(`Failed to read ${file}: ${readResult.error.message}`);
      continue;
    }

    // Process content
    const newContent = processor(readResult.value);

    // Write back
    const writeResult = await fs.writeFile(file, newContent);
    if (!writeResult.success) {
      console.error(`Failed to write ${file}: ${writeResult.error.message}`);
      continue;
    }

    processed++;
  }

  return ok(processed);
}
```

### 5. Safe JSON Operations

Handle JSON parsing errors gracefully:

```typescript
async function readConfigWithDefaults<T>(
  fs: FileSystem,
  path: string,
  defaults: T,
): Promise<Result<T>> {
  const result = await fs.readJson<T>(path);

  if (!result.success) {
    if (result.error.code === "ENOENT") {
      // File doesn't exist, use defaults
      return ok(defaults);
    }

    if (result.error.code === "INVALID_JSON") {
      // Corrupted file, backup and use defaults
      await fs.copy(path, `${path}.backup`);
      await fs.writeJson(path, defaults, { spaces: 2 });
      return ok(defaults);
    }

    return result;
  }

  // Merge with defaults for missing fields
  return ok({ ...defaults, ...result.value });
}
```

## Real-World Examples

### Configuration Manager

```typescript
class ConfigManager {
  constructor(
    private fs: FileSystem,
    private configPath: string,
  ) {}

  async load<T>(schema: z.Schema<T>): Promise<Result<T>> {
    // Read file
    const readResult = await this.fs.readJson(this.configPath);
    if (!readResult.success) {
      if (readResult.error.code === "ENOENT") {
        return err(
          createError({
            code: "CONFIG_NOT_FOUND",
            message: `Configuration file not found: ${this.configPath}`,
            suggestion: 'Run "init" command to create a default configuration',
          }),
        );
      }
      return readResult;
    }

    // Validate with Zod
    const parseResult = schema.safeParse(readResult.value);
    if (!parseResult.success) {
      return err(
        createValidationError({
          message: "Invalid configuration format",
          details: parseResult.error.message,
        }),
      );
    }

    return ok(parseResult.data);
  }

  async save<T>(config: T): Promise<Result<void>> {
    // Ensure directory exists
    const dir = path.dirname(this.configPath);
    const ensureResult = await this.fs.ensureDir(dir);
    if (!ensureResult.success) {
      return ensureResult;
    }

    // Write with backup
    const backupPath = `${this.configPath}.backup`;
    const exists = await this.fs.exists(this.configPath);

    if (exists.success && exists.value) {
      // Backup existing file
      const backupResult = await this.fs.copy(this.configPath, backupPath);
      if (!backupResult.success) {
        return backupResult;
      }
    }

    // Write new config
    return this.fs.writeJson(this.configPath, config, { spaces: 2 });
  }
}
```

### File Watcher Pattern

```typescript
async function watchFile(
  fs: FileSystem,
  filePath: string,
  onChange: (content: string) => Promise<void>,
  interval = 1000,
): Promise<() => void> {
  let lastContent: string | null = null;
  let watching = true;

  const check = async () => {
    if (!watching) return;

    const result = await fs.readFile(filePath);
    if (result.success && result.value !== lastContent) {
      lastContent = result.value;
      await onChange(result.value);
    }

    if (watching) {
      setTimeout(check, interval);
    }
  };

  // Start watching
  check();

  // Return stop function
  return () => {
    watching = false;
  };
}

// Usage
const stopWatching = await watchFile(
  fs,
  "/config/app.json",
  async (content) => {
    console.log("Config changed:", content);
    await reloadConfig(content);
  },
);

// Later...
stopWatching();
```

### Directory Tree Walker

```typescript
interface FileEntry {
  path: string;
  type: "file" | "directory";
  size?: number;
}

async function* walkDirectory(
  fs: FileSystem,
  dir: string,
): AsyncGenerator<Result<FileEntry>> {
  const result = await fs.readdir(dir);
  if (!result.success) {
    yield err(result.error);
    return;
  }

  for (const entry of result.value) {
    const fullPath = path.join(dir, entry);
    const statsResult = await fs.stat(fullPath);

    if (!statsResult.success) {
      yield err(statsResult.error);
      continue;
    }

    const stats = statsResult.value;
    yield ok({
      path: fullPath,
      type: stats.isDirectory ? "directory" : "file",
      size: stats.isFile ? stats.size : undefined,
    });

    if (stats.isDirectory) {
      yield* walkDirectory(fs, fullPath);
    }
  }
}

// Usage
for await (const result of walkDirectory(fs, "/src")) {
  if (result.success) {
    const entry = result.value;
    if (entry.type === "file" && entry.path.endsWith(".ts")) {
      console.log(`TypeScript file: ${entry.path} (${entry.size} bytes)`);
    }
  }
}
```

## Custom Adapters

Create custom file system adapters for special use cases:

```typescript
interface FileSystemAdapter {
  readFile(path: string, encoding?: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: MkdirOptions): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<FileStats>;
  copyFile(src: string, dest: string): Promise<void>;
  rm(
    path: string,
    options?: { recursive?: boolean; force?: boolean },
  ): Promise<void>;
}

// Example: S3 adapter
class S3Adapter implements FileSystemAdapter {
  constructor(
    private bucket: string,
    private s3Client: S3Client,
  ) {}

  async readFile(path: string): Promise<string> {
    const response = await this.s3Client.getObject({
      Bucket: this.bucket,
      Key: path,
    });
    return response.Body.toString();
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this.s3Client.putObject({
      Bucket: this.bucket,
      Key: path,
      Body: content,
    });
  }

  // ... implement other methods
}

// Use custom adapter
const s3fs = createFileSystem(new S3Adapter("my-bucket", s3Client));
```

## Testing Utilities

Helper functions for testing with FileSystem:

```typescript
// Create test file structure
function createTestFiles(files: Record<string, string>): FileSystem {
  return createMemoryFileSystem(files);
}

// Assert file exists with content
async function assertFileContent(
  fs: FileSystem,
  path: string,
  expectedContent: string,
): Promise<void> {
  const result = await fs.readFile(path);
  expect(result.success).toBe(true);
  expect(result.value).toBe(expectedContent);
}

// Assert directory structure
async function assertDirectoryStructure(
  fs: FileSystem,
  dir: string,
  expected: string[],
): Promise<void> {
  const result = await fs.readdir(dir);
  expect(result.success).toBe(true);
  expect(result.value.sort()).toEqual(expected.sort());
}

// Example test
it("should process template files", async () => {
  const fs = createTestFiles({
    "/templates/component.tsx": "export function {{name}}() {}",
    "/templates/test.tsx": 'describe("{{name}}", () => {})',
  });

  await processTemplates(fs, { name: "Button" });

  await assertFileContent(
    fs,
    "/output/component.tsx",
    "export function Button() {}",
  );

  await assertFileContent(
    fs,
    "/output/test.tsx",
    'describe("Button", () => {})',
  );
});
```
