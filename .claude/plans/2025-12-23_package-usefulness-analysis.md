# Package Usefulness Analysis

**Date**: 2025-12-23
**Packages Analyzed**: `@trailhead/data`, `@trailhead/fs`, `@trailhead/sort`

---

## @trailhead/data

| Metric             | Value                                                      |
|--------------------|------------------------------------------------------------|
| Lines of code      | 9,515                                                      |
| External consumers | **0** (all refs are JSDoc examples or vitest alias config) |
| Core value-add     | CSV/JSON/Excel parsing with auto-detection + Result types  |
| Alternative        | `papaparse`, `xlsx`, `file-type` directly                  |
| Verdict            | **DELETE**                                                 |

### Analysis

This is 9,500+ lines of aspirational code with zero external consumers. It wraps
papaparse/xlsx with Result types and adds format detection, but nobody uses it.

**Dependencies pulled in**:
- `papaparse` - CSV parsing
- `xlsx` - Excel parsing
- `file-type` - Format detection
- `mime-types` - MIME type handling
- `@trailhead/core`, `@trailhead/fs`, `@trailhead/sort`

**Conclusion**: Pure technical debt. Delete entire package.

---

## @trailhead/fs

| Metric             | Value                                                             |
|--------------------|-------------------------------------------------------------------|
| Lines of code      | ~3,850 (core:752, errors:166, path-utils:969, mock-fs:443, etc.)  |
| External consumers | **3 packages** (cli, create-cli, data[^1])                        |
| Core value-add     | Result-wrapped fs-extra + mock-fs for testing                     |
| Alternative        | `fs-extra` + try/catch, custom mock                               |
| Verdict            | **KEEP**                                                          |

[^1]: data has 0 consumers, so effectively 2 real consumers

### Analysis

Provides consistent Result-based error handling and valuable testing utilities (mock-fs).
Real consumers in cli and create-cli make this worth keeping.

**Key exports**:
- `fs` object with Result-wrapped operations (readFile, writeFile, exists, etc.)
- `createFileSystemError`, `mapNodeError` - error handling
- Mock filesystem for testing
- Path utilities

**Dependencies**:
- `fs-extra` - Enhanced filesystem operations
- `glob` - File pattern matching
- `@trailhead/core`, `@trailhead/sort`

**Conclusion**: Keep. Provides real value with actual consumers.

---

## @trailhead/sort

| Metric             | Value                                                    |
|--------------------|----------------------------------------------------------|
| Lines of code      | 614 source + 227 tests = 841 total                       |
| External consumers | **3 packages** (cli, create-cli, fs) but with caveats    |
| Core value-add     | Re-exports es-toolkit + topN/bottomN partial sort        |
| Alternative        | `es-toolkit` directly + inline topN/bottomN (~150 lines) |
| Verdict            | **DELETE / MERGE 150 lines into core**                   |

### Function-by-Function Analysis

| Function           | Used By           | es-toolkit has? | Value?     |
|--------------------|-------------------|-----------------|------------|
| sortBy, orderBy    | cli, create-cli   | Yes             | 0          |
| partition          | (not used!)       | Yes             | 0          |
| sortStrings        | create-cli, data  | No              | 3 lines    |
| topN, bottomN      | cli (stats.ts)    | No              | ~150 LOC   |

### Analysis

- **sortBy/orderBy**: Pure re-exports from es-toolkit. Zero value over direct import.
- **partition**: es-toolkit already has this AND it's not even used in the codebase.
- **sortStrings**: `[...arr].sort()` with optional reverse - trivial to inline.
- **topN/bottomN**: Actual novel partial-sort algorithms with O(n) instead of O(n log n).
  These are the only functions with genuine value.

**Actual usage locations**:
- `packages/cli/src/utils/stats.ts` - uses topN, bottomN, sortBy, orderBy
- `packages/cli/src/testing/performance.ts` - uses topN, bottomN, sortBy, orderBy
- `packages/create-cli/src/lib/templates/modules.ts` - uses sortBy, sortStrings
- `packages/fs/src/types.ts` - uses Order type only

**Conclusion**: Delete package. Move topN/bottomN (~150 lines) to `@trailhead/core` or inline
in cli. Change all sortBy/orderBy imports to direct es-toolkit.

---

## Summary

| Package | LOC   | Consumers | Verdict          | Action                          |
|---------|-------|-----------|------------------|---------------------------------|
| data    | 9,515 | 0         | **DELETE**       | Delete entire package           |
| fs      | 3,850 | 2         | **KEEP**         | None                            |
| sort    | 841   | 3         | **DELETE/MERGE** | Move topN/bottomN to core [^2]  |

[^2]: Only ~150 lines of novel code worth preserving

### Impact Summary

- **Lines to delete**: ~10,000+ (data: 9,515 + sort: ~690 after extracting topN/bottomN)
- **Lines to preserve**: ~150 (topN/bottomN algorithms)
- **Dependencies removed**: papaparse, xlsx, file-type, mime-types

### Recommended Actions

1. **Delete `@trailhead/data`** - Zero consumers, pure aspirational code
2. **Delete `@trailhead/sort`** after:
   - Moving `topN`/`bottomN` to `@trailhead/core` (~150 lines)
   - Updating cli imports to use es-toolkit directly for sortBy/orderBy
   - Inlining sortStrings in create-cli (3 lines)
3. **Update `@trailhead/fs`** - Remove dependency on `@trailhead/sort`

---

*Analysis performed using the framework: external consumers, LOC vs value ratio,
dependency analysis, and alternative evaluation.*
