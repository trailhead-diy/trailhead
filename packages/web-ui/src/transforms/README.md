<<<<<<< HEAD
# Transform System

A functional transform system for code modifications built on @esteban-url/trailhead-cli framework.

## Overview

The transform system provides a pipeline for applying code transformations to Catalyst UI components. It uses Result-based error handling and functional programming patterns for reliable, composable transformations.
=======
# Transform System Architecture

A comprehensive, maintainable transform system built on top of the @esteban-url/trailhead-cli framework.

## Overview

This transform system provides a robust foundation for code transformations with:

- **Result-based error handling** using CLI framework Result types
- **Phase-based execution** with sequential and parallel transform support
- **Comprehensive validation** with reusable validation rules
- **Atomic operations** using Strategy pattern for composability
- **Built-in debugging** and profiling capabilities
- **High-ROI testing** with specialized transform test utilities
>>>>>>> cef6dae (fix: resolve failing tests and enhance transform system (#125))

## Architecture

```
src/transforms/
<<<<<<< HEAD
├── index.ts                    # Main transform pipeline and exports
├── utils.ts                    # Shared utility functions
├── transforms/                 # Individual transform implementations
│   ├── catalyst-prefix.ts      # Add Catalyst prefix to components
│   ├── clsx-to-cn.ts          # Convert clsx to cn utility
│   ├── file-headers.ts        # Add/update file headers
│   ├── semantic-colors.ts     # Add semantic color tokens
│   └── ts-nocheck.ts         # Add TypeScript nocheck directives
├── __tests__/                # Transform tests
│   ├── pipeline-integration.test.ts
│   ├── semantic-colors.test.ts
│   └── ts-nocheck.test.ts
└── README.md
```

## Core Concepts

### Transform Functions

Each transform is a pure function that takes input content and returns a Result:

```typescript
function transformName(input: string): Result<TransformResult, CLIError> {
  // Transform logic
  return Ok({ content: transformed, changed: true, warnings: [] });
}
```

### Transform Metadata

Each transform exports metadata describing its purpose:

```typescript
export const transformMetadata = {
  name: 'transform-name',
  description: 'Description of what the transform does',
  category: 'semantic' | 'format' | 'quality' | 'import' | 'ast',
};
```

### Transform Pipeline

The main pipeline applies transforms in sequence:

```typescript
const transforms = [
  { ...clsxToCnTransform, transform: transformClsxToCn },
  { ...catalystPrefixTransform, transform: transformCatalystPrefix },
  { ...semanticColorsTransform, transform: transformSemanticColors },
  { ...fileHeadersTransform, transform: transformFileHeaders },
  { ...tsNocheckTransform, transform: transformTsNocheck },
];
```

## Available Transforms

### 1. Catalyst Prefix Transform (`catalyst-prefix.ts`)

- Adds "Catalyst" prefix to component function names
- Ensures consistent naming across all components

### 2. Clsx to CN Transform (`clsx-to-cn.ts`)

- Converts `clsx()` function calls to `cn()` utility
- Maintains same functionality with project conventions

### 3. Semantic Colors Transform (`semantic-colors.ts`)

- Adds semantic color tokens (primary, secondary, destructive, accent, muted)
- Component-specific color patterns for theming consistency

### 4. File Headers Transform (`file-headers.ts`)

- Adds development warning headers to generated files
- Tracks generation metadata

### 5. TypeScript Nocheck Transform (`ts-nocheck.ts`)

- Adds `// @ts-nocheck` directives to specific files
- Bypasses TypeScript checking for generated code

## Usage

### CLI Commands

```bash
# Run all transforms on components
trailhead-ui transforms

# Run transforms with specific options
trailhead-ui transforms --dry-run --verbose

# Enhanced transform command
trailhead-ui enhance
```

### Programmatic Usage

```typescript
import { runMainPipeline } from './index.js';

const result = await runMainPipeline('./src/components', {
  verbose: true,
  dryRun: false,
  filter: filename => filename.endsWith('.tsx'),
});
```

## Testing

All transforms include comprehensive tests:

```typescript
import { transformSemanticColors } from '../transforms/semantic-colors.js';
import { expectResult } from '@esteban-url/trailhead-cli/testing';

const result = transformSemanticColors(input);
expectResult(result);
expect(result.value.changed).toBe(true);
```

## Error Handling

All transforms use Result types for consistent error handling:

```typescript
=======
├── core/                   # Core framework integration
│   ├── transform-base.ts   # Base transform interface & utilities
│   ├── transform-runner.ts # Phase-based execution engine
│   ├── validation.ts       # Input validation pipeline
│   ├── debug-tools.ts      # Debugging & profiling tools
│   └── composition.ts      # Transform composition utilities
├── operations/             # Atomic operations (Strategy pattern)
│   ├── ast-operations.ts   # AST manipulation operations
│   ├── color-operations.ts # Color transformation operations
│   └── import-operations.ts # Import management operations
├── transforms/             # Concrete transforms
│   ├── semantic-colors.ts  # Semantic color generation
│   ├── code-quality.ts     # Formatting & linting
│   └── unused-imports.ts   # Unused import removal
├── pipelines/              # Transform pipelines
│   └── main.ts            # Main transform pipeline
├── __tests__/              # Comprehensive test suite
│   ├── semantic-colors.test.ts
│   └── transform-runner.test.ts
└── transform-framework-improvements.md # Enhancement opportunities
```

## Key Features

### 1. Result-Based Error Handling

All transforms use CLI framework Result types for consistent error handling:

```typescript
const result = await transform.execute(input, context);
>>>>>>> cef6dae (fix: resolve failing tests and enhance transform system (#125))
if (result.success) {
  console.log(result.value.content);
} else {
  console.error(result.error.message);
}
```

<<<<<<< HEAD
## CLI Integration

The transform system integrates with these CLI commands:

- `src/cli/commands/transforms.ts` - Main transforms command
- `src/cli/commands/enhance.ts` - Simplified transforms (uses `src/transforms/index.ts`)
- `src/cli/commands/dev-refresh.ts` - Development refresh with transforms (uses `src/transforms/index.ts`)
=======
### 2. Phase-Based Execution

Transform runner supports multiple execution phases:

```typescript
const runner = new TransformRunner(logger)
  .addPhase(PhaseUtils.createValidationPhase([validator]))
  .addPhase(PhaseUtils.createTransformationPhase([semanticColors]))
  .addPhase(PhaseUtils.createFormattingPhase([codeQuality]));

const result = await runner.execute(input, options);
```

### 3. Atomic Operations

Composable operations using Strategy pattern:

```typescript
const colorOperation = ColorOperationUtils.createColorReplacement(
  'red',
  ['primary', 'secondary', 'destructive'],
  true
);

const result = colorOperation.execute(content);
```

### 4. Comprehensive Validation

Input validation with reusable rules:

```typescript
const validationResult = await validateTransformInput(input, [
  TransformValidationRules.validJavaScriptContent,
  TransformValidationRules.hasReactComponent,
]);
```

### 5. Built-in Debugging

Debug wrapper and profiling tools:

```typescript
const debugTransform = DebugUtils.createDebugWrapper(
  transform,
  DebugUtils.createDevelopmentConfig(),
  logger
);

const profiler = DebugUtils.createProfiler(config, logger);
profiler.startSession('transform-session');
```

### 6. Transform Composition

Flexible composition patterns:

```typescript
// Sequential composition
const pipeline = CompositionUtils.sequential([
  semanticColorsTransform,
  codeQualityTransform,
  unusedImportsTransform,
]);

// Parallel composition
const parallel = CompositionUtils.parallel([formatTransform, lintTransform], 'best-match');

// Conditional composition
const conditional = CompositionUtils.conditional([
  {
    condition: CompositionUtils.conditions.isReactComponent,
    transform: semanticColorsTransform,
    description: 'React component detected',
  },
]);
```

## Usage Examples

### Basic Transform Usage

```typescript
import { SemanticColorsTransform } from './transforms/semantic-colors.js';
import { createDefaultLogger } from '@esteban-url/trailhead-cli/core';

const transform = new SemanticColorsTransform();
const context = {
  logger: createDefaultLogger(),
  dryRun: false,
  debug: true,
  filePath: 'component.tsx',
};

const result = await transform.execute(input, context);
```

### Pipeline Execution

```typescript
import { TransformRunner, PhaseUtils } from './core/transform-runner.js';
import { SemanticColorsTransform } from './transforms/semantic-colors.js';
import { CodeQualityTransform } from './transforms/code-quality.js';

const runner = new TransformRunner(logger);
runner.addPhase(
  PhaseUtils.createTransformationPhase([new SemanticColorsTransform(), new CodeQualityTransform()])
);

const result = await runner.execute(input, {
  dryRun: false,
  debug: true,
  parallel: false,
  skipValidation: false,
  failFast: true,
  logger,
});
```

### Testing Transforms

```typescript
import { describe, it, expect } from 'vitest';
import { expectResult } from '@esteban-url/trailhead-cli/testing';
import { SemanticColorsTransform } from '../transforms/semantic-colors.js';

describe('SemanticColorsTransform', () => {
  it('should add semantic colors to badge component', async () => {
    const transform = new SemanticColorsTransform();
    const result = await transform.execute(input, context);

    expectResult(result);
    expect(result.value.changed).toBe(true);
    expect(result.value.content).toContain('primary:');
  });
});
```

## Benefits

### Maintainability

- **Clear separation of concerns** through layered architecture
- **Immutable operations** prevent side effects
- **Composable design** allows flexible transform combinations
- **Comprehensive error handling** with structured error types

### Debugging

- **Built-in logging** with structured output
- **Dry-run mode** for safe preview
- **Performance profiling** with detailed metrics
- **Debug sessions** for complex debugging scenarios

### Testing

- **High-ROI tests** using CLI testing utilities
- **Comprehensive test coverage** with realistic examples
- **Edge case handling** with proper error scenarios
- **Performance testing** with timing assertions

### Performance

- **Parallel execution** support for independent transforms
- **Efficient validation** with early exit patterns
- **Memory profiling** for resource usage monitoring
- **Caching-ready** architecture for future optimizations

## Migration Guide

### From Legacy Transforms

1. **Extend ImmutableTransform** instead of creating plain functions
2. **Use Result types** for error handling
3. **Implement validation** for input checking
4. **Add comprehensive tests** with CLI utilities
5. **Use phase-based execution** for complex pipelines

### Example Migration

```typescript
// Before (legacy)
function semanticColorsTransform(input: string): string {
  // Transform logic
  return output;
}

// After (new architecture)
class SemanticColorsTransform extends ImmutableTransform {
  readonly name = 'semantic-colors';
  readonly description = 'Add semantic color variants';
  readonly category = 'semantic';

  protected async transform(input: string, context: TransformContext): Promise<TransformResult> {
    // Validation, transformation, and error handling
    return TransformUtils.success(output, changed, warnings);
  }
}
```

## Framework Integration

This transform system leverages the full power of the @esteban-url/trailhead-cli framework:

- **Result types** for consistent error handling
- **Validation pipeline** for input validation
- **Testing utilities** for comprehensive testing
- **Logging system** for structured output
- **Command patterns** for CLI integration
- **File system abstraction** for safe operations

For framework enhancement opportunities, see [transform-framework-improvements.md](./transform-framework-improvements.md).

## Best Practices

1. **Always use Result types** for error handling
2. **Implement comprehensive validation** for inputs
3. **Write high-ROI tests** with realistic scenarios
4. **Use debug mode** during development
5. **Compose transforms** for complex operations
6. **Profile performance** for optimization
7. **Follow immutability** principles
8. **Document transform behavior** clearly

## Contributing

When adding new transforms:

1. **Extend ImmutableTransform** for consistency
2. **Add comprehensive tests** with edge cases
3. **Include debug logging** for maintainability
4. **Validate inputs** with appropriate rules
5. **Document usage** with examples
6. **Follow naming conventions** consistently

## Future Enhancements

See [transform-framework-improvements.md](./transform-framework-improvements.md) for:

- Transform registry system
- Incremental transform support
- Enhanced caching capabilities
- Plugin architecture
- Advanced composition patterns
>>>>>>> cef6dae (fix: resolve failing tests and enhance transform system (#125))
