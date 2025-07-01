# Cross-Platform Testing Guide

This guide provides comprehensive patterns and best practices for writing tests that work reliably across Windows, macOS, and Linux environments in the Trailhead monorepo.

## Overview

Cross-platform compatibility is critical for a monorepo that may be developed and deployed across different operating systems. This guide covers the most common issues and provides robust solutions.

## Common Cross-Platform Issues

### 1. Path Separator Differences

**Problem**: Windows uses backslashes (`\`) while Unix systems use forward slashes (`/`)

**❌ Problematic Code:**
```typescript
const filePath = basePath + '/components/button.tsx'  // Fails on Windows
const testDir = process.cwd() + '\\temp\\test'        // Fails on Unix
```

**✅ Solution:**
```typescript
import { safeJoin, createAbsoluteTestPath } from '../../utils/cross-platform-paths.js'

const filePath = safeJoin(basePath, 'components', 'button.tsx')
const testDir = createAbsoluteTestPath('temp', 'test')
```

### 2. Temporary Directory Handling

**Problem**: Different temp directory locations and permissions across platforms

**❌ Problematic Code:**
```typescript
const tempDir = path.join(process.cwd(), 'temp', `test-${Date.now()}`)
```

**✅ Solution:**
```typescript
import { createTempPath } from '../../utils/cross-platform-paths.js'

const tempDir = createTempPath('test')  // Uses OS-specific temp directory
```

### 3. Mock Filesystem Path Normalization

**Problem**: Mock filesystems need consistent path handling

**❌ Problematic Code:**
```typescript
const mockFiles = new Map([
  ['/project/src/component.tsx', 'content'],  // Hardcoded Unix paths
])
```

**✅ Solution:**
```typescript
import { createMockFileSystem, normalizeMockPath } from '../../utils/mock-filesystem.js'

const mockFs = createMockFileSystem({
  initialFiles: {
    [normalizeMockPath('/project/src/component.tsx')]: 'content'
  }
})
```

## Cross-Platform Testing Utilities

The monorepo provides comprehensive utilities in `/packages/web-ui/tests/utils/`:

### Core Path Utilities

```typescript
import {
  createTestPath,           // Creates normalized test paths
  createAbsoluteTestPath,   // Creates absolute paths from project root
  createTempPath,           // Creates OS-specific temp paths
  safeJoin,                // Safe path joining with normalization
  normalizeMockPath,        // Normalizes paths for mock filesystems
  toPosixPath,             // Converts to POSIX format for assertions
  createPathRegex,         // Creates flexible path regex patterns
  pathAssertions           // Cross-platform path assertion helpers
} from '../../utils/cross-platform-paths.js'
```

### Mock Filesystem Utilities

```typescript
import {
  createMockFileSystem,        // Creates cross-platform mock filesystem
  createTestMockFileSystem,    // Pre-configured test filesystem
  createCatalystMockFileSystem // Catalyst component mock filesystem
} from '../../utils/mock-filesystem.js'
```

## Best Practices

### 1. Always Use Path Utilities

**DO:**
- Use `safeJoin()` instead of `path.join()` for mixed inputs
- Use `createTempPath()` for temporary directories
- Use `createAbsoluteTestPath()` for project-relative paths
- Use `normalizeMockPath()` for mock filesystem paths

**DON'T:**
- Hardcode path separators
- Use string concatenation for paths
- Assume Unix-style paths in tests
- Use `process.cwd()` directly without normalization

### 2. Mock Filesystem Setup

```typescript
describe('Cross-platform test', () => {
  let mockFs: ReturnType<typeof createMockFileSystem>
  
  beforeEach(() => {
    // Use the provided mock filesystem utilities
    mockFs = createTestMockFileSystem()
    
    // Add files with normalized paths
    mockFs.addFile(
      normalizeMockPath('/project/src/component.tsx'),
      'export function Component() {}'
    )
  })
  
  afterEach(() => {
    mockFs.clear()
  })
})
```

### 3. Path Assertions

```typescript
import { pathAssertions } from '../../utils/cross-platform-paths.js'

// Use cross-platform assertions
expect(pathAssertions.pathsEqual(actualPath, expectedPath)).toBe(true)
expect(pathAssertions.pathContains(fullPath, 'components')).toBe(true)
expect(pathAssertions.isAbsolutePath(testPath)).toBe(true)
```

### 4. Regex Patterns for Paths

```typescript
import { createPathRegex } from '../../utils/cross-platform-paths.js'

// Create flexible regex that matches both separators
const componentPathRegex = createPathRegex('src/components/.*\\.tsx$')
expect(componentPathRegex.test('src\\components\\button.tsx')).toBe(true)  // Windows
expect(componentPathRegex.test('src/components/button.tsx')).toBe(true)    // Unix
```

## Testing Patterns

### Pattern 1: File System Operations

```typescript
import { createTempPath, safeJoin } from '../../utils/cross-platform-paths.js'
import { promises as fs } from 'fs'

describe('File operations', () => {
  let tempDir: string
  
  beforeEach(async () => {
    tempDir = createTempPath('file-ops-test')
    await fs.mkdir(tempDir, { recursive: true })
  })
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })
  
  it('should handle file operations cross-platform', async () => {
    const filePath = safeJoin(tempDir, 'test.txt')
    await fs.writeFile(filePath, 'content')
    
    const content = await fs.readFile(filePath, 'utf-8')
    expect(content).toBe('content')
  })
})
```

### Pattern 2: Transform Testing

```typescript
import { createMockFileSystem } from '../../utils/mock-filesystem.js'
import { runTransform } from '../../../src/transforms/index.js'

