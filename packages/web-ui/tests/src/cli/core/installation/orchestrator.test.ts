/**
 * High-ROI tests for installation orchestrator
 * Focus: User workflow, error recovery, integration scenarios, dependency handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  performInstallation,
  validatePrerequisites,
  performDryRunInstallation,
} from '../../../../../src/cli/core/installation/orchestrator.js';
import { Ok, Err } from '../../../../../src/cli/core/installation/types.js';
import type {
  InstallConfig,
  Logger,
  FrameworkType,
} from '../../../../../src/cli/core/installation/types.js';
import { createMockFileSystem } from '../../../../utils/mock-filesystem.js';

// Mock external dependencies
vi.mock('ora', () => {
  const mockSpinner = {
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
  };
  return {
    default: vi.fn(() => mockSpinner),
  };
});

vi.mock('nypm', () => ({
  detectPackageManager: vi.fn().mockResolvedValue({ name: 'pnpm' }),
}));

// Mock installation modules
vi.mock('../../../../../src/cli/core/installation/dependencies.js', () => ({
  analyzeDependencies: vi.fn(),
  installDependenciesSmart: vi.fn(),
}));

vi.mock('../../../../../src/cli/core/installation/step-executor.js', () => ({
  executeInstallationSteps: vi.fn(),
}));

vi.mock('../../../../../src/cli/core/installation/step-factory.js', () => ({
  createInstallationSteps: vi.fn(),
}));

vi.mock('../../../../../src/cli/core/installation/workspace-detection.js', () => ({
  detectWorkspace: vi.fn(),
  detectCIEnvironment: vi.fn(),
  checkOfflineMode: vi.fn(),
}));

vi.mock('../../../../../src/cli/core/installation/dependency-resolution.js', () => ({
  analyzeDependencies: vi.fn(),
}));

vi.mock('../../../../../src/cli/core/filesystem/operations.js', () => ({
  checkExistingFiles: vi.fn(),
  ensureDirectories: vi.fn(),
}));

vi.mock('../../../../../src/cli/core/filesystem/paths.js', () => ({
  generateDestinationPaths: vi.fn(),
}));

describe('orchestrator - High-ROI Tests', () => {
  let mockFS: ReturnType<typeof createMockFileSystem>;
  let mockLogger: Logger;
  let config: InstallConfig;
  const trailheadRoot = '/trailhead';

  beforeEach(() => {
    mockFS = createMockFileSystem();
    mockLogger = {
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    };
    config = {
      projectRoot: '/project',
      componentsDir: '/project/components',
      libDir: '/project/components/lib',
      catalystDir: '/project/components/lib/catalyst',
      framework: 'nextjs' as FrameworkType,
    };
    vi.clearAllMocks();
  });

  describe('performInstallation - Critical User Workflows', () => {
    it('should handle existing files error and provide user guidance', async () => {
      // Setup: Files already exist and force is false
      const { ensureDirectories, checkExistingFiles } = await import(
        '../../../../../src/cli/core/filesystem/operations.js'
      );
      const { generateDestinationPaths } = await import(
        '../../../../../src/cli/core/filesystem/paths.js'
      );

      (ensureDirectories as any).mockResolvedValue(Ok(undefined));
      (generateDestinationPaths as any).mockReturnValue({
        themeConfig: '/project/components/theme/config.ts',
        catalystDir: '/project/components/lib',
      });
      (checkExistingFiles as any).mockResolvedValue(
        Ok(['/project/components/theme/config.ts', '/project/components/lib'])
      );

      const result = await performInstallation(mockFS, mockLogger, config, trailheadRoot, false);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('Installation would overwrite existing files');
      }
      expect(mockLogger.warning).toHaveBeenCalledWith('The following files already exist:');
      expect(mockLogger.warning).toHaveBeenCalledWith('Use --force to overwrite existing files');
    });

    it('should handle dependency analysis failures gracefully', async () => {
      // Setup: Directory creation succeeds but dependency analysis fails
      const { ensureDirectories, checkExistingFiles } = await import(
        '../../../../../src/cli/core/filesystem/operations.js'
      );
      const { executeInstallationSteps } = await import(
        '../../../../../src/cli/core/installation/step-executor.js'
      );
      const { createInstallationSteps } = await import(
        '../../../../../src/cli/core/installation/step-factory.js'
      );
      const { analyzeDependencies } = await import(
        '../../../../../src/cli/core/installation/dependencies.js'
      );

      (ensureDirectories as any).mockResolvedValue(Ok(undefined));
      (checkExistingFiles as any).mockResolvedValue(Ok([]));
      (createInstallationSteps as any).mockReturnValue([]);
      (executeInstallationSteps as any).mockResolvedValue(
        Ok({ installedFiles: [], failedSteps: [] })
      );
      (analyzeDependencies as any).mockResolvedValue(
        Err({
          type: 'DependencyError',
          message: 'Cannot read package.json: file is corrupted',
          path: '/project/package.json',
        })
      );

      const result = await performInstallation(mockFS, mockLogger, config, trailheadRoot);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('DependencyError');
        expect(result.error.message).toBe('Cannot read package.json: file is corrupted');
      }
    });

    it('should handle installation failure with detailed error reporting', async () => {
      // Setup: Installation step execution fails
      const { ensureDirectories, checkExistingFiles } = await import(
        '../../../../../src/cli/core/filesystem/operations.js'
      );
      const { executeInstallationSteps } = await import(
        '../../../../../src/cli/core/installation/step-executor.js'
      );

      (ensureDirectories as any).mockResolvedValue(Ok(undefined));
      (checkExistingFiles as any).mockResolvedValue(Ok([]));
      (executeInstallationSteps as any).mockResolvedValue(
        Err({
          type: 'FileSystemError',
          message: 'Failed to copy theme files: disk full',
          path: '/project/components/theme',
          details: 'ENOSPC: no space left on device',
        })
      );

      const result = await performInstallation(mockFS, mockLogger, config, trailheadRoot);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('Failed to copy theme files: disk full');
      }
    });
  });

  describe('validatePrerequisites - Installation Safety', () => {
    it('should detect missing Trailhead UI root directory', async () => {
      mockFS.access.mockImplementation(async (path: string) => {
        if (path === trailheadRoot) {
          return Err({ code: 'ENOENT', message: 'Directory not found', path });
        }
        return Ok(undefined);
      });

      const result = await validatePrerequisites(mockFS, config, trailheadRoot);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('ConfigurationError');
        expect(result.error.message).toBe(`Trailhead UI root not found: ${trailheadRoot}`);
      }
    });

    it('should detect missing project root directory', async () => {
      mockFS.access.mockImplementation(async (path: string) => {
        if (path === config.projectRoot) {
          return Err({ code: 'ENOENT', message: 'Directory not found', path });
        }
        return Ok(undefined);
      });

      const result = await validatePrerequisites(mockFS, config, trailheadRoot);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('ConfigurationError');
        expect(result.error.message).toBe(`Project root not found: ${config.projectRoot}`);
      }
    });

    it('should detect insufficient write permissions', async () => {
      // Setup: Directories exist but write test fails
      mockFS.access.mockResolvedValue(Ok(undefined));
      mockFS.writeFile.mockResolvedValue(
        Err({
          type: 'FileSystemError',
          message: 'Permission denied',
          path: '/project/.trailhead-test-123',
        })
      );

      const result = await validatePrerequisites(mockFS, config, trailheadRoot);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('No write permission in destination directory');
      }
    });

    it('should clean up test files after successful validation', async () => {
      // Setup: All validations pass
      mockFS.access.mockResolvedValue(Ok(undefined));
      mockFS.writeFile.mockResolvedValue(Ok(undefined));
      mockFS.rm.mockResolvedValue(Ok(undefined));

      const result = await validatePrerequisites(mockFS, config, trailheadRoot);

      expect(result.success).toBe(true);
      expect(mockFS.rm).toHaveBeenCalled(); // Should clean up test file
    });
  });

  describe('performDryRunInstallation - User Preview', () => {
    it('should provide accurate preview of files to be installed', async () => {
      // Setup: Successful dry run with file preview
      const { analyzeDependencies } = await import(
        '../../../../../src/cli/core/installation/dependencies.js'
      );

      (analyzeDependencies as any).mockResolvedValue(
        Ok({
          needsInstall: true,
          added: { react: '^18.0.0', tailwindcss: '^3.0.0' },
        })
      );

      mockFS.readdir.mockResolvedValue(Ok(['button.tsx', 'input.tsx', 'alert.tsx']));
      mockFS.access.mockResolvedValue(Err({ code: 'ENOENT', message: 'File not found', path: '' })); // No existing files

      const result = await performDryRunInstallation(mockFS, mockLogger, config, trailheadRoot);

      expect(result.success).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Performing dry run installation...');
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Would add 2 dependencies:')
      );
      expect(mockLogger.info).toHaveBeenCalledWith('  • react@^18.0.0');
      expect(mockLogger.info).toHaveBeenCalledWith('  • tailwindcss@^3.0.0');
    });

    it('should warn about file conflicts during dry run', async () => {
      const { analyzeDependencies } = await import(
        '../../../../../src/cli/core/installation/dependencies.js'
      );

      (analyzeDependencies as any).mockResolvedValue(
        Ok({
          needsInstall: false,
          added: {},
        })
      );

      mockFS.readdir.mockResolvedValue(Ok(['button.tsx']));
      mockFS.access.mockImplementation(async (path: string) => {
        // Simulate existing theme config file
        if (path.includes('theme/config.ts')) {
          return Ok(undefined);
        }
        return Err({ code: 'ENOENT', message: 'File not found', path });
      });

      const result = await performDryRunInstallation(mockFS, mockLogger, config, trailheadRoot);

      expect(result.success).toBe(true);
      expect(mockLogger.warning).toHaveBeenCalledWith(expect.stringContaining('Would overwrite'));
    });

    it('should handle dependency analysis errors during dry run', async () => {
      const { analyzeDependencies } = await import(
        '../../../../../src/cli/core/installation/dependencies.js'
      );

      (analyzeDependencies as any).mockResolvedValue(
        Err({
          type: 'DependencyError',
          message: 'Cannot analyze dependencies',
        })
      );

      mockFS.readdir.mockResolvedValue(Ok([]));

      const result = await performDryRunInstallation(mockFS, mockLogger, config, trailheadRoot);

      expect(result.success).toBe(true);
      // Should continue with file preview even if dependency analysis fails
      expect(mockLogger.info).toHaveBeenCalledWith('Performing dry run installation...');
    });
  });
});
