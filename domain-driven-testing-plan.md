# Domain-Driven Testing & Export Standardization Plan

## **Overview**

Transform the Trailhead monorepo from centralized testing utilities to a domain-driven architecture where each package owns its testing capabilities. Standardize export patterns across all packages for consistency and discoverability.

## **Core Philosophy**

- **Domain Ownership**: Each package provides comprehensive testing utilities for its domain
- **Composition over Centralization**: Packages import testing utilities from other domains as needed
- **Discoverability**: "Need to test data? Look in `data/testing`"
- **Maintainability**: Testing utilities evolve with their domain expertise
- **Consistency**: All packages follow standardized export patterns

## **Current State Analysis**

### **Packages with Substantial Testing Utilities**

- `@esteban-url/cli` - 121 utilities (50% general-purpose, should be domain-specific)
- `@esteban-url/fs` - 8 utilities (correctly domain-focused)
- `@esteban-url/core` - 6 utilities (correctly domain-focused)

### **Packages with Placeholder/Minimal Testing**

- `@esteban-url/config` - 11 lines placeholder
- `@esteban-url/data` - 100 lines, appears unused
- `@esteban-url/streams` - 186 lines, appears unused
- `@esteban-url/validation` - 196 lines, appears unused

### **Packages Missing Testing Directories**

- `@esteban-url/git`
- `@esteban-url/watcher`
- `@esteban-url/formats`
- `@esteban-url/workflows`
- `@esteban-url/db`
- `@esteban-url/create-cli`

## **Target Architecture**

### **@repo/vitest-config (Cross-cutting Only)**

```typescript
// tooling/vitest-config/src/index.ts
export { createVitestConfig } from './vitest.shared.js'
export type { VitestConfigOptions } from './vitest.shared.js'

// Cross-cutting utilities only
export const testPatterns = {
  timeout: (ms: number) => ({ timeout: ms }),
  retry: (count: number) => ({ retry: count }),
  skip: (condition: boolean) => condition,
}
```

### **@esteban-url/core/testing (Result-focused)**

```typescript
// packages/core/src/testing/index.ts
export const resultMatchers = {
  toBeOk: /* comprehensive matcher moved from CLI */,
  toBeErr: /* comprehensive matcher moved from CLI */,
  toBeOkWith: /* value matching */,
  toBeErrWith: /* error matching */,
}

export const resultHelpers = {
  createOk: <T>(value: T) => ok(value),
  createErr: <E>(error: E) => err(error),
  assertOk: /* assertion helper */,
  assertErr: /* assertion helper */,
}

export const resultFixtures = {
  successResult: () => ok('test-success'),
  errorResult: () => err(createCoreError('TEST_ERROR', 'Test error')),
  asyncOk: async <T>(value: T) => ok(value),
  asyncErr: async <E>(error: E) => err(error),
}
```

### **@esteban-url/fs/testing (Filesystem-focused)**

```typescript
// packages/fs/src/testing/index.ts
export const fsMocks = {
  createMockFS: /* filesystem mocking */,
  mockReadFile: /* read file mock */,
  mockWriteFile: /* write file mock */,
  mockExists: /* exists mock */,
}

export const fsFixtures = {
  createTestTempDir: /* temporary directory */,
  createFileStructure: /* file structure builder */,
  cleanupTestFiles: /* cleanup utilities */,
  sampleFiles: /* common test files */,
}

export const fsHelpers = {
  assertFileExists: /* file existence assertion */,
  assertFileContent: /* content assertion */,
  compareDirectories: /* directory comparison */,
  normalizePath: /* cross-platform path handling */,
}
```

### **@esteban-url/cli/testing (CLI-focused Only)**

```typescript
// packages/cli/src/testing/index.ts
export const cliRunners = {
  runCommand: /* CLI command execution */,
  runInteractiveCommand: /* interactive command */,
  runCommandWithArgs: /* command with arguments */,
}

export const cliMocks = {
  mockLogger: /* logger mocking */,
  mockContext: /* CLI context mocking */,
  mockPrompts: /* prompt mocking */,
}

export const cliAssertions = {
  assertCommandSuccess: /* command success assertion */,
  assertCommandFailure: /* command failure assertion */,
  assertOutput: /* output assertion */,
  assertExitCode: /* exit code assertion */,
}

export const cliFixtures = {
  createCLIContext: /* test CLI context */,
  sampleCommands: /* sample command configs */,
  interactiveScenarios: /* interactive test scenarios */,
}
```

### **@esteban-url/data/testing (Data Processing-focused)**

