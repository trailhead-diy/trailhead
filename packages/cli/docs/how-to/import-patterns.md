---
type: how-to
title: 'How to Optimize Import Patterns'
description: 'Import @esteban-url/trailhead-cli modules efficiently for optimal tree-shaking and smaller bundle sizes'
prerequisites:
  - '@esteban-url/trailhead-cli installed'
  - 'Basic understanding of ES modules'
  - 'Bundler knowledge (esbuild, webpack, etc.)'
related:
  - '/docs/reference/api/index'
  - '/docs/how-to/optimization-guide'
---

# How to Optimize Import Patterns

This guide shows you how to import @esteban-url/trailhead-cli modules efficiently to minimize bundle size and maximize tree-shaking benefits.

## Prerequisites

Before optimizing imports, ensure you have:

- @esteban-url/trailhead-cli installed in your project
- A modern bundler (esbuild, webpack 5+, Vite, etc.)
- TypeScript configured with `moduleResolution: "bundler"`
- Understanding of ES module imports vs CommonJS

## Solution

### Method 1: Use Targeted Subpath Imports (Recommended)

Import only what you need using subpath imports:

```typescript
// ✅ Optimal - Only imports required code
import { Ok, Err } from '@esteban-url/trailhead-cli';
import { createCommand } from '@esteban-url/trailhead-cli/command';
import { createFileSystem } from '@esteban-url/trailhead-cli/filesystem';

// Bundle size: ~25KB
```

**Key points:**

- Use specific subpath imports for each module
- Only import functions you actually use
- Avoid wildcard imports (`import *`)

### Method 2: Lazy Loading for Heavy Dependencies

Load expensive modules only when needed:

```typescript
// ✅ Load prompts only when interactive mode is used
const command = createCommand({
  name: 'interactive',
  async action(options, context) {
    if (options.interactive) {
      const { prompt, select } = await import('@esteban-url/trailhead-cli/prompts');
      const answer = await prompt({ message: 'Enter value:' });
    }
    // Regular non-interactive logic
  },
});
```

**Use this when:**

- Module is expensive (like prompts with inquirer)
- Feature is conditionally used
- Startup time is critical

## Quick Reference

| What You Need          | Import From                             | Example                                                                    |
| ---------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| Result types (Ok, Err) | `@esteban-url/trailhead-cli`            | `import { Ok, Err } from "@esteban-url/trailhead-cli"`                     |
| CLI creation           | `@esteban-url/trailhead-cli`            | `import { createCLI } from "@esteban-url/trailhead-cli"`                   |
| Commands               | `@esteban-url/trailhead-cli/command`    | `import { createCommand } from "@esteban-url/trailhead-cli/command"`       |
| File operations        | `@esteban-url/trailhead-cli/filesystem` | `import { createFileSystem } from "@esteban-url/trailhead-cli/filesystem"` |
| Configuration          | `@esteban-url/trailhead-cli/config`     | `import { defineConfig } from "@esteban-url/trailhead-cli/config"`         |
| User prompts           | `@esteban-url/trailhead-cli/prompts`    | `import { prompt, select } from "@esteban-url/trailhead-cli/prompts"`      |
| Testing utilities      | `@esteban-url/trailhead-cli/testing`    | `import { createTestContext } from "@esteban-url/trailhead-cli/testing"`   |
| Styling & spinners     | `@esteban-url/trailhead-cli/utils`      | `import { chalk, createSpinner } from "@esteban-url/trailhead-cli/utils"`  |

## Common Variations

### Variation 1: Core Principles for Import Optimization

### 1. Minimal Main Export

The main `@esteban-url/trailhead-cli` export contains only essential types and the CLI factory:

```typescript
// ✅ ONLY these are available from main export
import { Ok, Err, isOk, isErr, createCLI } from '@esteban-url/trailhead-cli';
import type { Result, CLI, CLIConfig } from '@esteban-url/trailhead-cli';
```

### 2. Subpath Imports Required

All other functionality requires subpath imports:

```typescript
// ❌ WRONG - Not available from main export
import { createCommand } from '@esteban-url/trailhead-cli';

// ✅ CORRECT - Use subpath import
import { createCommand } from '@esteban-url/trailhead-cli/command';
```

### 3. Tree-Shaking Benefits

Using subpath imports ensures only used code is bundled:

