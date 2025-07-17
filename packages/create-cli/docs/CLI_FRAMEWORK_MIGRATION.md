# CLI Framework Migration Guide

This guide documents the migration of @esteban-url/create-cli from custom patterns to CLI framework architecture. Use this as a reference for migrating other packages to the CLI framework foundation.

## Overview

The create-cli package has been successfully migrated to align with @esteban-url/cli framework principles:

- **Functional programming patterns** instead of OOP classes
- **Result types** for explicit error handling
- **CLI framework testing utilities** for consistent testing
- **Standardized error helpers** to reduce boilerplate
- **Template compilation** using functional composition

## Migration Phases

### Phase 1: CLI Framework Command Structure

**Goal**: Establish command structure using @esteban-url/cli framework

**Changes**:

- Replaced custom argument parsing with CLI framework commands
- Integrated `createCommand` and `createCLI` from framework
- Added proper command options and validation

**Before**:

```typescript
// Custom argument parsing
function parseArgs(args: string[]) {
  // Manual parsing logic
}
```

**After**:

```typescript
// CLI framework commands
const generateCommand = createCommand<GenerateOptions>({
  name: 'generate',
  description: 'Generate a new CLI project',
  options: [
    /* framework options */
  ],
  action: async (options, context) => {
    // Framework-managed execution
  },
})
```

### Phase 2: Logger Integration

**Goal**: Replace custom logging with CLI framework logging

**Changes**:

- Removed custom logger implementations
- Integrated `createDefaultLogger` from CLI framework
- Updated all log calls to use framework patterns

**Before**:

```typescript
// Custom logger
const logger = createCustomLogger()
logger.info('Message')
```

**After**:

```typescript
// CLI framework logger
const logger = createDefaultLogger(verbose)
logger.info('Message') // Same interface, framework implementation
```

### Phase 3: Functional Template Compilation

**Goal**: Convert OOP TemplateCompiler to functional patterns

**Changes**:

- Removed `TemplateCompiler` class (58 lines)
- Created functional template compilation functions
- Used immutable data structures and pure functions

**Before**:

```typescript
// OOP approach
class TemplateCompiler {
  private cache: Map<string, any>

  compile(template: string): string {
    // Stateful compilation
  }
}
```

**After**:

```typescript
// Functional approach
export async function compileTemplate(
  templatePath: string,
  context: TemplateContext,
  compilerContext: TemplateCompilerContext
): Promise<Result<string, CoreError>> {
  // Pure function with explicit state
}
```

### Phase 4: Standardized Error Handling

**Goal**: Create consistent error patterns across the codebase

**Changes**:

- Created centralized error helpers
- Standardized error codes and messages
- Added consistent error context

**Before**:

```typescript
// Manual error construction
return err({
  domain: 'template-compiler',
  code: 'TEMPLATE_FAILED',
  message: 'Template compilation failed',
  type: 'template-compiler-error',
  recoverable: false,
  component: 'TemplateCompiler',
  operation: 'compileTemplate',
  severity: 'high',
  timestamp: new Date(),
  context: { templatePath },
  cause: error,
} as CoreError)
```

**After**:

```typescript
// Helper-based error construction
return err(
  createTemplateCompilerError(ERROR_CODES.TEMPLATE_COMPILE_FAILED, 'Template compilation failed', {
    operation: 'compileTemplate',
    context: { templatePath },
    cause: error,
    recoverable: false,
  })
)
```

### Phase 5: CLI Framework Testing

**Goal**: Integrate CLI framework testing utilities

**Changes**:

- Added `setupResultMatchers()` for Vitest
- Used `expectSuccess()`, `expectError()` from CLI framework
- Created both traditional and functional testing utilities

**Before**:

```typescript
// Basic Result testing
expect(result.isOk()).toBe(true)
```

**After**:

```typescript
// CLI framework testing
expectSuccess(result)
expect(result).toBeOk()
```

### Phase 6: Integration Validation

**Goal**: Ensure all changes work together

**Results**:

- ✅ 25/25 tests passing
- ✅ Full TypeScript compliance
- ✅ All packages build successfully
- ✅ No breaking changes

## Benefits Achieved

### Code Quality Improvements

1. **Reduced Bundle Size**: ~121KB → ~113KB
2. **Eliminated Boilerplate**: Error creation from 15+ lines to 5-7 lines
3. **Improved Maintainability**: Clear patterns, functional composition
4. **Better Type Safety**: Full Result type integration

### Developer Experience

1. **Better Error Messages**: Helpful suggestions and context
2. **Consistent Patterns**: Same error handling across all files
3. **Easier Testing**: Both traditional and functional test utilities
4. **Clear Architecture**: Functional patterns easier to reason about

### Performance

1. **Template Caching**: Intelligent cache invalidation
2. **Pure Functions**: Better optimization potential
3. **Reduced Memory**: Immutable data structures

## Key Patterns to Follow

### 1. Error Handling Pattern

```typescript
// Always use error helpers instead of manual construction
import { createComponentError, ERROR_CODES } from './error-helpers.js'

// Good
return err(
  createComponentError(ERROR_CODES.OPERATION_FAILED, 'Operation failed', {
    operation: 'operationName',
    context: { relevant: 'data' },
    recoverable: true,
  })
)

// Avoid
return err(new Error('Operation failed'))
```

### 2. Functional Composition Pattern

```typescript
// Prefer functional composition over classes
export async function processTemplate(
  input: Input,
  context: Context
): Promise<Result<Output, CoreError>> {
  // Pure function logic
  return pipe(validateInput, transformData, generateOutput)(input)
}
```

### 3. Testing Pattern

```typescript
// Use CLI framework testing utilities
import { expectSuccess, expectError } from '@esteban-url/cli/testing'
import { setupResultMatchers } from '@esteban-url/core/testing'

setupResultMatchers()

// Test success cases
expectSuccess(result)
expect(result).toBeOk()

// Test error cases
expectError(result)
expect(result).toBeErr()
```

## Migration Checklist

When migrating a package to CLI framework patterns:

### Commands & Structure

- [ ] Replace custom CLI parsing with `createCommand`
- [ ] Use `createCLI` for application structure
- [ ] Integrate proper option definitions

### Logging

- [ ] Remove custom logger implementations
- [ ] Import `createDefaultLogger` from CLI framework
- [ ] Update all logging calls to use framework interface

### Error Handling

- [ ] Create error helpers file with constants
- [ ] Replace all manual error construction
- [ ] Add consistent error context and suggestions
- [ ] Use Result types throughout

### Testing

- [ ] Add `setupResultMatchers()`
- [ ] Use CLI framework testing utilities
- [ ] Create both traditional and functional test utilities
- [ ] Update assertions to use framework patterns

### Documentation

- [ ] Update README with CLI framework patterns
- [ ] Document error codes and helpers
- [ ] Create migration notes for breaking changes

## Common Pitfalls

### 1. Type Narrowing with Result Types

```typescript
// Problem: TypeScript can't narrow Result types after expectError()
expectError(result)
const error = result.error // TS Error

// Solution: Manual type narrowing
if (result.isErr()) {
  const error = result.error // TS OK
}
```

### 2. Error Helper Context

```typescript
// Problem: Missing required fields
createComponentError(code, message, {}) // Missing operation

// Solution: Include required context
createComponentError(code, message, {
  operation: 'functionName',
  // other required fields
})
```

### 3. Testing Utility Order

```typescript
// Problem: expectSuccess after type narrowing
if (result.isOk()) {
  expectSuccess(result) // Redundant
}

// Solution: Use framework utilities first
expectSuccess(result)
if (result.isOk()) {
  // Additional assertions
}
```

## Further Reading

- [CLI Framework Documentation](../../../cli/README.md)
- [Core Testing Utilities](../../../core/src/testing/README.md)
- [Error Handling Best Practices](./ERROR_HANDLING.md)
- [Functional Programming Patterns](./FUNCTIONAL_PATTERNS.md)
