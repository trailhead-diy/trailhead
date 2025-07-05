import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getGitStatus,
  isWorkingDirectoryClean,
  formatGitStatus,
} from '../status.js';
import { executeGitCommandSimple } from '../git-command.js';
import type { GitStatus } from '../types.js';

// Mock the git command execution
vi.mock('../git-command.js');

const mockExecuteGitCommandSimple = vi.mocked(executeGitCommandSimple);

describe('status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isWorkingDirectoryClean', () => {
    it('should return true for clean working directory', async () => {
      mockExecuteGitCommandSimple.mockResolvedValueOnce({
        isOk: true,
        value: '', // Empty output means clean
        isErr: false,
        error: undefined as never,
      });

      const result = await isWorkingDirectoryClean();

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe(true);
      }
      expect(mockExecuteGitCommandSimple).toHaveBeenCalledWith(
        ['status', '--porcelain'],
        {},
      );
    });

    it('should return false for dirty working directory', async () => {
      mockExecuteGitCommandSimple.mockResolvedValueOnce({
        isOk: true,
        value: ' M file1.txt\n?? file2.txt',
        isErr: false,
        error: undefined as never,
      });

      const result = await isWorkingDirectoryClean();

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe('getGitStatus', () => {
    it('should parse clean repository status', async () => {
      // Mock git environment validation
      mockExecuteGitCommandSimple
        .mockResolvedValueOnce({
          isOk: true,
          value: 'git version 2.34.1',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: '.git',
          isErr: false,
          error: undefined as never,
        })
        // Mock getCurrentBranch
        .mockResolvedValueOnce({
          isOk: true,
          value: 'main',
          isErr: false,
          error: undefined as never,
        })
        // Mock status --porcelain
        .mockResolvedValueOnce({
          isOk: true,
          value: '',
          isErr: false,
          error: undefined as never,
        });

      const result = await getGitStatus();

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const status = result.value;
        expect(status.currentBranch).toBe('main');
        expect(status.isClean).toBe(true);
        expect(status.staged).toBe(0);
        expect(status.modified).toBe(0);
        expect(status.untracked).toBe(0);
      }
    });

    it('should parse repository with mixed changes', async () => {
      // Mock git environment validation
      mockExecuteGitCommandSimple
        .mockResolvedValueOnce({
          isOk: true,
          value: 'git version 2.34.1',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: '.git',
          isErr: false,
          error: undefined as never,
        })
        // Mock getCurrentBranch
        .mockResolvedValueOnce({
          isOk: true,
          value: 'feature',
          isErr: false,
          error: undefined as never,
        })
        // Mock status --porcelain with various file states
        .mockResolvedValueOnce({
          isOk: true,
          value:
            'M  staged-file.txt\n M modified-file.txt\nA  added-file.txt\n?? untracked-file.txt\nMM both-modified.txt',
          isErr: false,
          error: undefined as never,
        });

      const result = await getGitStatus();

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const status = result.value;
        expect(status.currentBranch).toBe('feature');
        expect(status.isClean).toBe(false);
        expect(status.staged).toBe(3); // M_, A_, MM (index has changes)
        expect(status.modified).toBe(2); // _M, MM (working tree has changes)
        expect(status.untracked).toBe(1); // ??
      }
    });

    it('should handle various git status codes correctly', async () => {
      // Mock git environment validation
      mockExecuteGitCommandSimple
        .mockResolvedValueOnce({
          isOk: true,
          value: 'git version 2.34.1',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: '.git',
          isErr: false,
          error: undefined as never,
        })
        // Mock getCurrentBranch
        .mockResolvedValueOnce({
          isOk: true,
          value: 'test',
          isErr: false,
          error: undefined as never,
        })
        // Mock status --porcelain with all possible states
        .mockResolvedValueOnce({
          isOk: true,
          value: [
            'M  staged-modified.txt', // Staged modification
            ' M unstaged-modified.txt', // Unstaged modification
            'A  staged-added.txt', // Staged addition
            '?? untracked.txt', // Untracked file
            'MM both-modified.txt', // Modified in both index and working tree
            'D  staged-deleted.txt', // Staged deletion
            ' D unstaged-deleted.txt', // Unstaged deletion
          ].join('\n'),
          isErr: false,
          error: undefined as never,
        });

      const result = await getGitStatus();

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const status = result.value;
        expect(status.staged).toBe(4); // M_, A_, MM, D_ (index has changes)
        expect(status.modified).toBe(3); // _M, MM, _D (working tree has changes)
        expect(status.untracked).toBe(1); // ??
        expect(status.isClean).toBe(false);
      }
    });
  });

  describe('formatGitStatus', () => {
    it('should format clean status', () => {
      const status: GitStatus = {
        currentBranch: 'main',
        isClean: true,
        staged: 0,
        modified: 0,
        untracked: 0,
      };

      const formatted = formatGitStatus(status);
      expect(formatted).toBe("On branch 'main' - working directory clean");
    });

    it('should format status with single file changes', () => {
      const status: GitStatus = {
        currentBranch: 'feature',
        isClean: false,
        staged: 1,
        modified: 1,
        untracked: 1,
      };

      const formatted = formatGitStatus(status);
      expect(formatted).toBe(
        "On branch 'feature', 1 staged file, 1 modified file, 1 untracked file",
      );
    });

    it('should format status with multiple file changes', () => {
      const status: GitStatus = {
        currentBranch: 'develop',
        isClean: false,
        staged: 3,
        modified: 2,
        untracked: 5,
      };

      const formatted = formatGitStatus(status);
      expect(formatted).toBe(
        "On branch 'develop', 3 staged files, 2 modified files, 5 untracked files",
      );
    });

    it('should format status with only some types of changes', () => {
      const status: GitStatus = {
        currentBranch: 'hotfix',
        isClean: false,
        staged: 2,
        modified: 0,
        untracked: 0,
      };

      const formatted = formatGitStatus(status);
      expect(formatted).toBe("On branch 'hotfix', 2 staged files");
    });
  });
});
