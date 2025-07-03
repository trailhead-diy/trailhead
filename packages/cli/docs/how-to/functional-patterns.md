---
type: how-to
title: "How to Apply Functional Programming Patterns"
description: "Implement functional programming patterns in your CLI applications for better maintainability and error handling"
prerequisites:
  - "@esteban-url/trailhead-cli installed"
  - "Basic TypeScript knowledge"
  - "Understanding of Result types"
related:
  - "/docs/reference/api/core"
  - "/docs/explanation/architecture"
---

# How to Apply Functional Programming Patterns

This guide shows you how to implement key functional programming patterns in your @esteban-url/trailhead-cli applications to improve code maintainability, testability, and error handling.

## Prerequisites

Before starting, ensure you have:

- @esteban-url/trailhead-cli installed in your project
- Basic understanding of TypeScript
- Familiarity with Result types (`Ok` and `Err`)
- Understanding of async/await patterns

## Solution

### Method 1: Core Functional Concepts

### Immutability

Always return new data instead of modifying existing:

```typescript
// ❌ Mutation
const config = { port: 3000 };
config.port = 4000;

// ✅ Immutable
const config = { port: 3000 };
const updated = { ...config, port: 4000 };
```

### Pure Functions

Functions that depend only on inputs and have no side effects:

```typescript
// ✅ Pure - same input always gives same output
const formatName = (first: string, last: string): string => `${first} ${last}`;

// ❌ Impure - depends on external state
let count = 0;
const getId = (): number => ++count;
```

### Method 2: Result Type Patterns

### Basic Error Handling

```typescript
import { Ok, Err } from "@esteban-url/trailhead-cli";

async function readConfig(path: string): Promise<Result<Config>> {
  const result = await fs.readFile(path);
  if (!result.success) {
    return result; // Propagate error
  }

  try {
    const config = JSON.parse(result.value);
    return Ok(config);
  } catch (error) {
    return Err(new Error(`Invalid JSON: ${error.message}`));
  }
}
```

### Chaining Operations

Use `map` and `chain` for Result transformations:

```typescript
import { map, chain } from "@esteban-url/trailhead-cli/core";

// Transform successful values
const doubled = map(Ok(21), (x) => x * 2); // Ok(42)

// Chain operations that return Results
const result = await chain(
  readFile("config.json"),
  (content) => parseJSON(content),
  (config) => validateConfig(config),
);
```

### Early Returns

Exit early on errors:

```typescript
async function processFile(path: string): Promise<Result<void>> {
  // Read file
  const readResult = await fs.readFile(path);
  if (!readResult.success) return readResult;

  // Parse content
  const parseResult = parseContent(readResult.value);
  if (!parseResult.success) return parseResult;

  // Save processed content
  return fs.writeFile(path + ".processed", parseResult.value);
}
```

## Common Variations

### Variation 1: Composition Patterns

### Function Composition

Build complex operations from simple functions:

```typescript
const compose =
  <A, B, C>(f: (b: B) => C, g: (a: A) => B) =>
  (a: A): C =>
    f(g(a));

// Example: Format and validate
const trim = (s: string) => s.trim();
const lowercase = (s: string) => s.toLowerCase();
const normalizeEmail = compose(lowercase, trim);

normalizeEmail("  USER@EXAMPLE.COM  "); // "user@example.com"
```

### Pipeline Pattern

Process data through a series of transformations:

```typescript
const pipeline =
  <T>(...fns: Array<(value: T) => T>) =>
  (initial: T): T =>
    fns.reduce((value, fn) => fn(value), initial);

// Example: Text processing pipeline
const processText = pipeline(
  (s: string) => s.trim(),
  (s: string) => s.toLowerCase(),
  (s: string) => s.replace(/\s+/g, "-"),
);

processText("  Hello World  "); // "hello-world"
```

### Variation 2: Higher-Order Functions

### Function Factories

Create specialized functions:

```typescript
// Validator factory
const createRangeValidator = (min: number, max: number) => {
  return (value: number): Result<number> => {
    if (value < min || value > max) {
      return Err(new Error(`Value must be between ${min} and ${max}`));
    }
    return Ok(value);
  };
};

const validatePort = createRangeValidator(1, 65535);
const validatePercentage = createRangeValidator(0, 100);
```

### Middleware Pattern

Wrap functions with additional behavior:

```typescript
// Logging middleware
const withLogging = <T, R>(
  fn: (arg: T) => Promise<Result<R>>,
  logger: Logger,
) => {
  return async (arg: T): Promise<Result<R>> => {
    logger.info(`Calling with: ${JSON.stringify(arg)}`);
    const result = await fn(arg);
    if (result.success) {
      logger.success("Operation succeeded");
    } else {
      logger.error(`Operation failed: ${result.error.message}`);
    }
    return result;
  };
};

// Usage
const processWithLogging = withLogging(processData, logger);
```

### Variation 3: Partial Application

Create specialized functions by fixing some arguments:

```typescript
// Generic file reader
const readFileWithEncoding = (encoding: string) => (path: string) =>
  fs.readFile(path, encoding);

// Specialized readers
const readUTF8 = readFileWithEncoding("utf8");
const readUTF16 = readFileWithEncoding("utf16le");

// Usage
const content = await readUTF8("config.json");
```

