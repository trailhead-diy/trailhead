---
type: how-to
title: "How to Optimize CLI Performance"
description: "Optimize your @esteban-url/trailhead-cli applications for better performance, smaller bundle size, and improved user experience"
prerequisites:
  - "@esteban-url/trailhead-cli application built"
  - "Basic understanding of bundlers"
  - "Node.js performance concepts"
  - "Profiling tools knowledge"
related:
  - "/docs/how-to/import-patterns"
  - "/docs/reference/api/utils"
---

# How to Optimize CLI Performance

This guide shows you how to optimize your @esteban-url/trailhead-cli applications across multiple dimensions: bundle size, runtime performance, and user experience.

## Prerequisites

Before optimizing your CLI, ensure you have:

- A working @esteban-url/trailhead-cli application
- Access to bundler analysis tools (esbuild, webpack-bundle-analyzer)
- Basic understanding of JavaScript performance
- Profiling tools installed (Node.js --prof, clinic.js)

## Solution

### Method 1: Bundle Size Optimization (Most Impact)

Start with import optimization as it provides the biggest wins:

```typescript
// ❌ Imports entire package (large bundle)
import { createCLI, Ok, Err, createCommand } from "@esteban-url/trailhead-cli";

// ✅ Import only what you need (minimal bundle)
import { createCLI, Ok, Err } from "@esteban-url/trailhead-cli";
import { createCommand } from "@esteban-url/trailhead-cli/command";
```

**Bundle size comparison:**

- Full package import: ~150KB
- Targeted imports: ~25KB
- Savings: **83% smaller bundle**

**Key points:**

- Use subpath imports for each module
- Lazy load heavy dependencies
- Enable tree-shaking in your bundler

### Lazy Load Heavy Dependencies

Load expensive modules only when needed:

```typescript
// ❌ Always loads inquirer (heavy)
import { multiselect } from "@esteban-url/trailhead-cli/prompts";

const command: Command = {
  execute: async (options, context) => {
    if (options.interactive) {
      const choices = await multiselect({
        /* config */
      });
    }
    // Regular logic
  },
};

// ✅ Load prompts only when needed
const command: Command = {
  execute: async (options, context) => {
    if (options.interactive) {
      const { multiselect } = await import(
        "@esteban-url/trailhead-cli/prompts"
      );
      const choices = await multiselect({
        /* config */
      });
    }
    // Regular logic
  },
};
```

### Optimize FileSystem Operations

```typescript
// ❌ Loads filesystem even for help commands
import type { FileSystem } from "@esteban-url/trailhead-cli/filesystem";

// ✅ Use context.fs (provided by framework)
const command: Command = {
  execute: async (options, context) => {
    // context.fs is already optimized
    const result = await context.fs.readFile("config.json");
  },
};
```

### Tree-Shaking Best Practices

```typescript
// ❌ Imports that prevent tree-shaking
import * as utils from "@esteban-url/trailhead-cli/utils";
import { createSpinner } from "@esteban-url/trailhead-cli/utils";
const chalk = require("chalk"); // CommonJS prevents optimization

// ✅ Tree-shake friendly imports
import { createSpinner } from "@esteban-url/trailhead-cli/utils";
import { chalk } from "@esteban-url/trailhead-cli/utils"; // Re-exported ES modules
```

### Method 2: Runtime Performance Optimization

### Minimize Startup Time

```typescript
// ❌ Heavy operations during import
const config = loadComplexConfig(); // Blocks startup
const cache = new Map(expensiveData); // Memory allocation

const command: Command = {
  execute: async (options, context) => {
    // Uses pre-loaded data
  },
};

// ✅ Lazy initialization
let configCache: Config | null = null;

const command: Command = {
  execute: async (options, context) => {
    // Load only when needed
    if (!configCache) {
      const result = await loadConfig(context.fs);
      if (!result.success) return result;
      configCache = result.value;
    }
    // Use cached config
  },
};
```

### Efficient Error Handling

```typescript
// ❌ Exception-based flow control (slow)
try {
  const config = await loadConfig();
  const data = await processData(config);
  const result = await saveResult(data);
} catch (error) {
  // Handle any error
}

// ✅ Early returns with Results (fast)
const configResult = await loadConfig();
if (!configResult.success) return configResult;

const dataResult = await processData(configResult.value);
if (!dataResult.success) return dataResult;

return saveResult(dataResult.value);
```