```typescript
// This imports ONLY createCommand (~5KB)
import { createCommand } from '@esteban-url/trailhead-cli/command';

// This would import the entire module (avoid)
import * as command from '@esteban-url/trailhead-cli/command';
```

### Variation 2: Import Examples by Use Case

### Basic CLI Application

```typescript
import { Ok, Err, createCLI } from '@esteban-url/trailhead-cli';
import { createCommand } from '@esteban-url/trailhead-cli/command';
import type { CommandContext } from '@esteban-url/trailhead-cli/command';

const cli = createCLI({
  name: 'my-app',
  version: '1.0.0',
});

const myCommand = createCommand({
  name: 'hello',
  action: async (options, context) => {
    context.logger.info('Hello!');
    return Ok(undefined);
  },
});
```

### File Operations

```typescript
import { Ok, Err } from '@esteban-url/trailhead-cli';
import { createFileSystem } from '@esteban-url/trailhead-cli/filesystem';
import type { FileSystem } from '@esteban-url/trailhead-cli/filesystem';

const fs = createFileSystem();
const result = await fs.readFile('config.json');

if (result.success) {
  console.log(result.value);
}
```

### Configuration Management

```typescript
import { defineConfig } from '@esteban-url/trailhead-cli/config';
import { z } from 'zod';

const schema = z.object({
  port: z.number().default(3000),
  host: z.string().default('localhost'),
});

const config = defineConfig(schema);
```

### Interactive Prompts

```typescript
import { prompt, select, confirm } from '@esteban-url/trailhead-cli/prompts';

const name = await prompt({
  message: "What's your name?",
});

const color = await select({
  message: 'Choose a color',
  choices: ['red', 'green', 'blue'],
});
```

### Testing

```typescript
import { createTestContext, mockFileSystem } from '@esteban-url/trailhead-cli/testing';
import { myCommand } from '../src/commands/my-command';

test('command works', async () => {
  const fs = mockFileSystem({
    'test.txt': 'content',
  });

  const context = createTestContext({ filesystem: fs });
  const result = await myCommand.execute({}, context);

  expect(result.success).toBe(true);
});
```

### Styling Output

```typescript
import { chalk, success, error, warning } from '@esteban-url/trailhead-cli/utils';
import { createSpinner } from '@esteban-url/trailhead-cli/utils';

console.log(chalk.blue('Info message'));
console.log(success('✓ Done'));
console.log(error('✗ Failed'));

const spinner = createSpinner('Loading...');
// ... do work
spinner.succeed('Loaded!');
```

### Variation 3: Understanding Module Dependencies

Some modules depend on others. Here's the dependency graph:

```
@esteban-url/trailhead-cli (main)
├── Result types (Ok, Err, isOk, isErr)
└── createCLI

@esteban-url/trailhead-cli/command
└── uses Result types from main

@esteban-url/trailhead-cli/filesystem
└── uses Result types from main

@esteban-url/trailhead-cli/config
├── uses Result types from main
└── re-exports zod

@esteban-url/trailhead-cli/prompts
└── re-exports @inquirer/prompts

@esteban-url/trailhead-cli/testing
├── uses Result types from main
└── can mock any other module

@esteban-url/trailhead-cli/utils
└── standalone utilities
```

## Common Issues

### Issue: Large bundle size despite using subpath imports

**Symptoms**: Bundle is still large even when using specific imports

**Solution**: Check for wildcard imports and ensure tree-shaking is working:

```typescript
// ❌ Prevents tree-shaking
import * as cli from '@esteban-url/trailhead-cli/command';
import { createCommand } from '@esteban-url/trailhead-cli/command'; // This is also included

// ✅ Proper tree-shaking
import {
  createCommand,
  executeWithPhases,
  executeWithDryRun,
  displaySummary,
} from '@esteban-url/trailhead-cli/command';
```

### Issue: TypeScript can't resolve subpath imports

**Cause**: Incorrect TypeScript configuration

**Solution**: Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler", // or "node16"
    "module": "ESNext",
    "target": "ES2022",
    "allowImportingTsExtensions": true
  }
}
```

### Common Mistakes

### 1. Importing from Wrong Location

```typescript
// ❌ WRONG
import { createCommand } from '@esteban-url/trailhead-cli';
import { createFileSystem } from '@esteban-url/trailhead-cli';

