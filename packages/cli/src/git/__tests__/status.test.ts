import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isWorkingDirectoryClean, getGitStatus, formatGitStatus } from '../status.js';
import { executeGitCommandSimple, validateGitEnvironment } from '../git-command.js';
import type { GitStatus } from '../types.js';
import { ok } from '../../core/index.js';

// Mock the git command execution
vi.mock('../git-command.js');

const mockExecuteGitCommandSimple = vi.mocked(executeGitCommandSimple);
const mockValidateGitEnvironment = vi.mocked(validateGitEnvironment);

describe('status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isWorkingDirectoryClean', () => {
    it('should return true for clean working directory', async () => {
      mockExecuteGitCommandSimple.mockResolvedValueOnce(ok(''));

      const result = await isWorkingDirectoryClean();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it('should return false for dirty working directory', async () => {
      mockExecuteGitCommandSimple.mockResolvedValueOnce(ok(' M file1.txt\n?? file2.txt'));

      const result = await isWorkingDirectoryClean();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe('getGitStatus', () => {
    it('should parse clean repository status', async () => {
      // Mock git environment validation
      mockValidateGitEnvironment.mockResolvedValueOnce(ok(true));

      mockExecuteGitCommandSimple
        // Mock getCurrentBranch
        .mockResolvedValueOnce(ok('main'))
        // Mock git status --porcelain
        .mockResolvedValueOnce(ok(''));

      const result = await getGitStatus();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentBranch).toBe('main');
        expect(result.value.isClean).toBe(true);
        expect(result.value.staged).toBe(0);
        expect(result.value.modified).toBe(0);
        expect(result.value.untracked).toBe(0);
      }
    });

    it('should parse repository with mixed changes', async () => {
      // Mock git environment validation
      mockValidateGitEnvironment.mockResolvedValueOnce(ok(true));

      mockExecuteGitCommandSimple
        // Mock getCurrentBranch
        .mockResolvedValueOnce(ok('feature'))
        // Mock git status --porcelain with mixed changes
        .mockResolvedValueOnce(
          ok('M  staged.txt\n M modified.txt\n?? untracked.txt\nA  added.txt')
        );

      const result = await getGitStatus();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentBranch).toBe('feature');
        expect(result.value.isClean).toBe(false);
        expect(result.value.staged).toBe(2); // M and A in index
        expect(result.value.modified).toBe(1); // M in working tree
        expect(result.value.untracked).toBe(1); // ??
      }
    });

    it('should handle various git status codes correctly', async () => {
      // Mock git environment validation
      mockValidateGitEnvironment.mockResolvedValueOnce(ok(true));

      mockExecuteGitCommandSimple
        // Mock getCurrentBranch
        .mockResolvedValueOnce(ok('main'))
        // Mock git status --porcelain with various codes
        .mockResolvedValueOnce(
          ok(
            'MM both-modified.txt\nAM added-then-modified.txt\nD  deleted.txt\n M workspace-modified.txt\n?? untracked.txt'
          )
        );

      const result = await getGitStatus();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.staged).toBe(3); // MM, AM, D (index changes)
        expect(result.value.modified).toBe(3); // MM, AM, M (working tree changes)
        expect(result.value.untracked).toBe(1); // ??
        expect(result.value.isClean).toBe(false);
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

      const result = formatGitStatus(status);

      expect(result).toBe("On branch 'main' - working directory clean");
    });

    it('should format status with single file changes', () => {
      const status: GitStatus = {
        currentBranch: 'feature',
        isClean: false,
        staged: 1,
        modified: 1,
        untracked: 1,
      };

      const result = formatGitStatus(status);

      expect(result).toBe("On branch 'feature', 1 staged file, 1 modified file, 1 untracked file");
    });

    it('should format status with multiple file changes', () => {
      const status: GitStatus = {
        currentBranch: 'develop',
        isClean: false,
        staged: 3,
        modified: 2,
        untracked: 5,
      };

      const result = formatGitStatus(status);

      expect(result).toBe(
        "On branch 'develop', 3 staged files, 2 modified files, 5 untracked files"
      );
    });

    it('should format status with only some types of changes', () => {
      const status: GitStatus = {
        currentBranch: 'hotfix',
        isClean: false,
        staged: 2,
        modified: 0,
        untracked: 1,
      };

      const result = formatGitStatus(status);

      expect(result).toBe("On branch 'hotfix', 2 staged files, 1 untracked file");
    });
  });
});