### Parallel Operations

```typescript
// ❌ Sequential processing (slow)
const files = ["a.txt", "b.txt", "c.txt"];
const results = [];
for (const file of files) {
  const result = await processFile(file, context.fs);
  results.push(result);
}

// ✅ Parallel processing (fast)
const files = ["a.txt", "b.txt", "c.txt"];
const results = await Promise.all(
  files.map((file) => processFile(file, context.fs)),
);

// ✅ Controlled concurrency (balanced)
import pLimit from "p-limit";
const limit = pLimit(3); // Max 3 concurrent operations

const results = await Promise.all(
  files.map((file) => limit(() => processFile(file, context.fs))),
);
```

### Memory Management

```typescript
// ❌ Memory leaks
const cache = new Map(); // Never cleared
let fileHandles = []; // Accumulates handles

const processLargeFile = async (path: string) => {
  const content = await fs.readFile(path); // Entire file in memory
  return processContent(content);
};

// ✅ Proper cleanup
const cache = new Map();
const MAX_CACHE_SIZE = 100;

const processLargeFile = async (path: string, fs: FileSystem) => {
  // Stream processing for large files
  const stream = await fs.createReadStream(path);
  try {
    return await processStream(stream);
  } finally {
    stream.destroy(); // Cleanup
  }
};

// Clear cache when it gets too large
if (cache.size > MAX_CACHE_SIZE) {
  cache.clear();
}
```

## Common Variations

### Variation 1: User Experience Optimization

#### Progressive Loading

```typescript
const command: Command = {
  execute: async (options, context) => {
    const spinner = createSpinner("Initializing...");

    // Show immediate feedback
    const configResult = await context.fs.readFile("config.json");
    if (!configResult.success) {
      spinner.fail("Config not found");
      return configResult;
    }

    spinner.text = "Processing data...";
    const processed = await processData(configResult.value);
    if (!processed.success) {
      spinner.fail("Processing failed");
      return processed;
    }

    spinner.succeed("Complete!");
    return Ok(undefined);
  },
};
```

### Intelligent Defaults

```typescript
// ❌ Require user to specify everything
const command: Command = {
  options: [
    { name: "input", required: true },
    { name: "output", required: true },
    { name: "format", required: true },
    { name: "compression", required: true },
  ],
};

// ✅ Smart defaults
const command: Command = {
  options: [
    { name: "input", required: true },
    { name: "output", default: "./output" }, // Sensible default
    { name: "format", default: "json" }, // Common format
    { name: "compression", default: "auto" }, // Auto-detect
  ],
  execute: async (options, context) => {
    // Auto-detect output from input if not specified
    const output =
      options.output === "./output"
        ? `${options.input}.processed`
        : options.output;
  },
};
```

### Caching Strategies

```typescript
// File-based caching
const getCachedData = async (
  key: string,
  fs: FileSystem,
): Promise<Result<any>> => {
  const cacheFile = `.cache/${key}.json`;

  // Check cache first
  const cached = await fs.readJson(cacheFile);
  if (cached.success) {
    const data = cached.value;
    const age = Date.now() - data.timestamp;

    // Use cache if less than 1 hour old
    if (age < 60 * 60 * 1000) {
      return Ok(data.value);
    }
  }

  // Cache miss or expired - fetch fresh data
  const fresh = await fetchFreshData(key);
  if (!fresh.success) return fresh;

  // Save to cache
  await fs.writeJson(cacheFile, {
    timestamp: Date.now(),
    value: fresh.value,
  });

  return fresh;
};

// Memory caching with LRU
import { LRUCache } from "lru-cache";

const memoryCache = new LRUCache<string, any>({
  max: 100, // Max 100 items
  ttl: 10 * 60 * 1000, // 10 minutes
});

const getCachedInMemory = async (key: string): Promise<any | null> => {
  return memoryCache.get(key) || null;
};
```

### Variation 2: Development Optimization

#### Fast Development Builds

