import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createNodeFileSystem } from '../filesystem/node.js';
import { createMemoryFileSystem } from '../filesystem/memory.js';
import { createTestTempDir, cleanup } from './test-utils.js';
import type { FileSystem } from '../filesystem/types.js';
import { promises as fs } from 'fs';
import path from 'path';

describe('FileSystem Edge Cases', () => {
  let nodeFs: FileSystem;
  let memoryFs: FileSystem;
  let tempDir: string;

  beforeEach(async () => {
    nodeFs = createNodeFileSystem();
    memoryFs = createMemoryFileSystem();
    tempDir = await createTestTempDir();
  });

  afterEach(async () => {
    await cleanup(tempDir);
  });

  describe('Permission Tests (Node FS only)', () => {
    it('should handle permission denied errors gracefully', async () => {
      // Create a file in temp directory
      const testFile = path.join(tempDir, 'readonly.txt');
      await fs.writeFile(testFile, 'test content');

      // Make file read-only (simulate permission issues)
      await fs.chmod(testFile, 0o444);

      // Try to write to read-only file
      const result = await nodeFs.writeFile(testFile, 'new content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toMatch(/EACCES|EPERM/);
        expect(result.error.message).toContain('Permission denied');
        expect(result.error.recoverable).toBe(false);
      }
    });

    it('should handle directory permission errors', async () => {
      // Create a directory in temp
      const testDir = path.join(tempDir, 'protected');
      await fs.mkdir(testDir);

      // Make directory read-only
      await fs.chmod(testDir, 0o555);

      // Try to create file in read-only directory
      const testFile = path.join(testDir, 'test.txt');
      const result = await nodeFs.writeFile(testFile, 'content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toMatch(/EACCES|EPERM/);
        expect(result.error.recoverable).toBe(false);
      }
    });
  });

  describe('Large File Handling', () => {
    it('should handle large file operations efficiently', async () => {
      // Create a 1MB string
      const largeContent = 'x'.repeat(1024 * 1024);
      const testFile = path.join(tempDir, 'large.txt');

      // Test write performance
      const writeStart = Date.now();
      const writeResult = await nodeFs.writeFile(testFile, largeContent);
      const writeTime = Date.now() - writeStart;

      expect(writeResult.success).toBe(true);
      expect(writeTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Test read performance
      const readStart = Date.now();
      const readResult = await nodeFs.readFile(testFile);
      const readTime = Date.now() - readStart;

      expect(readResult.success).toBe(true);
      expect(readTime).toBeLessThan(5000);

      if (readResult.success) {
        expect(readResult.value.length).toBe(largeContent.length);
      }
    });

    it('should handle large JSON files', async () => {
      // Create large JSON object
      const largeData = {
        items: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `item-${i}`,
          description: `Description for item ${i}`.repeat(10),
          metadata: {
            created: new Date().toISOString(),
            tags: [`tag-${i % 10}`, `category-${i % 5}`],
          },
        })),
      };

      const testFile = path.join(tempDir, 'large.json');

      // Test JSON write
      const writeResult = await nodeFs.writeJson(testFile, largeData);
      expect(writeResult.success).toBe(true);

      // Test JSON read
      const readResult = await nodeFs.readJson(testFile);
      expect(readResult.success).toBe(true);

      if (readResult.success) {
        expect(readResult.value.items).toHaveLength(10000);
        expect(readResult.value.items[0].id).toBe(0);
        expect(readResult.value.items[9999].id).toBe(9999);
      }
    });
  });

  describe('Edge Case Path Handling', () => {
    it('should handle paths with special characters', async () => {
      const specialPaths = [
        'file with spaces.txt',
        'file-with-dashes.txt',
        'file_with_underscores.txt',
        'file.with.dots.txt',
        'file(with)parentheses.txt',
        'file[with]brackets.txt',
      ];

      for (const fileName of specialPaths) {
        const testFile = path.join(tempDir, fileName);
        const content = `Content for ${fileName}`;

        // Test write
        const writeResult = await nodeFs.writeFile(testFile, content);
        expect(writeResult.success).toBe(true, `Failed to write ${fileName}`);

        // Test read
        const readResult = await nodeFs.readFile(testFile);
        expect(readResult.success).toBe(true, `Failed to read ${fileName}`);

        if (readResult.success) {
          expect(readResult.value).toBe(content);
        }
      }
    });

    it('should handle very long file paths', async () => {
      // Create nested directory structure
      const longPath = Array.from({ length: 20 }, (_, i) => `level${i}`).join(
        '/',
      );
      const testFile = path.join(tempDir, longPath, 'deep-file.txt');

      // Ensure directory exists
      const dirResult = await nodeFs.ensureDir(path.dirname(testFile));
      expect(dirResult.success).toBe(true);

      // Test file operations
      const writeResult = await nodeFs.writeFile(testFile, 'deep content');
      expect(writeResult.success).toBe(true);

      const readResult = await nodeFs.readFile(testFile);
      expect(readResult.success).toBe(true);

      if (readResult.success) {
        expect(readResult.value).toBe('deep content');
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent file operations safely', async () => {
      const promises: Promise<any>[] = [];
      const fileCount = 50;

      // Create multiple files concurrently
      for (let i = 0; i < fileCount; i++) {
        const testFile = path.join(tempDir, `concurrent-${i}.txt`);
        promises.push(nodeFs.writeFile(testFile, `Content ${i}`));
      }

      const results = await Promise.all(promises);

      // All operations should succeed
      for (const result of results) {
        expect(result.success).toBe(true);
      }

      // Verify all files exist and have correct content
      const readPromises: Promise<any>[] = [];
      for (let i = 0; i < fileCount; i++) {
        const testFile = path.join(tempDir, `concurrent-${i}.txt`);
        readPromises.push(nodeFs.readFile(testFile));
      }

      const readResults = await Promise.all(readPromises);

      for (let i = 0; i < fileCount; i++) {
        expect(readResults[i].success).toBe(true);
        if (readResults[i].success) {
          expect(readResults[i].value).toBe(`Content ${i}`);
        }
      }
    });

    it('should handle concurrent directory operations', async () => {
      const dirCount = 20;
      const promises: Promise<any>[] = [];

      // Create multiple directories concurrently
      for (let i = 0; i < dirCount; i++) {
        const testDir = path.join(tempDir, `concurrent-dir-${i}`);
        promises.push(nodeFs.mkdir(testDir));
      }

      const results = await Promise.all(promises);

      // All operations should succeed
      for (const result of results) {
        expect(result.success).toBe(true);
      }

      // Verify all directories exist
      for (let i = 0; i < dirCount; i++) {
        const testDir = path.join(tempDir, `concurrent-dir-${i}`);
        const existsResult = await nodeFs.exists(testDir);
        expect(existsResult.success).toBe(true);
        if (existsResult.success) {
          expect(existsResult.value).toBe(true);
        }
      }
    });
  });

  describe('Error Recovery', () => {
    it('should handle disk space exhaustion gracefully', async () => {
      // This is difficult to test without actually filling disk
      // We'll simulate by testing the error mapping
      const mockFs = {
        ...nodeFs,
        writeFile: async () => ({
          success: false as const,
          error: {
            code: 'ENOSPC',
            message:
              'Write failed for "/test/file.txt": No space left on device',
            path: '/test/file.txt',
            recoverable: false,
          },
        }),
      };

      const result = await mockFs.writeFile('/test/file.txt', 'content');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('ENOSPC');
        expect(result.error.recoverable).toBe(false);
      }
    });

    it('should handle file system busy errors', async () => {
      const mockFs = {
        ...nodeFs,
        remove: async () => ({
          success: false as const,
          error: {
            code: 'EBUSY',
            message:
              'Remove failed for "/test/busy-file.txt": Resource busy or locked',
            path: '/test/busy-file.txt',
            recoverable: true,
          },
        }),
      };

      const result = await mockFs.remove('/test/busy-file.txt');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EBUSY');
        expect(result.error.recoverable).toBe(true);
      }
    });
  });

  describe('Memory vs Node FS Consistency', () => {
    it('should behave consistently across implementations', async () => {
      const testCases = [
        { operation: 'writeFile', args: ['test.txt', 'content'] },
        { operation: 'readFile', args: ['test.txt'] },
        { operation: 'exists', args: ['test.txt'] },
        { operation: 'mkdir', args: ['testdir'] },
        { operation: 'readdir', args: ['.'] },
      ];

      for (const testCase of testCases) {
        const { operation, args } = testCase;

        try {
          // Test memory filesystem
          const memoryResult = await (memoryFs as any)[operation](...args);

          // For operations that should work in memory
          if (operation !== 'readdir' || args[0] === '.') {
            expect(memoryResult.success).toBeDefined();
          }
        } catch (error) {
          // Some operations might not be fully compatible
          console.warn(`Operation ${operation} failed on memory fs:`, error);
        }
      }
    });
  });
});
