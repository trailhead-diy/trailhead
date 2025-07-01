# Cross-Platform Testing Support in @trailhead/cli

## Summary

Cross-platform testing learnings from the Windows path fixes have been integrated into the @trailhead/cli framework. All future CLIs built with the framework will benefit from built-in cross-platform support.

## What Was Added

### 1. Path Utilities (`src/testing/path-utils.ts`)

- `normalizePath()` - Normalizes paths for consistent comparisons
- `toPosixPath()` / `toWindowsPath()` - Convert between path formats
- `createTestPath()` - Creates platform-appropriate test paths
- `pathAssertions` - Helpers for cross-platform path testing
- `testPaths` - Common test paths that work on all platforms

### 2. Enhanced Memory FileSystem

The memory filesystem now automatically normalizes paths, so these work identically:

```typescript
await fs.readFile("/config/app.json"); // Unix style
await fs.readFile("C:\\config\\app.json"); // Windows style - same file!
```

### 3. Updated Documentation

- Added "Cross-Platform Testing" section to the testing guide
- Covers common pitfalls and solutions
- Includes practical examples

### 4. Example CLI

Created a cross-platform file organizer example showing:

- Proper path handling in commands
- Cross-platform tests
- CI configuration for multi-platform testing

## Usage

```typescript
import {
  createTestContext,
  pathAssertions,
  testPaths,
} from "@trailhead/cli/testing";

describe("My CLI", () => {
  it("works on all platforms", async () => {
    const context = createTestContext({
      files: {
        [testPaths.project("config.json")]: '{"name": "app"}',
      },
    });

    // Path assertions work regardless of platform
    const configPath = testPaths.project("config.json");
    expect(pathAssertions.contains(configPath, "config")).toBe(true);
  });
});
```

## Benefits

1. **Zero Configuration** - Cross-platform support works out of the box
2. **Automatic Path Normalization** - Memory filesystem handles path differences
3. **Testing Utilities** - Built-in helpers for common path operations
4. **Clear Documentation** - Examples and best practices included
5. **CI Ready** - Example GitHub Actions configuration for multi-platform testing

Future CLIs built with @trailhead/cli will automatically work correctly on Windows, macOS, and Linux without additional effort.
