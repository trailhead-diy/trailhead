# High-ROI Effect.ts Patterns for @esteban-url/trailhead-cli Framework

## Overview

This document outlines functional programming patterns inspired by Effect.ts that could enhance @esteban-url/trailhead-cli without the complexity and bundle size overhead of the full Effect.ts library. These patterns maintain the framework's simplicity while adding powerful capabilities.

## 1. Tagged Errors with Pattern Matching

### Current Implementation

```typescript
interface CLIError {
  code: string;
  message: string;
  details?: string;
}
```

### Enhanced Pattern

```typescript
// Tagged error types for better discrimination
type FileError = {
  _tag: 'FileError';
  path: string;
  operation: string;
  cause?: Error;
};
type ValidationError = {
  _tag: 'ValidationError';
  field: string;
  reason: string;
};
type NetworkError = { _tag: 'NetworkError'; url: string; status?: number };

type AppError = FileError | ValidationError | NetworkError;

// Pattern matching helper
function matchError<R>(
  error: AppError,
  patterns: {
    FileError: (e: FileError) => R;
    ValidationError: (e: ValidationError) => R;
    NetworkError: (e: NetworkError) => R;
  }
): R {
  return patterns[error._tag](error as any);
}

// Usage
const result = matchError(error, {
  FileError: e => `File operation failed: ${e.operation} on ${e.path}`,
  ValidationError: e => `Validation failed for ${e.field}: ${e.reason}`,
  NetworkError: e => `Network request failed: ${e.url} (${e.status || 'unknown'})`,
});
```

### Benefits

- Type-safe error handling
- Exhaustive pattern matching
- Better error context
- No runtime overhead

## 2. Pipe Operator for Composition

### Implementation

```typescript
// Simple pipe function
export function pipe<A>(a: A): A;
export function pipe<A, B>(a: A, ab: (a: A) => B): B;
export function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
export function pipe<A, B, C, D>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
export function pipe<A, B, C, D, E>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E
): E;
export function pipe(a: any, ...fns: Function[]): any {
  return fns.reduce((acc, fn) => fn(acc), a);
}

// Result-aware pipe helpers
export const tapOk =
  <T>(fn: (value: T) => void) =>
  (result: Result<T>): Result<T> => {
    if (result.success) fn(result.value);
    return result;
  };

export const tapErr =
  <E>(fn: (error: E) => void) =>
  (result: Result<any, E>): Result<any, E> => {
    if (!result.success) fn(result.error);
    return result;
  };

// Usage
const result = pipe(
  readFile(path),
  flatMap(content => parseJSON(content)),
  map(data => transform(data)),
  tapOk(data => logger.info('Transformed successfully')),
  tapErr(error => logger.error('Processing failed'))
);
```

### Benefits

- Clean composition syntax
- Avoids nested callbacks
- Type inference works well
- Minimal implementation

## 3. Service Pattern for Dependency Injection

### Implementation

```typescript
// Service container
interface Services {
  logger: Logger;
  fs: FileSystem;
  config: Configuration;
}

// Service accessors
const ServiceContext = Symbol('ServiceContext');

export function createServices(services: Services): Services {
  return services;
}

export function withServices<T>(services: Services, fn: (services: Services) => T): T {
  return fn(services);
}

// Functional dependency injection
export function inject<T, R>(
  fn: (services: Services) => (args: T) => R
): (services: Services) => (args: T) => R {
  return services => fn(services);
}

// Usage
const processFile = inject(services => async (path: string) => {
  const { fs, logger } = services;

  const content = await fs.readFile(path);
  logger.info(`Read ${content.length} bytes`);

  return content;
});

// Run with services
const services = createServices({ logger, fs, config });
const result = await processFile(services)('/path/to/file');
```

### Benefits

- Explicit dependencies
- Easy testing with mock services
- Type-safe service access
- Functional approach

## 4. Structured Concurrency Patterns

### Implementation

```typescript
// Concurrent execution with proper error handling
export async function parallel<T>(tasks: Array<() => Promise<Result<T>>>): Promise<Result<T[]>> {
  const results = await Promise.all(tasks.map(task => task()));

  const errors = results.filter(r => !r.success);
  if (errors.length > 0) {
    return Err({
      code: 'PARALLEL_EXECUTION_ERROR',
      message: 'One or more tasks failed',
      errors: errors.map(e => e.error),
    });
  }

  return Ok(results.map(r => r.value));
}

// Race with cancellation
export async function race<T>(tasks: Array<() => Promise<Result<T>>>): Promise<Result<T>> {
  const controllers = tasks.map(() => new AbortController());

  try {
    const result = await Promise.race(
      tasks.map((task, i) =>
        task().then(result => {
          // Cancel other tasks
          controllers.forEach((c, j) => {
            if (i !== j) c.abort();
          });
          return result;
        })
      )
    );
    return result;
  } catch (error) {
    controllers.forEach(c => c.abort());
    throw error;
  }
}
```

### Benefits

- Safe concurrent operations
- Proper error aggregation
- Resource cleanup
- Cancellation support

## 5. Retry with Exponential Backoff

### Implementation

