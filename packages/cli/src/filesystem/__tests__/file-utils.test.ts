import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import {
  findFiles,
  readFile,
  writeFile,
  fileExists,
  ensureDirectory,
  compareFiles,
  getRelativePath,
  createTimestamp,
  createBackupName,
  createFileStats,
  updateFileStats,
  type FileStats,
} from '../file-utils.js';

// Mock fs promises
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn(),
  },
}));

// Mock glob
vi.mock('glob', () => ({
  glob: vi.fn(),
}));

// Mock path.join for cross-platform testing
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    join: vi.fn((...args: string[]) => args.join('/')),
    relative: vi.fn((from: string, to: string) => to.replace(from + '/', '')),
  };
});

const mockFs = vi.mocked(fs);
const mockGlob = vi.mocked(glob);
const mockPath = vi.mocked(path);

describe('File Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findFiles', () => {
    it('should find files matching pattern', async () => {
      const expectedFiles = ['src/file1.ts', 'src/file2.ts'];
      mockGlob.mockResolvedValue(expectedFiles);

      const result = await findFiles('src', '*.ts');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(expectedFiles);
      }
      expect(mockPath.join).toHaveBeenCalledWith('src', '*.ts');
      expect(mockGlob).toHaveBeenCalledWith('src/*.ts', {
        ignore: ['**/node_modules/**', '**/dist/**'],
      });
    });

    it('should include custom ignore patterns', async () => {
      const expectedFiles = ['src/file1.ts'];
      mockGlob.mockResolvedValue(expectedFiles);

      const result = await findFiles('src', '*.ts', ['**/*.test.ts']);

      expect(result.success).toBe(true);
      expect(mockGlob).toHaveBeenCalledWith('src/*.ts', {
        ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.ts'],
      });
    });

    it('should handle glob errors', async () => {
      const error = new Error('Glob failed');
      mockGlob.mockRejectedValue(error);

      const result = await findFiles('src', '*.ts');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILESYSTEM_ERROR');
        expect(result.error.message).toBe('Failed to find files');
        expect(result.error.cause).toBe(error);
      }
    });

    it('should handle non-Error exceptions', async () => {
      mockGlob.mockRejectedValue('string error');

      const result = await findFiles('src', '*.ts');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILESYSTEM_ERROR');
        expect(result.error.message).toBe('Failed to find files');
        expect((result.error.cause as Error).message).toBe('string error');
      }
    });
  });

  describe('readFile', () => {
    it('should read file content successfully', async () => {
      const content = 'export default {};';
      mockFs.readFile.mockResolvedValue(content);

      const result = await readFile('test.ts');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(content);
      }
      expect(mockFs.readFile).toHaveBeenCalledWith('test.ts', 'utf8');
    });

    it('should handle file read errors', async () => {
      const error = new Error('File not found');
      mockFs.readFile.mockRejectedValue(error);

      const result = await readFile('missing.ts');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILESYSTEM_ERROR');
        expect(result.error.message).toBe('Failed to read file');
        expect(result.error.cause).toBe(error);
      }
    });

    it('should handle non-Error exceptions in read', async () => {
      mockFs.readFile.mockRejectedValue('permission denied');

      const result = await readFile('restricted.ts');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILESYSTEM_ERROR');
        expect(result.error.message).toBe('Failed to read file');
        expect((result.error.cause as Error).message).toBe('Failed to read restricted.ts');
      }
    });
  });

  describe('writeFile', () => {
    it('should write file content successfully', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await writeFile('test.ts', 'content');

      expect(result.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledWith('test.ts', 'content', 'utf8');
    });

    it('should handle file write errors', async () => {
      const error = new Error('Permission denied');
      mockFs.writeFile.mockRejectedValue(error);

      const result = await writeFile('readonly.ts', 'content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILESYSTEM_ERROR');
        expect(result.error.message).toBe('Failed to write file');
        expect(result.error.cause).toBe(error);
      }
    });

    it('should handle non-Error exceptions in write', async () => {
      mockFs.writeFile.mockRejectedValue('disk full');

      const result = await writeFile('test.ts', 'content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILESYSTEM_ERROR');
        expect(result.error.message).toBe('Failed to write file');
        expect((result.error.cause as Error).message).toBe('Failed to write test.ts');
      }
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const exists = await fileExists('existing.ts');

      expect(exists).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith('existing.ts');
    });

    it('should return false when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const exists = await fileExists('missing.ts');

      expect(exists).toBe(false);
    });

    it('should return false on any access error', async () => {
      mockFs.access.mockRejectedValue('permission denied');

      const exists = await fileExists('restricted.ts');

      expect(exists).toBe(false);
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory successfully', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);

      const result = await ensureDirectory('new-dir');

      expect(result.success).toBe(true);
      expect(mockFs.mkdir).toHaveBeenCalledWith('new-dir', { recursive: true });
    });

    it('should handle directory creation errors', async () => {
      const error = new Error('Permission denied');
      mockFs.mkdir.mockRejectedValue(error);

      const result = await ensureDirectory('restricted-dir');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILESYSTEM_ERROR');
        expect(result.error.message).toBe('Failed to create directory');
        expect(result.error.cause).toBe(error);
      }
    });

    it('should handle non-Error exceptions in mkdir', async () => {
      mockFs.mkdir.mockRejectedValue('disk full');

      const result = await ensureDirectory('test-dir');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILESYSTEM_ERROR');
        expect(result.error.message).toBe('Failed to create directory');
        expect((result.error.cause as Error).message).toBe('Failed to create directory test-dir');
      }
    });
  });

  describe('compareFiles', () => {
    it('should detect identical files', async () => {
      mockFs.access.mockResolvedValue(undefined); // Both files exist
      mockFs.readFile.mockResolvedValueOnce('same content').mockResolvedValueOnce('same content');

      const result = await compareFiles('file1.ts', 'file2.ts');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          sourceExists: true,
          destExists: true,
          identical: true,
          sourceContent: 'same content',
          destContent: 'same content',
        });
      }
    });

    it('should detect different files', async () => {
      mockFs.access.mockResolvedValue(undefined); // Both files exist
      mockFs.readFile.mockResolvedValueOnce('content 1').mockResolvedValueOnce('content 2');

      const result = await compareFiles('file1.ts', 'file2.ts');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          sourceExists: true,
          destExists: true,
          identical: false,
          sourceContent: 'content 1',
          destContent: 'content 2',
        });
      }
    });

    it('should handle missing source file', async () => {
      mockFs.access
        .mockRejectedValueOnce(new Error('Source not found'))
        .mockResolvedValueOnce(undefined); // Dest exists

      const result = await compareFiles('missing.ts', 'existing.ts');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          sourceExists: false,
          destExists: true,
          identical: false,
        });
      }
    });

    it('should handle missing destination file', async () => {
      mockFs.access
        .mockResolvedValueOnce(undefined) // Source exists
        .mockRejectedValueOnce(new Error('Dest not found'));
      mockFs.readFile.mockResolvedValueOnce('source content');

      const result = await compareFiles('existing.ts', 'missing.ts');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          sourceExists: true,
          destExists: false,
          identical: false,
          sourceContent: 'source content',
        });
      }
    });

    it('should handle source file read error', async () => {
      mockFs.access.mockResolvedValue(undefined); // Both exist
      const readError = new Error('Read failed');
      mockFs.readFile.mockRejectedValueOnce(readError);

      const result = await compareFiles('error.ts', 'file2.ts');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILESYSTEM_ERROR');
        expect(result.error.message).toBe('Failed to read file');
        expect(result.error.cause).toBe(readError);
      }
    });

    it('should handle destination file read error', async () => {
      mockFs.access.mockResolvedValue(undefined); // Both exist
      const readError = new Error('Read failed');
      mockFs.readFile.mockResolvedValueOnce('source content').mockRejectedValueOnce(readError);

      const result = await compareFiles('file1.ts', 'error.ts');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILESYSTEM_ERROR');
        expect(result.error.message).toBe('Failed to read file');
        expect(result.error.cause).toBe(readError);
      }
    });

    it('should handle completely malformed inputs gracefully', async () => {
      // Test with very edge case inputs - this tests the outer try/catch
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('content');

      const result = await compareFiles('', '');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.sourceExists).toBe(true);
        expect(result.value.destExists).toBe(true);
        expect(result.value.identical).toBe(true);
      }
    });
  });

  describe('getRelativePath', () => {
    it('should get relative path from cwd', () => {
      mockPath.relative.mockReturnValue('src/utils/test.ts');

      const result = getRelativePath('/full/path/src/utils/test.ts');

      expect(result).toBe('src/utils/test.ts');
      expect(mockPath.relative).toHaveBeenCalledWith(process.cwd(), '/full/path/src/utils/test.ts');
    });

    it('should handle current directory files', () => {
      mockPath.relative.mockReturnValue('test.ts');

      const result = getRelativePath('test.ts');

      expect(result).toBe('test.ts');
    });
  });

  describe('createTimestamp', () => {
    let mockDate: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mockDate = vi.spyOn(Date.prototype, 'toISOString');
    });

    afterEach(() => {
      mockDate.mockRestore();
    });

    it('should create timestamp string', () => {
      mockDate.mockReturnValue('2023-12-25T10:30:45.123Z');

      const timestamp = createTimestamp();

      expect(timestamp).toBe('2023-12-25T10-30-45-123Z');
    });

    it('should replace colons and dots', () => {
      mockDate.mockReturnValue('2023-01-01T00:00:00.000Z');

      const timestamp = createTimestamp();

      expect(timestamp).toBe('2023-01-01T00-00-00-000Z');
    });
  });

  describe('createBackupName', () => {
    let mockDate: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mockDate = vi.spyOn(Date.prototype, 'toISOString');
      mockDate.mockReturnValue('2023-12-25T10:30:45.123Z');
    });

    afterEach(() => {
      mockDate.mockRestore();
    });

    it('should create backup name with default prefix', () => {
      const backupName = createBackupName();

      expect(backupName).toBe('backup-2023-12-25T10-30-45-123Z');
    });

    it('should create backup name with custom prefix', () => {
      const backupName = createBackupName('archive');

      expect(backupName).toBe('archive-2023-12-25T10-30-45-123Z');
    });

    it('should handle empty prefix', () => {
      const backupName = createBackupName('');

      expect(backupName).toBe('-2023-12-25T10-30-45-123Z');
    });
  });

  describe('createFileStats', () => {
    let mockDate: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mockDate = vi.spyOn(Date, 'now');
      mockDate.mockReturnValue(1703505045123);
    });

    afterEach(() => {
      mockDate.mockRestore();
    });

    it('should create initial file stats', () => {
      const stats = createFileStats();

      expect(stats).toEqual({
        filesProcessed: 0,
        filesModified: 0,
        startTime: 1703505045123,
      });
    });
  });

  describe('updateFileStats', () => {
    const initialStats: FileStats = {
      filesProcessed: 5,
      filesModified: 2,
      startTime: 1703505045123,
    };

    it('should update stats with default values', () => {
      const updated = updateFileStats(initialStats);

      expect(updated).toEqual({
        filesProcessed: 6,
        filesModified: 2,
        startTime: 1703505045123,
      });
      // Ensure original is unchanged
      expect(initialStats.filesProcessed).toBe(5);
    });

    it('should update stats with custom values', () => {
      const updated = updateFileStats(initialStats, 3, 1);

      expect(updated).toEqual({
        filesProcessed: 8,
        filesModified: 3,
        startTime: 1703505045123,
      });
    });

    it('should handle zero updates', () => {
      const updated = updateFileStats(initialStats, 0, 0);

      expect(updated).toEqual(initialStats);
      expect(updated).not.toBe(initialStats); // Should be new object
    });

    it('should handle large numbers', () => {
      const updated = updateFileStats(initialStats, 1000, 500);

      expect(updated).toEqual({
        filesProcessed: 1005,
        filesModified: 502,
        startTime: 1703505045123,
      });
    });
  });

  describe('Result type helpers', () => {
    it('should create successful result with Ok', async () => {
      mockFs.readFile.mockResolvedValue('content');

      const result = await readFile('test.ts');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('content');
      }
    });

    it('should create error result with Err', async () => {
      const error = new Error('Test error');
      mockFs.readFile.mockRejectedValue(error);

      const result = await readFile('test.ts');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILESYSTEM_ERROR');
        expect(result.error.message).toBe('Failed to read file');
        expect(result.error.cause).toBe(error);
      }
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete file processing workflow', async () => {
      // Setup: file exists and can be read
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('original content');
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      // Process: read, modify, ensure directory, write
      const readResult = await readFile('input.ts');
      expect(readResult.success).toBe(true);

      const ensureResult = await ensureDirectory('output');
      expect(ensureResult.success).toBe(true);

      const writeResult = await writeFile('output/modified.ts', 'modified content');
      expect(writeResult.success).toBe(true);

      // Verify stats tracking
      let stats = createFileStats();
      stats = updateFileStats(stats, 1, 1);

      expect(stats.filesProcessed).toBe(1);
      expect(stats.filesModified).toBe(1);
    });

    it('should handle error cascade gracefully', async () => {
      // Setup: source exists but destination read fails
      mockFs.access
        .mockResolvedValueOnce(undefined) // Source exists
        .mockResolvedValueOnce(undefined); // Dest exists
      mockFs.readFile
        .mockResolvedValueOnce('source content') // Source read succeeds
        .mockRejectedValueOnce(new Error('Destination read failed')); // Dest read fails

      const result = await compareFiles('source.ts', 'dest.ts');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILESYSTEM_ERROR');
        expect(result.error.message).toBe('Failed to read file');
        expect((result.error.cause as Error).message).toBe('Destination read failed');
      }
    });
  });
});
