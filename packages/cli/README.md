# @esteban-url/trailhead-cli

A comprehensive functional CLI framework for building production-ready command-line applications with TypeScript and neverthrow Result types.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

## Overview

@esteban-url/trailhead-cli is a comprehensive CLI framework that provides 14+ specialized modules for building robust, production-ready command-line applications. Built on neverthrow Result types for explicit error handling, the framework eliminates exceptions in favor of functional error patterns that make error paths explicit at compile time.

The framework combines battle-tested libraries with functional programming principles, providing everything from basic CLI creation to advanced workflows, git operations, data processing, file watching, and comprehensive testing utilities. Each module is independently importable via tree-shakeable subpath exports, allowing applications to include only the functionality they need while maintaining optimal bundle sizes.

## Get Started in Seconds

Generate a complete CLI project with TypeScript, testing, and build configuration:

```bash
pnpm create trailhead-cli my-cli
cd my-cli
pnpm dev
```

The generator provides project scaffolding with basic and advanced templates, including monorepo setup, CI/CD workflows, and comprehensive documentation structure.

## Complete Features

| Module                 | Description                                                                                                      | Libraries Used                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create-trailhead-cli` | Project scaffolding with TypeScript setup, testing, and CI/CD workflows                                          | [Handlebars](https://handlebarsjs.com/), [fast-glob](https://github.com/mrmlnc/fast-glob), [execa](https://github.com/sindresorhus/execa)                      |
| `/core`                | neverthrow Result types, advanced error handling, validation pipelines, and retry patterns with circuit breakers | [neverthrow](https://github.com/supermacro/neverthrow), [p-retry](https://github.com/sindresorhus/p-retry)                                                     |
| `/command`             | Performance-optimized CLI parsing, validation, and execution with caching and git hooks integration              | [Commander.js](https://github.com/tj/commander.js)                                                                                                             |
| `/filesystem`          | Production-ready file operations with Result types, advanced utilities, and cross-platform support               | [Node.js fs/promises](https://nodejs.org/api/fs.html#promises-api), [glob](https://github.com/isaacs/node-glob)                                                |
| `/config`              | Template-based configuration system with 6 predefined templates and validation                                   | [Cosmiconfig](https://github.com/davidtheclark/cosmiconfig), [Zod](https://github.com/colinhacks/zod)                                                          |
| `/prompts`             | Interactive command line user interfaces with excellent UX                                                       | [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js)                                                                                                  |
| `/utils`               | Package manager detection, terminal styling, spinners, and enhanced utilities                                    | [Chalk](https://github.com/chalk/chalk), [yocto-spinner](https://github.com/sindresorhus/yocto-spinner), [cli-progress](https://github.com/npkgz/cli-progress) |
| `/git`                 | Zero-dependency git operations with branch sync, merge base, and status management                               | Native git commands via Node.js child_process                                                                                                                  |
| `/workflows`           | Advanced task orchestration with Listr2 integration and progress tracking                                        | [Listr2](https://github.com/listr2/listr2)                                                                                                                     |
| `/streams`             | Memory-efficient streaming for large files with CSV, JSON Lines, and batch processing                            | [papaparse](https://github.com/mholt/PapaParse)                                                                                                                |
| `/data`                | Comprehensive data processing with CSV, JSON, and Excel support plus format auto-detection                       | [papaparse](https://github.com/mholt/PapaParse), [exceljs](https://github.com/exceljs/exceljs), [csv-sniffer](https://github.com/pajtai/csv-sniffer)           |
| `/formats`             | File type detection and validation with support for buffers, streams, and blobs                                  | [file-type](https://github.com/sindresorhus/file-type)                                                                                                         |
| `/watcher`             | File system watching with pattern matching and batched event handling                                            | [chokidar](https://github.com/paulmillr/chokidar)                                                                                                              |
| `/validation`          | Enhanced validation with common patterns (email, phone, URL) using Zod and Result types                          | [Zod](https://github.com/colinhacks/zod)                                                                                                                       |
| `/progress`            | Basic and enhanced progress tracking with weighted calculations                                                  | [cli-progress](https://github.com/npkgz/cli-progress)                                                                                                          |
| `/testing`             | Comprehensive testing framework with 50% boilerplate reduction, CLI testing, and custom Vitest matchers          | [Vitest](https://vitest.dev/)                                                                                                                                  |

## 📚 Documentation

- **[Getting Started](./docs/tutorials/getting-started.md)** - Build your first CLI in minutes
- **[API Reference](./docs/reference/)** - Complete module documentation
- **[How-To Guides](./docs/how-to/)** - In-depth topics and patterns
- **[Examples](./examples/)** - Real-world applications

## Installation

### For Monorepo Development

When working within the Trailhead monorepo:

```bash
# From within the monorepo
pnpm add @esteban-url/trailhead-cli --workspace

