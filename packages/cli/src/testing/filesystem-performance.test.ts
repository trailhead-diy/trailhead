import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createNodeFileSystem } from '../filesystem/node.js';
import { createMemoryFileSystem } from '../filesystem/memory.js';
import {
  createTestTempDir,
  cleanup,
  createTestStructure,
} from './test-utils.js';
import type { FileSystem } from '../filesystem/types.js';
import path from 'path';

describe('FileSystem Performance Benchmarks', () => {
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

  describe('Read Performance', () => {
    it('should read small files efficiently', async () => {
      const content = 'Hello, World!'.repeat(100);
      const testFile = path.join(tempDir, 'small.txt');

      // Setup
      const writeResult = await nodeFs.writeFile(testFile, content);
      expect(writeResult.success).toBe(true);

      // Benchmark read operations
      const iterations = 100;
      const start = process.hrtime.bigint();

      for (let i = 0; i < iterations; i++) {
        const result = await nodeFs.readFile(testFile);
        expect(result.success).toBe(true);
      }

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      const avgMs = durationMs / iterations;

      console.log(
        `Small file read: ${avgMs.toFixed(2)}ms average (${iterations} iterations)`,
      );
      expect(avgMs).toBeLessThan(10); // Should be very fast
    });

    it('should read medium files efficiently', async () => {
      const content = 'x'.repeat(10_000); // 10KB
      const testFile = path.join(tempDir, 'medium.txt');

      const writeResult = await nodeFs.writeFile(testFile, content);
      expect(writeResult.success).toBe(true);

      const iterations = 50;
      const start = process.hrtime.bigint();

      for (let i = 0; i < iterations; i++) {
        const result = await nodeFs.readFile(testFile);
        expect(result.success).toBe(true);
      }

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      const avgMs = durationMs / iterations;

      console.log(
        `Medium file read: ${avgMs.toFixed(2)}ms average (${iterations} iterations)`,
      );
      expect(avgMs).toBeLessThan(50);
    });

    it('should read large files within reasonable time', async () => {
      const content = 'x'.repeat(1_000_000); // 1MB
      const testFile = path.join(tempDir, 'large.txt');

      const writeResult = await nodeFs.writeFile(testFile, content);
      expect(writeResult.success).toBe(true);

      const iterations = 10;
      const start = process.hrtime.bigint();

      for (let i = 0; i < iterations; i++) {
        const result = await nodeFs.readFile(testFile);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.length).toBe(content.length);
        }
      }

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      const avgMs = durationMs / iterations;

      console.log(
        `Large file read: ${avgMs.toFixed(2)}ms average (${iterations} iterations)`,
      );
      expect(avgMs).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('Write Performance', () => {
    it('should write files efficiently', async () => {
      const content = 'Hello, World!'.repeat(1000);
      const iterations = 50;
      const start = process.hrtime.bigint();

      for (let i = 0; i < iterations; i++) {
        const testFile = path.join(tempDir, `write-test-${i}.txt`);
        const result = await nodeFs.writeFile(testFile, content);
        expect(result.success).toBe(true);
      }

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      const avgMs = durationMs / iterations;

      console.log(
        `File write: ${avgMs.toFixed(2)}ms average (${iterations} iterations)`,
      );
      expect(avgMs).toBeLessThan(100);
    });
  });

  describe('Directory Operations Performance', () => {
    it('should create directories efficiently', async () => {
      const iterations = 100;
      const start = process.hrtime.bigint();

      for (let i = 0; i < iterations; i++) {
        const testDir = path.join(tempDir, `test-dir-${i}`);
        const result = await nodeFs.mkdir(testDir);
        expect(result.success).toBe(true);
      }

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      const avgMs = durationMs / iterations;

      console.log(
        `Directory creation: ${avgMs.toFixed(2)}ms average (${iterations} iterations)`,
      );
      expect(avgMs).toBeLessThan(20);
    });

    it('should read directories efficiently', async () => {
      // Create test structure
      const fileCount = 100;
      const structure: Record<string, string> = {};
      for (let i = 0; i < fileCount; i++) {
        structure[`file-${i}.txt`] = `Content ${i}`;
      }
      await createTestStructure(tempDir, structure);

      const iterations = 50;
      const start = process.hrtime.bigint();

      for (let i = 0; i < iterations; i++) {
        const result = await nodeFs.readdir(tempDir);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.length).toBeGreaterThanOrEqual(fileCount);
        }
      }

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      const avgMs = durationMs / iterations;

      console.log(
        `Directory read (${fileCount} files): ${avgMs.toFixed(2)}ms average`,
      );
      expect(avgMs).toBeLessThan(50);
    });
  });

  describe('JSON Operations Performance', () => {
    it('should handle JSON operations efficiently', async () => {
      const data = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`,
          metadata: {
            created: new Date().toISOString(),
            tags: [`tag-${i % 10}`, `category-${i % 5}`],
          },
        })),
      };

      const testFile = path.join(tempDir, 'data.json');
      const iterations = 20;

      // Write performance
      const writeStart = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        const result = await nodeFs.writeJson(`${testFile}.${i}`, data);
        expect(result.success).toBe(true);
      }
      const writeEnd = process.hrtime.bigint();
      const writeAvg = Number(writeEnd - writeStart) / 1_000_000 / iterations;

      // Read performance
      const readStart = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        const result = await nodeFs.readJson(`${testFile}.${i}`);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.items.length).toBe(1000);
        }
      }
      const readEnd = process.hrtime.bigint();
      const readAvg = Number(readEnd - readStart) / 1_000_000 / iterations;

      console.log(`JSON write: ${writeAvg.toFixed(2)}ms average`);
      console.log(`JSON read: ${readAvg.toFixed(2)}ms average`);

      expect(writeAvg).toBeLessThan(200);
      expect(readAvg).toBeLessThan(100);
    });
  });

  describe('Memory vs Node FS Performance Comparison', () => {
    it('should compare read performance between implementations', async () => {
      const content = 'x'.repeat(10_000);
      const iterations = 100;

      // Memory FS performance
      memoryFs = createMemoryFileSystem({ 'test.txt': content });

      const memoryStart = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        const result = await memoryFs.readFile('test.txt');
        expect(result.success).toBe(true);
      }
      const memoryEnd = process.hrtime.bigint();
      const memoryAvg =
        Number(memoryEnd - memoryStart) / 1_000_000 / iterations;

      // Node FS performance
      const testFile = path.join(tempDir, 'test.txt');
      await nodeFs.writeFile(testFile, content);

      const nodeStart = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        const result = await nodeFs.readFile(testFile);
        expect(result.success).toBe(true);
      }
      const nodeEnd = process.hrtime.bigint();
      const nodeAvg = Number(nodeEnd - nodeStart) / 1_000_000 / iterations;

      console.log(`Memory FS read: ${memoryAvg.toFixed(2)}ms average`);
      console.log(`Node FS read: ${nodeAvg.toFixed(2)}ms average`);
      console.log(`Memory FS speedup: ${(nodeAvg / memoryAvg).toFixed(1)}x`);

      // Memory should be faster or at least as fast
      // Note: Small differences in timing can occur due to system load
      expect(memoryAvg).toBeLessThanOrEqual(nodeAvg * 1.5);
    });

    it('should compare write performance between implementations', async () => {
      const content = 'Hello, World!'.repeat(100);
      const iterations = 100;

      // Memory FS performance
      const memoryStart = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        const result = await memoryFs.writeFile(`test-${i}.txt`, content);
        expect(result.success).toBe(true);
      }
      const memoryEnd = process.hrtime.bigint();
      const memoryAvg =
        Number(memoryEnd - memoryStart) / 1_000_000 / iterations;

      // Node FS performance
      const nodeStart = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        const testFile = path.join(tempDir, `test-${i}.txt`);
        const result = await nodeFs.writeFile(testFile, content);
        expect(result.success).toBe(true);
      }
      const nodeEnd = process.hrtime.bigint();
      const nodeAvg = Number(nodeEnd - nodeStart) / 1_000_000 / iterations;

      console.log(`Memory FS write: ${memoryAvg.toFixed(2)}ms average`);
      console.log(`Node FS write: ${nodeAvg.toFixed(2)}ms average`);
      console.log(`Memory FS speedup: ${(nodeAvg / memoryAvg).toFixed(1)}x`);

      // Memory should be faster or at least as fast
      // Note: Small differences in timing can occur due to system load
      expect(memoryAvg).toBeLessThanOrEqual(nodeAvg * 1.5);
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle bulk copy operations efficiently', async () => {
      const fileCount = 50;
      const content = 'Test content'.repeat(100);

      // Create source files
      const structure: Record<string, string> = {};
      for (let i = 0; i < fileCount; i++) {
        structure[`src/file-${i}.txt`] = content;
      }
      await createTestStructure(tempDir, structure);

      // Benchmark copy operations
      const start = process.hrtime.bigint();

      for (let i = 0; i < fileCount; i++) {
        const src = path.join(tempDir, `src/file-${i}.txt`);
        const dest = path.join(tempDir, `dest/file-${i}.txt`);
        const result = await nodeFs.copy(src, dest);
        expect(result.success).toBe(true);
      }

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      const avgMs = durationMs / fileCount;

      console.log(
        `Bulk copy (${fileCount} files): ${avgMs.toFixed(2)}ms average per file`,
      );
      expect(avgMs).toBeLessThan(100);
    });

    it('should handle bulk remove operations efficiently', async () => {
      const fileCount = 100;
      const content = 'Test content';

      // Create files to remove
      const structure: Record<string, string> = {};
      for (let i = 0; i < fileCount; i++) {
        structure[`to-remove/file-${i}.txt`] = content;
      }
      await createTestStructure(tempDir, structure);

      // Benchmark remove operations
      const start = process.hrtime.bigint();

      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `to-remove/file-${i}.txt`);
        const result = await nodeFs.remove(filePath);
        expect(result.success).toBe(true);
      }

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      const avgMs = durationMs / fileCount;

      console.log(
        `Bulk remove (${fileCount} files): ${avgMs.toFixed(2)}ms average per file`,
      );
      expect(avgMs).toBeLessThan(50);
    });
  });
});