```typescript
interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
}

export async function retry<T>(
  fn: () => Promise<Result<T>>,
  policy: RetryPolicy
): Promise<Result<T>> {
  let lastError: any;
  let delay = policy.initialDelay;

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    const result = await fn();

    if (result.success) {
      return result;
    }

    lastError = result.error;

    if (attempt < policy.maxAttempts) {
      await sleep(delay);
      delay = Math.min(delay * policy.factor, policy.maxDelay);
    }
  }

  return Err({
    code: 'RETRY_EXHAUSTED',
    message: `Failed after ${policy.maxAttempts} attempts`,
    cause: lastError,
  });
}

// Conditional retry
export function retryIf<T>(
  predicate: (error: any) => boolean
): (fn: () => Promise<Result<T>>) => (policy: RetryPolicy) => Promise<Result<T>> {
  return fn => policy => {
    const wrappedFn = async () => {
      const result = await fn();
      if (!result.success && !predicate(result.error)) {
        throw new Error('Non-retryable error');
      }
      return result;
    };
    return retry(wrappedFn, policy);
  };
}
```

### Benefits

- Configurable retry policies
- Exponential backoff
- Conditional retries
- Clean API

## 6. Resource Management (Bracket Pattern)

### Implementation

```typescript
// Resource management with automatic cleanup
export async function bracket<R, A>(
  acquire: () => Promise<Result<R>>,
  use: (resource: R) => Promise<Result<A>>,
  release: (resource: R) => Promise<void>
): Promise<Result<A>> {
  const resourceResult = await acquire();

  if (!resourceResult.success) {
    return resourceResult;
  }

  try {
    const result = await use(resourceResult.value);
    await release(resourceResult.value);
    return result;
  } catch (error) {
    await release(resourceResult.value).catch(() => {});
    return Err({
      code: 'RESOURCE_ERROR',
      message: 'Error during resource usage',
      cause: error,
    });
  }
}

// File handle example
export const withFileHandle = (path: string, mode: string) =>
  bracket(
    async () => {
      try {
        const handle = await fs.open(path, mode);
        return Ok(handle);
      } catch (error) {
        return Err({ code: 'FILE_OPEN_ERROR', message: error.message });
      }
    },
    async handle => {
      // Use file handle
      return Ok(await handle.read());
    },
    async handle => {
      await handle.close();
    }
  );

// Scoped resources
export function scoped<T>(
  fn: (scope: { addFinalizer: (cleanup: () => Promise<void>) => void }) => Promise<Result<T>>
): Promise<Result<T>> {
  const finalizers: Array<() => Promise<void>> = [];

  const scope = {
    addFinalizer: (cleanup: () => Promise<void>) => {
      finalizers.push(cleanup);
    },
  };

  return fn(scope).finally(async () => {
    for (const finalizer of finalizers.reverse()) {
      await finalizer().catch(() => {});
    }
  });
}
```

### Benefits

- Guaranteed cleanup
- Exception safety
- Composable resources
- Memory leak prevention

## 7. Lazy Evaluation

### Implementation

```typescript
// Lazy value computation
export interface Lazy<T> {
  (): T;
  readonly _tag: 'Lazy';
}

export function lazy<T>(fn: () => T): Lazy<T> {
  let cached: { value: T } | undefined;

  const lazyFn = () => {
    if (!cached) {
      cached = { value: fn() };
    }
    return cached.value;
  };

  lazyFn._tag = 'Lazy' as const;
  return lazyFn as Lazy<T>;
}

// Lazy Result computation
export function lazyResult<T>(fn: () => Result<T>): () => Result<T> {
  let cached: Result<T> | undefined;

  return () => {
    if (!cached) {
      cached = fn();
    }
    return cached;
  };
}

// Usage
const expensiveConfig = lazy(() => {
  console.log('Computing expensive config...');
  return parseComplexConfig();
});

// Only computed when accessed
if (needsConfig) {
  const config = expensiveConfig();
}
```

### Benefits

- Deferred computation
- Automatic memoization
- Performance optimization
- Clean API

## Implementation Priority

Based on current @esteban-url/trailhead-cli patterns and needs:

1. **High Priority** (Immediate value, low complexity):
   - Tagged errors with pattern matching
   - Pipe operator for composition
   - Retry with exponential backoff

2. **Medium Priority** (Good value, moderate complexity):
   - Service pattern for DI
   - Resource management (bracket)
   - Structured concurrency

3. **Low Priority** (Nice to have):
   - Lazy evaluation
   - Advanced stream processing
   - Effect-like generators

## Migration Strategy

1. **Phase 1**: Implement core patterns (pipe, tagged errors)
2. **Phase 2**: Add retry and resource management
3. **Phase 3**: Enhance with service pattern if needed
4. **Phase 4**: Consider advanced patterns based on usage

## Example Integration

```typescript
// Before (current style)
const result = await readFile(path);
if (!result.success) {
  logger.error(result.error.message);
  return result;
}
const parsed = parseJSON(result.value);
if (!parsed.success) {
  logger.error(parsed.error.message);
  return parsed;
}
return transform(parsed.value);

// After (with patterns)
return pipe(
  await readFile(path),
  flatMap(parseJSON),
  flatMap(transform),
  tapErr(error => logger.error(error.message))
);
```

## Conclusion

These patterns provide Effect.ts-like benefits without the complexity:

- 🎯 **Targeted**: Only what adds value to CLI framework
- 📦 **Lightweight**: Minimal bundle size impact
- 🧩 **Incremental**: Can be adopted gradually
- 🔧 **Practical**: Solves real CLI development challenges
- ✅ **Type-safe**: Maintains TypeScript benefits

The framework can selectively adopt these patterns based on actual needs rather than wholesale Effect.ts migration.
