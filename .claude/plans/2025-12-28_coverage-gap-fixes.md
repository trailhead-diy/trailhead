# Plan: Fix All Identified Coverage Gaps

## Overview

Address 75 total gaps across 4 packages, prioritized by risk level:

- **CRITICAL**: 6 gaps (security-sensitive, create-cli)
- **HIGH**: 18 gaps (cross-package impact, core + cli + data)
- **MEDIUM**: 24 gaps (partial coverage)
- **LOW**: 27 gaps (testing utilities, edge cases)

## Scope

**In scope**: All 75 gaps across all priority levels
**Approach**: Sequential by priority (1→2→3→4→5→6), commit after each priority

## Priority 1: Security-Critical (create-cli)

### 1.1 Path Validation Tests

**File**: `packages/create-cli/src/lib/config/__tests__/validation.test.ts` (new)

Tests needed:

- `validateProjectPath`: directory traversal (`../`), absolute paths, symlinks
- `validateTemplatePath`: template injection, path escape attempts
- `validateOutputPath`: write-outside-project prevention

```typescript
describe('validateProjectPath', () => {
  it('should reject paths with directory traversal')
  it('should reject absolute paths outside allowed roots')
  it('should handle symlink attacks')
  it('should normalize and validate resolved paths')
})
```

### 1.2 Sanitization Tests

**File**: `packages/create-cli/src/lib/templates/__tests__/sanitization.test.ts` (new)

Tests needed:

- `sanitizeText`: control chars, null bytes, injection patterns
- `sanitizeTemplateContext`: XSS patterns, prototype pollution
- `sanitizeObject`: recursive depth limits, circular refs

## Priority 2: Cross-Package Impact (core)

### 2.1 Error Mapper Tests

**File**: `packages/core/__tests__/error-mappers.test.ts` (new)

Tests needed:

- `mapNodeError`: ENOENT, EACCES, EEXIST, EPERM patterns
- `mapLibraryError`: Error wrapping, context preservation
- `mapValidationError`: field/value context, JSON serialization

```typescript
describe('mapNodeError', () => {
  it('should map ENOENT to file-not-found CoreError')
  it('should map EACCES to permission-denied CoreError')
  it('should preserve path and operation context')
})
```

### 2.2 Async Composition Error Path

**File**: `packages/core/__tests__/functional.test.ts` (existing)

Add test:

```typescript
it('should short-circuit on first error in composeResultAsync', async () => {
  const fail = async () => err(createCoreError(...))
  const shouldNotRun = vi.fn()
  const composed = composeResultAsync(fail, shouldNotRun)
  const result = await composed('input')
  expect(result.isErr()).toBe(true)
  expect(shouldNotRun).not.toHaveBeenCalled()
})
```

## Priority 3: User-Facing Features (cli)

### 3.1 Git Hooks Command Tests

**File**: `packages/cli/tests/git-hooks.integration.test.ts` (new)

Tests needed:

- `installGitHooks`: creates hooks, handles existing hooks
- `updateGitHooks`: preserves config, updates scripts
- `removeGitHooks`: cleans up, handles partial state

Requires mock git repository fixture.

### 3.2 Subprocess Execution Tests

**File**: `packages/cli/tests/subprocess.test.ts` (new)

Tests needed:

- `executeSubprocess`: spawn, stdout/stderr capture, exit codes
- Timeout handling, error propagation

### 3.3 Rollback Behavior Tests

**File**: `packages/cli/tests/patterns.test.ts` (new)

Tests needed:

- `executeFileSystemOperations.rollback`: partial completion recovery
- `executeWithPhases.rollback`: phase failure propagation

## Priority 4: File I/O Integration (data)

### 4.1 CSV File Operations

**File**: `packages/data/src/csv/core.integration.test.ts` (new)

Tests needed:

- `parseFile`: real CSV fixtures, encoding, large files
- `writeFile`: temp directory, verify contents

### 4.2 JSON File Operations

**File**: `packages/data/src/json/core.integration.test.ts` (new)

Tests needed:

- `parseFile`: malformed files, BOM handling
- `writeFile`: permissions, atomic writes