describe('Transform operations', () => {
  let mockFs: ReturnType<typeof createMockFileSystem>
  
  beforeEach(() => {
    mockFs = createMockFileSystem({
      initialFiles: {
        [normalizeMockPath('/src/component.tsx')]: 'original content'
      }
    })
  })
  
  it('should transform files cross-platform', async () => {
    const result = await runTransform(mockFs, '/src/component.tsx')
    expect(result.success).toBe(true)
  })
})
```

### Pattern 3: CLI Testing

```typescript
import { createTestConfig } from '../../utils/cross-platform-paths.js'

describe('CLI operations', () => {
  it('should handle CLI operations cross-platform', () => {
    const config = createTestConfig({
      projectRoot: '/custom/project/root'
    })
    
    expect(config.projectRoot).toBeDefined()
    expect(config.componentsDir).toBeDefined()
  })
})
```

## Debugging Cross-Platform Issues

### Debug Utilities

```typescript
import { debugPaths } from '../../utils/cross-platform-paths.js'

// Debug path information
console.log(debugPaths.showPathInfo('/some/path'))
console.log(debugPaths.showEnvironment())
```

### Environment Variables

Set these environment variables for debugging:

- `DEBUG_PATHS=true` - Enable path debugging
- `TEST_WINDOWS_PATHS=true` - Force Windows path testing
- `KEEP_TEMP=true` - Keep temporary directories for inspection

### Common Debugging Steps

1. **Check path normalization:**
   ```typescript
   console.log('Original:', originalPath)
   console.log('Normalized:', normalize(originalPath))
   console.log('Platform sep:', sep)
   ```

2. **Verify mock filesystem state:**
   ```typescript
   console.log('Mock paths:', mockFs.getStoredPaths())
   ```

3. **Test path operations:**
   ```typescript
   console.log('Path exists:', await mockFs.exists(testPath))
   console.log('Path normalized:', normalizeMockPath(testPath))
   ```

## CI/CD Integration

The monorepo includes a comprehensive CI/CD workflow (`.github/workflows/cross-platform-tests.yml`) that:

- Tests on Windows, macOS, and Linux
- Validates path handling across platforms
- Runs Windows-specific edge case tests
- Generates compatibility reports

### Running Cross-Platform Tests Locally

```bash
# Test on current platform
pnpm test

# Test with Windows path simulation (Unix/macOS)
TEST_WINDOWS_PATHS=true pnpm test

# Test with debugging enabled
DEBUG_PATHS=true pnpm test

# Keep temp directories for inspection
KEEP_TEMP=true pnpm test
```

## Migration Guide

### Updating Existing Tests

1. **Replace hardcoded paths:**
   ```typescript
   // Before
   const testPath = '/project/src/component.tsx'
   
   // After
   const testPath = normalizeMockPath('/project/src/component.tsx')
   ```

2. **Update path operations:**
   ```typescript
   // Before
   const fullPath = path.join(basePath, 'component.tsx')
   
   // After
   const fullPath = safeJoin(basePath, 'component.tsx')
   ```

3. **Update mock filesystem usage:**
   ```typescript
   // Before
   const mockFiles = new Map([...])
   
   // After
   const mockFs = createMockFileSystem({ initialFiles: {...} })
   ```

4. **Update assertions:**
   ```typescript
   // Before
   expect(actualPath).toBe(expectedPath)
   
   // After
   expect(pathAssertions.pathsEqual(actualPath, expectedPath)).toBe(true)
   ```

## Performance Considerations

### Path Normalization Overhead

The utilities are designed for minimal performance impact:

- Path normalization is cached where possible
- Mock filesystem operations are optimized for test scenarios
- Utilities use native Node.js path methods internally

### Memory Usage

- Mock filesystems clear state between tests
- Temporary directories are automatically cleaned up
- Path utilities don't store unnecessary state

## Future Improvements

1. **Automated Migration Tool**: Create a script to automatically migrate existing tests
2. **IDE Integration**: Add IDE snippets for common patterns
3. **Performance Monitoring**: Add benchmarks for path operations
4. **Extended Platform Support**: Consider additional platforms if needed

## Troubleshooting

### Common Issues

1. **Tests pass locally but fail in CI:**
   - Check path separator assumptions
   - Verify temp directory cleanup
   - Review mock filesystem path normalization

2. **Windows-specific failures:**
   - Check for hardcoded Unix paths
   - Verify backslash handling in regex
   - Review UNC path handling if applicable

3. **Mock filesystem issues:**
   - Ensure paths are normalized before storage
   - Check parent directory creation
   - Verify case sensitivity settings

### Getting Help

- Review test utilities source code in `/packages/web-ui/tests/utils/`
- Check existing test examples for patterns
- Run debug utilities to understand path behavior
- Check CI/CD logs for platform-specific failures

This guide ensures robust, maintainable cross-platform testing across the entire Trailhead monorepo.