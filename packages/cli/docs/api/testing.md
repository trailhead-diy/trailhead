# Testing Module API

The testing module provides utilities for testing CLI applications built with @trailhead/cli.

## Import

```typescript
import {
  createTestContext,
  mockFileSystem,
  mockLogger,
  mockPrompts,
  expectResult,
  expectError,
  runCommand,
} from "@trailhead/cli/testing";
```

## Test Context

### createTestContext

Creates a test context with mocked dependencies.

```typescript
const context = createTestContext({
  filesystem: mockFileSystem({
    "config.json": '{"name": "test"}',
    "data.txt": "Hello, world!",
  }),
  logger: mockLogger(),
  projectRoot: "/test/project",
});

// Use in tests
const result = await myCommand.action(options, context);
```

#### Options

- `filesystem` (FileSystem) - Mock filesystem instance
- `logger` (Logger) - Mock logger instance
- `projectRoot` (string) - Project root directory
- `verbose` (boolean) - Enable verbose logging

### createTestContextWithFiles

Convenience function that creates a test context with files.

```typescript
const context = createTestContextWithFiles({
  "package.json": JSON.stringify({ name: "test-app" }),
  "src/index.ts": 'console.log("Hello")',
  ".gitignore": "node_modules",
});
```

## Mock Utilities

### mockFileSystem

Creates an in-memory filesystem for testing.

```typescript
const fs = mockFileSystem({
  "config.json": '{"port": 3000}',
  "src/app.ts": "export const app = {}",
  "tests/app.test.ts": 'test("app", () => {})',
});

// Use filesystem
const result = await fs.readFile("config.json");
if (result.success) {
  console.log(result.value); // {"port": 3000}
}

// Test helpers
fs.getFiles(); // Map of all files
fs.getDirectories(); // Set of all directories
fs.clear(); // Clear all files
```

#### Methods

All standard FileSystem methods plus:

- `getFiles()` - Get all files as a Map
- `getDirectories()` - Get all directories as a Set
- `clear()` - Clear all files and directories

### mockLogger

Creates a logger that captures all log messages.

```typescript
const logger = mockLogger();

// Use logger
logger.info("Processing...");
logger.success("Done!");
logger.error("Failed");

// Check logs
expect(logger.logs).toEqual([
  { level: "info", message: "Processing..." },
  { level: "success", message: "Done!" },
  { level: "error", message: "Failed" },
]);

// Check specific log levels
const errors = logger.logs.filter((l) => l.level === "error");
expect(errors).toHaveLength(1);
```

#### Properties

- `logs` - Array of all logged messages with level and message

### mockPrompts

Creates mock prompt responses for testing interactive commands.

```typescript
const prompts = mockPrompts({
  "What is your name?": "Alice",
  "Choose a color": "blue",
  "Continue?": true,
  "Select features": ["typescript", "eslint"],
});

// In your command
const name = await prompts.prompt({ message: "What is your name?" });
// Returns: 'Alice'

const color = await prompts.select({ message: "Choose a color" });
// Returns: 'blue'
```

## Assertion Helpers

### expectResult

Assert that a Result is successful and optionally check its value.

```typescript
import { expectResult } from "@trailhead/cli/testing";

// Basic usage
const result = await processFile("data.txt");
expectResult(result); // Throws if not successful

// Check value
expectResult(result, { name: "test", version: "1.0.0" });

// With custom matcher
expectResult(result, (value) => {
  expect(value.items).toHaveLength(3);
  expect(value.total).toBeGreaterThan(0);
});
```

### expectError

Assert that a Result is an error and optionally check the error.

```typescript
import { expectError } from "@trailhead/cli/testing";

// Basic usage
const result = await processInvalidFile();
expectError(result); // Throws if successful

// Check error code
expectError(result, "FILE_NOT_FOUND");

// Check error properties
expectError(result, (error) => {
  expect(error.code).toBe("VALIDATION_FAILED");
  expect(error.message).toContain("Invalid format");
});
```

## Command Testing

### runCommand

Test runner for commands with automatic context setup.

```typescript
const runner = new CommandTestRunner(myCommand);

// Run with options
const result = await runner.run({
  options: { name: "test", force: true },
  files: {
    "config.json": '{"version": "1.0.0"}',
  },
  prompts: {
    "Confirm?": true,
  },
});

// Check result
expectResult(result);

// Check side effects
const files = runner.getFiles();
expect(files.get("output.json")).toBeDefined();

const logs = runner.getLogs();
expect(logs).toContainEqual({
  level: "success",
  message: "Operation completed",
});
```

## Testing Patterns

### Testing Commands

```typescript
import { describe, it, expect } from "vitest";
import {
  createTestContext,
  mockFileSystem,
  expectResult,
} from "@trailhead/cli/testing";
import { myCommand } from "../src/commands/my-command";

describe("myCommand", () => {
  it("should process files successfully", async () => {
    // Arrange
    const fs = mockFileSystem({
      "input.txt": "Hello, world!",
      "config.json": '{"uppercase": true}',
    });
    const context = createTestContext({ filesystem: fs });

    // Act
    const result = await myCommand.action(
      { input: "input.txt", output: "output.txt" },
      context,
    );

    // Assert
    expectResult(result);

    const outputResult = await fs.readFile("output.txt");
    expectResult(outputResult, "HELLO, WORLD!");
  });

  it("should handle missing files", async () => {
    const context = createTestContext();

    const result = await myCommand.action({ input: "missing.txt" }, context);

    expectError(result, "FILE_NOT_FOUND");
  });
});
```

### Testing Interactive Commands