### 4.3 Excel File Operations

**File**: `packages/data/src/excel/core.integration.test.ts` (new)

Tests needed:

- `parseFile`: real .xlsx fixture, multiple worksheets
- `writeFile`: read-back verification

### 4.4 Fixtures Directory

**Directory**: `packages/data/tests/fixtures/`

Create:

- `sample.csv` - basic CSV with headers
- `sample.json` - nested object structure
- `sample.xlsx` - multi-worksheet Excel file

## Priority 5: Medium Priority Gaps

### 5.1 CLI Partial Coverage

**Files**: Various in `packages/cli/`

| Gap                        | File                 | Test Needed                  |
| -------------------------- | -------------------- | ---------------------------- |
| executeBatch.failFast      | patterns.ts:375      | Batch failure handling       |
| displaySummary             | patterns.ts:620      | Summary formatting           |
| directoryPrompt.validation | prompts/index.ts:117 | Path traversal prevention    |
| cli.run.variadicArgs       | cli.ts:199           | Variadic edge cases          |
| cli.run.errorRecovery      | cli.ts:219           | Error handling + suggestions |
| defineOptions.chainMethods | builders.ts:130      | Fluent API chaining          |
| commonOptions              | options.ts           | Option defaults              |

### 5.2 Core Partial Coverage

**Files**: Various in `packages/core/`

| Gap                          | File               | Test Needed                           |
| ---------------------------- | ------------------ | ------------------------------------- |
| testing/async-helpers        | async-helpers.ts   | retryAsync, withTimeout, processBatch |
| testing/vitest-matchers      | vitest-matchers.ts | Custom matcher edge cases             |
| testing/error-factories      | error-factories.ts | createErrorChain, extractErrorChain   |
| combine/combineWithAllErrors | utils.ts           | CoreError integration                 |

### 5.3 Create-CLI Partial Coverage

**Files**: Various in `packages/create-cli/`

| Gap                   | File                | Test Needed                        |
| --------------------- | ------------------- | ---------------------------------- |
| Handlebars helpers    | compiler.ts:118-262 | kebab, pascal, camel, json, date   |
| Template caching      | compiler.ts:400-489 | Cache hit/miss, mtime invalidation |
| precompileTemplates   | compiler.ts:498-552 | Batch precompilation errors        |
| getTemplateFiles      | loader.ts:54-112    | Monorepo file filtering            |
| resolveTemplatePaths  | loader.ts:139-171   | Path resolution fallback           |
| formatGeneratedCode   | transforms.ts:11-61 | File type parsers                  |
| createTemplateContext | context.ts:7-91     | Context variable generation        |

### 5.4 Data Partial Coverage

**Files**: Various in `packages/data/`

| Gap                                  | File                  | Test Needed                |
| ------------------------------------ | --------------------- | -------------------------- |
| Excel.parseWorksheet                 | excel/core.ts:127     | Parse by worksheet name    |
| Excel.parseWorksheetByIndex          | excel/core.ts:136     | Index bounds handling      |
| Detection.detectBatch                | detection/core.ts:153 | Error aggregation          |
| sortJSONArray.nullHandling           | json/core.ts:266      | Null/undefined in sort     |
| extractUniqueSorted.accessorRecovery | json/core.ts:348      | Partial accessor failure   |
| MimeOperations.parseMimeType         | mime/core.ts:103      | Multi-parameter MIME types |

## Priority 6: Low Priority Gaps

### 6.1 Testing Utilities (all packages)

| Package    | Gap                                     | Notes                  |
| ---------- | --------------------------------------- | ---------------------- |
| core       | Type guards (isDefined, isObject, etc.) | Simple predicates      |
| core       | Pre-configured error factories          | Thin wrappers          |
| create-cli | createArgsParserError                   | Unused utility         |
| create-cli | debugTemplateContext                    | Debug-only             |
| data       | testing.dataGenerators                  | Meta-testing utilities |

### 6.2 Verification Tests (create-cli)

Already covered by E2E but could have unit tests:

- `generator.verifyPackageJson`
- `generator.verifyTypeScriptConfig`
- `generator.verifyProjectStructure`