### Variation 4: Array Operations with Results

### Processing Arrays

```typescript
// Process array of Results
async function processFiles(paths: string[]): Promise<Result<string[]>> {
  const results = await Promise.all(paths.map((path) => fs.readFile(path)));

  // Check if all succeeded
  const errors = results.filter((r) => !r.success);
  if (errors.length > 0) {
    return Err(new Error(`Failed to read ${errors.length} files`));
  }

  // Extract values
  const contents = results.filter((r) => r.success).map((r) => r.value);

  return Ok(contents);
}
```

### Collecting Results

```typescript
// Collect Results into Result of array
function collectResults<T>(results: Result<T>[]): Result<T[]> {
  const values: T[] = [];

  for (const result of results) {
    if (!result.success) {
      return result;
    }
    values.push(result.value);
  }

  return Ok(values);
}
```

### Variation 5: Memoization

Cache expensive computations:

```typescript
const memoize = <T, R>(fn: (arg: T) => R): ((arg: T) => R) => {
  const cache = new Map<T, R>();

  return (arg: T): R => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }

    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
};

// Example: Expensive computation
const fibonacci = memoize((n: number): number => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});
```

## Common Issues

### Issue: Mixing imperative and functional styles

**Symptoms**: Code that's hard to test, inconsistent error handling, side effects scattered throughout

**Solution**: Use consistent functional patterns throughout your codebase:

```typescript
// ❌ Mixed styles
function processData(data: any[]) {
  let results = [];
  for (let item of data) {
    try {
      results.push(transform(item));
    } catch (error) {
      console.error(error); // Side effect
      return null; // Inconsistent return
    }
  }
  return results;
}

// ✅ Consistent functional style
function processData(data: any[]): Result<TransformedData[]> {
  const results = data.map((item) => transform(item));
  return collectResults(results);
}
```

### Issue: Not leveraging Result types properly

**Cause**: Using try/catch instead of Result types for error handling

**Solution**: Always use Result types for operations that can fail:

```typescript
// ❌ Exception-based
try {
  const data = await processFile(path);
  return data;
} catch (error) {
  throw new Error(`Processing failed: ${error.message}`);
}

// ✅ Result-based
const result = await processFile(path);
if (!result.success) {
  return Err(new Error(`Processing failed: ${result.error.message}`));
}
return Ok(result.value);
```

## Complete Example

Here's a complete CLI command using functional patterns:

```typescript
import { Ok, Err, createCLI } from "@esteban-url/trailhead-cli";
import { createCommand } from "@esteban-url/trailhead-cli/command";
import type { CommandContext } from "@esteban-url/trailhead-cli/command";

// Pure function for data transformation
const normalizeInput = (input: string): string => input.trim().toLowerCase();

// Pure function with Result type
const validateInput = (input: string): Result<string> => {
  if (input.length === 0) {
    return Err(new Error("Input cannot be empty"));
  }
  if (input.length > 100) {
    return Err(new Error("Input too long"));
  }
  return Ok(input);
};

// Higher-order function for retries
const withRetry =
  <T>(fn: () => Promise<Result<T>>, maxAttempts = 3) =>
  async (): Promise<Result<T>> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await fn();
      if (result.success || attempt === maxAttempts) {
        return result;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
    return Err(new Error("Max attempts reached"));
  };

// Functional pipeline
const processInput = pipeline(
  normalizeInput,
  validateInput,
  (result: Result<string>) => result, // Pass through Result
);

// Command using functional patterns
const processCommand = createCommand({
  name: "process",
  description: "Process input using functional patterns",
  options: [
    { name: "input", type: "string", required: true },
    { name: "retry", type: "boolean", default: false },
  ],
  async action(options, context: CommandContext) {
    // Pure function composition
    const inputResult = processInput(options.input);
    if (!inputResult.success) {
      return inputResult;
    }

    // Higher-order function usage
    const processData = options.retry
      ? withRetry(() => processDataWithAPI(inputResult.value))
      : () => processDataWithAPI(inputResult.value);

    const result = await processData();
    if (!result.success) {
      return result;
    }

    context.logger.success(`Processed: ${result.value}`);
    return Ok(undefined);
  },
});

// Helper function
function pipeline<T>(...fns: Array<(value: any) => any>) {
  return (initial: T) => fns.reduce((value, fn) => fn(value), initial);
}

async function processDataWithAPI(input: string): Promise<Result<string>> {
  // Simulate API call
  return Ok(`Processed: ${input}`);
}
```

## Testing

Test your functional patterns:

```bash
# Run your command
node dist/cli.js process --input "  HELLO WORLD  " --retry
```

Expected output:

```
✓ Processed: Processed: hello world
```

## Related Tasks

- **[Error Handling](./error-handling.md)**: Handle errors functionally with Result types
- **[Testing CLI Apps](./testing-cli-apps.md)**: Test functional code effectively
- **[Performance Optimization](./optimization-guide.md)**: Optimize functional patterns

## Reference

- [Core API Reference](../reference/api/core.md) - Result type utilities
- [Command API Reference](../reference/api/command.md) - Command creation
- [TypeScript Configuration](../reference/typescript-config.md) - TS setup for functional patterns

---

**See also**: [Architecture Explanation](../explanation/architecture.md) for deeper understanding of why functional programming improves CLI applications
