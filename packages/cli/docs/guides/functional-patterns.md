# Functional Programming Patterns

This guide explores functional programming patterns used throughout @trailhead/cli and how to apply them in your CLI applications.

## Core Principles

### 1. Immutability

Data structures are never modified. Operations return new data.

```typescript
// Instead of mutation
const config = { port: 3000 };
config.port = 4000; // Mutation!

// Use immutable updates
const config = { port: 3000 };
const updated = { ...config, port: 4000 };
```

### 2. Pure Functions

Functions that depend only on their inputs and produce no side effects.

```typescript
// Pure function
const addPrefix = (str: string, prefix: string): string => prefix + str;

// Impure function (depends on external state)
let prefix = "app:";
const addPrefix = (str: string): string => prefix + str; // Depends on external variable
```

### 3. Function Composition

Building complex operations from simple functions.

```typescript
const compose =
  <A, B, C>(f: (b: B) => C, g: (a: A) => B) =>
  (a: A): C =>
    f(g(a));

const trim = (s: string) => s.trim();
const uppercase = (s: string) => s.toUpperCase();
const shout = compose(uppercase, trim);

shout("  hello  "); // 'HELLO'
```

## Higher-Order Functions

Functions that take or return other functions.

### Map, Filter, Reduce

```typescript
// Transform Results
const mapResult = <T, U>(result: Result<T>, fn: (value: T) => U): Result<U> => {
  if (!result.success) return result;
  return ok(fn(result.value));
};

// Filter with Results
const filterResults = <T>(
  results: Result<T>[],
  predicate: (value: T) => boolean,
): Result<T>[] => {
  return results.filter((r) => r.success && predicate(r.value));
};
```

### Function Factories

```typescript
// Create specialized validators
const createLengthValidator = (min: number, max: number) => {
  return (value: string): Result<string> => {
    if (value.length < min) {
      return err(new Error(`Minimum length is ${min}`));
    }
    if (value.length > max) {
      return err(new Error(`Maximum length is ${max}`));
    }
    return ok(value);
  };
};

const validateUsername = createLengthValidator(3, 20);
const validatePassword = createLengthValidator(8, 100);
```

## Monadic Patterns with Result

The Result type forms a monad, enabling elegant error handling.

### Chaining Operations

```typescript
// Traditional approach
async function processUser(id: string) {
  const userResult = await fetchUser(id);
  if (!userResult.success) return userResult;

  const validResult = validateUser(userResult.value);
  if (!validResult.success) return validResult;

  const savedResult = await saveUser(validResult.value);
  if (!savedResult.success) return savedResult;

  return ok(savedResult.value);
}

// Monadic chaining
const chain = <T, U>(
  result: Result<T>,
  fn: (value: T) => Result<U>,
): Result<U> => {
  if (!result.success) return result;
  return fn(result.value);
};

async function processUser(id: string) {
  return chain(await fetchUser(id), (user) =>
    chain(validateUser(user), (validUser) => saveUser(validUser)),
  );
}
```

### Result Utilities

```typescript
// Combine multiple Results
const combine = <T>(results: Result<T>[]): Result<T[]> => {
  const values: T[] = [];
  for (const result of results) {
    if (!result.success) return result;
    values.push(result.value);
  }
  return ok(values);
};

// Apply function if all Results succeed
const apply = <A, B, C>(
  fn: (a: A, b: B) => C,
  ra: Result<A>,
  rb: Result<B>,
): Result<C> => {
  if (!ra.success) return ra;
  if (!rb.success) return rb;
  return ok(fn(ra.value, rb.value));
};
```

## Partial Application and Currying

### Partial Application

```typescript
// Generic file processor
const processFile =
  (transformer: (content: string) => string) =>
  async (path: string, fs: FileSystem): Promise<Result<void>> => {
    const readResult = await fs.readFile(path);
    if (!readResult.success) return readResult;

    const transformed = transformer(readResult.value);
    return fs.writeFile(path, transformed);
  };

// Create specialized processors
const uppercaseFile = processFile((s) => s.toUpperCase());
const minifyFile = processFile((s) => s.replace(/\s+/g, " "));
```

### Currying

