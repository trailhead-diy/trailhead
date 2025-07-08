# Atomic Transform System

A modern, composable transformation system built on atomic operations and functional programming principles.

## Key Concepts

### Atomic Operations

Small, single-responsibility transforms that do exactly one thing:

- `reorderParameters` - Fix invalid rest parameter ordering
- `addPrefix` - Add prefix to identifiers
- `wrapExpression` - Wrap JSX expressions with function calls

### Business Logic Transforms

Higher-level transforms that compose atomic operations:

- `addCatalystPrefix` - Add Catalyst prefix using component mappings
- `addClassNameParam` - Add className parameter to React components
- `forwardClassName` - Forward className to JSX children

### Pipelines

Orchestrate multiple transforms with error handling and logging:

- `MainTransformPipeline` - Flexible pipeline builder
- `createCompletePipeline()` - Pre-configured complete transformation
- `createCatalystPrefixPipeline()` - Catalyst-only transformations

## Quick Start

```typescript
import { createCompletePipeline } from './transforms-new';

// Apply all transforms
const pipeline = createCompletePipeline({ verbose: true });
const result = pipeline.execute(sourceCode);

console.log(`Applied ${result.totalChanges} changes`);
```

## Custom Pipeline

```typescript
import { MainTransformPipeline, addCatalystPrefix, reorderParameters } from './transforms-new';

const pipeline = new MainTransformPipeline({ verbose: true })
  .addTransform(addCatalystPrefix, { scope: 'imports' })
  .addTransform(reorderParameters);

const result = pipeline.execute(sourceCode);
```

## Atomic Operations

```typescript
import { reorderParameters, addPrefix } from './transforms-new';

// Fix parameter ordering
const result1 = reorderParameters.apply('function test({ ...props, className }) {}');

// Add prefixes
const result2 = addPrefix.apply(source, {
  prefix: 'Catalyst',
  targets: ['Button', 'Input'],
  scope: 'imports',
});
```

## Architecture Benefits

### Code Reduction

- **~50% less code** through elimination of duplication
- **Single responsibility** - each transform does one thing
- **Reusable operations** across different business contexts

### Improved Maintainability

- **Atomic testing** - test operations in isolation
- **Clear separation** between AST operations and business logic
- **Composable architecture** - build complex transforms from simple ones

### Enhanced Performance

- **Efficient pipelines** - only run necessary transforms
- **Better error handling** - isolate and report specific failures
- **Future: parallel execution** - independent operations can run concurrently

## Migration from Old System

The new system includes a compatibility layer for gradual migration:

```typescript
import { atomicToLegacyTransform, reorderParameters } from './transforms-new';

// Convert atomic transform to legacy interface
const legacyTransform = atomicToLegacyTransform(reorderParameters);

// Use in existing pipeline
const result = legacyTransform.apply(source);
```

## File Structure

```
transforms-new/
├── core/                      # Core utilities and types
├── ast-operations/            # Atomic AST operations
│   ├── identifiers/          # Identifier manipulation
│   ├── imports/              # Import/export handling
│   ├── parameters/           # Function parameter operations
│   ├── jsx/                  # JSX element operations
│   └── objects/              # Object manipulation
├── business-logic/           # Business-specific transforms
│   ├── catalyst-integration/ # Catalyst prefix logic
│   ├── className-management/ # className handling
│   └── semantic-colors/      # Color token transforms
├── pipelines/                # Pipeline orchestration
├── migration/                # Migration utilities
└── __tests__/                # Comprehensive test suite
```

## Testing

Each atomic operation includes comprehensive unit tests:

```bash
# Test atomic transforms
pnpm test src/transforms-new

# Test integration
pnpm test src/transforms-new/__tests__/integration

# Test backward compatibility
pnpm test src/transforms
```

## Next Steps

1. **Phase 2**: Replace existing transforms with atomic versions
2. **Phase 3**: Add semantic color and import management operations
3. **Phase 4**: Performance optimizations and parallel execution
4. **Phase 5**: Remove legacy system and complete migration

See `migration/migration-plan.md` for detailed migration roadmap.
