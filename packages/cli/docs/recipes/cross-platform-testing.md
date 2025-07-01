# Cross-Platform Testing Recipe

This recipe shows how to write tests that work correctly on Windows, macOS, and Linux.

## Common Pitfalls and Solutions

### 1. Path Separator Issues

**Problem**: Tests fail on Windows due to hardcoded forward slashes.

```typescript
// ❌ Bad - breaks on Windows
const configPath = '/home/user/.config/app.json'
expect(result.path).toBe('/home/user/.config/app.json')
```

**Solution**: Use path utilities and normalized comparisons.

```typescript
// ✅ Good - works everywhere
import { pathAssertions, testPaths } from '@trailhead/cli/testing';

const configPath = testPaths.config('app.json')
expect(pathAssertions.equal(result.path, configPath)).toBe(true)
```

### 2. Mock Filesystem Paths

**Problem**: Mock filesystem doesn't handle platform-specific paths.

```typescript
// ❌ Bad - paths don't match on Windows
const mockFs = mockFileSystem({
  '/project/src/index.ts': 'content'
})
```

**Solution**: Use normalized paths in mocks.

```typescript
// ✅ Good - automatic path normalization
import { mockFileSystem } from '@trailhead/cli/testing';
import { join } from 'path';

const mockFs = mockFileSystem({
  [join('project', 'src', 'index.ts')]: 'content'
})
```

### 3. Path Existence Checks

**Problem**: Real filesystem checks break test isolation.

```typescript
// ❌ Bad - uses real filesystem
import { existsSync } from 'fs';
if (existsSync(path)) { /* ... */ }
```

**Solution**: Mock filesystem modules properly.

```typescript
// ✅ Good - controlled test environment
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    existsSync: vi.fn((path: string) => {
      // Control what paths "exist" in tests
      return path.includes('src')
    })
  }
})
```

## Quick Reference

```typescript
import { 
  createPathRegex,
  pathAssertions,
  testPaths,
  normalizePath 
} from '@trailhead/cli/testing';

// Match paths with wildcards
const pattern = createPathRegex('src/components/*.tsx')
expect(pattern.test('src\\components\\button.tsx')).toBe(true) // Windows
expect(pattern.test('src/components/button.tsx')).toBe(true)   // Unix

// Compare paths safely
expect(pathAssertions.equal(
  'C:\\Users\\test\\file.txt',  // Windows
  '/Users/test/file.txt'         // Unix
)).toBe(true) // When normalized, they're equivalent

// Use platform-appropriate test paths
const projectDir = testPaths.mockProject    // C:\test\project or /test/project
const configFile = testPaths.config('app')  // Joins with correct separator
```

## CI Configuration

Always test on multiple platforms:

```yaml
# .github/workflows/test.yml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
```

## See Also

- [Testing Guide](../guides/testing-cli-apps.md#cross-platform-testing) - Comprehensive testing patterns
- [Path Utils API](../api/testing.md#path-utilities) - Full API documentation