```typescript
// Curried function for configuration
const getConfigValue = (path: string) => (config: Config) => {
  const parts = path.split(".");
  let value: any = config;

  for (const part of parts) {
    value = value?.[part];
  }

  return value;
};

// Create specific getters
const getApiUrl = getConfigValue("api.url");
const getTimeout = getConfigValue("api.timeout");

// Use with any config
const url = getApiUrl(config);
const timeout = getTimeout(config);
```

## Functional Error Handling

### Either Pattern

```typescript
type Either<L, R> = { tag: "left"; value: L } | { tag: "right"; value: R };

const left = <L, R>(value: L): Either<L, R> => ({ tag: "left", value });

const right = <L, R>(value: R): Either<L, R> => ({ tag: "right", value });

// Use for branching logic
const parseConfig = (text: string): Either<Error, Config> => {
  try {
    const config = JSON.parse(text);
    return right(config);
  } catch (error) {
    return left(error as Error);
  }
};
```

### Option/Maybe Pattern

```typescript
type Option<T> = { tag: "some"; value: T } | { tag: "none" };

const some = <T>(value: T): Option<T> => ({ tag: "some", value });

const none = <T>(): Option<T> => ({ tag: "none" });

// Use for optional values
const findUser = (id: string): Option<User> => {
  const user = users.get(id);
  return user ? some(user) : none();
};
```

## Functional Pipelines

### Pipeline Builder

```typescript
type Pipeline<T> = {
  pipe: <U>(fn: (value: T) => U) => Pipeline<U>;
  value: () => T;
};

const pipeline = <T>(initial: T): Pipeline<T> => ({
  pipe: (fn) => pipeline(fn(initial)),
  value: () => initial,
});

// Usage
const result = pipeline("  hello world  ")
  .pipe((s) => s.trim())
  .pipe((s) => s.toUpperCase())
  .pipe((s) => s.replace(/ /g, "_"))
  .value();
// 'HELLO_WORLD'
```

### Async Pipeline

```typescript
type AsyncPipeline<T> = {
  pipe: <U>(fn: (value: T) => Promise<U>) => AsyncPipeline<U>;
  value: () => Promise<T>;
};

const asyncPipeline = <T>(initial: Promise<T>): AsyncPipeline<T> => ({
  pipe: (fn) => asyncPipeline(initial.then(fn)),
  value: () => initial,
});

// Usage
const content = await asyncPipeline(fs.readFile("data.json"))
  .pipe((text) => JSON.parse(text))
  .pipe((data) => transform(data))
  .pipe((result) => fs.writeFile("output.json", result))
  .value();
```

## Lens Pattern for Nested Updates

```typescript
type Lens<T, U> = {
  get: (obj: T) => U;
  set: (value: U, obj: T) => T;
};

// Create lens for nested property
const createLens = <T, K extends keyof T>(key: K): Lens<T, T[K]> => ({
  get: (obj) => obj[key],
  set: (value, obj) => ({ ...obj, [key]: value }),
});

// Compose lenses
const compose = <A, B, C>(
  lens1: Lens<A, B>,
  lens2: Lens<B, C>,
): Lens<A, C> => ({
  get: (obj) => lens2.get(lens1.get(obj)),
  set: (value, obj) => lens1.set(lens2.set(value, lens1.get(obj)), obj),
});

// Usage
interface Config {
  api: {
    endpoints: {
      users: string;
    };
  };
}

const apiLens = createLens<Config, "api">("api");
const endpointsLens = createLens<Config["api"], "endpoints">("endpoints");
const usersLens = createLens<Config["api"]["endpoints"], "users">("users");

const usersEndpointLens = compose(compose(apiLens, endpointsLens), usersLens);

// Update nested value immutably
const updated = usersEndpointLens.set(
  "https://api.example.com/v2/users",
  config,
);
```

## Memoization

Cache expensive computations.

```typescript
const memoize = <Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
): ((...args: Args) => Result) => {
  const cache = new Map<string, Result>();

  return (...args: Args): Result => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Memoize expensive computation
const fibonacci = memoize((n: number): number => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});
```

## Functional State Management

### State Monad Pattern

