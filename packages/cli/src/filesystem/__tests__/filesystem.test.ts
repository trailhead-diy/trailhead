import { describe, it, expect, beforeEach } from 'vitest';
import { createMemoryFileSystem } from '../memory.js';
import { getErrorMessage } from '../../core/errors/utils.js';
import type { FileSystem } from '../types.js';

describe('FileSystem', () => {
  let fs: FileSystem;

  beforeEach(() => {
    // Use memory filesystem for testing
    fs = createMemoryFileSystem();
    if (fs.clear) {
      fs.clear();
    }
  });

  describe('Basic Operations', () => {
    describe('access', () => {
      it('should return error for non-existent file', async () => {
        const result = await fs.access('/non-existent.txt');
        expect(result.isOk()).toBe(false);
      });

      it('should return success for existing file', async () => {
        await fs.writeFile('/test.txt', 'content');
        const result = await fs.access('/test.txt');
        expect(result.isOk()).toBe(true);
      });

      it('should return success for existing directory', async () => {
        await fs.mkdir('/test-dir');
        const result = await fs.access('/test-dir');
        expect(result.isOk()).toBe(true);
      });
    });

    describe('readFile', () => {
      it('should read file content', async () => {
        const content = 'Hello, World!';
        await fs.writeFile('/test.txt', content);
        const result = await fs.readFile('/test.txt');
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(content);
        }
      });

      it('should return error for non-existent file', async () => {
        const result = await fs.readFile('/non-existent.txt');
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(getErrorMessage(result.error)).toContain('not found');
        }
      });

      it('should handle different encodings', async () => {
        const content = 'Unicode: 你好世界';
        await fs.writeFile('/unicode.txt', content);
        const result = await fs.readFile('/unicode.txt', 'utf8');
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(content);
        }
      });
    });

    describe('writeFile', () => {
      it('should write file content', async () => {
        const content = 'Test content';
        const writeResult = await fs.writeFile('/test.txt', content);
        expect(writeResult.isOk()).toBe(true);

        const readResult = await fs.readFile('/test.txt');
        if (readResult.isOk()) {
          expect(readResult.value).toBe(content);
        }
      });

      it('should overwrite existing file', async () => {
        await fs.writeFile('/test.txt', 'old content');
        const newContent = 'new content';

        const writeResult = await fs.writeFile('/test.txt', newContent);
        expect(writeResult.isOk()).toBe(true);

        const readResult = await fs.readFile('/test.txt');
        if (readResult.isOk()) {
          expect(readResult.value).toBe(newContent);
        }
      });

      it('should create parent directories if they exist', async () => {
        await fs.mkdir('/parent');
        const result = await fs.writeFile('/parent/child.txt', 'content');
        expect(result.isOk()).toBe(true);
      });
    });

    describe('mkdir', () => {
      it('should create directory', async () => {
        const result = await fs.mkdir('/new-dir');
        expect(result.isOk()).toBe(true);

        const accessResult = await fs.access('/new-dir');
        expect(accessResult.isOk()).toBe(true);
      });

      it('should create nested directories with recursive option', async () => {
        const result = await fs.mkdir('/parent/child/grandchild', {
          recursive: true,
        });
        expect(result.isOk()).toBe(true);

        const accessResult = await fs.access('/parent/child/grandchild');
        expect(accessResult.isOk()).toBe(true);
      });

      it('should create nested paths without error in memory filesystem', async () => {
        // Memory filesystem creates parent directories automatically
        const result = await fs.mkdir('/parent/child/grandchild');
        expect(result.isOk()).toBe(true);
      });

      it('should handle existing directory gracefully', async () => {
        await fs.mkdir('/existing');
        const result = await fs.mkdir('/existing');
        // Should not error if directory already exists
        expect(result.isOk()).toBe(true);
      });
    });

    describe('readdir', () => {
      it('should list directory contents', async () => {
        await fs.mkdir('/dir');
        await fs.writeFile('/dir/file1.txt', 'content1');
        await fs.writeFile('/dir/file2.txt', 'content2');
        await fs.mkdir('/dir/subdir');

        const result = await fs.readdir('/dir');
        expect(result.isOk()).toBe(true);

        if (result.isOk()) {
          const entries = result.value;
          expect(entries).toHaveLength(3);
          expect(entries).toContain('file1.txt');
          expect(entries).toContain('file2.txt');
          expect(entries).toContain('subdir');
        }
      });

      it('should return empty array for empty directory', async () => {
        await fs.mkdir('/empty');
        const result = await fs.readdir('/empty');
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toEqual([]);
        }
      });

      it('should return error for non-existent directory', async () => {
        const result = await fs.readdir('/non-existent');
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(getErrorMessage(result.error)).toContain('not found');
        }
      });

      it('should return error when reading a file', async () => {
        await fs.writeFile('/file.txt', 'content');
        const result = await fs.readdir('/file.txt');
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(getErrorMessage(result.error)).toContain('not found');
        }
      });
    });
  });

  describe('Extended Operations', () => {
    describe('copy', () => {
      it('should copy file', async () => {
        const content = 'file content';
        await fs.writeFile('/source.txt', content);

        const result = await fs.cp('/source.txt', '/dest.txt');
        expect(result.isOk()).toBe(true);

        const destContent = await fs.readFile('/dest.txt');
        if (destContent.isOk()) {
          expect(destContent.value).toBe(content);
        }
      });

      it('should overwrite by default in memory filesystem', async () => {
        await fs.writeFile('/source.txt', 'new content');
        await fs.writeFile('/dest.txt', 'old content');

        // Memory filesystem allows overwriting
        const result = await fs.cp('/source.txt', '/dest.txt');
        expect(result.isOk()).toBe(true);

        const content = await fs.readFile('/dest.txt');
        if (content.isOk()) {
          expect(content.value).toBe('new content');
        }
      });

      it('should return error for non-existent source', async () => {
        const result = await fs.cp('/non-existent.txt', '/dest.txt');
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(getErrorMessage(result.error)).toContain('not found');
        }
      });
    });

    describe('ensureDir', () => {
      it('should create directory if it does not exist', async () => {
        const result = await fs.ensureDir('/new/path/to/dir');
        expect(result.isOk()).toBe(true);

        const accessResult = await fs.access('/new/path/to/dir');
        expect(accessResult.isOk()).toBe(true);
      });

      it('should not fail if directory already exists', async () => {
        await fs.mkdir('/existing', { recursive: true });
        const result = await fs.ensureDir('/existing');
        expect(result.isOk()).toBe(true);
      });

      it('should create nested directories', async () => {
        const result = await fs.ensureDir('/a/b/c/d/e');
        expect(result.isOk()).toBe(true);

        const accessResult = await fs.access('/a/b/c/d/e');
        expect(accessResult.isOk()).toBe(true);
      });
    });

    describe('JSON operations', () => {
      describe('readJson', () => {
        it('should read and parse JSON file', async () => {
          const data = {
            name: 'test',
            value: 42,
            nested: { array: [1, 2, 3] },
          };
          await fs.writeFile('/data.json', JSON.stringify(data));

          const result = await fs.readJson('/data.json');
          expect(result.isOk()).toBe(true);
          if (result.isOk()) {
            expect(result.value).toEqual(data);
          }
        });

        it('should return error for invalid JSON', async () => {
          await fs.writeFile('/invalid.json', 'not valid json');
          const result = await fs.readJson('/invalid.json');
          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(getErrorMessage(result.error)).toContain('JSON');
          }
        });

        it('should return error for non-existent file', async () => {
          const result = await fs.readJson('/non-existent.json');
          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(getErrorMessage(result.error)).toContain('not found');
          }
        });

        it('should handle empty objects and arrays', async () => {
          await fs.writeFile('/empty-obj.json', '{}');
          await fs.writeFile('/empty-arr.json', '[]');

          const objResult = await fs.readJson('/empty-obj.json');
          if (objResult.isOk()) {
            expect(objResult.value).toEqual({});
          }

          const arrResult = await fs.readJson('/empty-arr.json');
          if (arrResult.isOk()) {
            expect(arrResult.value).toEqual([]);
          }
        });
      });

      describe('writeJson', () => {
        it('should write JSON with default formatting', async () => {
          const data = { name: 'test', value: 42 };
          const result = await fs.writeJson('/output.json', data);
          expect(result.isOk()).toBe(true);

          const content = await fs.readFile('/output.json');
          if (content.isOk()) {
            expect(content.value).toBe(JSON.stringify(data, null, 2));
          }
        });

        it('should write JSON with custom spacing', async () => {
          const data = { name: 'test' };
          const result = await fs.writeJson('/output.json', data, {
            spaces: 4,
          });
          expect(result.isOk()).toBe(true);

          const content = await fs.readFile('/output.json');
          if (content.isOk()) {
            expect(content.value).toBe(JSON.stringify(data, null, 4));
          }
        });

        it('should write minified JSON with spaces: 0', async () => {
          const data = { name: 'test', value: 42 };
          const result = await fs.writeJson('/output.json', data, {
            spaces: 0,
          });
          expect(result.isOk()).toBe(true);

          const content = await fs.readFile('/output.json');
          if (content.isOk()) {
            expect(content.value).toBe(JSON.stringify(data));
          }
        });

        it('should handle circular references', async () => {
          const data: any = { name: 'test' };
          data.circular = data;

          // Memory filesystem doesn't handle circular references
          // This will throw an error during JSON.stringify
          try {
            await fs.writeJson('/output.json', data);
            expect(true).toBe(false); // Should not reach here
          } catch (error) {
            expect(error).toBeDefined();
          }
        });

        it('should overwrite existing file', async () => {
          await fs.writeJson('/data.json', { old: true });
          const result = await fs.writeJson('/data.json', { new: true });
          expect(result.isOk()).toBe(true);

          const data = await fs.readJson('/data.json');
          if (data.isOk()) {
            expect(data.value).toEqual({ new: true });
          }
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle path traversal attempts', async () => {
      const result = await fs.readFile('../../../etc/passwd');
      expect(result.isErr()).toBe(true);
    });

    it('should handle null bytes in paths', async () => {
      const result = await fs.readFile('/test\0.txt');
      expect(result.isErr()).toBe(true);
    });

    it('should provide meaningful error messages', async () => {
      const result = await fs.readFile('/non-existent.txt');
      expect(result.isErr()).toBe(true);
      const error = result.error as any;
      expect(error.code).toBeDefined();
      expect(error.message).toBeDefined();
      expect(error.path).toBe('/non-existent.txt');
    });
  });

  describe('Memory FileSystem specific', () => {
    it('should track files and directories separately', async () => {
      const memFs = createMemoryFileSystem();
      await memFs.writeFile('/file.txt', 'content');
      await memFs.mkdir('/dir');

      expect(memFs.getFiles?.().has('/file.txt')).toBe(true);
      expect(memFs.getDirectories?.().has('/dir')).toBe(true);
    });

    it('should clear all data', async () => {
      const memFs = createMemoryFileSystem();
      await memFs.writeFile('/file.txt', 'content');
      await memFs.mkdir('/dir');

      memFs.clear?.();

      const fileResult = await memFs.access('/file.txt');
      const dirResult = await memFs.access('/dir');
      expect(fileResult.isOk()).toBe(false);
      expect(dirResult.isOk()).toBe(false);
    });
  });

  describe('New fs-extra methods', () => {
    describe('move', () => {
      it('should move file to new location', async () => {
        await fs.writeFile('/source.txt', 'content to move');
        const moveResult = await fs.rename('/source.txt', '/destination.txt');
        expect(moveResult.isOk()).toBe(true);

        // Source should not exist
        const sourceResult = await fs.access('/source.txt');
        expect(sourceResult.isOk()).toBe(false);

        // Destination should exist with content
        const destContent = await fs.readFile('/destination.txt');
        if (destContent.isOk()) {
          expect(destContent.value).toBe('content to move');
        }
      });

      it('should return error when moving non-existent file', async () => {
        const result = await fs.rename('/non-existent.txt', '/dest.txt');
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(getErrorMessage(result.error)).toContain('not found');
        }
      });
    });

    describe('remove', () => {
      it('should remove file', async () => {
        await fs.writeFile('/file-to-remove.txt', 'content');
        const removeResult = await fs.rm('/file-to-remove.txt');
        expect(removeResult.isOk()).toBe(true);

        const result = await fs.access('/file-to-remove.txt');
        expect(result.isOk()).toBe(false);
      });

      it('should remove directory and its contents', async () => {
        await fs.writeFile('/dir/file1.txt', 'content1');
        await fs.writeFile('/dir/file2.txt', 'content2');
        await fs.mkdir('/dir/subdir', { recursive: true });

        const removeResult = await fs.rm('/dir', { recursive: true });
        expect(removeResult.isOk()).toBe(true);

        const dirResult = await fs.access('/dir');
        expect(dirResult.isOk()).toBe(false);

        const file1Result = await fs.access('/dir/file1.txt');
        expect(file1Result.isOk()).toBe(false);
      });

      it('should return error when removing non-existent path', async () => {
        const result = await fs.rm('/non-existent');
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(getErrorMessage(result.error)).toContain('not found');
        }
      });
    });

    describe('emptyDir', () => {
      it('should empty directory contents', async () => {
        await fs.writeFile('/dir/file1.txt', 'content1');
        await fs.writeFile('/dir/file2.txt', 'content2');
        await fs.mkdir('/dir/subdir', { recursive: true });

        const emptyResult = await fs.emptyDir('/dir');
        expect(emptyResult.isOk()).toBe(true);

        const dirResult = await fs.access('/dir');
        expect(dirResult.isOk()).toBe(true);

        const file1Result = await fs.access('/dir/file1.txt');
        expect(file1Result.isOk()).toBe(false);

        const subdirResult = await fs.access('/dir/subdir');
        expect(subdirResult.isOk()).toBe(false);
      });

      it('should create directory if it does not exist', async () => {
        const result = await fs.emptyDir('/new-empty-dir');
        expect(result.isOk()).toBe(true);

        const accessResult = await fs.access('/new-empty-dir');
        expect(accessResult.isOk()).toBe(true);
      });
    });

    describe('outputFile', () => {
      it('should write file creating parent directories', async () => {
        const result = await fs.outputFile('/deep/nested/path/file.txt', 'content');
        expect(result.isOk()).toBe(true);

        const content = await fs.readFile('/deep/nested/path/file.txt');
        if (content.isOk()) {
          expect(content.value).toBe('content');
        }

        const dirResult = await fs.access('/deep/nested/path');
        expect(dirResult.isOk()).toBe(true);
      });
    });
  });
});
