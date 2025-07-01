/**
 * Cross-Platform Testing Example
 *
 * This test file demonstrates best practices for writing
 * tests that work correctly on Windows, macOS, and Linux.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';
import {
  mockFileSystem,
  createTestContext,
  pathAssertions,
  testPaths,
  createPathRegex,
  normalizePath,
} from '../../src/testing/index.js';
import type { FileSystem } from '../../src/filesystem/types.js';

describe('Cross-Platform Testing Examples', () => {
  let fs: FileSystem;

  beforeEach(() => {
    // Use join() to create platform-appropriate paths
    fs = mockFileSystem({
      [join('project', 'package.json')]: JSON.stringify({ name: 'test-app' }),
      [join('project', 'src', 'index.ts')]: 'console.log("Hello")',
      [join('project', 'config', 'app.json')]: '{"port": 3000}',
    });
  });

  describe('Path Handling', () => {
    it('should find files regardless of platform separators', async () => {
      // Both styles work with memory filesystem
      const result1 = await fs.exists('project/src/index.ts');
      const result2 = await fs.exists(join('project', 'src', 'index.ts'));

      expect(result1.value).toBe(true);
      expect(result2.value).toBe(true);
    });

    it('should handle path assertions correctly', () => {
      const windowsPath = 'C:\\Users\\test\\app.config';
      const unixPath = '/Users/test/app.config';

      // These would be different on each platform
      expect(windowsPath).not.toBe(unixPath);

      // But pathAssertions handles the differences
      expect(pathAssertions.contains(windowsPath, 'test')).toBe(true);
      expect(pathAssertions.contains(unixPath, 'test')).toBe(true);
      expect(pathAssertions.endsWith(windowsPath, 'app.config')).toBe(true);
      expect(pathAssertions.endsWith(unixPath, 'app.config')).toBe(true);
    });

    it('should match paths with patterns', () => {
      const pattern = createPathRegex('src/components/*.tsx');

      // Works with both separators
      expect(pattern.test('src/components/button.tsx')).toBe(true);
      expect(pattern.test('src\\components\\button.tsx')).toBe(true);
      expect(pattern.test('src/components/dialog.tsx')).toBe(true);
      expect(pattern.test('src/utils/helper.tsx')).toBe(false);
    });
  });

  describe('Mock Filesystem', () => {
    it('should normalize paths automatically', async () => {
      // Add files with different separator styles
      await fs.writeFile('test/file1.txt', 'content1');
      await fs.writeFile('test\\file2.txt', 'content2');

      // Both can be read with either style
      const read1 = await fs.readFile('test/file1.txt');
      const read2 = await fs.readFile('test\\file2.txt');

      expect(read1.value).toBe('content1');
      expect(read2.value).toBe('content2');
    });

    it('should handle complex directory structures', async () => {
      // Test reading a file in a nested directory
      const content = await fs.readFile(join('project', 'src', 'index.ts'));
      expect(content.value).toBe('console.log("Hello")');

      // Test JSON files
      const config = await fs.readFile(join('project', 'config', 'app.json'));
      expect(JSON.parse(config.value!)).toEqual({ port: 3000 });
    });
  });

  describe('Test Context with Paths', () => {
    it('should create contexts with proper paths', async () => {
      const context = createTestContext({
        filesystem: fs,
        cwd: testPaths.mockProject,
      });

      // Use relative paths from context
      const result = await context.fs.readFile(join('src', 'index.ts'));
      expect(result.success).toBe(false); // Not found from mock project root

      // Or absolute paths
      const absResult = await context.fs.readFile(
        join('project', 'src', 'index.ts'),
      );
      expect(absResult.value).toBe('console.log("Hello")');
    });
  });

  describe('Real-World Scenario', () => {
    it('should handle config file discovery across platforms', async () => {
      // Create config in platform-appropriate location
      const homeConfig = join(testPaths.mockHome, '.myapp', 'config.json');
      const projectConfig = join('project', '.myapp.json');

      await fs.writeFile(homeConfig, JSON.stringify({ source: 'home' }));
      await fs.writeFile(projectConfig, JSON.stringify({ source: 'project' }));

      // Function that searches for config
      const findConfig = async (searchPaths: string[]) => {
        for (const path of searchPaths) {
          const exists = await fs.exists(path);
          if (exists.value) {
            const config = await fs.readFile(path);
            if (config.success) return JSON.parse(config.value);
          }
        }
        return null;
      };

      // Search in order of precedence
      const config = await findConfig([projectConfig, homeConfig]);
      expect(config).toEqual({ source: 'project' });
    });
  });
});

// Mock fs.existsSync for modules that use it directly
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn((path: string) => {
      // Control what exists in tests
      const normalized = normalizePath(path);
      return normalized.includes('src') || normalized.includes('dist');
    }),
  };
});