```typescript
// packages/data/src/testing/index.ts
export const dataFixtures = {
  sampleCSV: /* CSV test data */,
  sampleJSON: /* JSON test data */,
  sampleExcel: /* Excel test data */,
  invalidData: /* invalid data samples */,
}

export const dataMocks = {
  mockCSVParser: /* CSV parser mock */,
  mockJSONTransformer: /* JSON transformer mock */,
  mockDataValidator: /* validation mock */,
}

export const dataHelpers = {
  assertDataStructure: /* data structure assertion */,
  compareDatasets: /* dataset comparison */,
  validateDataTypes: /* type validation */,
}
```

### **@esteban-url/validation/testing (Validation-focused)**

```typescript
// packages/validation/src/testing/index.ts
export const validationFixtures = {
  validSchemas: /* valid schema examples */,
  invalidSchemas: /* invalid schema examples */,
  sampleData: /* test data for validation */,
}

export const validationMocks = {
  mockValidator: /* validator mocking */,
  mockSchema: /* schema mocking */,
  mockValidationResult: /* result mocking */,
}

export const validationHelpers = {
  assertValidationSuccess: /* validation success assertion */,
  assertValidationFailure: /* validation failure assertion */,
  createTestSchema: /* test schema factory */,
}
```

### **@esteban-url/config/testing (Configuration-focused)**

```typescript
// packages/config/src/testing/index.ts
export const configFixtures = {
  validConfigs: /* valid configuration examples */,
  invalidConfigs: /* invalid configuration examples */,
  configFiles: /* sample config files */,
}

export const configMocks = {
  mockConfigLoader: /* config loader mock */,
  mockConfigValidator: /* validator mock */,
  mockEnvironment: /* environment mock */,
}

export const configHelpers = {
  assertConfigValid: /* config validation assertion */,
  mergeConfigs: /* config merging helper */,
  createTestConfig: /* test config factory */,
}
```

### **Additional Domain Testing Directories**

Each of the following packages will receive new testing directories with domain-appropriate utilities:

- **@esteban-url/git/testing** - Git operations, repository mocking, commit fixtures
- **@esteban-url/watcher/testing** - File watching simulation, event mocking
- **@esteban-url/formats/testing** - Format detection, conversion testing
- **@esteban-url/workflows/testing** - Workflow execution, pipeline testing
- **@esteban-url/db/testing** - Database mocking, query testing
- **@esteban-url/create-cli/testing** - Template generation, scaffolding testing

## **Composition Pattern Examples**

### **CLI + Filesystem Integration Testing**

```typescript
// In CLI tests that need filesystem operations
import { createTestTempDir, fsFixtures } from '@esteban-url/fs/testing'
import { cliRunners, cliAssertions } from '@esteban-url/cli/testing'

export const testCLIWithFiles = async (command: string, files: FileStructure) => {
  const tempDir = createTestTempDir()
  await fsFixtures.createFileStructure(tempDir, files)

  const result = await cliRunners.runCommand(command, { cwd: tempDir })
  cliAssertions.assertCommandSuccess(result)
}
```

### **Data + Validation Integration Testing**

```typescript
// In data processing tests that need validation
import { validationFixtures, validationHelpers } from '@esteban-url/validation/testing'
import { dataFixtures, dataHelpers } from '@esteban-url/data/testing'

export const testDataValidation = (csvData: string) => {
  const schema = validationFixtures.validSchemas.csvSchema
  const parsed = dataHelpers.parseCSV(csvData)

  const result = validationHelpers.validateWithSchema(schema, parsed)
  validationHelpers.assertValidationSuccess(result)
}
```

## **Export Standardization**

### **Standard Export Pattern Template**

```typescript
// Standard index.ts pattern for every package
// ========================================
// Re-exports from Foundation (if needed)
// ========================================
export { ok, err } from '@esteban-url/core'
export type { Result, CoreError } from '@esteban-url/core'

// ========================================
// Type Exports (Domain Types First)
// ========================================
export type {
  // Main domain types
  DomainConfig,
  DomainOptions,
  DomainResult,

  // Error types
  DomainError,
  DomainErrorCode,
} from './types.js'

// ========================================
// Core Function Exports (Main API)
// ========================================
export { createDomain, executeDomain, validateDomain } from './core.js'

// ========================================
// Utility Exports (Supporting Functions)
// ========================================
export { createDomainError, mapDomainError, isDomainValid } from './utils.js'

// ========================================
// Testing Exports (Domain Testing)
// ========================================
export * from './testing/index.js'

// ========================================
// Convenience Object (Optional)
// ========================================
export const domain = {
  create: createDomain(),
  execute: executeDomain(),
  validate: validateDomain(),
}
```

