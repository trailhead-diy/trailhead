# @trailhead/core

> Foundation package providing unified Result types, enhanced error handling, and performance-optimized utilities

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

Foundation package for the Trailhead ecosystem providing unified Result types, enhanced error handling, and performance-optimized type guards.

## Installation

```bash
npm install @trailhead/core
```

## Quick Example

```typescript
import { ok, err, type Result } from '@trailhead/core'

const divide = (a: number, b: number): Result<number, Error> => {
  if (b === 0) {
    return err(new Error('Division by zero'))
  }
  return ok(a / b)
}

const result = divide(10, 2)
if (result.isOk()) {
  console.log('Result:', result.value) // 5
} else {
  console.error('Error:', result.error.message)
}
```

## Key Features

- **Unified Result types** - Single source of truth for Result operations across the ecosystem
- **Enhanced error context** - Rich debugging with operation context, timestamps, and severity
- **Performance-optimized type guards** - Zero-overhead validation for critical paths
- **Functional utilities** - Composition helpers and Result-based patterns

## Documentation

- **[API Documentation](../../docs/@trailhead.core.md)** - Complete API reference
- **[Result Types Pattern](../../docs/explanation/result-types-pattern.md)** - Understanding Result types
- **[Functional Architecture](../../docs/explanation/functional-architecture.md)** - Functional programming patterns

## License

MIT © [Esteban URL](https://github.com/esteban-url)
