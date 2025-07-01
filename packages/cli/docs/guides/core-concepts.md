# Core Concepts

Understanding the fundamental principles behind @trailhead/cli will help you build better CLI applications and make the most of the framework's features.

## Functional Programming Foundation

@trailhead/cli is built on functional programming principles. This means:

### Pure Functions

Functions that always return the same output for the same input and have no side effects.

```typescript
// Pure function
function add(a: number, b: number): number {
  return a + b;
}

// Not pure - has side effects
function saveToFile(data: string): void {
  fs.writeFileSync("file.txt", data); // Side effect!
}
```

### Immutability

Data is never modified in place. Operations return new data structures.

```typescript
// Immutable update
const config = { host: "localhost", port: 3000 };
const updated = { ...config, port: 4000 };

// Original unchanged
console.log(config.port); // 3000
console.log(updated.port); // 4000
```

### Function Composition

Building complex behavior by combining simple functions.

```typescript
import { pipe } from "@trailhead/cli/core";

const trim = (s: string) => s.trim();
const lowercase = (s: string) => s.toLowerCase();
const sanitize = pipe(trim, lowercase);

sanitize("  HELLO  "); // 'hello'
```

## Result Type Pattern

The most important concept in @trailhead/cli is the Result type. It replaces exceptions with explicit error handling.

### Why Results?

Traditional error handling with try-catch:

```typescript
try {
  const data = JSON.parse(text);
  const processed = processData(data);
  return processed;
} catch (error) {
  // Which function threw? What type is error?
  console.error("Something failed:", error);
  throw error;
}
```

With Result types:

```typescript
const parseResult = parseJson(text);
if (!parseResult.success) {
  return parseResult; // Propagate typed error
}

const processResult = processData(parseResult.value);
if (!processResult.success) {
  return processResult; // Different error type
}

return processResult;
```

### Result Type Definition

```typescript
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };
```

### Creating Results

```typescript
import { ok, err } from "@trailhead/cli/core";

// Success
const good = ok(42);
// { success: true, value: 42 }

// Failure
const bad = err(new Error("Not found"));
// { success: false, error: Error }
```

### Working with Results

```typescript
import { isOk, isErr } from "@trailhead/cli/core";

function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return err(new Error("Division by zero"));
  }
  return ok(a / b);
}

const result = divide(10, 2);

// Type narrowing
if (isOk(result)) {
  console.log(result.value); // 5
} else {
  console.error(result.error.message);
}
```

## Dependency Injection

All dependencies are passed explicitly through context objects. This makes code testable and predictable.

### Command Context

```typescript
interface CommandContext {
  projectRoot: string;
  logger: Logger;
  fs: FileSystem;
  config: Config;
  verbose: boolean;
}
```

### Using Context

```typescript
const myCommand = createCommand({
  name: "process",
  action: async (options, context) => {
    // All I/O through context
    const result = await context.fs.readFile("data.json");
    if (!result.success) {
      context.logger.error(result.error.message);
      return result;
    }

    context.logger.success("Processed successfully");
    return ok(undefined);
  },
});
```

### Testing with Mocked Context

```typescript
import { createTestContext, mockFileSystem } from "@trailhead/cli/testing";

it("processes file", async () => {
  const fs = mockFileSystem({
    "data.json": '{"name": "test"}',
  });

  const context = createTestContext({ filesystem: fs });
  const result = await myCommand.action({}, context);

  expect(result.success).toBe(true);
});
```

## Command Architecture

Commands are the building blocks of CLI applications.

### Command Structure

```typescript
interface Command<T> {
  name: string;
  description: string;
  options?: CommandOption[];
  arguments?: CommandArgument[];
  subcommands?: Command[];
  action?: (options: T, context: CommandContext) => Promise<Result>;
}
```

### Command Lifecycle

1. **Parse** - Arguments and options are parsed
2. **Validate** - Input validation runs
3. **Execute** - Action function is called
4. **Handle Result** - Success or error is handled

```typescript
const command = createCommand({
  name: "deploy",
  validation: async (options) => {
    if (!options.env) {
      return err(new Error("Environment required"));
    }
    return ok(options);
  },
  action: async (options, context) => {
    // Validation has already passed
    return deploy(options.env, context);
  },
});
```

## FileSystem Abstraction

The FileSystem abstraction enables testing and provides consistent error handling.

### Interface

```typescript
interface FileSystem {
  readFile(path: string): Promise<Result<string>>;
  writeFile(path: string, content: string): Promise<Result<void>>;
  exists(path: string): Promise<Result<boolean>>;
  mkdir(path: string): Promise<Result<void>>;
  // ... more methods
}
```

### Usage