```typescript
it("should collect user input", async () => {
  const prompts = mockPrompts({
    "Project name?": "my-app",
    "Use TypeScript?": true,
    "Select features": ["eslint", "prettier"],
  });

  const context = createTestContext();

  // Mock the prompt module
  vi.mock("@trailhead/cli/prompts", () => prompts);

  const result = await initCommand.action({}, context);

  expectResult(result);

  // Verify created files
  const packageJson = await context.fs.readJson("package.json");
  expectResult(
    packageJson,
    expect.objectContaining({
      name: "my-app",
      devDependencies: expect.objectContaining({
        typescript: expect.any(String),
        eslint: expect.any(String),
        prettier: expect.any(String),
      }),
    }),
  );
});
```

### Testing Error Scenarios

```typescript
it("should handle validation errors", async () => {
  const context = createTestContext();

  const result = await createUserCommand.action(
    { username: "a" }, // Too short
    context,
  );

  expectError(result, (error) => {
    expect(error.code).toBe("VALIDATION_FAILED");
    expect(error.message).toContain("at least 3 characters");
  });

  // Check that no files were created
  const files = context.fs.getFiles();
  expect(files.size).toBe(0);
});
```

### Testing Async Operations

```typescript
it("should handle concurrent operations", async () => {
  const fs = mockFileSystem({
    "file1.txt": "content1",
    "file2.txt": "content2",
    "file3.txt": "content3",
  });

  const context = createTestContext({ filesystem: fs });

  const result = await batchProcessCommand.action(
    { pattern: "*.txt" },
    context,
  );

  expectResult(result, { processed: 3, failed: 0 });

  // Verify all files were processed
  for (let i = 1; i <= 3; i++) {
    const processed = await fs.readFile(`file${i}.processed`);
    expectResult(processed);
  }
});
```

### Testing Configuration

```typescript
it("should load configuration", async () => {
  const fs = mockFileSystem({
    ".myapprc": JSON.stringify({
      theme: "dark",
      plugins: ["auto-save"],
    }),
  });

  const context = createTestContext({ filesystem: fs });

  const configResult = await loadConfig(context);
  expectResult(configResult, {
    theme: "dark",
    plugins: ["auto-save"],
  });
});
```

### Testing Side Effects

```typescript
it("should log progress messages", async () => {
  const logger = mockLogger();
  const context = createTestContext({ logger });

  await processCommand.action({ verbose: true }, context);

  // Check log messages
  expect(logger.logs).toContainEqual({
    level: "info",
    message: "Starting process...",
  });

  expect(logger.logs).toContainEqual({
    level: "step",
    message: "Processing files",
  });

  expect(logger.logs).toContainEqual({
    level: "success",
    message: "Process completed",
  });

  // Check no errors
  const errors = logger.logs.filter((l) => l.level === "error");
  expect(errors).toHaveLength(0);
});
```

## Testing Best Practices

### 1. Test Both Success and Failure Paths

```typescript
describe("parseConfig", () => {
  it("should parse valid config", async () => {
    const fs = mockFileSystem({
      "config.json": '{"valid": true}',
    });

    const result = await parseConfig("config.json", fs);
    expectResult(result, { valid: true });
  });

  it("should handle invalid JSON", async () => {
    const fs = mockFileSystem({
      "config.json": "invalid json",
    });

    const result = await parseConfig("config.json", fs);
    expectError(result, "PARSE_ERROR");
  });

  it("should handle missing file", async () => {
    const fs = mockFileSystem();

    const result = await parseConfig("config.json", fs);
    expectError(result, "FILE_NOT_FOUND");
  });
});
```

### 2. Test Edge Cases

```typescript
it("should handle empty input", async () => {
  const result = await processItems([]);
  expectResult(result, { processed: 0, skipped: 0 });
});

it("should handle special characters", async () => {
  const fs = mockFileSystem({
    "file with spaces.txt": "content",
    "special-@#$-chars.txt": "content",
  });

  const result = await processFiles("*.txt", fs);
  expectResult(result, { count: 2 });
});
```

### 3. Use Descriptive Test Names

```typescript
describe("FileProcessor", () => {
  describe("when processing markdown files", () => {
    it("should convert headings to uppercase", async () => {
      // Test implementation
    });

    it("should preserve code blocks unchanged", async () => {
      // Test implementation
    });

    it("should handle nested directories", async () => {
      // Test implementation
    });
  });
});
```

### 4. Test Isolation

```typescript
let context: TestContext;

beforeEach(() => {
  // Fresh context for each test
  context = createTestContext();
});

afterEach(() => {
  // Clean up if needed
  context.fs.clear();
});
```

### 5. Test Real-World Scenarios

```typescript
it("should handle real-world project structure", async () => {
  const fs = mockFileSystem({
    "package.json": JSON.stringify({
      name: "my-app",
      dependencies: { react: "^18.0.0" },
    }),
    "src/index.ts": 'export * from "./app"',
    "src/app.ts": "export const app = {}",
    "src/components/Button.tsx": "export const Button = () => {}",
    ".gitignore": "node_modules\ndist",
    "README.md": "# My App",
  });

  const result = await analyzeProject(".", fs);
  expectResult(
    result,
    expect.objectContaining({
      type: "react-typescript",
      entryPoint: "src/index.ts",
      componentCount: 1,
    }),
  );
});
```

## Summary

The testing module provides:

- In-memory filesystem for isolated testing
- Mock logger with message capture
- Mock prompts for interactive testing
- Result assertion helpers
- Command test runner
- Full TypeScript support

Use these utilities to write comprehensive tests for your CLI applications.