```typescript
// tsconfig.json for development
{
  "compilerOptions": {
    "target": "ES2022", // Modern target for speed
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true, // Skip emit in dev
    "incremental": true, // Faster rebuilds
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}

// Use tsx for development
{
  "scripts": {
    "dev": "tsx src/cli.ts", // No build step
    "build": "tsc",
    "start": "node dist/cli.js"
  }
}
```

### Testing Performance

```typescript
// ❌ Slow tests with real I/O
test("processes files", async () => {
  await fs.writeFile("/tmp/test.txt", "content");
  const result = await command.execute({ input: "/tmp/test.txt" });
  const output = await fs.readFile("/tmp/output.txt");
  // Cleanup...
});

// ✅ Fast tests with memory filesystem
import {
  mockFileSystem,
  createTestContext,
} from "@esteban-url/trailhead-cli/testing";

test("processes files", async () => {
  const fs = mockFileSystem({
    "test.txt": "content",
  });

  const context = createTestContext({ filesystem: fs });
  const result = await command.execute({ input: "test.txt" }, context);

  const output = await fs.readFile("output.txt");
  // No cleanup needed - memory only
});
```

### Variation 3: Production Optimization

#### Build Configuration

```typescript
// esbuild configuration for optimal bundles
import { build } from "esbuild";

await build({
  entryPoints: ["src/cli.ts"],
  bundle: true,
  minify: true,
  target: "node18",
  platform: "node",
  format: "esm",
  outfile: "dist/cli.js",
  external: [
    // Keep heavy dependencies external
    "@inquirer/prompts",
    "chalk",
  ],
  treeShaking: true,
  // Analyze bundle
  metafile: true,
  write: false,
}).then((result) => {
  // Analyze what's in your bundle
  console.log(require("esbuild").analyzeMetafile(result.metafile));
});
```

### Error Reporting

```typescript
// Efficient error collection
const errors: Error[] = [];
const warnings: string[] = [];

const command: Command = {
  execute: async (options, context) => {
    const results = await Promise.allSettled([
      operation1(),
      operation2(),
      operation3(),
    ]);

    // Collect all errors at once
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        errors.push(
          new Error(`Operation ${index + 1} failed: ${result.reason}`),
        );
      }
    });

    if (errors.length > 0) {
      // Report all errors together
      context.logger.error(`${errors.length} operations failed:`);
      errors.forEach((err) => context.logger.error(`  - ${err.message}`));
      return Err(new Error(`${errors.length} operations failed`));
    }

    return Ok(undefined);
  },
};
```

### Variation 4: Monitoring and Profiling

#### Performance Monitoring

```typescript
import { createStats } from "@esteban-url/trailhead-cli/utils";

const command: Command = {
  execute: async (options, context) => {
    const stats = createStats();

    stats.startTimer("total");
    stats.startTimer("config-load");

    const config = await loadConfig();
    stats.endTimer("config-load");

    stats.startTimer("processing");
    const result = await processData(config);
    stats.endTimer("processing");

    stats.endTimer("total");

    if (context.verbose) {
      const summary = stats.getSummary();
      context.logger.info(
        `Performance: ${JSON.stringify(summary.timers, null, 2)}`,
      );
    }

    return result;
  },
};
```

### Bundle Analysis

```bash
# Analyze your bundle size
npx esbuild src/cli.ts --bundle --minify --analyze

# Check what's using space
npx webpack-bundle-analyzer dist/

# Profile Node.js performance
node --prof dist/cli.js large-operation
node --prof-process isolate-*.log > profile.txt
```

### Memory Profiling

```typescript
// Memory usage monitoring
const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024) + "MB",
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + "MB",
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + "MB",
  };
};

const command: Command = {
  execute: async (options, context) => {
    if (context.verbose) {
      context.logger.info(`Memory start: ${JSON.stringify(getMemoryUsage())}`);
    }

    // Your operations...

    if (context.verbose) {
      context.logger.info(`Memory end: ${JSON.stringify(getMemoryUsage())}`);
    }
  },
};
```

## Common Issues

### Issue: Slow CLI startup time

**Symptoms**: CLI takes more than 200ms to show help or start execution

**Solution**: Implement lazy loading and reduce startup dependencies:

