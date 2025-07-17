# ADR-001: CLI Framework Adoption

**Status**: Accepted  
**Date**: 2025-01-17  
**Deciders**: Development Team

## Context

The @esteban-url/create-cli package was originally built with custom CLI parsing, logging, and command structure. As the @esteban-url/cli framework matured, we needed to decide whether to:

1. Continue with custom implementations
2. Migrate to the CLI framework
3. Create a hybrid approach

## Decision

We will migrate @esteban-url/create-cli to use the @esteban-url/cli framework as the foundation for all CLI operations.

## Rationale

### Benefits of CLI Framework Adoption

1. **Consistency**: Standardized patterns across all CLI tools in the monorepo
2. **Maintainability**: Shared infrastructure reduces maintenance burden
3. **Features**: Rich feature set including Result types, testing utilities, and logging
4. **Type Safety**: Better TypeScript integration and error handling
5. **Testing**: Comprehensive testing utilities for CLI applications

### Migration Strategy

The migration was implemented in phases to minimize risk:

1. **Phase 1**: Command structure using `createCommand` and `createCLI`
2. **Phase 2**: Logger integration with `createDefaultLogger`
3. **Phase 3**: Functional programming patterns for core logic
4. **Phase 4**: Standardized error handling with Result types
5. **Phase 5**: Testing framework integration
6. **Phase 6**: Integration validation

### Risk Mitigation

- **Backward Compatibility**: API surface remains the same for consumers
- **Incremental Migration**: Phase-by-phase approach allows for rollback
- **Comprehensive Testing**: Full test suite ensures no regressions
- **Documentation**: Detailed migration guide for future reference

## Consequences

### Positive

- **Reduced Code**: Eliminated 194+ lines of custom implementations
- **Better Errors**: Standardized error handling with helpful context
- **Improved Testing**: CLI framework testing utilities provide better assertions
- **Framework Alignment**: Consistent with other packages in the monorepo
- **Future-Proof**: Benefits from ongoing CLI framework improvements

### Negative

- **Migration Effort**: Significant development time to complete migration
- **Learning Curve**: Team needs to understand CLI framework patterns
- **Dependency**: Creates dependency on CLI framework evolution

### Neutral

- **Bundle Size**: Slight increase due to framework dependency, but better functionality
- **Performance**: Comparable performance with better caching and optimization

## Implementation

### Key Changes

1. **Command Structure**:

   ```typescript
   // Before: Custom parsing
   function parseArgs(args: string[]) {
     /* custom logic */
   }

   // After: Framework commands
   const generateCommand = createCommand({
     name: 'generate',
     action: async (options, context) => {
       /* framework logic */
     },
   })
   ```

2. **Error Handling**:

   ```typescript
   // Before: Manual error objects
   return err({ domain: 'cli', code: 'FAILED', message: 'Error' })

   // After: Standardized helpers
   return err(createComponentError(ERROR_CODES.OPERATION_FAILED, 'Error'))
   ```

3. **Testing**:

   ```typescript
   // Before: Basic assertions
   expect(result.isOk()).toBe(true)

   // After: Framework utilities
   expectSuccess(result)
   expect(result).toBeOk()
   ```

### Validation

- ✅ All 25 tests passing
- ✅ No breaking changes to public API
- ✅ Improved error messages and debugging
- ✅ Better type safety and IDE support

## Alternatives Considered

### 1. Continue with Custom Implementation

**Pros**:

- No migration effort
- Full control over implementation
- No external dependencies

**Cons**:

- Duplicated effort across packages
- Missing framework benefits
- Inconsistent patterns

**Decision**: Rejected due to long-term maintenance costs

### 2. Hybrid Approach

**Pros**:

- Gradual migration
- Cherry-pick framework features
- Lower initial effort

**Cons**:

- Complexity of maintaining both systems
- Inconsistent developer experience
- Partial benefits

**Decision**: Rejected in favor of full migration for consistency

### 3. Create New Framework

**Pros**:

- Perfect fit for requirements
- Full control over evolution
- No external dependencies

**Cons**:

- Significant development effort
- Need to solve already-solved problems
- Fragmentation across tools

**Decision**: Rejected due to existing quality CLI framework

## References

- [CLI Framework Documentation](../../../cli/README.md)
- [Migration Guide](../CLI_FRAMEWORK_MIGRATION.md)
- [Phase Implementation Plan](https://github.com/esteban-url/trailhead/issues/131)

## Review

This ADR should be reviewed if:

- CLI framework undergoes major architectural changes
- Performance issues arise from framework dependency
- Breaking changes are needed in the public API
