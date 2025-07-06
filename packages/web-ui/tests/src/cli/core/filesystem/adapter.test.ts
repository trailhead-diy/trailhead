/**
 * High-ROI tests for filesystem adapter
 * Focus: Error handling, security concerns, error conversion accuracy
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptFrameworkToInstallFS } from '../../../../../src/cli/core/filesystem/adapter.js';
import type { FileSystem as FrameworkFileSystem } from '@esteban-url/trailhead-cli/filesystem';
// Note: Ok and Err are not directly used in tests but imported by test setup

describe('filesystem-adapter - High-ROI Tests', () => {
  let mockFrameworkFS: FrameworkFileSystem;
  let adapter: ReturnType<typeof adaptFrameworkToInstallFS>;

  beforeEach(() => {
    mockFrameworkFS = {
      access: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      ensureDir: vi.fn(),
      readdir: vi.fn(),
      cp: vi.fn(),
      readJson: vi.fn(),
      writeJson: vi.fn(),
      rm: vi.fn(),
      stat: vi.fn(),
    };
    adapter = adaptFrameworkToInstallFS(mockFrameworkFS);
    vi.clearAllMocks();
  });

  describe('Error Conversion - Critical Functionality', () => {
    it('should preserve error context when converting filesystem errors', async () => {
      // Setup: Framework filesystem returns detailed error
      const frameworkError = {
        message: 'Permission denied: /restricted/file.txt',
        path: '/restricted/file.txt',
        code: 'EACCES',
        cause: new Error('System permission error'),
      };
      mockFrameworkFS.readFile.mockResolvedValue({ success: false, error: frameworkError });

      const result = await adapter.readFile('/restricted/file.txt');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('Permission denied: /restricted/file.txt');
        expect(result.error.path).toBe('/restricted/file.txt');
        expect(result.error.cause).toBe(frameworkError);
      }
    });

    it('should handle errors without path information gracefully', async () => {
      // Setup: Error missing path information
      const frameworkError = {
        message: 'Network timeout',
        code: 'ETIMEDOUT',
      };
      mockFrameworkFS.writeFile.mockResolvedValue({ success: false, error: frameworkError });

      const result = await adapter.writeFile('/network/file.txt', 'content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('Network timeout');
        expect(result.error.path).toBe(''); // Should default to empty string
        expect(result.error.cause).toBe(frameworkError);
      }
    });

    it('should provide fallback error message for undefined errors', async () => {
      // Setup: Error with minimal information
      const frameworkError = {};
      mockFrameworkFS.ensureDir.mockResolvedValue({ success: false, error: frameworkError });

      const result = await adapter.ensureDir('/some/directory');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('Filesystem operation failed');
        expect(result.error.path).toBe('');
        expect(result.error.cause).toBe(frameworkError);
      }
    });
  });

  describe('Security-Critical Operations', () => {
    it('should handle permission errors during file access', async () => {
      // Setup: Access denied to sensitive file
      const securityError = {
        message: 'Access denied to system file',
        path: '/etc/passwd',
        code: 'EACCES',
      };
      mockFrameworkFS.access.mockResolvedValue({ success: false, error: securityError });

      const result = await adapter.access('/etc/passwd');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('Access denied to system file');
        expect(result.error.path).toBe('/etc/passwd');
      }
    });

    it('should handle file operation security violations', async () => {
      // Setup: Attempt to write to protected directory
      const securityError = {
        message: 'Operation not permitted',
        path: '/root/.ssh/authorized_keys',
        code: 'EPERM',
      };
      mockFrameworkFS.writeFile.mockResolvedValue({ success: false, error: securityError });

      const result = await adapter.writeFile('/root/.ssh/authorized_keys', 'malicious content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('Operation not permitted');
        expect(result.error.path).toBe('/root/.ssh/authorized_keys');
      }
    });

    it('should handle directory traversal protection failures', async () => {
      // Setup: Attempt to access files outside allowed directory
      const securityError = {
        message: 'Path traversal not allowed',
        path: '../../../etc/hosts',
        code: 'EACCES',
      };
      mockFrameworkFS.readFile.mockResolvedValue({ success: false, error: securityError });

      const result = await adapter.readFile('../../../etc/hosts');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('Path traversal not allowed');
        expect(result.error.path).toBe('../../../etc/hosts');
      }
    });
  });

  describe('Critical Path Error Handling', () => {
    it('should handle JSON parsing errors with context preservation', async () => {
      // Setup: Malformed JSON file
      const jsonError = {
        message: 'Unexpected token } in JSON at position 45',
        path: '/project/package.json',
        cause: new SyntaxError('Invalid JSON syntax'),
      };
      mockFrameworkFS.readJson.mockResolvedValue({ success: false, error: jsonError });

      const result = await adapter.readJson('/project/package.json');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('Unexpected token } in JSON at position 45');
        expect(result.error.path).toBe('/project/package.json');
        expect(result.error.cause).toEqual(jsonError);
      }
    });

    it('should handle copy operation failures with detailed error information', async () => {
      // Setup: Copy operation fails due to disk space
      const copyError = {
        message: 'No space left on device',
        path: '/full/disk/destination',
        code: 'ENOSPC',
      };
      mockFrameworkFS.cp.mockResolvedValue({ success: false, error: copyError });

      const result = await adapter.cp('/source/file', '/full/disk/destination');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('No space left on device');
        expect(result.error.path).toBe('/full/disk/destination');
      }
    });

    it('should handle remove operation errors safely', async () => {
      // Setup: Remove operation fails on protected file
      const removeError = {
        message: 'Cannot remove: File is being used by another process',
        path: '/locked/file.txt',
        code: 'EBUSY',
      };
      mockFrameworkFS.rm.mockResolvedValue({ success: false, error: removeError });

      const result = await adapter.rm('/locked/file.txt');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('Cannot remove: File is being used by another process');
        expect(result.error.path).toBe('/locked/file.txt');
      }
    });
  });

  describe('Success Path Verification', () => {
    it('should correctly adapt successful file operations', async () => {
      // Setup: Successful operations
      mockFrameworkFS.readFile.mockResolvedValue({ success: true, value: 'file content' });
      mockFrameworkFS.writeFile.mockResolvedValue({ success: true, value: undefined });
      mockFrameworkFS.access.mockResolvedValue({ success: true, value: undefined });

      const readResult = await adapter.readFile('/test/file.txt');
      const writeResult = await adapter.writeFile('/test/file.txt', 'content');
      const accessResult = await adapter.access('/test/file.txt');

      expect(readResult.success).toBe(true);
      expect(writeResult.success).toBe(true);
      expect(accessResult.success).toBe(true);
    });

    it('should correctly adapt successful JSON operations', async () => {
      // Setup: Successful JSON operations
      const jsonData = { name: 'test', version: '1.0.0' };
      mockFrameworkFS.readJson.mockResolvedValue({ success: true, value: jsonData });
      mockFrameworkFS.writeJson.mockResolvedValue({ success: true, value: undefined });

      const readResult = await adapter.readJson('/test/package.json');
      const writeResult = await adapter.writeJson('/test/package.json', jsonData);

      expect(readResult.success).toBe(true);
      if (readResult.success) {
        expect(readResult.value).toEqual(jsonData);
      }
      expect(writeResult.success).toBe(true);
    });

    it('should correctly adapt directory operations', async () => {
      // Setup: Successful directory operations
      mockFrameworkFS.readdir.mockResolvedValue({
        success: true,
        value: ['file1.txt', 'file2.txt'],
      });
      mockFrameworkFS.ensureDir.mockResolvedValue({ success: true, value: undefined });

      const readdirResult = await adapter.readdir('/test/directory');
      const ensureDirResult = await adapter.ensureDir('/test/newdir');

      expect(readdirResult.success).toBe(true);
      if (readdirResult.success) {
        expect(readdirResult.value).toEqual(['file1.txt', 'file2.txt']);
      }
      expect(ensureDirResult.success).toBe(true);
    });
  });

  describe('Method Parameter Passing', () => {
    it('should correctly pass parameters to underlying filesystem methods', async () => {
      mockFrameworkFS.access.mockResolvedValue({ success: true, value: undefined });
      mockFrameworkFS.cp.mockResolvedValue({ success: true, value: undefined });
      mockFrameworkFS.writeJson.mockResolvedValue({ success: true, value: undefined });

      await adapter.access('/path', 0o755);
      await adapter.cp('/source', '/dest', { recursive: true });
      await adapter.writeJson('/file.json', { test: true }, { spaces: 2 });

      expect(mockFrameworkFS.access).toHaveBeenCalledWith('/path', 0o755);
      expect(mockFrameworkFS.cp).toHaveBeenCalledWith('/source', '/dest', { recursive: true });
      expect(mockFrameworkFS.writeJson).toHaveBeenCalledWith(
        '/file.json',
        { test: true },
        { spaces: 2 }
      );
    });

    it('should use correct default parameters for remove operations', async () => {
      mockFrameworkFS.rm.mockResolvedValue({ success: true, value: undefined });

      await adapter.rm('/path/to/remove');

      expect(mockFrameworkFS.rm).toHaveBeenCalledWith('/path/to/remove', {
        recursive: true,
        force: true,
      });
    });
  });
});
