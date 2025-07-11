import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  readFile,
  writeFile,
  exists,
  stat,
  mkdir,
  readDir,
  copy,
  move,
  remove,
  readJson,
  writeJson,
  ensureDir,
  outputFile,
  emptyDir,
  findFiles,
  readIfExists,
  copyIfExists,
  defaultFSConfig,
} from '../core.js';

describe('Filesystem Core Operations', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `trailhead-fs-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('readFile', () => {
    it('should read existing file successfully', async () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Hello, World!';
      await fs.writeFile(filePath, content);

      const result = await readFile()(filePath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(content);
      }
    });

    it('should return error for non-existent file', async () => {
      const filePath = join(testDir, 'nonexistent.txt');

      const result = await readFile()(filePath);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FILESYSTEM_ERROR');
        expect(result.error.code).toBe('ENOENT');
        expect(result.error.recoverable).toBe(true);
      }
    });

    it('should use custom config encoding', async () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Hello, World!';
      await fs.writeFile(filePath, content);

      const customConfig = { ...defaultFSConfig, encoding: 'utf8' as BufferEncoding };
      const result = await readFile(customConfig)(filePath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(content);
      }
    });
  });

  describe('writeFile', () => {
    it('should write file successfully', async () => {
      const filePath = join(testDir, 'write-test.txt');
      const content = 'Test content';

      const result = await writeFile()(filePath, content);

      expect(result.isOk()).toBe(true);
      const writtenContent = await fs.readFile(filePath, 'utf8');
      expect(writtenContent).toBe(content);
    });

    it('should return error for invalid path', async () => {
      const filePath = join(testDir, 'nonexistent', 'test.txt');
      const content = 'Test content';

      const result = await writeFile()(filePath, content);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FILESYSTEM_ERROR');
        expect(result.error.code).toBe('ENOENT');
      }
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const filePath = join(testDir, 'exists-test.txt');
      await fs.writeFile(filePath, 'content');

      const result = await exists()(filePath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it('should return false for non-existent file', async () => {
      const filePath = join(testDir, 'nonexistent.txt');

      const result = await exists()(filePath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });

    it('should return true for existing directory', async () => {
      const dirPath = join(testDir, 'test-dir');
      await fs.mkdir(dirPath);

      const result = await exists()(dirPath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });
  });

  describe('stat', () => {
    it('should return stats for existing file', async () => {
      const filePath = join(testDir, 'stat-test.txt');
      const content = 'test content';
      await fs.writeFile(filePath, content);

      const result = await stat()(filePath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.isFile).toBe(true);
        expect(result.value.isDirectory).toBe(false);
        expect(result.value.size).toBe(content.length);
        expect(result.value.mtime).toBeInstanceOf(Date);
      }
    });

    it('should return stats for existing directory', async () => {
      const dirPath = join(testDir, 'stat-dir');
      await fs.mkdir(dirPath);

      const result = await stat()(dirPath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.isFile).toBe(false);
        expect(result.value.isDirectory).toBe(true);
      }
    });

    it('should return error for non-existent path', async () => {
      const filePath = join(testDir, 'nonexistent.txt');

      const result = await stat()(filePath);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FILESYSTEM_ERROR');
        expect(result.error.code).toBe('ENOENT');
      }
    });
  });

  describe('mkdir', () => {
    it('should create directory successfully', async () => {
      const dirPath = join(testDir, 'new-dir');

      const result = await mkdir()(dirPath);

      expect(result.isOk()).toBe(true);
      const stats = await fs.stat(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create nested directories with recursive option', async () => {
      const dirPath = join(testDir, 'nested', 'deep', 'dir');

      const result = await mkdir()(dirPath, { recursive: true });

      expect(result.isOk()).toBe(true);
      const stats = await fs.stat(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should return error for existing directory without force', async () => {
      const dirPath = join(testDir, 'existing-dir');
      await fs.mkdir(dirPath);

      const result = await mkdir()(dirPath);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FILESYSTEM_ERROR');
        expect(result.error.code).toBe('EEXIST');
      }
    });
  });

  describe('readDir', () => {
    it('should read directory contents', async () => {
      const dirPath = join(testDir, 'read-dir');
      await fs.mkdir(dirPath);
      await fs.writeFile(join(dirPath, 'file1.txt'), 'content1');
      await fs.writeFile(join(dirPath, 'file2.txt'), 'content2');
      await fs.mkdir(join(dirPath, 'subdir'));

      const result = await readDir()(dirPath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(3);
        expect(result.value).toContain('file1.txt');
        expect(result.value).toContain('file2.txt');
        expect(result.value).toContain('subdir');
      }
    });

    it('should return error for non-existent directory', async () => {
      const dirPath = join(testDir, 'nonexistent-dir');

      const result = await readDir()(dirPath);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FILESYSTEM_ERROR');
        expect(result.error.code).toBe('ENOENT');
      }
    });
  });

  describe('copy', () => {
    it('should copy file successfully', async () => {
      const srcPath = join(testDir, 'source.txt');
      const destPath = join(testDir, 'destination.txt');
      const content = 'Copy test content';
      await fs.writeFile(srcPath, content);

      const result = await copy()(srcPath, destPath);

      expect(result.isOk()).toBe(true);
      const destContent = await fs.readFile(destPath, 'utf8');
      expect(destContent).toBe(content);
    });

    it('should copy directory recursively', async () => {
      const srcDir = join(testDir, 'src-dir');
      const destDir = join(testDir, 'dest-dir');
      await fs.mkdir(srcDir);
      await fs.writeFile(join(srcDir, 'file.txt'), 'content');
      await fs.mkdir(join(srcDir, 'subdir'));

      const result = await copy()(srcDir, destDir, { recursive: true });

      expect(result.isOk()).toBe(true);
      const destFile = await fs.readFile(join(destDir, 'file.txt'), 'utf8');
      expect(destFile).toBe('content');
      const destSubdir = await fs.stat(join(destDir, 'subdir'));
      expect(destSubdir.isDirectory()).toBe(true);
    });
  });

  describe('move', () => {
    it('should move file successfully', async () => {
      const srcPath = join(testDir, 'move-source.txt');
      const destPath = join(testDir, 'move-dest.txt');
      const content = 'Move test content';
      await fs.writeFile(srcPath, content);

      const result = await move()(srcPath, destPath);

      expect(result.isOk()).toBe(true);

      // Source should not exist
      try {
        await fs.access(srcPath);
        expect.fail('Source file should not exist after move');
      } catch (error: any) {
        expect(error.code).toBe('ENOENT');
      }

      // Destination should have the content
      const destContent = await fs.readFile(destPath, 'utf8');
      expect(destContent).toBe(content);
    });

    it('should return error when destination exists and overwrite is false', async () => {
      const srcPath = join(testDir, 'move-src.txt');
      const destPath = join(testDir, 'move-dest.txt');
      await fs.writeFile(srcPath, 'source');
      await fs.writeFile(destPath, 'destination');

      const result = await move()(srcPath, destPath, { overwrite: false });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FILESYSTEM_ERROR');
        expect(result.error.code).toBe('EEXIST');
      }
    });
  });

  describe('remove', () => {
    it('should remove file successfully', async () => {
      const filePath = join(testDir, 'remove-test.txt');
      await fs.writeFile(filePath, 'content');

      const result = await remove()(filePath);

      expect(result.isOk()).toBe(true);

      try {
        await fs.access(filePath);
        expect.fail('File should not exist after removal');
      } catch (error: any) {
        expect(error.code).toBe('ENOENT');
      }
    });

    it('should remove directory recursively', async () => {
      const dirPath = join(testDir, 'remove-dir');
      await fs.mkdir(dirPath);
      await fs.writeFile(join(dirPath, 'file.txt'), 'content');

      const result = await remove()(dirPath, { recursive: true });

      expect(result.isOk()).toBe(true);

      try {
        await fs.access(dirPath);
        expect.fail('Directory should not exist after removal');
      } catch (error: any) {
        expect(error.code).toBe('ENOENT');
      }
    });
  });

  describe('readJson', () => {
    it('should read and parse JSON file', async () => {
      const filePath = join(testDir, 'test.json');
      const data = { name: 'test', value: 42 };
      await fs.writeFile(filePath, JSON.stringify(data));

      const result = await readJson()(filePath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(data);
      }
    });

    it('should return error for invalid JSON', async () => {
      const filePath = join(testDir, 'invalid.json');
      await fs.writeFile(filePath, 'invalid json');

      const result = await readJson()(filePath);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FILESYSTEM_ERROR');
        expect(result.error.code).toBe('JSON_PARSE_ERROR');
      }
    });
  });

  describe('writeJson', () => {
    it('should write JSON file with proper formatting', async () => {
      const filePath = join(testDir, 'write.json');
      const data = { name: 'test', value: 42, nested: { key: 'value' } };

      const result = await writeJson()(filePath, data);

      expect(result.isOk()).toBe(true);
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(data);
    });

    it('should create parent directories automatically', async () => {
      const filePath = join(testDir, 'nested', 'deep', 'write.json');
      const data = { test: true };

      const result = await writeJson()(filePath, data);

      expect(result.isOk()).toBe(true);
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(data);
    });

    it('should respect custom spacing', async () => {
      const filePath = join(testDir, 'spaced.json');
      const data = { test: true };

      const result = await writeJson()(filePath, data, { spaces: 4 });

      expect(result.isOk()).toBe(true);
      const content = await fs.readFile(filePath, 'utf8');
      expect(content).toContain('    "test"'); // 4 spaces
    });
  });

  describe('ensureDir', () => {
    it('should create directory if it does not exist', async () => {
      const dirPath = join(testDir, 'ensure', 'nested', 'dir');

      const result = await ensureDir()(dirPath);

      expect(result.isOk()).toBe(true);
      const stats = await fs.stat(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should succeed if directory already exists', async () => {
      const dirPath = join(testDir, 'existing');
      await fs.mkdir(dirPath);

      const result = await ensureDir()(dirPath);

      expect(result.isOk()).toBe(true);
    });
  });

  describe('outputFile', () => {
    it('should create file and parent directories', async () => {
      const filePath = join(testDir, 'output', 'nested', 'file.txt');
      const content = 'Output file content';

      const result = await outputFile()(filePath, content);

      expect(result.isOk()).toBe(true);
      const writtenContent = await fs.readFile(filePath, 'utf8');
      expect(writtenContent).toBe(content);
    });
  });

  describe('emptyDir', () => {
    it('should remove all contents from directory', async () => {
      const dirPath = join(testDir, 'empty-test');
      await fs.mkdir(dirPath);
      await fs.writeFile(join(dirPath, 'file1.txt'), 'content1');
      await fs.writeFile(join(dirPath, 'file2.txt'), 'content2');
      await fs.mkdir(join(dirPath, 'subdir'));

      const result = await emptyDir()(dirPath);

      expect(result.isOk()).toBe(true);
      const contents = await fs.readdir(dirPath);
      expect(contents).toHaveLength(0);
    });
  });

  describe('findFiles', () => {
    it('should find files matching pattern', async () => {
      const searchDir = join(testDir, 'search');
      await fs.mkdir(searchDir);
      await fs.writeFile(join(searchDir, 'test1.txt'), 'content');
      await fs.writeFile(join(searchDir, 'test2.txt'), 'content');
      await fs.writeFile(join(searchDir, 'other.md'), 'content');

      const result = await findFiles()('*.txt', { cwd: searchDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value).toContain('test1.txt');
        expect(result.value).toContain('test2.txt');
      }
    });
  });

  describe('readIfExists', () => {
    it('should read file if it exists', async () => {
      const filePath = join(testDir, 'conditional.txt');
      const content = 'Conditional content';
      await fs.writeFile(filePath, content);

      const result = await readIfExists()(filePath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(content);
      }
    });

    it('should return null if file does not exist', async () => {
      const filePath = join(testDir, 'nonexistent.txt');

      const result = await readIfExists()(filePath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(null);
      }
    });
  });

  describe('copyIfExists', () => {
    it('should copy file if source exists', async () => {
      const srcPath = join(testDir, 'copy-src.txt');
      const destPath = join(testDir, 'copy-dest.txt');
      const content = 'Copy content';
      await fs.writeFile(srcPath, content);

      const result = await copyIfExists()(srcPath, destPath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
      const destContent = await fs.readFile(destPath, 'utf8');
      expect(destContent).toBe(content);
    });

    it('should return false if source does not exist', async () => {
      const srcPath = join(testDir, 'nonexistent-src.txt');
      const destPath = join(testDir, 'copy-dest.txt');

      const result = await copyIfExists()(srcPath, destPath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });
  });
});