### **Standard package.json Exports**

```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./core": {
      "types": "./dist/core/index.d.ts",
      "default": "./dist/core/index.js"
    },
    "./testing": {
      "types": "./dist/testing/index.d.ts",
      "default": "./dist/testing/index.js"
    }
  }
}
```

## **Implementation Phases**

### **Phase 1: Foundation & Core Changes**

**@repo/vitest-config**

- Simplify to cross-cutting utilities only
- Remove Result matchers (move to core)
- Keep only configuration factory and test patterns

**@esteban-url/core/testing**

- Move comprehensive Result matchers from CLI
- Enhance with better error matching
- Add Result helpers and fixtures

**Update Dependencies**

- Update all packages to use core/testing for Result matchers
- Remove vitest-config Result matcher dependencies

### **Phase 2: CLI Cleanup & Domain Implementations**

**@esteban-url/cli/testing Cleanup**

- Remove general-purpose utilities (path utils, fixtures, performance monitoring)
- Keep only CLI-specific: command runners, interactive testing, CLI context mocking
- Reduce from 121 to ~15 CLI-focused utilities

**Implement Missing Testing Directories**

- Create testing directories for: git, watcher, formats, workflows, db, create-cli
- Implement shallow but functional utilities for each domain

### **Phase 3: Complete Remaining Packages**

**Enhance Existing Packages**

- Improve data/testing with actual utilities (not placeholders)
- Improve validation/testing with Zod-specific helpers
- Improve config/testing with configuration testing patterns

**Final Integration & Testing**

- Update all package dependencies for new testing imports
- Test composition patterns (CLI + fs, data + validation, etc.)
- Ensure all packages have complete testing capabilities

### **Phase 4: Export Standardization**

**Standardize All Package Exports**

- Apply consistent export pattern to all packages
- Update all package.json subpath exports
- Ensure predictable import patterns across the monorepo

## **File-by-File Implementation Priority**

### **High Priority**

1. `tooling/vitest-config/` - Simplify to cross-cutting only
2. `packages/core/src/testing/` - Move Result matchers from CLI
3. `packages/cli/src/testing/` - Remove non-CLI utilities

### **Medium Priority**

4. `packages/fs/src/testing/` - Already good, minor enhancements
5. `packages/data/src/testing/` - Replace placeholders with actual utilities
6. `packages/validation/src/testing/` - Implement Zod-specific helpers
7. `packages/config/src/testing/` - Implement configuration testing

### **Low Priority**

8. `packages/git/src/testing/` - Create new directory
9. `packages/watcher/src/testing/` - Create new directory
10. `packages/formats/src/testing/` - Create new directory
11. `packages/workflows/src/testing/` - Create new directory
12. `packages/db/src/testing/` - Create new directory
13. `packages/create-cli/src/testing/` - Create new directory

### **All Packages**

14. Standardize all `index.ts` export patterns
15. Update all `package.json` subpath exports
16. Update all package dependencies for new testing imports

## **Expected Outcomes**

### **Utility Distribution**

- **Before**: 121 utilities in CLI + scattered utilities across packages
- **After**: ~15 CLI utilities + ~8 per domain package = ~95 total utilities
- **Distribution**: Logical domain-focused distribution instead of centralized accumulation

### **Benefits**

1. **Domain Expertise**: Each package owns its testing story and domain-specific patterns
2. **Discoverability**: Developers know exactly where to find testing utilities for each domain
3. **Composition**: Clear, explicit imports for cross-domain testing scenarios
4. **Maintainability**: Testing utilities evolve alongside their domain expertise
5. **Consistency**: All packages provide predictable testing capabilities
6. **Reusability**: Well-defined composition patterns for complex testing scenarios
7. **Reduced Cognitive Load**: No more searching through 121 utilities to find the right one

### **Breaking Changes**

- CLI testing utilities significantly reduced and refocused
- Result matchers moved from vitest-config to core/testing
- Import paths change for all testing utilities
- Some packages gain testing directories for the first time
- Export patterns standardized across all packages

## **Migration Strategy**

Since this is a breaking change, packages should be updated simultaneously to avoid compatibility issues. The migration involves:

1. **Update import statements** for testing utilities across all test files
2. **Adopt new composition patterns** for cross-domain testing
3. **Use standardized export patterns** when importing from any package
4. **Leverage domain-specific testing utilities** instead of generic ones

This plan creates a sustainable, domain-driven testing architecture where each package provides comprehensive testing utilities for its domain while enabling clear composition patterns for complex testing scenarios. The result is better organization, improved discoverability, and more maintainable testing code across the entire monorepo.
