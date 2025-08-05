# Troubleshooting Guide

Solutions to common problems when building CLIs with the Trailhead framework.

## Installation Issues

### `pnpm create @esteban-url/cli` fails

**Problem**: Command not found or permission errors

**Solutions**:

1. Ensure Node.js 16+ is installed:

```bash
node --version  # Should show v16.0.0 or higher
```

2. Try with npx:

```bash
npx @esteban-url/create-cli my-project
```

3. Check npm registry:

```bash
npm config get registry  # Should be https://registry.npmjs.org/
```

### Dependencies fail to install

**Problem**: Network errors or version conflicts

**Solutions**:

1. Clear package manager cache:

```bash
pnpm store prune
# or
npm cache clean --force
```

2. Delete lock file and reinstall:

```bash
rm pnpm-lock.yaml
pnpm install
```

## Build Errors

### TypeScript compilation fails

**Problem**: Type errors when building

**Common causes and solutions**:

1. **Strict mode issues**:

```typescript
// Add type annotations
const result: Result<string, Error> = await readFile('data.txt')

// Handle all cases
if (result.isOk()) {
  // Use result.value
} else {
  // Handle result.error
}
```

2. **Module resolution**:

```typescript
// Use .js extension for local imports
import { myFunction } from './lib/utils.js' // ✓
import { myFunction } from './lib/utils' // ✗
```

### Build output missing

**Problem**: `dist/` directory not created

**Solutions**:

1. Check tsup configuration:

```typescript
// tsup.config.ts
export default {
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node16',
  clean: true,
}
```

2. Ensure build script is correct:

```json
{
  "scripts": {
    "build": "tsup"
  }
}
```

## Runtime Errors

### Command not found

**Problem**: CLI doesn't recognize your command

**Solutions**:

1. **Check command registration with Commander**:

```typescript
// src/index.ts
import { createCLI } from '@esteban-url/cli'
import { myCommand } from './commands/my-command.js'

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
})

// Register the command properly
cli
  .command(myCommand.name)
  .description(myCommand.description)
  .arguments(myCommand.arguments || '')
  .action(async (...args) => {
    const result = await myCommand.execute(args[args.length - 1], {
      args: args.slice(0, -1),
      logger: console,
    })
    if (result.isErr()) {
      process.exit(1)
    }
  })

cli.parse() // Don't forget to parse!
```

2. **Verify command export**:

```typescript
// src/commands/my-command.ts
export const myCommand = createCommand({
  // Must be exported
  name: 'my-command',
  description: 'My command description',
  action: async (options, context) => {
    // Implementation
    return ok(undefined)
  },
})
```

### Result type errors

**Problem**: "Property 'value' does not exist on type Result"

**Solution**: Always check Result status first:

```typescript
// Wrong
const content = readResult.value // ✗

// Correct
if (readResult.isOk()) {
  const content = readResult.value // ✓
}

// Or use type guards
const content = readResult.unwrapOr('default')
```

### Import errors

**Problem**: "Cannot find module" or "Module not found"

**Solutions**:

1. **Use correct import paths**:

```typescript
// Main package exports
import { createCLI } from '@esteban-url/cli'
import { ok, err } from '@esteban-url/core'
import { readFile, writeFile } from '@esteban-url/fs'

// Subpath exports - use exact paths from package.json
import { createCommand } from '@esteban-url/cli/command'
import { input, confirm } from '@esteban-url/cli/prompts'
import { createTestContext } from '@esteban-url/cli/testing'
import { SingleBar } from '@esteban-url/cli/progress'

// Local imports - always with .js extension
import { utils } from './lib/utils.js'
import { config } from './config/index.js'
```

2. **Common import mistakes**:

```typescript
// Wrong - these don't exist
import { defineArgs } from '@esteban-url/cli/args' // ✗
import { spinner } from '@esteban-url/cli/progress' // ✗

// Wrong - no index exports
import { readFile } from '@esteban-url/fs/index' // ✗

// Wrong - missing .js extension for local files
import { myHelper } from './helpers/util' // ✗
import { myHelper } from './helpers/util.js' // ✓
```

## Testing Issues

### Tests fail with import errors

**Problem**: Vitest can't resolve modules

**Solution**: Check vitest config:

```typescript
// vitest.config.ts
export default {
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}
```

### Mocking file operations

**Problem**: Tests interact with real file system

**Solution**: Use test utilities:

```typescript
import { createTestContextWithFiles } from '@esteban-url/cli/testing'

// Create a test context with virtual files
const context = await createTestContextWithFiles({
  'data/test.json': JSON.stringify({ test: true }),
  'config.yml': 'apiUrl: http://localhost:3000',
})

// The context includes a temp directory with these files
const result = await myCommand.execute(options, context)

// Or manually mock file operations
import { vi } from 'vitest'
import * as fs from '@esteban-url/fs'

vi.mock('@esteban-url/fs', () => ({
  readFile: vi.fn().mockResolvedValue(ok('file content')),
  writeFile: vi.fn().mockResolvedValue(ok(undefined)),
  exists: vi.fn().mockResolvedValue(ok(true)),
}))
```

## Common Patterns

### Handling optional values

**Problem**: Dealing with undefined or null values

**Solution**: Use proper defaults and validation:

```typescript
// In command args
flags: z.object({
  config: z.string().optional().default('config.json'),
  timeout: z.number().optional().default(5000),
})

// In action
const configPath = flags.config ?? 'config.json'
const timeout = flags.timeout ?? 5000
```

### Async operation errors

**Problem**: Unhandled promise rejections

**Solution**: Always use Result types:

```typescript
import { fromThrowableAsync } from '@esteban-url/core'

// Instead of throwing
async function riskyOperation(): Promise<string> {
  throw new Error('Failed') // ✗
}

// Use Result-based file operations
async function safeFileOperation(path: string): Promise<Result<string, Error>> {
  return readFile(path, 'utf-8') // Already returns Result
}

// Wrap external async functions that might throw
const fetchData = fromThrowableAsync(async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
})

// Usage
const result = await fetchData('https://api.example.com/data')
if (result.isError()) {
  logger.error(`Failed to fetch: ${result.error.message}`)
}
```

### Path resolution issues

**Problem**: Relative paths not working as expected

**Solution**: Use proper path resolution:

```typescript
import { resolve } from 'path'

// Get absolute path from CLI's working directory
const absolutePath = resolve(process.cwd(), relativePath)

// Use in file operations
const result = await readFile(absolutePath)
```

## Performance Issues

### Slow startup time

**Problem**: CLI takes too long to start

**Solutions**:

1. **Lazy load commands**:

```typescript
// Instead of importing all commands at top
const commands = [
  {
    name: 'heavy-command',
    load: () => import('./commands/heavy-command.js'),
  },
]
```

2. **Optimize dependencies**:

```bash
# Check bundle size
pnpm build
ls -lh dist/

# Use bundlephobia.com to check dependency sizes
```

### Memory usage

**Problem**: Processing large files causes out of memory errors

**Solution**: Use streaming:

```typescript
import { createReadStream } from 'fs'
import { pipeline } from 'stream/promises'

async function processLargeFile(path: string) {
  const stream = createReadStream(path, { encoding: 'utf8' })

  // Process in chunks
  for await (const chunk of stream) {
    // Process chunk
  }
}
```

## Debugging Tips

### Enable verbose logging

Set environment variable:

```bash
DEBUG=* ./bin/cli.js my-command
```

Or add debug flag:

```typescript
if (flags.verbose) {
  logger.debug('Options:', options)
  logger.debug('Context:', context)
}
```

### Inspect Result values

```typescript
// Helper to log Result details
function debugResult<T, E>(result: Result<T, E>, label: string) {
  if (result.isOk()) {
    logger.debug(`${label} - OK:`, result.value)
  } else {
    logger.debug(`${label} - Error:`, result.error)
  }
  return result
}

// Usage
const result = await readFile('data.json')
debugResult(result, 'File read')
```

## Getting Help

1. **Check the tutorial**: [From CSV Hell to CLI Heaven](../tutorials/csv-hell-to-cli-heaven.md)
2. **Review examples**: Look at the example commands in the generated project
3. **Read API docs**: [API Reference](../reference/api/)
4. **GitHub issues**: Report bugs at [github.com/esteban-url/trailhead](https://github.com/esteban-url/trailhead/issues)
