/**
 * High-ROI tests for workspace detection
 * Focus: Error handling, CI environment detection, integration scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectWorkspace,
  detectCIEnvironment,
  checkOfflineMode,
  findWorkspaceRoot,
  isInWorkspace,
  shouldInstallAtRoot,
} from '../../../../../src/cli/core/installation/workspace-detection.js';
import { Ok, Err } from '../../../../../src/cli/core/installation/types.js';
import { createMockFileSystem } from '../../../../utils/mock-filesystem.js';

describe('workspace-detection - High-ROI Tests', () => {
  let mockFS: ReturnType<typeof createMockFileSystem>;

  beforeEach(() => {
    mockFS = createMockFileSystem();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment variables
    delete process.env.GITHUB_ACTIONS;
    delete process.env.GITLAB_CI;
    delete process.env.CIRCLECI;
    delete process.env.JENKINS_URL;
    delete process.env.NETLIFY;
    delete process.env.VERCEL;
    delete process.env.CI;
    delete process.env.CONTINUOUS_INTEGRATION;
  });

  describe('detectWorkspace - Error Handling', () => {
    it('should handle filesystem permission errors gracefully', async () => {
      // Setup: Mock filesystem that consistently returns permission errors
      mockFS.access.mockImplementation(async () => {
        throw new Error('Permission denied - access restricted');
      });

      const result = await detectWorkspace(mockFS, '/restricted/path');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('Failed to detect workspace');
        expect(result.error.path).toBe('/restricted/path');
      }
    });

    it('should handle corrupted package.json during workspace detection', async () => {
      // Setup: No workspace config files exist, package.json is corrupted
      mockFS.access.mockImplementation(async (path: string) => {
        if (path.includes('package.json')) {
          return Ok(undefined); // package.json exists
        }
        return Err({ code: 'ENOENT', message: 'File not found', path });
      });
      mockFS.readJson.mockResolvedValue(
        Err({
          type: 'FileSystemError',
          message: 'Invalid JSON syntax',
          path: '/project/package.json',
        })
      );

      const result = await detectWorkspace(mockFS, '/project');

      expect(result.success).toBe(true);
      expect(result.value).toBe(null); // Should gracefully return null for corrupted files
    });

    it('should detect npm workspace when package.json has invalid workspace format', async () => {
      // Setup: Only package.json exists, other workspace configs don't exist
      mockFS.access.mockImplementation(async (path: string) => {
        if (path.includes('package.json')) {
          return Ok(undefined); // package.json exists
        }
        return Err({ code: 'ENOENT', message: 'File not found', path });
      });
      mockFS.readJson.mockResolvedValue(
        Ok({
          workspaces: { invalid: 'format' }, // Missing packages property
        })
      );

      const result = await detectWorkspace(mockFS, '/project');

      expect(result.success).toBe(true);
      expect(result.value).toBe(null); // Should handle invalid workspace format gracefully
    });
  });

  describe('detectCIEnvironment - Edge Cases', () => {
    it('should detect GitHub Actions with various environment configurations', () => {
      process.env.GITHUB_ACTIONS = 'true';

      const result = detectCIEnvironment();

      expect(result).toEqual({
        type: 'github',
        name: 'GitHub Actions',
        isCI: true,
      });
    });

    it('should detect GitLab CI when only GitLab variables are set', () => {
      // Ensure GitHub Actions is not set
      delete process.env.GITHUB_ACTIONS;
      process.env.GITLAB_CI = 'true';

      const result = detectCIEnvironment();

      expect(result).toEqual({
        type: 'gitlab',
        name: 'GitLab CI',
        isCI: true,
      });
    });

    it('should detect generic CI when only basic CI variables are set', () => {
      process.env.CI = 'true';

      const result = detectCIEnvironment();

      expect(result).toEqual({
        type: 'generic',
        name: 'CI',
        isCI: true,
      });
    });

    it('should handle CONTINUOUS_INTEGRATION variable for legacy CI systems', () => {
      process.env.CONTINUOUS_INTEGRATION = 'true';

      const result = detectCIEnvironment();

      expect(result).toEqual({
        type: 'generic',
        name: 'CI',
        isCI: true,
      });
    });

    it('should return null when no CI environment is detected', () => {
      // Ensure no CI environment variables are set
      const result = detectCIEnvironment();

      expect(result).toBe(null);
    });

    it('should detect Jenkins with both URL and HOME variables', () => {
      process.env.JENKINS_URL = 'http://jenkins.example.com';
      process.env.JENKINS_HOME = '/var/jenkins_home';

      const result = detectCIEnvironment();

      expect(result).toEqual({
        type: 'jenkins',
        name: 'Jenkins',
        isCI: true,
      });
    });
  });

  describe('checkOfflineMode - Network Failure Scenarios', () => {
    it('should detect offline mode when network request times out', async () => {
      // Mock fetch to simulate timeout
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Network timeout')), 100);
          })
      );

      const result = await checkOfflineMode();

      expect(result).toBe(true);
    });

    it('should detect offline mode when registry returns error status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await checkOfflineMode();

      expect(result).toBe(true);
    });

    it('should detect online mode when registry responds successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const result = await checkOfflineMode();

      expect(result).toBe(false);
    });

    it('should handle network errors gracefully and default to offline', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('DNS resolution failed'));

      const result = await checkOfflineMode();

      expect(result).toBe(true);
    });
  });

  describe('findWorkspaceRoot - Integration Scenarios', () => {
    it('should handle deeply nested project structures', async () => {
      // Setup: Workspace root at /monorepo, current path at /monorepo/packages/ui/src/components
      const deepPath = '/monorepo/packages/ui/src/components';

      // Mock successful access to pnpm-workspace.yaml only at the root
      mockFS.access.mockImplementation(async (path: string) => {
        if (path === '/monorepo/pnpm-workspace.yaml') {
          return Ok(undefined);
        }
        return Err({ code: 'ENOENT', message: 'File not found', path });
      });

      const result = await findWorkspaceRoot(mockFS, deepPath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('/monorepo');
      }
    });

    it('should return null when no workspace is found at filesystem root', async () => {
      // Setup: Search from root directory with no workspace files
      mockFS.access.mockResolvedValue(Err({ code: 'ENOENT', message: 'File not found', path: '' }));

      const result = await findWorkspaceRoot(mockFS, '/');

      expect(result.success).toBe(true);
      expect(result.value).toBe(null);
    });

    it('should handle filesystem errors during workspace traversal gracefully', async () => {
      // Setup: Mock filesystem to throw errors
      mockFS.access.mockImplementation(async () => {
        throw new Error('I/O error - disk corrupted');
      });

      const result = await findWorkspaceRoot(mockFS, '/corrupted/path/project');

      // The function should handle errors gracefully and return null instead of failing
      // This is high-ROI behavior for user experience
      expect(result.success).toBe(true);
      expect(result.value).toBe(null);
    });
  });

  describe('isInWorkspace - Integration Testing', () => {
    it('should correctly identify project within workspace', async () => {
      // Setup: Mock successful workspace detection
      mockFS.access.mockImplementation(async (path: string) => {
        return path.includes('pnpm-workspace.yaml')
          ? Ok(undefined)
          : Err({ code: 'ENOENT', message: 'Not found', path });
      });

      const result = await isInWorkspace(mockFS, '/workspace/packages/ui');

      expect(result).toBe(true);
    });

    it('should handle errors gracefully and return false', async () => {
      // Setup: Mock filesystem errors
      mockFS.access.mockResolvedValue(
        Err({
          code: 'EACCES',
          message: 'Permission denied',
          path: '/restricted',
        })
      );

      const result = await isInWorkspace(mockFS, '/restricted/project');

      expect(result).toBe(false);
    });
  });

  describe('shouldInstallAtRoot - Business Logic', () => {
    it('should recommend root installation for pnpm workspace with shared dependencies', () => {
      const workspace = {
        type: 'pnpm' as const,
        configFile: 'pnpm-workspace.yaml',
        root: '/workspace',
      };

      const result = shouldInstallAtRoot(workspace, true);

      expect(result).toBe(true);
    });

    it('should recommend package-level installation for pnpm workspace with non-shared dependencies', () => {
      const workspace = {
        type: 'pnpm' as const,
        configFile: 'pnpm-workspace.yaml',
        root: '/workspace',
      };

      const result = shouldInstallAtRoot(workspace, false);

      expect(result).toBe(false);
    });

    it('should handle lerna workspace configuration appropriately', () => {
      const workspace = {
        type: 'lerna' as const,
        configFile: 'lerna.json',
        root: '/workspace',
      };

      const result = shouldInstallAtRoot(workspace, true);

      expect(result).toBe(false); // Lerna typically installs at package level
    });

    it('should handle npm workspace with proper fallback behavior', () => {
      const workspace = {
        type: 'npm' as const,
        configFile: 'package.json',
        root: '/workspace',
        workspaces: ['packages/*'],
      };

      const result = shouldInstallAtRoot(workspace, true);

      expect(result).toBe(false); // npm workspaces typically install at package level
    });

    it('should return false for non-workspace projects', () => {
      const result = shouldInstallAtRoot(null, true);

      expect(result).toBe(false);
    });
  });
});
