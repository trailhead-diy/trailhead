---
type: tutorial
title: "Migrate to @trailhead/cli from Other Frameworks"
description: "Step-by-step migration from class-based CLI frameworks to functional approach"
prerequisites:
  - Existing CLI application to migrate
  - Basic TypeScript knowledge
  - Understanding of Promise/async patterns
related:
  - /docs/reference/api/command
  - /docs/explanation/design-decisions
  - /docs/how-to/functional-patterns
---

# Migrate to @trailhead/cli from Other Frameworks

In this tutorial, you'll migrate an existing CLI application from a class-based framework to @trailhead/cli's functional approach. By the end, you'll have a fully functional CLI using Result types and functional patterns.

## What You'll Accomplish

Transform a traditional class-based CLI into:
- Functional commands with explicit error handling
- Result types instead of try/catch blocks
- Composable operations with pure functions
- Comprehensive testing with built-in utilities

## Before You Begin

Make sure you have:
- An existing CLI application to migrate
- Basic understanding of TypeScript
- Familiarity with Promise/async patterns

This tutorial takes approximately 30 minutes to complete.

## From Class-Based CLI Frameworks

### Before: Class-Based Commands

```typescript
// ❌ Traditional class-based command
import { Command } from 'old-cli-framework';

class BuildCommand extends Command {
  static description = 'Build the project';
  
  async run() {
    try {
      const files = await this.readFiles();
      await this.processFiles(files);
      this.log('Build complete');
    } catch (error) {
      this.error(error.message);
    }
  }
  
  private async readFiles() {
    // Implementation
  }
  
  private async processFiles(files: string[]) {
    // Implementation
  }
}
```

### After: Functional Commands

```typescript
// ✅ @trailhead/cli functional command
import type { Command } from '@trailhead/cli/command';
import type { Result } from '@trailhead/cli';
import { Ok, Err } from '@trailhead/cli';

const buildCommand: Command = {
  name: 'build',
  description: 'Build the project',
  execute: async (options, context) => {
    const filesResult = await readFiles(context.fs);
    if (!filesResult.success) return filesResult;
    
    const processResult = await processFiles(filesResult.value, context);
    if (!processResult.success) return processResult;
    
    context.logger.success('Build complete');
    return Ok(undefined);
  }
};

// Pure functions - easy to test
const readFiles = async (fs: FileSystem): Promise<Result<string[]>> => {
  // Implementation with Result types
};

const processFiles = async (files: string[], context: CommandContext): Promise<Result<void>> => {
  // Implementation with Result types
};
```

## From Commander.js

### Before: Commander.js Style

```typescript
// ❌ Commander.js
import { Command } from 'commander';
const program = new Command();

program
  .name('mycli')
  .description('CLI to do things')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize project')
  .option('-t, --template <type>', 'project template')
  .action(async (options) => {
    try {
      // Command logic with potential throws
      console.log('Project initialized');
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
```

### After: @trailhead/cli Style

```typescript
// ✅ @trailhead/cli
import { createCLI } from '@trailhead/cli';
import type { Command } from '@trailhead/cli/command';
import { Ok, Err } from '@trailhead/cli';

const initCommand: Command<{ template?: string }> = {
  name: 'init',
  description: 'Initialize project',
  options: [
    {
      name: 'template',
      alias: 't',
      description: 'Project template',
      type: 'string'
    }
  ],
  execute: async (options, context) => {
    // Command logic with Result types
    const result = await initializeProject(options.template, context);
    if (!result.success) return result;
    
    context.logger.success('Project initialized');
    return Ok(undefined);
  }
};

const cli = createCLI({
  name: 'mycli',
  version: '1.0.0',
  description: 'CLI to do things',
  commands: [initCommand]
});

// Graceful error handling - no process.exit
cli.run(process.argv);
```

## From Oclif

### Before: Oclif Commands