```typescript
// ❌ Heavy imports at startup
import { complexOperation } from "./heavy-module";
import "@inquirer/prompts"; // Loads even for simple commands

const cli = createCLI({
  commands: [
    /* all commands loaded upfront */
  ],
});

// ✅ Lazy loading approach
const cli = createCLI({
  commands: [
    // Load commands dynamically
    {
      name: "build",
      description: "Build the project",
      async action(options, context) {
        const { buildCommand } = await import("./commands/build.js");
        return buildCommand.action(options, context);
      },
    },
  ],
});
```

### Issue: Memory leaks during long operations

**Symptoms**: Memory usage grows continuously during file processing

**Cause**: Accumulating data in memory instead of streaming

**Solution**: Use streaming and proper cleanup:

```typescript
// ❌ Accumulates memory
const processFiles = async (files: string[]) => {
  const allContent = [];
  for (const file of files) {
    const content = await fs.readFile(file); // Keeps all in memory
    allContent.push(processContent(content));
  }
  return allContent;
};

// ✅ Streaming approach
const processFiles = async (files: string[], context: CommandContext) => {
  const results = [];
  for (const file of files) {
    const result = await fs.readFile(file);
    if (result.success) {
      const processed = await processAndSave(result.value);
      results.push(processed);
      // content goes out of scope and can be GC'd
    }
  }
  return results;
};
```

### Issue: Bundle size larger than expected

**Cause**: Importing entire modules or using non-tree-shakeable patterns

**Solution**: Follow import optimization patterns:

```typescript
// ❌ Large bundle
import * as cli from "@esteban-url/trailhead-cli";
import { inquirer } from "inquirer"; // Full inquirer package

// ✅ Optimized imports
import { createCLI, Ok, Err } from "@esteban-url/trailhead-cli";
import { prompt } from "@esteban-url/trailhead-cli/prompts"; // Re-exported optimized version
```

### Common Performance Pitfalls

#### 1. Synchronous Operations

```typescript
// ❌ Blocks event loop
const data = fs.readFileSync("large-file.json");
const parsed = JSON.parse(data);

// ✅ Non-blocking
const result = await fs.readFile("large-file.json");
if (!result.success) return result;
const parsed = JSON.parse(result.value);
```

### 2. Memory Leaks in Loops

```typescript
// ❌ Accumulates memory
const allResults = [];
for (const file of largeFileList) {
  const content = await fs.readFile(file); // Keeps all in memory
  allResults.push(processContent(content.value));
}

// ✅ Process and release
for (const file of largeFileList) {
  const content = await fs.readFile(file);
  if (content.success) {
    await processAndSave(content.value);
    // content goes out of scope and can be GC'd
  }
}
```

### 3. Inefficient String Building

```typescript
// ❌ Quadratic complexity
let output = "";
for (const item of items) {
  output += formatItem(item); // Creates new string each time
}

// ✅ Linear complexity
const parts = items.map(formatItem);
const output = parts.join("");
```

## Complete Example

Here's a fully optimized CLI application:

```typescript
// cli.ts - Optimized entry point
import { createCLI } from "@esteban-url/trailhead-cli";

// Lazy load commands to reduce startup time
const cli = createCLI({
  name: "optimized-cli",
  version: "1.0.0",
  commands: [
    {
      name: "process",
      description: "Process files efficiently",
      options: [
        { name: "input", type: "string", required: true },
        { name: "output", type: "string", default: "./output" },
        { name: "parallel", type: "number", default: 3 },
        { name: "profile", type: "boolean", default: false },
      ],
      async action(options, context) {
        // Lazy load the actual implementation
        const { processCommand } = await import("./commands/process.js");
        return processCommand(options, context);
      },
    },
  ],
});

export default cli;

// commands/process.ts - Optimized command implementation
import { Ok, Err } from "@esteban-url/trailhead-cli";
import type { CommandContext } from "@esteban-url/trailhead-cli/command";
import pLimit from "p-limit";

export async function processCommand(options: any, context: CommandContext) {
  // Optional performance monitoring
  let stats: any = null;
  if (options.profile) {
    const { createStats } = await import("@esteban-url/trailhead-cli/utils");
    stats = createStats();
    stats.startTimer("total");
  }

  // Controlled concurrency to prevent memory issues
  const limit = pLimit(options.parallel);

  // Lazy load filesystem when needed
  const { createFileSystem } = await import(
    "@esteban-url/trailhead-cli/filesystem"
  );
  const fs = createFileSystem();

  // Get file list
  const filesResult = await fs.glob(`${options.input}/**/*`);
  if (!filesResult.success) {
    return Err(new Error(`Failed to find files: ${filesResult.error.message}`));
  }

  const files = filesResult.value.filter((f) => f.endsWith(".txt"));

  // Process with progress indication
  const { createSpinner } = await import("@esteban-url/trailhead-cli/utils");
  const spinner = createSpinner(`Processing ${files.length} files...`);

  try {
    // Parallel processing with memory management
    const results = await Promise.all(
      files.map((file) =>
        limit(async () => {
          const content = await fs.readFile(file);
          if (!content.success) {
            context.logger.warning(`Skipped ${file}: ${content.error.message}`);
            return null;
          }

          // Process and immediately save to avoid memory accumulation
          const processed = processContent(content.value);
          const outputPath = `${options.output}/${file.replace(options.input, "").replace(".txt", ".processed.txt")}`;

          const saveResult = await fs.writeFile(outputPath, processed);
          return saveResult.success ? outputPath : null;
        }),
      ),
    );

    const successful = results.filter((r) => r !== null).length;
    spinner.succeed(`Processed ${successful}/${files.length} files`);

    // Performance reporting
    if (stats) {
      stats.endTimer("total");
      const summary = stats.getSummary();
      context.logger.info(
        `Performance: ${JSON.stringify(summary.timers, null, 2)}`,
      );
    }

    return Ok(undefined);
  } catch (error) {
    spinner.fail("Processing failed");
    return Err(new Error(`Processing failed: ${error.message}`));
  }
}

// Pure function for content processing
function processContent(content: string): string {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}
```

## Testing

Test your optimized CLI:

```bash
# Test with profiling
node dist/cli.js process --input ./test-files --output ./output --profile

# Test bundle size
npx esbuild src/cli.ts --bundle --minify --analyze

# Memory profiling
node --prof dist/cli.js process --input ./large-dataset
node --prof-process isolate-*.log > profile.txt
```

Expected results:

- Startup time: < 100ms
- Bundle size: < 50KB (without heavy dependencies)
- Memory usage: Stable during processing
- Processing speed: Scales with CPU cores

## Performance Checklist

### Bundle Size

- [ ] Using subpath imports (`@esteban-url/trailhead-cli/module`)
- [ ] No wildcard imports (`import *`)
- [ ] External dependencies are truly external
- [ ] Analyzed bundle with tools
- [ ] Tree-shaking working correctly

### Runtime Performance

- [ ] Async operations where possible
- [ ] Result types instead of exceptions
- [ ] Parallel processing for independent operations
- [ ] Proper memory cleanup
- [ ] Efficient data structures

### User Experience

- [ ] Fast startup time (< 100ms)
- [ ] Progress indicators for long operations
- [ ] Intelligent defaults
- [ ] Helpful error messages
- [ ] Responsive CLI (never blocks)

### Development Experience

- [ ] Fast test execution
- [ ] Quick development builds
- [ ] Good TypeScript performance
- [ ] Efficient watch mode

## Related Tasks

- **[Import Optimization](./import-patterns.md)**: Optimize your import patterns for smaller bundles
- **[Error Handling](./error-handling.md)**: Implement efficient error handling patterns
- **[Testing Performance](./testing-cli-apps.md)**: Write fast tests for optimized code

## Reference

- [Utils API Reference](../reference/api/utils.md) - Performance utilities and stats
- [FileSystem API Reference](../reference/api/filesystem.md) - Efficient file operations
- [Build Configuration](../reference/build-config.md) - Bundler optimization settings

### Optimization Tools

**Bundle Analysis:**

- [esbuild-analyzer](https://esbuild.github.io/analyze/)
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)

**Performance Profiling:**

- Node.js built-in profiler (`--prof`)
- [clinic.js](https://clinicjs.org/)
- [0x](https://github.com/davidmarkclements/0x)

**Memory Analysis:**

- Node.js built-in (`process.memoryUsage()`)
- [heapdump](https://github.com/bnoordhuis/node-heapdump)
- Chrome DevTools memory tab

---

**See also**: [Architecture Explanation](../explanation/architecture.md) for understanding the design decisions behind these optimizations
