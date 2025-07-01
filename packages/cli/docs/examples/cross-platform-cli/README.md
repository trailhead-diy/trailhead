# Cross-Platform CLI Example

This example demonstrates how to build a CLI that works correctly on Windows, macOS, and Linux.

## Key Features

- Handles file paths correctly on all platforms
- Uses the built-in cross-platform utilities
- Tests pass on Windows, macOS, and Linux

## The Example: File Organizer CLI

A simple CLI that organizes files by type into folders.

```typescript
// src/commands/organize.ts
import { createCommand } from '@trailhead/cli/command';
import { ok, err } from '@trailhead/cli/core';
import { join, extname } from 'path';

export const organizeCommand = createCommand({
  name: 'organize',
  description: 'Organize files by type',
  options: [
    { name: 'source', type: 'string', required: true },
    { name: 'dest', type: 'string', default: './organized' }
  ],
  action: async (options, context) => {
    const { source, dest } = options;
    const { fs, logger } = context;
    
    // Read source directory
    const filesResult = await fs.readdir(source);
    if (!filesResult.success) {
      return filesResult;
    }
    
    // Organize files by extension
    const organized = new Map<string, string[]>();
    for (const file of filesResult.value) {
      const ext = extname(file).toLowerCase() || 'no-extension';
      if (!organized.has(ext)) {
        organized.set(ext, []);
      }
      organized.get(ext)!.push(file);
    }
    
    // Create folders and move files
    for (const [ext, files] of organized) {
      const folder = join(dest, ext.replace('.', ''));
      await fs.ensureDir(folder);
      
      for (const file of files) {
        const srcPath = join(source, file);
        const destPath = join(folder, file);
        await fs.copy(srcPath, destPath);
      }
    }
    
    logger.success(`Organized ${filesResult.value.length} files`);
    return ok(undefined);
  }
});
```

## Cross-Platform Tests

```typescript
// tests/organize.test.ts
import { describe, it, expect } from 'vitest';
import { createTestContext } from '@trailhead/cli/testing';
import { pathAssertions, testPaths } from '@trailhead/cli/testing';
import { organizeCommand } from '../src/commands/organize';

describe('Organize Command', () => {
  it('should organize files on all platforms', async () => {
    // Create test context with files
    const context = createTestContext({
      files: {
        [testPaths.project('files', 'document.pdf')]: 'pdf content',
        [testPaths.project('files', 'image.jpg')]: 'image data',
        [testPaths.project('files', 'data.json')]: '{"test": true}',
        [testPaths.project('files', 'README')]: 'no extension',
      }
    });
    
    // Run organize command
    const result = await organizeCommand.execute({
      source: testPaths.project('files'),
      dest: testPaths.project('organized')
    }, context);
    
    expect(result.success).toBe(true);
    
    // Verify files were organized (works on all platforms)
    const pdfPath = testPaths.project('organized', 'pdf', 'document.pdf');
    const exists = await context.fs.exists(pdfPath);
    expect(exists.value).toBe(true);
    
    // Verify path contains expected segments
    expect(pathAssertions.contains(pdfPath, 'organized')).toBe(true);
    expect(pathAssertions.endsWith(pdfPath, 'document.pdf')).toBe(true);
  });
  
  it('should handle Windows paths', async () => {
    const context = createTestContext({
      files: {
        'C:\\Users\\test\\Downloads\\file.txt': 'content'
      }
    });
    
    // This works even on Unix systems
    const result = await organizeCommand.execute({
      source: 'C:\\Users\\test\\Downloads',
      dest: 'C:\\Users\\test\\Organized'
    }, context);
    
    expect(result.success).toBe(true);
  });
});
```

## CI Configuration

```yaml
# .github/workflows/test.yml
name: Cross-Platform Tests

on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - run: npm install
      - run: npm test
```

## Running the Example

```bash
# Install dependencies
npm install

# Run tests (works on all platforms)
npm test

# Build and run
npm run build
node dist/cli.js organize --source ./downloads --dest ./organized
```

## Key Takeaways

1. **Use `path.join()`** instead of string concatenation for paths
2. **Use test utilities** like `testPaths` for consistent test data
3. **Memory filesystem** handles path normalization automatically
4. **Path assertions** work across platforms
5. **Test on all platforms** in CI to catch issues early