```typescript
// ❌ Oclif
import { Command, Flags } from '@oclif/core';

export default class Deploy extends Command {
  static description = 'Deploy application';
  static flags = {
    environment: Flags.string({ char: 'e', required: true }),
    verbose: Flags.boolean({ char: 'v' })
  };
  
  async run(): Promise<void> {
    const { flags } = await this.parse(Deploy);
    
    try {
      await this.deploy(flags.environment);
      this.log('Deployment successful');
    } catch (error) {
      this.error(error.message, { exit: 1 });
    }
  }
  
  private async deploy(env: string): Promise<void> {
    // Implementation
  }
}
```

### After: @trailhead/cli Style

```typescript
// ✅ @trailhead/cli
import type { Command } from '@trailhead/cli/command';
import { Ok, Err } from '@trailhead/cli';

interface DeployOptions {
  environment: string;
  verbose?: boolean;
}

const deployCommand: Command<DeployOptions> = {
  name: 'deploy',
  description: 'Deploy application',
  options: [
    {
      name: 'environment',
      alias: 'e',
      description: 'Target environment',
      type: 'string',
      required: true
    },
    {
      name: 'verbose',
      alias: 'v',
      description: 'Verbose output',
      type: 'boolean'
    }
  ],
  execute: async (options, context) => {
    const result = await deployApp(options.environment, context);
    if (!result.success) return result;
    
    context.logger.success('Deployment successful');
    return Ok(undefined);
  }
};

// Testable pure function
const deployApp = async (env: string, context: CommandContext): Promise<Result<void>> => {
  // Implementation with Result types
};
```

## From Yargs

### Before: Yargs Style

```typescript
// ❌ Yargs
import yargs from 'yargs';

yargs
  .command(
    'generate <type>',
    'Generate code',
    (yargs) => {
      return yargs
        .positional('type', {
          describe: 'Type to generate',
          type: 'string'
        })
        .option('name', {
          alias: 'n',
          type: 'string',
          description: 'Name of the generated item'
        });
    },
    async (argv) => {
      try {
        await generateCode(argv.type, argv.name);
        console.log('Generation complete');
      } catch (error) {
        console.error('Generation failed:', error.message);
        process.exit(1);
      }
    }
  )
  .demandCommand(1)
  .parse();
```

### After: @trailhead/cli Style

```typescript
// ✅ @trailhead/cli
import type { Command } from '@trailhead/cli/command';
import { Ok, Err } from '@trailhead/cli';

interface GenerateOptions {
  type: string;
  name?: string;
}

const generateCommand: Command<GenerateOptions> = {
  name: 'generate',
  description: 'Generate code',
  options: [
    {
      name: 'type',
      description: 'Type to generate',
      type: 'string',
      required: true
    },
    {
      name: 'name',
      alias: 'n',
      description: 'Name of the generated item',
      type: 'string'
    }
  ],
  execute: async (options, context) => {
    const result = await generateCode(options.type, options.name, context);
    if (!result.success) return result;
    
    context.logger.success('Generation complete');
    return Ok(undefined);
  }
};
```

## Error Handling Migration

### Before: Exception-Based

```typescript
// ❌ Throws exceptions
async function readConfig(path: string): Promise<Config> {
  if (!fs.existsSync(path)) {
    throw new Error(`Config file not found: ${path}`);
  }
  
  const content = fs.readFileSync(path, 'utf8');
  const parsed = JSON.parse(content); // Might throw
  
  if (!isValidConfig(parsed)) {
    throw new Error('Invalid configuration');
  }
  
  return parsed;
}

// Caller must handle with try/catch
try {
  const config = await readConfig('config.json');
  // Use config
} catch (error) {
  console.error(error.message);
}
```

### After: Result-Based

