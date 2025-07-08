# Transform System Migration Plan

This document outlines the plan for migrating from the existing monolithic transform system to the new atomic transform architecture.

## Phase 1: Foundation ✅ COMPLETED

- [x] Create new atomic transform directory structure
- [x] Implement core utilities (types, factory functions)
- [x] Create atomic AST operations for common patterns
- [x] Build business logic transforms using atomic operations
- [x] Create new pipeline system
- [x] Add comprehensive tests
- [x] Create compatibility layer for backward compatibility

## Phase 2: Gradual Migration 🔄 IN PROGRESS

### 2.1 Replace Parameter Reordering Transform

- [x] ✅ Created atomic `reorderParameters` transform
- [ ] Replace existing `reorder-parameters.ts` with atomic version
- [ ] Update main pipeline to use atomic version
- [ ] Verify dev-refresh still works correctly

### 2.2 Replace Catalyst Prefix Transform

- [x] ✅ Created atomic `addCatalystPrefix` transform with mappings
- [ ] Replace existing `catalyst-prefix.ts` with atomic version
- [ ] Update pipeline to use atomic version
- [ ] Test with existing CLI commands

### 2.3 Replace className Management Transforms

- [x] ✅ Created atomic `addClassNameParam` and `forwardClassName`
- [ ] Replace existing className transforms:
  - `add-parameter.ts`
  - `forward-to-child.ts`
  - `ensure-in-cn.ts`
  - `wrap-static.ts`
  - `remove-unused.ts`
  - `reorder-args.ts`
- [ ] Update pipeline to use atomic versions

## Phase 3: Advanced Transforms

### 3.1 Semantic Color System

- [ ] Create atomic semantic color operations
- [ ] Replace component-specific semantic color transforms:
  - `badge/add-semantic-colors.ts`
  - `button/add-semantic-colors.ts`
  - `checkbox/add-semantic-colors.ts`
  - `radio/add-semantic-colors.ts`
  - `switch/add-semantic-colors.ts`
- [ ] Create single configurable semantic color transform

### 3.2 Import/Export Management

- [ ] Create atomic import/export operations
- [ ] Replace existing import transforms:
  - `clsx-to-cn.ts`
  - `catalyst-prefix-exports.ts`
  - `catalyst-prefix-usage.ts`

### 3.3 Formatting Transforms

- [ ] Create atomic formatting operations
- [ ] Replace existing formatting transforms:
  - `file-headers.ts`
  - `ast-options.ts`

## Phase 4: Pipeline Optimization

### 4.1 Performance Improvements

- [ ] Implement source code modification tracking
- [ ] Add transform caching and memoization
- [ ] Optimize AST parsing (parse once, apply multiple transforms)
- [ ] Add parallel transform execution where safe

### 4.2 Enhanced Error Handling

- [ ] Add detailed error context and suggestions
- [ ] Implement transform rollback on failure
- [ ] Add validation and pre-flight checks

### 4.3 Developer Experience

- [ ] Add transform debugging and visualization
- [ ] Create transform composition utilities
- [ ] Add hot-reload for transform development

## Phase 5: Cleanup and Documentation

### 5.1 Remove Old System

- [ ] Remove old transform files after migration
- [ ] Update all imports and references
- [ ] Clean up unused utilities and types

### 5.2 Documentation

- [ ] Update transform documentation
- [ ] Create atomic transform development guide
- [ ] Add examples and best practices
- [ ] Update CLI help and guides

## Migration Benefits

### Code Reduction

- **~50% reduction** in transform code through deduplication
- **Single responsibility** principle throughout
- **Reusable atomic operations** across business contexts

### Improved Maintainability

- **Atomic testing** - each operation can be tested in isolation
- **Clear separation** between AST operations and business logic
- **Composable architecture** - complex transforms built from simple operations

### Enhanced Performance

- **Efficient pipelines** - only run necessary transforms
- **Better caching** - cache at atomic operation level
- **Parallel execution** - independent operations can run concurrently

### Developer Experience

- **Easier debugging** - isolated operations are easier to debug
- **Better error messages** - pinpoint exactly which operation failed
- **Flexible composition** - create custom pipelines for specific needs

## Rollback Plan

If issues arise during migration:

1. **Immediate rollback**: Use compatibility layer to switch back to old transforms
2. **Selective rollback**: Replace specific atomic transforms with old versions
3. **Gradual rollback**: Migrate back to old system one transform at a time

The new system is designed with backward compatibility in mind, ensuring safe migration.
