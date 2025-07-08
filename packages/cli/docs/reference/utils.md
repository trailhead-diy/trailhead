---
type: reference
title: 'Utils Module API Reference'
description: 'Styling, logging, spinners, and statistics tracking utilities for CLI applications'
related:
  - /docs/reference/api/command
  - /docs/reference/api/core
  - /docs/how-to/cli-styling
---

# Utils Module API Reference

Styling, logging, spinners, and statistics tracking utilities for CLI applications.

## Overview

| Property    | Value                              |
| ----------- | ---------------------------------- |
| **Package** | `@esteban-url/trailhead-cli`       |
| **Module**  | `@esteban-url/trailhead-cli/utils` |
| **Since**   | `v1.0.0`                           |

## Import

```typescript
import {
  chalk,
  success,
  error,
  warning,
  createSpinner,
  createStats,
} from '@esteban-url/trailhead-cli/utils';
```

## Basic Usage

```typescript
import {
  chalk,
  success,
  error,
  warning,
  createSpinner,
  createStats,
} from '@esteban-url/trailhead-cli/utils';
```

## Terminal Styling

### Chalk

Full [chalk](https://github.com/chalk/chalk) library for terminal styling.

```typescript
import { chalk } from '@esteban-url/trailhead-cli/utils';

console.log(chalk.blue('Information'));
console.log(chalk.red.bold('Error!'));
console.log(chalk.green.underline('Success'));
console.log(chalk.rgb(123, 45, 67).underline('Custom color'));
console.log(chalk.hex('#DEADED').bgHex('#000000')('Hex colors'));
```

### Semantic Color Functions

Pre-defined color functions for consistent styling:

```typescript
import {
  success, // Green text
  error, // Red text
  warning, // Yellow text
  info, // Blue text
  muted, // Gray text
  bold, // Bold text
  dim, // Dimmed text
  italic, // Italic text
  underline, // Underlined text
} from '@esteban-url/trailhead-cli/utils';

// Usage
console.log(success('✓ Operation completed'));
console.log(error('✗ Operation failed'));
console.log(warning('⚠ Check configuration'));
console.log(info('ℹ Processing...'));
console.log(muted('Debug: Internal state'));

// Combine styles
console.log(bold(success('Important success!')));
console.log(dim(muted('Less important info')));
```

## Spinners

### `createSpinner(text: string): Spinner`

Create loading spinners for long-running operations.

```typescript
import { createSpinner } from '@esteban-url/trailhead-cli/utils';

const spinner = createSpinner('Loading data...');

try {
  // Long operation
  await fetchData();
  spinner.succeed('Data loaded successfully');
} catch (err) {
  spinner.fail('Failed to load data');
}
```

### Spinner Methods

```typescript
interface Spinner {
  start(text?: string): void;
  stop(): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  warn(text?: string): void;
  info(text?: string): void;
  text: string;
  color: string;
  isSpinning: boolean;
}
```

### `withSpinner<T>(options: SpinnerOptions<T>): Promise<T>`

Execute async operations with automatic spinner management.

```typescript
import { withSpinner } from '@esteban-url/trailhead-cli/utils';

const result = await withSpinner({
  text: 'Processing files...',
  successText: 'Files processed',
  failText: 'Processing failed',
  execute: async () => {
    // Your async operation
    return await processFiles();
  },
});
```

### Advanced Spinner Usage

```typescript
// Using ora directly for more control
import { ora } from '@esteban-url/trailhead-cli/utils';

const spinner = ora({
  text: 'Loading',
  spinner: 'dots',
  color: 'cyan',
});

spinner.start();

// Update text
spinner.text = 'Loading users...';
spinner.color = 'yellow';

// Change spinner style
spinner.spinner = 'line';

// Stop with symbol
spinner.stopAndPersist({
  symbol: '🚀',
  text: 'Launched!',
});
```

## Statistics Tracking

### `createStats(): Stats`

Track operation statistics.

```typescript
import { createStats } from '@esteban-url/trailhead-cli/utils';

const stats = createStats();

// Track operations
stats.increment('files_processed');
stats.increment('files_processed', 5);
stats.add('bytes_read', 1024);

// Track timing
stats.startTimer('processing');
// ... do work
stats.endTimer('processing');

// Get statistics
const summary = stats.getSummary();
console.log(`Processed ${summary.files_processed} files`);
console.log(`Time: ${summary.timers.processing}ms`);
```

### Stats Interface

```typescript
interface Stats {
  increment(key: string, amount?: number): void;
  add(key: string, value: number): void;
  set(key: string, value: number): void;
  startTimer(key: string): void;
  endTimer(key: string): number;
  getSummary(): StatsSummary;
  reset(): void;
}

interface StatsSummary {
  [key: string]: number;
  timers: Record<string, number>;
}
```

### `formatStats(stats: StatsSummary): string`

Format statistics for display.

```typescript
import { formatStats } from '@esteban-url/trailhead-cli/utils';

const summary = stats.getSummary();
const formatted = formatStats(summary);
console.log(formatted);
// Output:
// Files processed: 42
// Bytes read: 10,240
// Processing time: 1,234ms
```

## Progress Tracking

### `updateStats(stats: Stats, operation: string, result: Result<any>): void`

Update statistics based on operation results.

```typescript
import { updateStats } from '@esteban-url/trailhead-cli/utils';

const stats = createStats();

for (const file of files) {
  const result = await processFile(file);
  updateStats(stats, 'file_processing', result);
}

// Automatically tracks successes and failures
const summary = stats.getSummary();
console.log(`Success: ${summary.file_processing_success}`);
console.log(`Failed: ${summary.file_processing_error}`);
```

## Time Utilities

### `getElapsedTime(startTime: number): string`

Get formatted elapsed time.

```typescript
import { getElapsedTime } from '@esteban-url/trailhead-cli/utils';

const start = Date.now();

// ... do work

console.log(`Completed in ${getElapsedTime(start)}`);
// Output: "Completed in 1.23s"
```

## Option Processing

### `filterUndefined<T>(obj: T): Partial<T>`

Remove undefined values from objects.

```typescript
import { filterUndefined } from '@esteban-url/trailhead-cli/utils';

const options = {
  name: 'test',
  value: undefined,
  count: 0,
  enabled: false,
};

const filtered = filterUndefined(options);
// { name: "test", count: 0, enabled: false }
```

### `mergeOptionsWithDefaults<T>(options: Partial<T>, defaults: T): T`

Merge options with defaults.

```typescript
import { mergeOptionsWithDefaults } from '@esteban-url/trailhead-cli/utils';

const defaults = {
  port: 3000,
  host: 'localhost',
  verbose: false,
};

const options = {
  port: 8080,
  verbose: true,
};

const merged = mergeOptionsWithDefaults(options, defaults);
// { port: 8080, host: "localhost", verbose: true }
```

### `processCommandOptions<T>(raw: any, schema: OptionSchema[]): T`

Process and validate command options.

```typescript
import { processCommandOptions } from '@esteban-url/trailhead-cli/utils';

const schema = [
  { name: 'port', type: 'number', default: 3000 },
  { name: 'host', type: 'string', default: 'localhost' },
  { name: 'debug', type: 'boolean', default: false },
];

const processed = processCommandOptions({ port: '8080', debug: 'true' }, schema);
// { port: 8080, host: "localhost", debug: true }
```

## Practical Examples

### Progress with Statistics

```typescript
const stats = createStats();
const spinner = createSpinner('Processing files...');

stats.startTimer('total');

for (const file of files) {
  spinner.text = `Processing ${file}...`;

  const result = await processFile(file);
  updateStats(stats, 'files', result);

  if (result.success) {
    stats.add('bytes_processed', result.value.size);
  }
}

stats.endTimer('total');
spinner.succeed('Processing complete');

console.log(formatStats(stats.getSummary()));
```

### Styled Output with Options

```typescript
function displayResults(results: any[], options: DisplayOptions) {
  const processed = processCommandOptions(options, [
    { name: 'color', type: 'boolean', default: true },
    { name: 'verbose', type: 'boolean', default: false },
  ]);

  if (processed.color) {
    console.log(success(`✓ Found ${results.length} results`));

    results.forEach(r => {
      console.log(info(`  - ${r.name}`));
      if (processed.verbose) {
        console.log(muted(`    ${r.description}`));
      }
    });
  } else {
    // Plain output
    console.log(`Found ${results.length} results`);
    results.forEach(r => console.log(`  - ${r.name}`));
  }
}
```

## Type Reference

```typescript
// Spinner types
interface Spinner {
  start(text?: string): void;
  stop(): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  warn(text?: string): void;
  info(text?: string): void;
  text: string;
  color: string;
  isSpinning: boolean;
}

interface SpinnerOptions<T> {
  text: string;
  successText?: string;
  failText?: string;
  execute: () => Promise<T>;
}

// Stats types
interface Stats {
  increment(key: string, amount?: number): void;
  add(key: string, value: number): void;
  set(key: string, value: number): void;
  startTimer(key: string): void;
  endTimer(key: string): number;
  getSummary(): StatsSummary;
  reset(): void;
}

// Option processing types
interface OptionSchema {
  name: string;
  type: 'string' | 'boolean' | 'number';
  default?: any;
}

// Style functions
type StyleFunction = (text: string) => string;
```

## Best Practices

1. **Use semantic colors** - Consistent meaning across your CLI
2. **Show progress** - Use spinners for operations > 1 second
3. **Track statistics** - Provide summary information
4. **Handle NO_COLOR** - Respect color preferences
5. **Clear spinners** - Always stop spinners on exit

## See Also

- [Getting Started](../getting-started.md) - Basic styling examples
- [Common Patterns](../how-to/common-patterns.md) - Progress patterns
- [Command Reference](./command.md) - Using utils in commands