```typescript
// ✅ Returns Results
import { Ok, Err } from '@trailhead/cli';
import type { Result } from '@trailhead/cli';
import type { FileSystem } from '@trailhead/cli/filesystem';

async function readConfig(path: string, fs: FileSystem): Promise<Result<Config>> {
  const existsResult = await fs.exists(path);
  if (!existsResult.success) return existsResult;
  if (!existsResult.value) {
    return Err(new Error(`Config file not found: ${path}`));
  }
  
  const contentResult = await fs.readFile(path);
  if (!contentResult.success) return contentResult;
  
  try {
    const parsed = JSON.parse(contentResult.value);
    
    if (!isValidConfig(parsed)) {
      return Err(new Error('Invalid configuration'));
    }
    
    return Ok(parsed);
  } catch (error) {
    return Err(new Error(`Invalid JSON: ${error.message}`));
  }
}

// Caller handles explicitly
const configResult = await readConfig('config.json', context.fs);
if (!configResult.success) {
  context.logger.error(configResult.error.message);
  return configResult;
}

const config = configResult.value;
// Use config safely
```

## File Operations Migration

### Before: Direct fs Usage

```typescript
// ❌ Direct Node.js fs
import fs from 'fs/promises';
import path from 'path';

async function createProject(name: string) {
  const projectDir = path.join(process.cwd(), name);
  
  await fs.mkdir(projectDir, { recursive: true });
  await fs.writeFile(
    path.join(projectDir, 'package.json'),
    JSON.stringify({ name, version: '1.0.0' }, null, 2)
  );
  
  // Hard to test without creating real files
}
```

### After: FileSystem Abstraction

```typescript
// ✅ FileSystem abstraction
import type { FileSystem } from '@trailhead/cli/filesystem';
import type { Result } from '@trailhead/cli';
import { Ok, Err } from '@trailhead/cli';

async function createProject(name: string, fs: FileSystem): Promise<Result<void>> {
  const projectDir = await fs.join(await fs.cwd(), name);
  
  const mkdirResult = await fs.mkdir(projectDir, { recursive: true });
  if (!mkdirResult.success) return mkdirResult;
  
  const packageJsonPath = await fs.join(projectDir, 'package.json');
  const packageJson = { name, version: '1.0.0' };
  
  const writeResult = await fs.writeJson(packageJsonPath, packageJson);
  if (!writeResult.success) return writeResult;
  
  return Ok(undefined);
}

// Easy to test with memory filesystem
const memoryFs = mockFileSystem();
const result = await createProject('test-project', memoryFs);
```

## Testing Migration

### Before: Complex Test Setup

```typescript
// ❌ Hard to test
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';

test('creates project', async () => {
  // Create temporary directory
  const tempDir = join(tmpdir(), `test-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  
  // Change working directory
  const originalCwd = process.cwd();
  process.chdir(tempDir);
  
  try {
    // Run command
    await createProject('my-app');
    
    // Check files exist
    const packageJson = await readFile(join(tempDir, 'my-app', 'package.json'), 'utf8');
    expect(JSON.parse(packageJson).name).toBe('my-app');
  } finally {
    // Cleanup
    process.chdir(originalCwd);
    await rm(tempDir, { recursive: true, force: true });
  }
});
```

### After: Simple Test Setup

```typescript
// ✅ Easy to test
import { createTestContext, mockFileSystem, expectResult } from '@trailhead/cli/testing';

test('creates project', async () => {
  const fs = mockFileSystem();
  const context = createTestContext({ filesystem: fs });
  
  const result = await createProjectCommand.execute(
    { name: 'my-app' },
    context
  );
  
  expectResult(result);
  
  // Check files in memory
  const packageJsonResult = await fs.readJson('my-app/package.json');
  const packageJson = expectResult(packageJsonResult);
  expect(packageJson.name).toBe('my-app');
});
```

## Configuration Migration

### Before: Manual Validation

```typescript
// ❌ Manual validation
interface Config {
  port: number;
  host: string;
  debug: boolean;
}

function loadConfig(data: any): Config {
  if (typeof data.port !== 'number' || data.port < 1 || data.port > 65535) {
    throw new Error('Invalid port');
  }
  
  if (typeof data.host !== 'string' || data.host.length === 0) {
    throw new Error('Invalid host');
  }
  
  return {
    port: data.port,
    host: data.host,
    debug: Boolean(data.debug)
  };
}
```

### After: Schema-Based Validation

```typescript
// ✅ Schema validation
import { defineConfig } from '@trailhead/cli/config';
import { z } from 'zod';

