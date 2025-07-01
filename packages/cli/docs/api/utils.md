# Utils Module API

The utils module provides styling, logging, spinners, and statistics tracking utilities for CLI applications.

## Import

```typescript
import {
  chalk,
  success,
  error,
  warning,
  createSpinner,
  createLogger,
  createStats,
} from "@trailhead/cli/utils";
```

## Terminal Styling

### chalk

Full [chalk](https://github.com/chalk/chalk) library for terminal styling.

```typescript
import { chalk } from "@trailhead/cli/utils";

console.log(chalk.blue("Information"));
console.log(chalk.red.bold("Error!"));
console.log(chalk.green.underline("Success"));
console.log(chalk.rgb(123, 45, 67).underline("Custom color"));
console.log(chalk.hex("#DEADED").bgHex("#000000")("Hex colors"));
```

### Pre-defined Colors

Semantic color functions for consistent styling:

```typescript
import {
  success, // Green
  error, // Red
  warning, // Yellow
  info, // Blue
  muted, // Gray
  bold, // Bold text
  dim, // Dimmed text
  italic, // Italic text
  underline, // Underlined text
} from "@trailhead/cli/utils";

// Usage
console.log(success("✓ Operation completed"));
console.log(error("✗ Operation failed"));
console.log(warning("⚠ Warning: Check configuration"));
console.log(info("ℹ Processing..."));
console.log(muted("Debug: Internal state"));

// Combine styles
console.log(bold(success("Important success!")));
console.log(dim(muted("Less important info")));
```

## Spinners

### createSpinner

Create loading spinners for long-running operations.

```typescript
import { createSpinner } from "@trailhead/cli/utils";

const spinner = createSpinner("Loading data...");
spinner.start();

try {
  const data = await fetchData();
  spinner.succeed("Data loaded successfully");
} catch (error) {
  spinner.fail("Failed to load data");
  throw error;
}
```

#### Spinner Methods

- `start()` - Start the spinner
- `stop()` - Stop without changing text
- `succeed(text?)` - Stop with success symbol
- `fail(text?)` - Stop with failure symbol
- `warn(text?)` - Stop with warning symbol
- `info(text?)` - Stop with info symbol

#### Spinner Properties

- `text` - Get/set spinner text
- `color` - Get/set spinner color
- `isSpinning` - Check if spinning

### withSpinner

Execute async function with automatic spinner management.

```typescript
import { withSpinner } from "@trailhead/cli/utils";

const result = await withSpinner("Processing files...", async () => {
  // Long running operation
  const files = await processFiles();
  return files;
});
// Spinner automatically succeeds or fails based on promise
```

### ora

Direct access to the [ora](https://github.com/sindresorhus/ora) library.

```typescript
import { ora } from "@trailhead/cli/utils";

const spinner = ora({
  text: "Custom spinner",
  spinner: "dots12",
  color: "yellow",
  hideCursor: true,
});
```

## Logger

### createLogger

Create a structured logger with semantic log levels.

```typescript
import { createLogger } from "@trailhead/cli/utils";

const logger = createLogger({
  verbose: true,
  prefix: "[MyApp]",
});

// Log methods
logger.info("Information message");
logger.success("Operation completed");
logger.warning("Warning message");
logger.error("Error occurred");
logger.debug("Debug information"); // Only shown if verbose: true
logger.step("Step 1 of 3");
```

#### Logger Options

- `verbose` (boolean) - Enable debug messages
- `prefix` (string) - Prefix for all messages
- `silent` (boolean) - Disable all output

#### Logger Methods

All methods accept a string message:

- `info(message)` - General information
- `success(message)` - Success messages (green)
- `warning(message)` - Warnings (yellow)
- `error(message)` - Errors (red)
- `debug(message)` - Debug info (only if verbose)
- `step(message)` - Step in a process

### Logger Type

```typescript
interface Logger {
  info: (message: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
  step: (message: string) => void;
}
```

## Statistics Tracking

### createStats

Track performance and statistics for operations.

```typescript
import { createStats } from "@trailhead/cli/utils";

const stats = createStats();

// Track operations
stats.increment("filesProcessed");
stats.increment("filesProcessed", 5); // Increment by 5
stats.record("processingTime", 150); // Record a value

// Get values
const processed = stats.get("filesProcessed"); // number
const times = stats.getAll("processingTime"); // number[]

// Calculate aggregates
const avgTime = stats.average("processingTime");
const totalFiles = stats.sum("filesProcessed");
```

### updateStats

Update existing stats tracker.

```typescript
import { updateStats } from "@trailhead/cli/utils";

const stats = createStats();

updateStats(stats, {
  filesProcessed: 10,
  errors: 2,
  duration: 1500,
});
```

### getElapsedTime

Get elapsed time since stats creation.

```typescript
import { getElapsedTime } from "@trailhead/cli/utils";

const stats = createStats();

// ... perform operations ...

const elapsed = getElapsedTime(stats); // milliseconds
console.log(`Completed in ${elapsed}ms`);
```

### formatStats

Format stats for display.

```typescript
import { formatStats } from "@trailhead/cli/utils";

const stats = createStats();
stats.increment("files", 42);
stats.increment("errors", 3);
stats.record("duration", 1234);

const formatted = formatStats(stats);
console.log(formatted);
// Output:
// Files: 42
// Errors: 3
// Duration: 1234ms
// Elapsed: 1.5s
```

### StatsTracker Type

```typescript
interface StatsTracker {
  metrics: Map<string, number[]>;
  startTime: number;

  increment(key: string, value?: number): void;
  record(key: string, value: number): void;
  get(key: string): number;
  getAll(key: string): number[];
  sum(key: string): number;
  average(key: string): number;
  reset(key?: string): void;
}
```

## Usage Patterns

### Progress Tracking

```typescript
async function processFiles(files: string[], context: CommandContext) {
  const stats = createStats();
  const spinner = createSpinner("Processing files...");
  spinner.start();

  for (const file of files) {
    try {
      await processFile(file);
      stats.increment("success");
    } catch (error) {
      stats.increment("errors");
      context.logger.warning(`Failed: ${file}`);
    }
  }

  const elapsed = getElapsedTime(stats);
  const successCount = stats.get("success");
  const errorCount = stats.get("errors");

  if (errorCount > 0) {
    spinner.warn(`Processed with ${errorCount} errors in ${elapsed}ms`);
  } else {
    spinner.succeed(`Processed ${successCount} files in ${elapsed}ms`);
  }

  // Display summary
  console.log(formatStats(stats));
}
```

### Styled Output

```typescript
function displayResults(results: ProcessResults) {
  console.log(bold("Processing Complete"));
  console.log();

  if (results.success.length > 0) {
    console.log(success(`✓ ${results.success.length} files processed`));
    results.success.forEach((file) => {
      console.log(dim(`  - ${file}`));
    });
  }

  if (results.errors.length > 0) {
    console.log();
    console.log(error(`✗ ${results.errors.length} errors`));
    results.errors.forEach(({ file, error }) => {
      console.log(error(`  - ${file}: ${error.message}`));
    });
  }

  console.log();
  console.log(muted(`Total time: ${results.duration}ms`));
}
```

### Multi-Step Operations

```typescript
async function deployApplication(context: CommandContext) {
  const logger = context.logger;

  logger.info(bold("Starting deployment..."));

  // Step 1: Build
  logger.step("Building application");
  const buildSpinner = createSpinner("Compiling TypeScript...");
  buildSpinner.start();

  try {
    await build();
    buildSpinner.succeed("Build completed");
  } catch (error) {
    buildSpinner.fail("Build failed");
    throw error;
  }

  // Step 2: Test
  logger.step("Running tests");
  const testResult = await withSpinner("Running test suite...", runTests);

  if (!testResult.success) {
    logger.error("Tests failed - deployment aborted");
    return err(new Error("Test failures"));
  }

  // Step 3: Deploy
  logger.step("Deploying to production");
  const deploySpinner = createSpinner("Uploading files...");
  deploySpinner.start();

  try {
    const result = await deploy();
    deploySpinner.succeed("Deployment successful");
    logger.success(bold(success("Application deployed!")));
    return ok(result);
  } catch (error) {
    deploySpinner.fail("Deployment failed");
    return err(error);
  }
}
```

### Performance Monitoring

```typescript
function createPerformanceTracker() {
  const stats = createStats();

  return {
    startOperation: (name: string) => {
      const start = Date.now();
      return () => {
        const duration = Date.now() - start;
        stats.record(name, duration);
      };
    },

    report: () => {
      console.log(bold("Performance Report"));
      console.log(dim("─".repeat(40)));

      for (const [key, values] of stats.metrics) {
        const avg = stats.average(key);
        const total = stats.sum(key);
        const count = values.length;

        console.log(`${key}:`);
        console.log(`  Count: ${count}`);
        console.log(`  Average: ${avg.toFixed(2)}ms`);
        console.log(`  Total: ${total}ms`);
      }
    },
  };
}

// Usage
const perf = createPerformanceTracker();

const endTimer = perf.startOperation("database-query");
const result = await queryDatabase();
endTimer();

perf.report();
```

### Custom Themes

```typescript
const theme = {
  primary: chalk.hex("#007ACC"),
  secondary: chalk.hex("#68217A"),
  accent: chalk.hex("#F0DB00"),

  title: (text: string) => bold(theme.primary(text)),
  subtitle: (text: string) => theme.secondary(text),
  highlight: (text: string) => theme.accent(underline(text)),
};

// Usage
console.log(theme.title("Welcome to MyApp"));
console.log(theme.subtitle("The best CLI tool"));
console.log(theme.highlight("Get started now!"));
```

## Best Practices

### 1. Use Semantic Colors

```typescript
// Good - semantic meaning
logger.success("Operation completed");
logger.error("Operation failed");
logger.warning("Deprecated option used");

// Avoid - arbitrary colors
console.log(chalk.magenta("Operation completed"));
console.log(chalk.cyan("Operation failed"));
```

### 2. Show Progress for Long Operations

```typescript
// Good - user sees progress
const spinner = createSpinner("Processing large dataset...");
spinner.start();
const result = await processDataset();
spinner.succeed(`Processed ${result.count} records`);

// Avoid - no feedback
const result = await processDataset(); // User waits with no feedback
```

### 3. Handle Spinner Failures

```typescript
const spinner = createSpinner("Connecting to server...");
spinner.start();

try {
  await connectToServer();
  spinner.succeed("Connected");
} catch (error) {
  spinner.fail("Connection failed");
  logger.error(error.message);
  // Handle error appropriately
} finally {
  // Ensure spinner is stopped
  if (spinner.isSpinning) {
    spinner.stop();
  }
}
```

### 4. Use Appropriate Log Levels

```typescript
logger.debug("Checking cache"); // Implementation details
logger.info("Processing file: data.json"); // General info
logger.step("Step 2 of 5: Validation"); // Process steps
logger.success("✓ All tests passed"); // Success
logger.warning("Config file missing, using defaults"); // Warnings
logger.error("Failed to parse JSON"); // Errors
```

### 5. Format Statistics Clearly

```typescript
const stats = createStats();
// ... operations ...

// Display formatted summary
console.log(bold("\nSummary:"));
console.log(dim("─".repeat(40)));
console.log(`${success("✓")} Processed: ${stats.get("processed")}`);
console.log(`${error("✗")} Failed: ${stats.get("failed")}`);
console.log(`${info("⏱")} Duration: ${getElapsedTime(stats)}ms`);
```

## Summary

The utils module provides:

- Terminal styling with chalk
- Loading spinners for async operations
- Structured logging with semantic levels
- Performance and statistics tracking
- Consistent visual feedback patterns

Use these utilities to create polished, user-friendly CLI applications.
