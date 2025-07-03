---
type: reference
title: "Type Reference Index"
description: "Comprehensive index of all types exported by @esteban-url/trailhead-cli modules"
related:
  - /docs/reference/api/core
  - /docs/reference/api/command
  - /docs/reference/api/filesystem
---

# Type Reference Index

Comprehensive index of all types exported by @esteban-url/trailhead-cli modules.

## Overview

| Property | Value |
|----------|-------|
| **Package** | `@esteban-url/trailhead-cli` |
| **Module** | All modules |
| **Since** | `v1.0.0` |

## Import

```typescript
import type { 
  Result, 
  CLI, 
  CLIConfig 
} from "@esteban-url/trailhead-cli";
```

## Import by Module

### Main Export (`@esteban-url/trailhead-cli`)

```typescript
import type { 
  Result, 
  CLI, 
  CLIConfig 
} from "@esteban-url/trailhead-cli";
```

### Core Types (`@esteban-url/trailhead-cli/core`)

```typescript
import type {
  Result,
  Ok,
  Err,
  CLIError,
  FileSystemError,
  ValidationError,
  ErrorOptions,
  Logger,
  ValidationRule,
  ValidationPipeline,
  Validator
} from "@esteban-url/trailhead-cli/core";
```

### Command Types (`@esteban-url/trailhead-cli/command`)

```typescript
import type {
  Command,
  CommandConfig,
  CommandContext,
  CommandOption,
  CommandPhase,
  ParsedOptions,
  ExecutionOptions,
  ProgressOptions
} from "@esteban-url/trailhead-cli/command";
```

### FileSystem Types (`@esteban-url/trailhead-cli/filesystem`)

```typescript
import type {
  FileSystem,
  FileSystemAdapter,
  FileStats,
  MkdirOptions,
  CopyOptions,
  RemoveOptions,
  JsonOptions
} from "@esteban-url/trailhead-cli/filesystem";
```

### Config Types (`@esteban-url/trailhead-cli/config`)

```typescript
import type {
  ConfigDefinition,
  ConfigSchema,
  LoadOptions
} from "@esteban-url/trailhead-cli/config";
```

### Testing Types (`@esteban-url/trailhead-cli/testing`)

```typescript
import type {
  TestContext,
  TestContextOptions,
  MockLogger,
  MockPrompts,
  RunOptions,
  CommandTestRunner
} from "@esteban-url/trailhead-cli/testing";
```

### Utils Types (`@esteban-url/trailhead-cli/utils`)

```typescript
import type {
  Spinner,
  SpinnerOptions,
  Stats,
  StatsSummary,
  OptionSchema,
  StyleFunction
} from "@esteban-url/trailhead-cli/utils";
```

## Core Type Definitions

### Result Type

```typescript
type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

type Ok<T> = { readonly success: true; readonly value: T };
type Err<E> = { readonly success: false; readonly error: E };
```

### CLI Types

```typescript
interface CLI {
  run(argv?: string[]): Promise<void>;
}

interface CLIConfig {
  name: string;
  version: string;
  description?: string;
  commands?: Command[];
}
```

### Command Types

```typescript
interface Command<T = any> {
  name: string;
  description: string;
  options?: CommandOption[];
  execute: (options: T, context: CommandContext) => Promise<Result<void>>;
}

interface CommandContext {
  readonly projectRoot: string;
  readonly logger: Logger;
  readonly verbose: boolean;
  readonly fs: FileSystem;
}

interface CommandOption {
  name?: string;
  alias?: string;
  flags?: string;
  description: string;
  type?: "string" | "boolean" | "number";
  required?: boolean;
  default?: any;
  choices?: string[];
}
```

### Error Types

```typescript
interface CLIError extends Error {
  code: string;
  details?: unknown;
  suggestion?: string;
  recoverable?: boolean;
}

interface FileSystemError extends CLIError {
  path: string;
  operation: string;
}

interface ValidationError extends CLIError {
  field?: string;
  value?: unknown;
  constraints?: Record<string, any>;
}
```

### FileSystem Types

```typescript
interface FileSystem {
  exists(path: string): Promise<Result<boolean>>;
  readFile(path: string, encoding?: string): Promise<Result<string>>;
  writeFile(path: string, content: string): Promise<Result<void>>;
  mkdir(path: string, options?: MkdirOptions): Promise<Result<void>>;
  readdir(path: string): Promise<Result<string[]>>;
  stat(path: string): Promise<Result<FileStats>>;
  copy(src: string, dest: string, options?: CopyOptions): Promise<Result<void>>;
  rm(path: string, options?: RemoveOptions): Promise<Result<void>>;
  ensureDir(path: string): Promise<Result<void>>;
  readJson<T = any>(path: string): Promise<Result<T>>;
  writeJson<T = any>(path: string, data: T, options?: JsonOptions): Promise<Result<void>>;
}

interface FileStats {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  mtime: Date;
}
```

## Generic Utility Types

### Option Types

```typescript
type CommandOptionType = "string" | "boolean" | "number";

type ParsedOptions = Record<string, string | boolean | number | undefined>;

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

### Function Types

```typescript
type AsyncFunction<T, R> = (arg: T) => Promise<R>;
type ResultFunction<T, R> = (arg: T) => Result<R>;
type AsyncResultFunction<T, R> = (arg: T) => Promise<Result<R>>;
```

## Module Compatibility

All types are designed to work together:

```typescript
// Example: Command using multiple module types
import type { Command, CommandContext } from "@esteban-url/trailhead-cli/command";
import type { Result } from "@esteban-url/trailhead-cli";
import type { FileSystem } from "@esteban-url/trailhead-cli/filesystem";
import type { Logger } from "@esteban-url/trailhead-cli/core";

const myCommand: Command<MyOptions> = {
  name: "process",
  description: "Process files",
  execute: async (options: MyOptions, context: CommandContext): Promise<Result<void>> => {
    const fs: FileSystem = context.fs;
    const logger: Logger = context.logger;
    
    // Implementation using typed modules
    return Ok(undefined);
  },
};
```

## Type Guards

Available type guards for runtime checks:

```typescript
// Result type guards
function isOk<T, E>(result: Result<T, E>): result is Ok<T>;
function isErr<T, E>(result: Result<T, E>): result is Err<E>;

// Error type guards
function isCLIError(error: unknown): error is CLIError;
function isFileSystemError(error: unknown): error is FileSystemError;
function isValidationError(error: unknown): error is ValidationError;
```

## See Also

- [Import Patterns](../how-to/import-patterns.md) - How to import types
- Individual module references for detailed type documentation