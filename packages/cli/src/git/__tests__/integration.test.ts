import { describe, it, expect, beforeAll } from 'vitest';
import {
  executeGitCommand,
  executeGitCommandSimple,
  validateGitEnvironment,
} from '../git-command.js';
import { checkBranchSync } from '../branch-sync.js';

describe('git integration', () => {
  let isGitAvailable = false;

  beforeAll(async () => {
    // Check if git is available in the test environment
    const gitValidation = await validateGitEnvironment();
    isGitAvailable = gitValidation.isOk();

    if (!isGitAvailable) {
      console.log('⚠️ Skipping git integration tests - git not available or not in git repository');
    }
  });

  describe('git version compatibility', () => {
    it('should work with current git version', async () => {
      if (!isGitAvailable) {
        console.log('Skipping: git not available');
        return;
      }

      const result = await executeGitCommandSimple(['--version']);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Git version should match pattern like "git version 2.34.1"
        expect(result.value).toMatch(/git version \d+\.\d+\.\d+/);

        // Extract version number and ensure it's 2.25+ (modern git)
        const versionMatch = result.value.match(/git version (\d+)\.(\d+)\.(\d+)/);
        if (versionMatch) {
          const [, major, minor] = versionMatch.map(Number);
          const version = major * 100 + minor;

          // Git 2.25+ required for reliable --is-ancestor support
          expect(version).toBeGreaterThanOrEqual(225);
        }
      }
    });

    it('should validate git environment correctly', async () => {
      if (!isGitAvailable) {
        console.log('Skipping: git not available');
        return;
      }

      const result = await validateGitEnvironment();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });
  });

  describe('timeout behavior validation', () => {
    it('should respect short timeout settings', async () => {
      if (!isGitAvailable) {
        console.log('Skipping: git not available');
        return;
      }

      const start = Date.now();

      // Use a very short timeout with a command that might take longer
      const result = await executeGitCommand(['log', '--oneline', '-1000'], {
        timeout: 50, // 50ms timeout - very short
      });

      const elapsed = Date.now() - start;

      // Should either succeed very quickly OR timeout around 50ms
      // Give some leeway for test environment variability
      expect(elapsed).toBeLessThan(200);

      if (!result.isOk()) {
        // If it failed, it should be due to timeout
        expect(result.error.message).toMatch(/timed out|timeout/i);
      }
    });

    it('should complete normal operations within reasonable time', async () => {
      if (!isGitAvailable) {
        console.log('Skipping: git not available');
        return;
      }

      const start = Date.now();

      // Normal timeout should be sufficient for basic git operations
      const result = await executeGitCommandSimple(['status', '--porcelain'], {
        timeout: 5000, // 5 second timeout
      });

      const elapsed = Date.now() - start;

      // Should complete well within timeout
      expect(elapsed).toBeLessThan(5000);
      expect(result.isOk()).toBe(true);
    });
  });

  describe('real repository operations', () => {
    it('should handle actual git status command', async () => {
      if (!isGitAvailable) {
        console.log('Skipping: git not available');
        return;
      }

      const result = await executeGitCommandSimple(['status', '--porcelain']);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Result should be a string (may be empty for clean repo)
        expect(typeof result.value).toBe('string');
      }
    });

    it('should handle current branch detection', async () => {
      if (!isGitAvailable) {
        console.log('Skipping: git not available');
        return;
      }

      const result = await executeGitCommandSimple(['rev-parse', '--abbrev-ref', 'HEAD']);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should return a valid branch name
        expect(result.value).toMatch(/^[a-zA-Z0-9/_-]+$/);
        expect(result.value.length).toBeGreaterThan(0);
      }
    });

    it('should handle branch sync check if remote exists', async () => {
      if (!isGitAvailable) {
        console.log('Skipping: git not available');
        return;
      }

      // Try to check sync with origin/main if it exists
      const result = await checkBranchSync('origin/main');

      // This may succeed or fail depending on repository state
      // We're mainly testing that it doesn't crash or hang
      expect(typeof result.isOk()).toBe('boolean');

      if (result.isOk()) {
        expect(result.value.currentBranch).toMatch(/^[a-zA-Z0-9/_-]+$/);
        expect(typeof result.value.ahead).toBe('number');
        expect(typeof result.value.behind).toBe('number');
        expect(typeof result.value.isUpToDate).toBe('boolean');
      } else {
        // If it fails, should be a proper error
        expect(result.error.message).toBeDefined();
      }
    });
  });

  describe('error handling with real git', () => {
    it('should handle invalid git commands gracefully', async () => {
      if (!isGitAvailable) {
        console.log('Skipping: git not available');
        return;
      }

      const result = await executeGitCommandSimple(['invalid-command']);

      expect(result.isOk()).toBe(false);
      if (!result.isOk()) {
        expect(result.error.message).toBeDefined();
        expect(result.error.code).toBeDefined();
      }
    });

    it('should handle git operations in non-git directory', async () => {
      // This test validates git environment detection
      // We're already in a git repo, so we can't easily test this
      // without changing directories, which might affect other tests

      const result = await validateGitEnvironment({ cwd: '/tmp' });

      // Should detect that /tmp is not a git repository or git is not available
      expect(result.isOk()).toBe(false);
      if (!result.isOk()) {
        expect(result.error.message).toMatch(/not a git repository|git is not available/i);
      }
    });
  });
});