```typescript
const processFile = async (path: string, fs: FileSystem) => {
  // Check existence
  const existsResult = await fs.exists(path);
  if (!existsResult.success) return existsResult;
  if (!existsResult.value) {
    return err(new Error(`File not found: ${path}`));
  }

  // Read file
  const readResult = await fs.readFile(path);
  if (!readResult.success) return readResult;

  // Process content
  const processed = transform(readResult.value);

  // Write result
  return fs.writeFile(`${path}.processed`, processed);
};
```

## Configuration Management

Type-safe configuration with validation.

### Defining Config Schema

```typescript
import { defineConfig } from "@trailhead/cli/config";
import { z } from "zod";

const schema = z.object({
  api: z.object({
    url: z.string().url(),
    timeout: z.number().default(30000),
  }),
  features: z.object({
    debug: z.boolean().default(false),
  }),
});

const config = defineConfig(schema);
```

### Loading Configuration

```typescript
const loadResult = await config.load();
if (!loadResult.success) {
  console.error("Invalid config:", loadResult.error);
  return loadResult;
}

const { api, features } = loadResult.value;
```

## Validation Pipelines

Composable validation for complex requirements.

### Creating Validators

```typescript
import { createValidationPipeline, createRule } from "@trailhead/cli/core";

const validateUsername = createValidationPipeline([
  createRule(
    "required",
    (value: string) => value.length > 0 || "Username required",
  ),
  createRule(
    "length",
    (value: string) => value.length >= 3 || "Minimum 3 characters",
  ),
  createRule(
    "format",
    (value: string) =>
      /^[a-zA-Z0-9_]+$/.test(value) || "Alphanumeric and underscore only",
  ),
]);
```

### Using Validators

```typescript
const result = validateUsername("ab");
if (!result.success) {
  console.error(result.error.message); // "Minimum 3 characters"
}
```

## Error Handling Patterns

### Error Creation

```typescript
import { createError } from "@trailhead/cli/core";

const error = createError("FILE_NOT_FOUND", "Config file missing", {
  path: "./config.json",
  suggestion: 'Run "init" command first',
});
```

### Error Propagation

```typescript
async function loadUserConfig(context: CommandContext) {
  const configResult = await context.fs.readFile("./config.json");
  if (!configResult.success) {
    // Add context while propagating
    return err(
      createError("CONFIG_LOAD_FAILED", "Failed to load user configuration", {
        cause: configResult.error,
      }),
    );
  }

  const parseResult = parseJson(configResult.value);
  if (!parseResult.success) {
    return parseResult; // Propagate as-is
  }

  return ok(parseResult.value);
}
```

## Composition Patterns

### Combining Commands

```typescript
const gitCommand = createCommand({
  name: "git",
  description: "Git operations",
  subcommands: [
    createCommand({ name: "status", action: gitStatus }),
    createCommand({ name: "commit", action: gitCommit }),
    createCommand({ name: "push", action: gitPush }),
  ],
});
```

### Middleware Pattern

```typescript
const withAuth = (command: Command) => ({
  ...command,
  action: async (options, context) => {
    const authResult = await authenticate(context);
    if (!authResult.success) return authResult;

    return command.action(options, {
      ...context,
      user: authResult.value,
    });
  },
});

const protectedCommand = withAuth(originalCommand);
```

## Best Practices

### 1. Always Use Results

```typescript
// Good
function parseNumber(s: string): Result<number> {
  const n = Number(s);
  if (isNaN(n)) {
    return err(new Error("Invalid number"));
  }
  return ok(n);
}

// Avoid
function parseNumber(s: string): number {
  const n = Number(s);
  if (isNaN(n)) {
    throw new Error("Invalid number"); // No!
  }
  return n;
}
```

### 2. Fail Fast, Return Early

```typescript
async function process(path: string, context: CommandContext) {
  const existsResult = await context.fs.exists(path);
  if (!existsResult.success) return existsResult;
  if (!existsResult.value) {
    return err(new Error("File not found"));
  }

  const readResult = await context.fs.readFile(path);
  if (!readResult.success) return readResult;

  // Continue processing...
}
```

### 3. Provide Rich Errors

```typescript
return err(
  createError("VALIDATION_FAILED", "Invalid configuration file", {
    path: configPath,
    errors: validationErrors,
    suggestion: "Check the configuration documentation",
  }),
);
```

### 4. Keep Functions Pure

```typescript
// Pure - testable
const formatUser = (user: User): string => `${user.firstName} ${user.lastName}`;

// Impure - hard to test
const formatUser = (userId: string): string => {
  const user = database.getUser(userId); // Side effect!
  return `${user.firstName} ${user.lastName}`;
};
```

## Summary

The core concepts of @trailhead/cli work together to create a robust foundation:

- **Result types** provide explicit error handling
- **Pure functions** ensure predictability
- **Dependency injection** enables testing
- **Composition** builds complexity from simplicity

By following these patterns, you'll create CLI applications that are reliable, testable, and maintainable.