```typescript
type State<S, A> = (state: S) => [A, S];

const runState = <S, A>(computation: State<S, A>, initial: S): [A, S] =>
  computation(initial);

// Combine state computations
const map = <S, A, B>(
  f: (a: A) => B,
  computation: State<S, A>,
): State<S, B> => {
  return (state: S) => {
    const [value, newState] = computation(state);
    return [f(value), newState];
  };
};

// Example: Counter with state
type CounterState = { count: number };

const increment: State<CounterState, number> = (state) => {
  const newCount = state.count + 1;
  return [newCount, { count: newCount }];
};

const [result, finalState] = runState(increment, { count: 0 });
```

## Real-World Examples

### Command Enhancer

```typescript
// Higher-order function to add logging
const withLogging = <T>(command: Command<T>): Command<T> => ({
  ...command,
  action: async (options, context) => {
    context.logger.debug(`Executing ${command.name}`);
    const start = Date.now();

    const result = await command.action(options, context);

    const duration = Date.now() - start;
    context.logger.debug(`Completed in ${duration}ms`);

    return result;
  },
});

// Apply to commands
const enhancedCommand = withLogging(originalCommand);
```

### Validation Composition

```typescript
// Compose validators
const and = <T>(...validators: Validator<T>[]): Validator<T> => {
  return (value: T): Result<T> => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.success) return result;
    }
    return ok(value);
  };
};

const or = <T>(...validators: Validator<T>[]): Validator<T> => {
  return (value: T): Result<T> => {
    const errors: Error[] = [];

    for (const validator of validators) {
      const result = validator(value);
      if (result.success) return result;
      errors.push(result.error);
    }

    return err(
      new Error(
        `All validations failed: ${errors.map((e) => e.message).join(", ")}`,
      ),
    );
  };
};

// Build complex validators
const validateEmail = and(notEmpty, matchesPattern(emailRegex), maxLength(255));
```

### Functional Configuration Builder

```typescript
type ConfigBuilder<T> = {
  set: <K extends keyof T>(key: K, value: T[K]) => ConfigBuilder<T>;
  update: <K extends keyof T>(
    key: K,
    fn: (current: T[K]) => T[K],
  ) => ConfigBuilder<T>;
  build: () => T;
};

const configBuilder = <T>(initial: T): ConfigBuilder<T> => {
  const config = { ...initial };

  return {
    set: (key, value) => {
      config[key] = value;
      return configBuilder(config);
    },
    update: (key, fn) => {
      config[key] = fn(config[key]);
      return configBuilder(config);
    },
    build: () => config,
  };
};

// Usage
const config = configBuilder({ port: 3000, debug: false })
  .set("port", 4000)
  .update("port", (p) => p + 1)
  .set("debug", true)
  .build();
```

## Best Practices

### 1. Prefer Composition Over Inheritance

```typescript
// Instead of class hierarchies
class BaseCommand {}
class AuthCommand extends BaseCommand {}

// Use composition
const withAuth = (cmd: Command) => ({ ...cmd /* auth logic */ });
const withCache = (cmd: Command) => ({ ...cmd /* cache logic */ });

const command = withCache(withAuth(baseCommand));
```

### 2. Make Invalid States Unrepresentable

```typescript
// Bad - allows invalid states
interface Task {
  status: "pending" | "completed" | "failed";
  result?: string;
  error?: Error;
}

// Good - type safety ensures valid states
type Task =
  | { status: "pending" }
  | { status: "completed"; result: string }
  | { status: "failed"; error: Error };
```

### 3. Use Function Parameters for Dependencies

```typescript
// Instead of implicit dependencies
const saveFile = async (content: string) => {
  await fs.writeFile("./output.txt", content); // Hidden dependency
};

// Make dependencies explicit
const saveFile = async (content: string, path: string, fs: FileSystem) => {
  return fs.writeFile(path, content);
};
```

### 4. Leverage Type Inference

```typescript
// Let TypeScript infer types when possible
const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T =>
    fns.reduce((acc, fn) => fn(acc), value);

// TypeScript infers the type
const process = pipe(trim, lowercase, removeSpaces); // (value: string) => string
```

## Summary

Functional programming patterns in @trailhead/cli enable:

- **Predictable code** through pure functions
- **Composable abstractions** for complex operations
- **Type-safe error handling** with Result types
- **Testable code** through explicit dependencies
- **Maintainable applications** through immutability

By embracing these patterns, you'll write CLI applications that are easier to understand, test, and maintain.