# Or in package.json
{
  "dependencies": {
    "@esteban-url/trailhead-cli": "workspace:*"
  }
}
```

### For External Projects

Since this package is private and not published to NPM, install directly from GitHub:

```bash
# Install specific package from monorepo
pnpm add github:esteban-url/trailhead#packages/cli

# Or with npm
npm install github:esteban-url/trailhead#packages/cli

# In package.json
{
  "dependencies": {
    "@esteban-url/trailhead-cli": "github:esteban-url/trailhead#packages/cli"
  }
}
```

> **Note**: You may need authentication to access the private repository. Ensure you have proper GitHub access configured.

## Quick Start

### Option 1: Generate a new project (Recommended)

```bash
# Create a new CLI project with scaffolding
pnpm create trailhead-cli my-awesome-cli

# Follow interactive prompts to configure your project
cd my-awesome-cli
pnpm dev
```

### Option 2: Add to existing project

```typescript
// Import core utilities from the main export
import { createCLI, ok, err } from '@esteban-url/trailhead-cli';
import type { Result } from '@esteban-url/trailhead-cli';

// Import specific modules using subpath exports
import { createCommand } from '@esteban-url/trailhead-cli/command';

// Create a command
const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet someone',
  options: [
    {
      name: 'name',
      alias: 'n',
      type: 'string',
      required: true,
      description: 'Name to greet',
    },
  ],
  action: async (options, context) => {
    context.logger.info(`Hello, ${options.name}!`);
    return ok(undefined);
  },
});

// Create a CLI application with commands
const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI tool',
  commands: [greetCommand],
});

// Run the CLI
cli.run(process.argv);
```

## Architecture

Built on functional programming principles with production-ready patterns:

- **neverthrow Result types** - Explicit error handling with `ok()` and `err()` instead of exceptions
- **Pure functions** - No classes in public API, predictable behavior and easy testing
- **Immutable data** - All modifications return new objects, preventing side effects
- **Dependency injection** - All I/O operations through context for testability
- **Composition over inheritance** - Build complex operations from simple, reusable functions
- **Performance optimizations** - Caching, streaming, and circuit breakers for production use
- **Tree-shakeable modules** - Import only what you need via subpath exports

## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Type checking
pnpm types

# Linting (dual setup)
pnpm lint              # Fast standard linting with oxlint
pnpm lint:neverthrow   # neverthrow Result validation with ESLint

# Complete validation
pnpm validate          # Types + lint + tests
```

📖 **See [LINTING.md](./LINTING.md) for detailed information about the dual linting setup**

## Best Practices

1. **Always return Results** - Use `ok()` and `err()` from @trailhead/core, never throw exceptions
2. **Use functional composition** - Combine small, pure functions with `Result.map()` and `Result.andThen()`
3. **Handle errors explicitly** - Check `result.isOk()` and `result.isErr()` for proper error handling
4. **Inject dependencies** - Pass FileSystem, Logger, etc. through context for testability
5. **Validate early** - Use validation pipelines with Result types for input processing
6. **Provide rich errors** - Include context, error codes, and recovery suggestions
7. **Use circuit breakers** - Implement retry logic with exponential backoff for resilient operations
8. **Stream large data** - Use streaming APIs for memory-efficient processing of large files
9. **Cache expensive operations** - Leverage built-in caching for performance optimization
10. **Test with high ROI** - Focus on business logic and user interactions, avoid low-value rendering tests