## Quality Issues to Fix

### 5.1 Fix No-Assertion Tests

**File**: `packages/data/src/detection/core.test.ts`

Replace:

```typescript
// BAD: expect(result.isOk() || result.isErr()).toBe(true)
// GOOD: expect(result.isErr()).toBe(true)
//       expect(result.error.type).toBe('file-not-found')
```

### 5.2 Improve CLI Test Assertions

**File**: `packages/cli/tests/cli-orchestration.test.ts`

Add actual assertions for captured context snapshots.

## Implementation Order

| Phase | Priority          | Package(s) | Commit After |
| ----- | ----------------- | ---------- | ------------ |
| 1     | P1: Security      | create-cli | Yes          |
| 2     | P2: Cross-package | core       | Yes          |
| 3     | P3: User-facing   | cli        | Yes          |
| 4     | P4: File I/O      | data       | Yes          |
| 5     | P5: Medium gaps   | all        | Yes          |
| 6     | P6: Low gaps      | all        | Yes          |
| 7     | Quality fixes     | cli, data  | Yes          |

## Files to Create/Modify

### Priority 1-4 (Critical + High)

| Action | Path                                                                   |
| ------ | ---------------------------------------------------------------------- |
| CREATE | `packages/create-cli/src/lib/config/__tests__/validation.test.ts`      |
| CREATE | `packages/create-cli/src/lib/templates/__tests__/sanitization.test.ts` |
| CREATE | `packages/core/__tests__/error-mappers.test.ts`                        |
| MODIFY | `packages/core/__tests__/functional.test.ts`                           |
| CREATE | `packages/cli/tests/git-hooks.integration.test.ts`                     |
| CREATE | `packages/cli/tests/subprocess.test.ts`                                |
| CREATE | `packages/cli/tests/patterns.test.ts`                                  |
| CREATE | `packages/data/src/csv/core.integration.test.ts`                       |
| CREATE | `packages/data/src/json/core.integration.test.ts`                      |
| CREATE | `packages/data/src/excel/core.integration.test.ts`                     |
| CREATE | `packages/data/tests/fixtures/sample.csv`                              |
| CREATE | `packages/data/tests/fixtures/sample.json`                             |
| CREATE | `packages/data/tests/fixtures/sample.xlsx`                             |

### Priority 5 (Medium)

| Action | Path                                                              |
| ------ | ----------------------------------------------------------------- |
| MODIFY | `packages/cli/tests/patterns.test.ts` (extend)                    |
| MODIFY | `packages/cli/tests/cli.test.ts` (extend)                         |
| CREATE | `packages/core/__tests__/testing-utils.test.ts`                   |
| CREATE | `packages/create-cli/src/lib/templates/__tests__/helpers.test.ts` |
| CREATE | `packages/create-cli/src/lib/templates/__tests__/caching.test.ts` |
| MODIFY | `packages/data/src/excel/core.test.ts` (extend)                   |
| MODIFY | `packages/data/src/detection/core.test.ts` (extend)               |
| MODIFY | `packages/data/src/json/core.test.ts` (extend)                    |

### Priority 6 (Low)

| Action | Path                                              |
| ------ | ------------------------------------------------- |
| CREATE | `packages/core/__tests__/type-guards.test.ts`     |
| CREATE | `packages/core/__tests__/error-factories.test.ts` |

### Quality Fixes

| Action | Path                                           |
| ------ | ---------------------------------------------- |
| MODIFY | `packages/data/src/detection/core.test.ts`     |
| MODIFY | `packages/cli/tests/cli-orchestration.test.ts` |

## Estimated Effort

| Priority                  | Effort     |
| ------------------------- | ---------- |
| P1: Security (create-cli) | ~2-3 hours |
| P2: Cross-package (core)  | ~1-2 hours |
| P3: User-facing (cli)     | ~3-4 hours |
| P4: File I/O (data)       | ~2-3 hours |
| P5: Medium gaps           | ~4-6 hours |
| P6: Low gaps              | ~2-3 hours |
| Quality fixes             | ~1 hour    |

**Total**: ~16-22 hours
