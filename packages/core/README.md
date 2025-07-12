# @trailhead/core

Foundation package for the Trailhead ecosystem providing unified Result types, enhanced error handling, and performance-optimized utilities.

## Features

- **Unified Result Types** - Single source of truth for all Result operations across the ecosystem
- **Enhanced Error Context** - Rich debugging information with operation context, timestamps, and severity levels
- **Performance-Optimized Type Guards** - Zero-overhead validation for critical paths
- **Functional Programming Utilities** - Composition helpers and Result-based functional patterns

## Installation

```bash
npm install @trailhead/core
```

## Usage

### Basic Result Operations

```typescript
import { ok, err, type Result } from '@trailhead/core';

function divide(a: number, b: number): Result<number, Error> {
  if (b === 0) {
    return err(new Error('Division by zero'));
  }
  return ok(a / b);
}

const result = divide(10, 2);
if (result.isOk()) {
  console.log('Result:', result.value); // 5
} else {
  console.error('Error:', result.error.message);
}
```

### Enhanced Error Creation

```typescript
import { createCoreError } from '@trailhead/core';

const error = createCoreError('VALIDATION_FAILED', 'Invalid input data', {
  component: 'UserService',
  operation: 'validateUser',
  severity: 'high',
  suggestion: 'Check that all required fields are provided',
  recoverable: true,
  context: { userId: '123', field: 'email' },
});
```

### Performance-Optimized Type Guards

```typescript
import { isDefined, isNonEmptyString, isObject } from '@trailhead/core';

// Fast null/undefined checks
if (isDefined(value)) {
  // value is guaranteed to be non-null/undefined
}

// Optimized string validation
if (isNonEmptyString(input)) {
  // input is guaranteed to be a non-empty string
}

// Efficient object validation
if (isObject(data)) {
  // data is guaranteed to be a record
}
```

### Functional Composition

```typescript
import { pipe, composeResult } from '@trailhead/core';

const processData = pipe(
  validateInput,
  composeResult(transformData, validateInput),
  composeResult(saveToDatabase, transformData)
);

const result = await processData(inputData);
```

## API Reference

### Result Types

- `Result<T, E>` - Core Result type (re-exported from neverthrow)
- `CoreResult<T>` - Result with CoreError
- `CoreResultAsync<T>` - Async Result with CoreError

### Error Handling

- `createCoreError(type, message, options)` - Create enhanced error with context
- `withContext(error, context)` - Add contextual information to existing error
- `chainError(error, cause)` - Chain errors for error propagation

### Type Guards

- `isDefined<T>(value)` - Check if value is not null/undefined
- `isNonEmptyString(value)` - Validate non-empty strings
- `isObject(value)` - Validate objects
- `isNonEmptyArray<T>(value)` - Validate non-empty arrays
- `hasErrorShape(value)` - Check if value has error structure

### Utilities

- `getErrorMessage(error)` - Extract human-readable message
- `isRecoverableError(error)` - Check if error is recoverable
- `getErrorType(error)` - Extract error type for pattern matching

## Breaking Changes in v1.0.0

1. **Enhanced CoreError Interface** - Added `component`, `operation`, `timestamp`, and `severity` fields
2. **Unified Result Imports** - All packages must import Result types from @trailhead/core
3. **Performance Type Guards** - New compile-time optimized validation functions

## Migration Guide

### From direct neverthrow imports:

```typescript
// Before
import { ok, err, type Result } from 'neverthrow';

// After
import { ok, err, type Result } from '@trailhead/core';
```

### Enhanced error creation:

```typescript
// Before
const error = { type: 'ERROR', message: 'Failed' };

// After
const error = createCoreError('ERROR', 'Failed', {
  component: 'MyComponent',
  operation: 'myOperation',
  severity: 'medium',
});
```

## Performance Notes

- Type guards are optimized for V8 and use minimal property access
- Compile-time validation reduces runtime overhead
- Enhanced error context is generated lazily to minimize performance impact

## License

MIT