## Advanced Modules

### `/git` - Git Operations

Zero-dependency git utilities for repository management:

```typescript
import { getCurrentBranch, checkBranchSync, getMergeBase } from '@esteban-url/trailhead-cli/git';

// Check current branch
const branchResult = await getCurrentBranch();
if (branchResult.isOk()) {
  console.log(`Current branch: ${branchResult.value}`);
} else {
  console.error('Failed to get branch:', branchResult.error.message);
}

// Check if branch needs sync with remote
const syncResult = await checkBranchSync('main');
if (syncResult.isOk()) {
  console.log('Branch sync status:', syncResult.value);
} else {
  console.error('Sync check failed:', syncResult.error.message);
}
```

### `/workflows` - Task Orchestration

Advanced task orchestration with progress tracking:

```typescript
import { createWorkflow } from '@esteban-url/trailhead-cli/workflows';
import { ok, err } from '@esteban-url/trailhead-cli/core';

// Example task functions
const buildProject = async () => {
  console.log('Building project...');
  return ok('Build completed');
};

const runTests = async () => {
  console.log('Running tests...');
  return ok('Tests passed');
};

const deploy = async () => {
  console.log('Deploying...');
  return ok('Deployment successful');
};

const workflow = createWorkflow([
  { title: 'Build project', task: () => buildProject() },
  { title: 'Run tests', task: () => runTests() },
  { title: 'Deploy', task: () => deploy() },
]);

const result = await workflow.run();
if (result.isOk()) {
  console.log('Workflow completed successfully');
} else {
  console.error('Workflow failed:', result.error.message);
}
```

### `/streams` - Large File Processing

Memory-efficient streaming for large datasets:

```typescript
import {
  createCSVParseStream,
  pipeline,
  createMapStream,
} from '@esteban-url/trailhead-cli/streams';
import * as fs from 'fs';

// Create processing streams
const csvStream = createCSVParseStream({ hasHeader: true });
const transformStream = createMapStream((row: any) => ({
  ...row,
  processed: true,
  timestamp: new Date().toISOString(),
}));

const result = await pipeline(
  fs.createReadStream('large-data.csv'),
  csvStream,
  transformStream,
  fs.createWriteStream('output.json')
);

if (result.isOk()) {
  console.log('Processing completed:', result.value);
} else {
  console.error('Stream processing failed:', result.error.message);
}
```

### `/data` - Data Processing

Comprehensive data processing with format auto-detection:

```typescript
import { processors, utils } from '@esteban-url/trailhead-cli/data';

// Example CSV data
const csvData = `name,age,city
John Doe,30,New York
Jane Smith,25,Los Angeles
Bob Johnson,35,Chicago`;

// Auto-detect and parse data
const result = utils.autoParse(csvData);
if (result.isOk()) {
  console.log('Parsed data:', result.value);
} else {
  console.error('Parse failed:', result.error.message);
}

// Process Excel files
const excelProcessor = processors.excel();
const workbookResult = await excelProcessor.parseFile('data.xlsx');
if (workbookResult.isOk()) {
  console.log('Excel data:', workbookResult.value);
} else {
  console.error('Excel processing failed:', workbookResult.error.message);
}
```

### `/formats` - File Type Detection

Reliable file type detection for various formats:

```typescript
import { detectFromBuffer } from '@esteban-url/trailhead-cli/formats';
import * as fs from 'fs';

// Read file into buffer
const buffer = await fs.promises.readFile('example-file.pdf');

const fileTypeResult = await detectFromBuffer(buffer);
if (fileTypeResult.isOk()) {
  console.log(`File type: ${fileTypeResult.value.ext}`);
  console.log(`MIME type: ${fileTypeResult.value.mime}`);
} else {
  console.error('Detection failed:', fileTypeResult.error.message);
}
```

### `/watcher` - File System Watching

Pattern-based file watching for development workflows:

```typescript
import { createWatcher } from '@esteban-url/trailhead-cli/watcher';

const watcher = createWatcher(['src/**/*.ts'], {
  onAdd: path => console.log(`Added: ${path}`),
  onChange: path => console.log(`Changed: ${path}`),
  onError: error => console.error('Watcher error:', error.message),
});

const watchResult = await watcher.start();
if (watchResult.isErr()) {
  console.error('Failed to start watcher:', watchResult.error.message);
}
```

### `/validation` - Enhanced Validation

Common validation patterns with Result types:

```typescript
import {
  validateEmail,
  validateUrl,
  validateStringLength,
  ok,
  err,
} from '@esteban-url/trailhead-cli/validation';

const emailResult = validateEmail('user@example.com');
if (emailResult.isOk()) {
  console.log('Valid email address');
} else {
  console.error('Invalid email:', emailResult.error.message);
}

// Create custom validation with Result types
const validateAndCheck = (value: string) => {
  const emailResult = validateEmail(value);
  if (emailResult.isErr()) {
    return err(emailResult.error);
  }

  const lengthResult = validateStringLength(value, 5);
  if (lengthResult.isErr()) {
    return err(lengthResult.error);
  }

  return ok(value);
};
```

## Production Ready Features

### Performance Optimizations

- **Caching**: Command option processing with intelligent cache invalidation
- **Streaming**: Memory-efficient processing of large files via streaming APIs
- **Batching**: Efficient batch processing for file operations and data transformations
- **Tree-shaking**: Modular exports allow importing only needed functionality

### Reliability Patterns

- **Circuit Breakers**: Automatic failure detection with exponential backoff retry
- **Error Recovery**: Advanced retry strategies with timeout and parallel retry options
- **Validation Pipelines**: Comprehensive input validation with detailed error messages
- **Resource Management**: Proper cleanup and resource disposal patterns

### Developer Experience

- **TypeScript First**: Full type safety with comprehensive type definitions
- **High-ROI Testing**: 50% boilerplate reduction with custom matchers and utilities
- **Rich Error Messages**: Detailed error context with recovery suggestions
- **Interactive Prompts**: Beautiful CLI interfaces with excellent UX

### Enterprise Features

- **Git Integration**: Zero-dependency git operations for workflow automation
- **File Watching**: Development workflow support with pattern-based watching
- **Data Processing**: Excel, CSV, and JSON processing with format auto-detection
- **Task Orchestration**: Advanced workflow management with progress tracking

## Module Exports

All modules are available via tree-shakeable subpath exports:

```typescript
// Core Result types and error handling
import { ok, err, Result } from '@esteban-url/trailhead-cli/core';

// Command creation and execution
import { createCommand } from '@esteban-url/trailhead-cli/command';

// File system operations
import { createFileSystem } from '@esteban-url/trailhead-cli/filesystem';

// Configuration management
import { createConfig } from '@esteban-url/trailhead-cli/config';

// Interactive prompts
import { confirm, input, select } from '@esteban-url/trailhead-cli/prompts';

// Git operations
import { getCurrentBranch, checkBranchSync } from '@esteban-url/trailhead-cli/git';

// Task orchestration
import { createWorkflow, Listr } from '@esteban-url/trailhead-cli/workflows';

// Streaming and data processing
import { createCSVParseStream } from '@esteban-url/trailhead-cli/streams';
import { processors, utils } from '@esteban-url/trailhead-cli/data';

// File type detection
import { detectFromBuffer } from '@esteban-url/trailhead-cli/formats';

// File watching
import { createWatcher } from '@esteban-url/trailhead-cli/watcher';

// Enhanced validation
import { validateEmail } from '@esteban-url/trailhead-cli/validation';
import { createValidationPipeline } from '@esteban-url/trailhead-cli/core';

// Progress tracking
import { createProgressTracker } from '@esteban-url/trailhead-cli/progress';

// Comprehensive testing utilities
import { createTestContext, createMockFileSystem } from '@esteban-url/trailhead-cli/testing';

// Utilities and styling
import { detectPackageManager, chalk, createSpinner } from '@esteban-url/trailhead-cli/utils';
```

## Examples

See the [examples directory](./examples/) for complete CLI applications and usage patterns.

## License

MIT