const ConfigSchema = z.object({
  port: z.number().min(1).max(65535),
  host: z.string().min(1),
  debug: z.boolean().default(false)
});

const config = defineConfig(ConfigSchema);

// Usage
const result = await config.load('config.json', context.fs);
if (!result.success) {
  // Detailed validation errors
  context.logger.error(result.error.message);
  return result;
}

// Fully typed configuration
const { port, host, debug } = result.value;
```

## Step-by-Step Migration

### 1. Install @trailhead/cli

```bash
npm install @trailhead/cli
# or
pnpm add @trailhead/cli
# or
yarn add @trailhead/cli
```

### 2. Convert Commands One by One

Start with your simplest command:

```typescript
// Create new command file
import type { Command } from '@trailhead/cli/command';
import { Ok } from '@trailhead/cli';

const myCommand: Command = {
  name: 'my-command',
  description: 'Description of command',
  execute: async (options, context) => {
    // Convert your existing logic
    context.logger.info('Command executed');
    return Ok(undefined);
  }
};

export { myCommand };
```

### 3. Update Error Handling

Replace try/catch with Result types:

```typescript
// Before
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  throw error;
}

// After
const result = await riskyOperation();
if (!result.success) return result;
return Ok(result.value);
```

### 4. Abstract File Operations

Replace direct fs calls with FileSystem:

```typescript
// Before
import fs from 'fs/promises';
const content = await fs.readFile(path, 'utf8');

// After
const result = await context.fs.readFile(path);
if (!result.success) return result;
const content = result.value;
```

### 5. Add Type Safety

Define option interfaces:

```typescript
interface MyCommandOptions {
  input: string;
  output?: string;
  verbose?: boolean;
}

const myCommand: Command<MyCommandOptions> = {
  // Command definition
};
```

### 6. Write Tests

Add tests using the testing utilities:

```typescript
import { createTestContext, expectResult } from '@trailhead/cli/testing';

test('my command works', async () => {
  const context = createTestContext();
  const result = await myCommand.execute({}, context);
  expectResult(result);
});
```

### 7. Update Main CLI File

```typescript
import { createCLI } from '@trailhead/cli';
import { myCommand } from './commands/my-command.js';

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My CLI application',
  commands: [myCommand]
});

cli.run(process.argv);
```

## Common Gotchas

### 1. Forgetting to Handle Results

```typescript
// ❌ Don't ignore Results
const result = await someOperation();
const value = result.value; // Might be undefined if error!

// ✅ Always check success first
const result = await someOperation();
if (!result.success) return result;
const value = result.value; // Safe to use
```

### 2. Using process.exit()

```typescript
// ❌ Don't use process.exit
if (error) {
  console.error(error.message);
  process.exit(1);
}

// ✅ Return error Results
if (error) {
  return Err(error);
}
```

### 3. Mixing Async Patterns

```typescript
// ❌ Don't mix callbacks and Promises
fs.readFile(path, (err, data) => {
  if (err) return callback(err);
  callback(null, data);
});

// ✅ Use Result-based async functions
const result = await fs.readFile(path);
if (!result.success) return result;
return Ok(result.value);
```

## Benefits After Migration

- **Better error handling**: Explicit error types and handling
- **Easier testing**: Mock all dependencies easily
- **Type safety**: Full TypeScript support
- **Smaller bundles**: Tree-shakeable subpath exports
- **Functional style**: Easier to reason about and compose
- **No classes**: Simpler mental model

## Need Help?

If you encounter issues during migration:

1. Check the [API Reference](../reference/) for specific functions
2. Look at [examples](../examples/) for patterns
3. Review [common patterns](../how-to/common-patterns.md)
4. See [troubleshooting guide](../troubleshooting.md)

## See Also

- [Getting Started](../getting-started.md) - Basic setup
- [Architecture](../explanation/architecture.md) - Design philosophy  
- [Design Decisions](../explanation/design-decisions.md) - Why we made these choices
- [Import Patterns](../how-to/import-patterns.md) - Using subpath exports