// ✅ CORRECT
import { createCommand } from '@esteban-url/trailhead-cli/command';
import { createFileSystem } from '@esteban-url/trailhead-cli/filesystem';
```

### 2. Over-importing

```typescript
// ❌ WRONG - Imports entire module
import * as cli from '@esteban-url/trailhead-cli/command';

// ✅ CORRECT - Import only what you need
import { createCommand, executeWithPhases } from '@esteban-url/trailhead-cli/command';
```

### 3. Mixing Import Styles

```typescript
// ❌ WRONG - Inconsistent
import { Ok } from '@esteban-url/trailhead-cli';
const { createCommand } = require('@esteban-url/trailhead-cli/command');

// ✅ CORRECT - Consistent ES modules
import { Ok } from '@esteban-url/trailhead-cli';
import { createCommand } from '@esteban-url/trailhead-cli/command';
```

## Complete Example

Here's a complete CLI application with optimized imports:

```typescript
// cli.ts - Main entry point
import { createCLI } from '@esteban-url/trailhead-cli';
import { buildCommand } from './commands/build.js';
import { devCommand } from './commands/dev.js';

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  commands: [buildCommand, devCommand],
});

export default cli;

// commands/build.ts - Build command
import { Ok, Err } from '@esteban-url/trailhead-cli';
import { createCommand } from '@esteban-url/trailhead-cli/command';
import type { CommandContext } from '@esteban-url/trailhead-cli/command';

export const buildCommand = createCommand({
  name: 'build',
  description: 'Build the project',
  async action(options, context: CommandContext) {
    // Lazy load file system operations
    const { createFileSystem } = await import('@esteban-url/trailhead-cli/filesystem');
    const fs = createFileSystem();

    const result = await fs.readFile('package.json');
    if (!result.success) {
      return Err(new Error('package.json not found'));
    }

    context.logger.success('Build completed!');
    return Ok(undefined);
  },
});

// commands/dev.ts - Development command with interactive features
import { Ok } from '@esteban-url/trailhead-cli';
import { createCommand } from '@esteban-url/trailhead-cli/command';
import type { CommandContext } from '@esteban-url/trailhead-cli/command';

export const devCommand = createCommand({
  name: 'dev',
  description: 'Start development server',
  options: [{ name: 'interactive', type: 'boolean', default: false }],
  async action(options, context: CommandContext) {
    if (options.interactive) {
      // Only load prompts when needed
      const { select } = await import('@esteban-url/trailhead-cli/prompts');

      const mode = await select({
        message: 'Choose development mode:',
        choices: ['fast', 'full', 'debug'],
      });

      context.logger.info(`Starting in ${mode} mode`);
    }

    context.logger.success('Development server started!');
    return Ok(undefined);
  },
});
```

## Testing

Verify your import optimization:

```bash
# Analyze bundle size
npx esbuild src/cli.ts --bundle --analyze=verbose

# Check specific imports
npx esbuild src/cli.ts --bundle --metafile=meta.json
npx esbuild --analyze=verbose < meta.json
```

Expected results:

- Core imports: ~5-10KB
- With filesystem: ~15-20KB
- With prompts (lazy): ~5-10KB base + ~40KB when loaded

## Bundle Size Optimization

To verify your imports are optimized:

1. Use bundler analysis tools
2. Check that unused exports are not included
3. Verify subpath imports are resolved correctly

Example with esbuild:

```bash
esbuild src/index.ts --bundle --analyze=verbose
```

### Bundle Analysis Tools

```bash
# esbuild analysis
esbuild src/cli.ts --bundle --analyze=verbose

# webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/

# Check individual module sizes
du -sh node_modules/@esteban-url/trailhead-cli/dist/*
```

### TypeScript Configuration

Ensure your `tsconfig.json` supports subpath imports:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

## Related Tasks

- **[Performance Optimization](./optimization-guide.md)**: Further optimize your CLI performance
- **[Bundle Analysis](./bundle-analysis.md)**: Analyze and debug bundle size issues
- **[Module Loading](./module-loading.md)**: Advanced module loading patterns

## Reference

- [Package Exports Reference](../reference/api/index.md) - All available exports
- [Module Architecture](../reference/architecture.md) - How modules are structured
- [Build Configuration](../reference/build-config.md) - Bundler configurations

---

**See also**: [Architecture Explanation](../explanation/architecture.md) for understanding why subpath exports improve performance
