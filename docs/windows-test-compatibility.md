# Windows Test Compatibility Solution

## Overview

This document provides a comprehensive solution for fixing Windows test failures in the Trailhead monorepo. The solution follows functional programming principles, maintains type safety, and implements reusable utilities to ensure cross-platform compatibility.

## Problem Analysis

### Root Causes

1. **Hardcoded Unix paths** (`/project/`, `/test/`, etc.) in test files
2. **Path separator mismatches** between Unix (`/`) and Windows (`\`)
3. **Mock filesystem inconsistencies** across platforms
4. **String-based path comparisons** that fail on Windows
5. **Absolute path assumptions** that don't translate between platforms

### Affected Files

#### High Priority (Direct Path Issues)

- `packages/cli/tests/src/core/command/base.test.ts`
- `packages/web-ui/tests/scripts/install/integration.test.ts`
- `packages/web-ui/tests/scripts/install/framework-detection.test.ts`
- `packages/web-ui/tests/scripts/install/installation-workflow.test.ts`

#### Medium Priority (Path Comparisons)

- `packages/web-ui/tests/src/cli/core/installation/component-installer.test.ts`
- `packages/web-ui/tests/src/cli/core/installation/step-factory.test.ts`
- `packages/web-ui/tests/src/cli/integration/install-workflow.test.ts`
- `packages/web-ui/tests/scripts/shared/file-utils.test.ts`

## Solution Architecture

### 1. Cross-Platform Path Utilities

We've created comprehensive utilities in two locations:

- `packages/web-ui/tests/utils/cross-platform-paths.ts` (existing)
- `packages/cli/tests/test-utils/cross-platform-paths.ts` (new)

#### Key Functions

```typescript
// Platform-aware path creation
export const createTestPath = (...segments: string[]): string
export const createAbsoluteTestPath = (...segments: string[]): string
export const createTempPath = (testName: string, timestamp?: number): string

// Path normalization
export const normalizeMockPath = (path: string): string
export const toPosixPath = (path: string): string
export const toWindowsPath = (path: string): string

// Safe operations
export const safeJoin = (...segments: string[]): string
export const safeRelative = (from: string, to: string): string

// Assertions
export const pathAssertions = {
  pathContains(actualPath: string, expectedSegment: string): boolean
  pathsEqual(path1: string, path2: string): boolean
  isAbsolutePath(path: string): boolean
}

// Test constants
export const testPaths = {
  mockProject: isWindows ? 'C:\\test\\project' : '/test/project',
  mockCli: isWindows ? 'C:\\test\\cli' : '/test/cli',
  // ... other paths
}
```

### 2. MockFileSystemPaths Class

A robust mock filesystem that handles cross-platform paths correctly:

```typescript
export class MockFileSystemPaths {
  addPath(path: string, content?: string): string;
  hasPath(path: string): boolean;
  getContent(path: string): string | undefined;
  listDirectory(dirPath: string): string[];
  clear(): void;
}
```

### 3. Implementation Strategy

#### Phase 1: Update Imports

Add cross-platform utilities import to affected test files:

```typescript
import {
  createTestPath,
  safeJoin,
  testPaths,
  isWindows,
} from "../test-utils/cross-platform-paths.js";
```

#### Phase 2: Replace Hardcoded Paths

Convert all hardcoded paths to use utility functions:

```typescript
// Before
const projectRoot = "/test/project";
const config = { path: "/project/src/components" };

// After
const projectRoot = testPaths.mockProject;
const config = { path: projectPath("src", "components") };
```

#### Phase 3: Fix Path Comparisons

Use path assertion utilities for comparisons:

```typescript
// Before
expect(result.path).toBe("/project/src/file.ts");

// After
expect(
  pathAssertions.pathsEqual(result.path, projectPath("src", "file.ts")),
).toBe(true);
```

## Manual Fixes Required

### 1. Fix CLI Package Tests

```bash
# Already completed:
# - packages/cli/tests/src/core/command/base.test.ts
```

### 2. Fix Web-UI Integration Tests

The `integration.test.ts` file requires extensive updates:

- Replace all `/project/` paths with `projectPath()` calls
- Replace all `/trailhead/` paths with `trailheadPath()` calls
- Update mock filesystem to use normalized paths

### 3. Update Mock Data Structures

Convert hardcoded paths in test data:

```typescript
// Before
existingFiles: new Set([
  "/project/package.json",
  "/project/src/components/button.tsx",
]);

// After
existingFiles: new Set([
  projectPath("package.json"),
  projectPath("src", "components", "button.tsx"),
]);
```

## Validation Approach

### 1. Local Testing

```bash
# Test on Unix/Mac
pnpm test

# Test on Windows (use Windows VM or CI)
pnpm test
```

### 2. CI/CD Integration

Add Windows test matrix to GitHub Actions:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
```

### 3. Path Validation Tests

Add specific tests for path utilities:

```typescript
describe("Cross-Platform Path Validation", () => {
  it("should handle Windows paths correctly", () => {
    const windowsPath = "C:\\Users\\test\\project";
    const normalized = normalizeMockPath(windowsPath);
    expect(normalized).toBe("C:/Users/test/project");
  });
});
```

## Future-Proofing Recommendations

### 1. ESLint Rule

Create custom ESLint rule to prevent hardcoded paths:

```javascript
module.exports = {
  rules: {
    "no-hardcoded-paths": {
      create(context) {
        return {
          Literal(node) {
            if (
              typeof node.value === "string" &&
              node.value.match(/^[\/\\](test|project|trailhead)/)
            ) {
              context.report({
                node,
                message:
                  "Use cross-platform path utilities instead of hardcoded paths",
              });
            }
          },
        };
      },
    },
  },
};
```

### 2. Test Template

Create a test file template with cross-platform imports:

```typescript
import { describe, it, expect } from "vitest";
import {
  createTestPath,
  testPaths,
} from "../test-utils/cross-platform-paths.js";

describe("Component Name", () => {
  const mockProjectRoot = testPaths.mockProject;

  it("should handle paths correctly", () => {
    const testFile = createTestPath("src", "component.ts");
    // ... test implementation
  });
});
```

### 3. Documentation

- Add cross-platform testing guidelines to contributing docs
- Include examples of common patterns and anti-patterns
- Document the utility functions and their usage

### 4. Automated Checks

- Add pre-commit hook to check for hardcoded paths
- Include Windows tests in PR checks
- Set up automated cross-platform testing

## Performance Considerations

The path utilities are designed to be lightweight:

- Minimal overhead for path operations
- Efficient normalization using native Node.js path module
- Lazy evaluation where possible
- No unnecessary string allocations

## Maintenance Guidelines

1. **Always use utility functions** for paths in tests
2. **Test on multiple platforms** before merging
3. **Keep utilities in sync** between packages
4. **Document platform-specific behaviors**
5. **Update this guide** when adding new patterns

## Common Patterns

### Creating Test Paths

```typescript
// Relative paths
const componentPath = createTestPath("src", "components", "button.tsx");

// Absolute paths
const projectPath = createAbsoluteTestPath("packages", "web-ui");

// Temporary paths
const tempDir = createTempPath("test-run");
```

### Mock Filesystem Usage

```typescript
const mockFs = new MockFileSystemPaths();
mockFs.addPath("/src/file.ts", "content");
mockFs.addPath("C:\\src\\file.ts", "content"); // Both work!

expect(mockFs.hasPath(createTestPath("src", "file.ts"))).toBe(true);
```

### Path Assertions

```typescript
// Check if path contains segment
expect(pathAssertions.pathContains(result, "components")).toBe(true);

// Compare paths (handles platform differences)
expect(pathAssertions.pathsEqual(actual, expected)).toBe(true);
```

## Conclusion

This comprehensive solution ensures Windows compatibility while maintaining:

- **Type safety** through TypeScript
- **Functional programming** principles
- **DRY** principle with reusable utilities
- **KISS** principle with simple, clear APIs
- **High maintainability** through centralized utilities

The solution scales with the codebase and prevents future Windows-specific issues through automated checks and clear guidelines.
