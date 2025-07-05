/**
 * High-ROI tests for dependency management utilities
 *
 * Focuses on:
 * - Package.json dependency analysis (user-critical)
 * - Version synchronization logic (reliability)
 * - Installation requirement detection (performance)
 * - Error handling for file operations (stability)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateExpectedDependencies,
  generateMinimalDependencies,
  needsDependencyUpdate,
  analyzeDependencies,
  updatePackageJsonDependencies,
  checkVersionSync,
  isInstallationNeeded,
  checkKeyDependencies,
  generateInstallCommand,
  getLockfileName,
  analyzeAndUpdateDependencies,
  type PackageJson,
  type ExpectedDependencies,
  DependencyErr,
  Ok,
  Err,
} from '../../../src/cli/core/shared/dependency-management';
import type { FileSystem, FileSystemError } from '@esteban-url/trailhead-cli/filesystem';

describe('Dependency Management - High ROI Tests', () => {
  describe('Dependency Configuration (Source of Truth)', () => {
    describe('generateExpectedDependencies', () => {
      it('should return exact versions for demo project dependencies', () => {
        const expected = generateExpectedDependencies();

        expect(expected.dependencies).toMatchObject({
          react: '19.1.0',
          'react-dom': '19.1.0',
          'framer-motion': '12.16.0',
          next: '15.3.4',
          'next-themes': '^0.4.6',
          'tailwind-merge': '3.3.0',
        });

        expect(expected.devDependencies).toMatchObject({
          '@types/react': '19.1.8',
          '@types/react-dom': '19.1.6',
        });
      });

      it('should include all critical dependencies for demo setup', () => {
        const expected = generateExpectedDependencies();

        // Verify React ecosystem
        expect(expected.dependencies.react).toBeDefined();
        expect(expected.dependencies['react-dom']).toBeDefined();
        expect(expected.devDependencies['@types/react']).toBeDefined();
        expect(expected.devDependencies['@types/react-dom']).toBeDefined();

        // Verify Next.js and theming
        expect(expected.dependencies.next).toBeDefined();
        expect(expected.dependencies['next-themes']).toBeDefined();

        // Verify styling dependencies
        expect(expected.dependencies['tailwind-merge']).toBeDefined();
        expect(expected.dependencies['framer-motion']).toBeDefined();
      });
    });

    describe('generateMinimalDependencies', () => {
      it('should return minimal set for install script', () => {
        const minimal = generateMinimalDependencies();

        expect(minimal.dependencies).toMatchObject({
          '@headlessui/react': '^2.0.0',
          'framer-motion': '^12.0.0',
          clsx: '^2.0.0',
          culori: '^4.0.0',
          'next-themes': '^0.4.0',
          'tailwind-merge': '^3.0.0',
        });

        expect(minimal.devDependencies).toEqual({});
      });

      it('should use range versions for install compatibility', () => {
        const minimal = generateMinimalDependencies();

        // All versions should use range specifiers for flexibility
        Object.values(minimal.dependencies).forEach(version => {
          expect(version.startsWith('^')).toBe(true);
        });
      });
    });
  });

  describe('Dependency Analysis (Business Logic)', () => {
    const samplePackageJson: PackageJson = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {
        react: '19.1.0',
        'react-dom': '18.0.0', // Outdated
        'next-themes': '^0.4.6',
        // Missing: framer-motion, next, tailwind-merge
      },
      devDependencies: {
        '@types/react': '19.1.8',
        // Missing: @types/react-dom
      },
    };

    describe('needsDependencyUpdate', () => {
      it('should detect when updates are needed', () => {
        const needsUpdate = needsDependencyUpdate(samplePackageJson);
        expect(needsUpdate).toBe(true);
      });

      it('should return false when all dependencies match', () => {
        const expected = generateExpectedDependencies();
        const upToDatePackage: PackageJson = {
          name: 'test',
          dependencies: expected.dependencies,
          devDependencies: expected.devDependencies,
        };

        const needsUpdate = needsDependencyUpdate(upToDatePackage, expected);
        expect(needsUpdate).toBe(false);
      });

      it('should handle missing dependencies sections', () => {
        const packageWithoutDeps: PackageJson = { name: 'test' };
        const needsUpdate = needsDependencyUpdate(packageWithoutDeps);
        expect(needsUpdate).toBe(true);
      });

      it('should work with custom expected dependencies', () => {
        const customExpected: ExpectedDependencies = {
          dependencies: { react: '18.0.0' },
          devDependencies: {},
        };

        const customPackage: PackageJson = {
          dependencies: { react: '18.0.0' },
        };

        const needsUpdate = needsDependencyUpdate(customPackage, customExpected);
        expect(needsUpdate).toBe(false);
      });
    });

    describe('analyzeDependencies', () => {
      it('should identify missing dependencies', () => {
        const analysis = analyzeDependencies(samplePackageJson);

        expect(analysis.missingDependencies).toContain('framer-motion');
        expect(analysis.missingDependencies).toContain('next');
        expect(analysis.missingDependencies).toContain('tailwind-merge');
        expect(analysis.missingDevDependencies).toContain('@types/react-dom');
      });

      it('should identify outdated dependencies', () => {
        const analysis = analyzeDependencies(samplePackageJson);

        expect(analysis.outdatedDependencies['react-dom']).toEqual({
          current: '18.0.0',
          expected: '19.1.0',
        });
      });

      it('should correctly report when updates are needed', () => {
        const analysis = analyzeDependencies(samplePackageJson);
        expect(analysis.hasUpdates).toBe(true);
      });

      it('should handle up-to-date package correctly', () => {
        const expected = generateExpectedDependencies();
        const upToDatePackage: PackageJson = {
          dependencies: expected.dependencies,
          devDependencies: expected.devDependencies,
        };

        const analysis = analyzeDependencies(upToDatePackage, expected);

        expect(analysis.hasUpdates).toBe(false);
        expect(analysis.missingDependencies).toHaveLength(0);
        expect(analysis.missingDevDependencies).toHaveLength(0);
        expect(Object.keys(analysis.outdatedDependencies)).toHaveLength(0);
        expect(Object.keys(analysis.outdatedDevDependencies)).toHaveLength(0);
      });
    });

    describe('updatePackageJsonDependencies', () => {
      it('should merge expected dependencies correctly', () => {
        const updated = updatePackageJsonDependencies(samplePackageJson);
        const expected = generateExpectedDependencies();

        // Should preserve existing structure
        expect(updated.name).toBe('test-project');
        expect(updated.version).toBe('1.0.0');

        // Should merge all expected dependencies
        expect(updated.dependencies).toMatchObject(expected.dependencies);
        expect(updated.devDependencies).toMatchObject(expected.devDependencies);
      });

      it('should preserve existing dependencies not in expected', () => {
        const packageWithExtra: PackageJson = {
          dependencies: {
            react: '18.0.0',
            'custom-lib': '1.0.0', // Should be preserved
          },
          devDependencies: {
            'custom-dev-tool': '2.0.0', // Should be preserved
          },
        };

        const updated = updatePackageJsonDependencies(packageWithExtra);

        expect(updated.dependencies!['custom-lib']).toBe('1.0.0');
        expect(updated.devDependencies!['custom-dev-tool']).toBe('2.0.0');
        expect(updated.dependencies!.react).toBe('19.1.0'); // Updated
      });

      it('should handle package without dependency sections', () => {
        const minimal: PackageJson = { name: 'minimal' };
        const updated = updatePackageJsonDependencies(minimal);
        const expected = generateExpectedDependencies();

        expect(updated.dependencies).toEqual(expected.dependencies);
        expect(updated.devDependencies).toEqual(expected.devDependencies);
      });
    });
  });

  describe('Version Synchronization (Reliability)', () => {
    describe('checkVersionSync', () => {
      it('should detect React types version mismatches', () => {
        const mainPackage: PackageJson = {
          devDependencies: { '@types/react': '18.0.0' }, // Outdated
        };

        const demoPackage: PackageJson = {
          devDependencies: { '@types/react': '19.1.8' }, // Correct
        };

        const syncCheck = checkVersionSync(mainPackage, demoPackage);

        expect(syncCheck.hasIssues).toBe(true);
        expect(syncCheck.warnings).toContainEqual(
          expect.stringContaining('Main project @types/react (18.0.0)')
        );
      });

      it('should check critical dependency versions', () => {
        const mainPackage: PackageJson = {
          dependencies: {
            react: '18.0.0', // Outdated
            'react-dom': '19.1.0', // Correct
          },
          devDependencies: {
            '@types/react-dom': '18.0.0', // Outdated
          },
        };

        const demoPackage: PackageJson = {};

        const syncCheck = checkVersionSync(mainPackage, demoPackage);

        expect(syncCheck.hasIssues).toBe(true);
        expect(syncCheck.warnings.some(w => w.includes('react (18.0.0)'))).toBe(true);
        expect(syncCheck.warnings.some(w => w.includes('@types/react-dom (18.0.0)'))).toBe(true);
      });

      it('should pass when versions are synchronized', () => {
        const expected = generateExpectedDependencies();

        const mainPackage: PackageJson = {
          dependencies: expected.dependencies,
          devDependencies: expected.devDependencies,
        };

        const demoPackage: PackageJson = {
          devDependencies: { '@types/react': expected.devDependencies['@types/react'] },
        };

        const syncCheck = checkVersionSync(mainPackage, demoPackage, expected);

        expect(syncCheck.hasIssues).toBe(false);
        expect(syncCheck.warnings).toHaveLength(0);
      });
    });
  });

  describe('Installation Detection (Performance)', () => {
    describe('isInstallationNeeded', () => {
      it('should require installation when node_modules missing', () => {
        const needed = isInstallationNeeded(
          false, // node_modules missing
          true,
          new Date(),
          new Date(),
          true
        );

        expect(needed).toBe(true);
      });

      it('should require installation when lockfile missing', () => {
        const needed = isInstallationNeeded(
          true,
          false, // lockfile missing
          new Date(),
          new Date(),
          true
        );

        expect(needed).toBe(true);
      });

      it('should require installation when key dependencies missing', () => {
        const needed = isInstallationNeeded(
          true,
          true,
          new Date(),
          new Date(),
          false // key dependencies missing
        );

        expect(needed).toBe(true);
      });

      it('should require installation when package.json is newer than lockfile', () => {
        const packageJsonTime = new Date('2024-01-02');
        const lockfileTime = new Date('2024-01-01');

        const needed = isInstallationNeeded(true, true, packageJsonTime, lockfileTime, true);

        expect(needed).toBe(true);
      });

      it('should not require installation when everything is up to date', () => {
        const packageJsonTime = new Date('2024-01-01');
        const lockfileTime = new Date('2024-01-02');

        const needed = isInstallationNeeded(true, true, packageJsonTime, lockfileTime, true);

        expect(needed).toBe(false);
      });

      it('should require installation when lockfile time is null', () => {
        const needed = isInstallationNeeded(
          true,
          true,
          new Date(),
          null, // null lockfile time
          true
        );

        expect(needed).toBe(true);
      });
    });

    describe('checkKeyDependencies', () => {
      let mockFs: FileSystem;

      beforeEach(() => {
        mockFs = {
          exists: vi.fn(),
          readdir: vi.fn(),
          readFile: vi.fn(),
          writeFile: vi.fn(),
          readJson: vi.fn(),
          writeJson: vi.fn(),
          copy: vi.fn(),
          ensureDir: vi.fn(),
          stat: vi.fn(),
          move: vi.fn(),
          remove: vi.fn(),
        };
      });

      it('should return true when all dependencies exist', async () => {
        vi.mocked(mockFs.exists).mockResolvedValue({ success: true, value: true });

        const result = await checkKeyDependencies(mockFs, '/project', ['react', 'next']);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toBe(true);
        }

        expect(mockFs.exists).toHaveBeenCalledWith('/project/node_modules/react');
        expect(mockFs.exists).toHaveBeenCalledWith('/project/node_modules/next');
      });

      it('should return false when any dependency is missing', async () => {
        vi.mocked(mockFs.exists)
          .mockResolvedValueOnce({ success: true, value: true }) // react exists
          .mockResolvedValueOnce({ success: true, value: false }); // next missing

        const result = await checkKeyDependencies(mockFs, '/project', ['react', 'next']);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toBe(false);
        }
      });

      it('should handle filesystem errors gracefully', async () => {
        const fsError: FileSystemError = {
          type: 'FileSystemError',
          message: 'Permission denied',
          path: '/project/node_modules/react',
        };
        vi.mocked(mockFs.exists).mockResolvedValue({ success: false, error: fsError });

        const result = await checkKeyDependencies(mockFs, '/project', ['react']);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toContain('Failed to check dependency: react');
        }
      });
    });
  });

  describe('Package Manager Utilities', () => {
    describe('generateInstallCommand', () => {
      it('should prefer pnpm when available', () => {
        const command = generateInstallCommand(true, true);
        expect(command).toBe('pnpm install');
      });

      it('should use yarn when pnpm not available', () => {
        const command = generateInstallCommand(true, false);
        expect(command).toBe('yarn install');
      });

      it('should fallback to npm', () => {
        const command = generateInstallCommand(false, false);
        expect(command).toBe('npm install');
      });
    });

    describe('getLockfileName', () => {
      it('should return correct lockfile names', () => {
        expect(getLockfileName(false, true)).toBe('pnpm-lock.yaml');
        expect(getLockfileName(true, false)).toBe('yarn.lock');
        expect(getLockfileName(false, false)).toBe('package-lock.json');
      });
    });
  });

  describe('High-Level Workflow Functions', () => {
    describe('analyzeAndUpdateDependencies', () => {
      let mockFs: FileSystem;

      beforeEach(() => {
        mockFs = {
          exists: vi.fn(),
          readdir: vi.fn(),
          readFile: vi.fn(),
          writeFile: vi.fn(),
          readJson: vi.fn(),
          writeJson: vi.fn(),
          copy: vi.fn(),
          ensureDir: vi.fn(),
          stat: vi.fn(),
          move: vi.fn(),
          remove: vi.fn(),
        };
      });

      it('should analyze and update outdated package.json', async () => {
        const outdatedPackage: PackageJson = {
          dependencies: { react: '18.0.0' },
          devDependencies: {},
        };

        vi.mocked(mockFs.readJson).mockResolvedValue({
          success: true,
          value: outdatedPackage,
        });

        vi.mocked(mockFs.writeJson).mockResolvedValue({
          success: true,
          value: undefined,
        });

        const result = await analyzeAndUpdateDependencies(mockFs, '/project');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.updated).toBe(true);
          expect(result.value.analysis.hasUpdates).toBe(true);
          expect(result.value.packageJson.dependencies!.react).toBe('19.1.0');
        }

        expect(mockFs.writeJson).toHaveBeenCalledWith(
          '/project/package.json',
          expect.objectContaining({
            dependencies: expect.objectContaining({ react: '19.1.0' }),
          }),
          { spaces: 2 }
        );
      });

      it('should skip update when package.json is current', async () => {
        const expected = generateExpectedDependencies();
        const currentPackage: PackageJson = {
          dependencies: expected.dependencies,
          devDependencies: expected.devDependencies,
        };

        vi.mocked(mockFs.readJson).mockResolvedValue({
          success: true,
          value: currentPackage,
        });

        const result = await analyzeAndUpdateDependencies(mockFs, '/project');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.updated).toBe(false);
          expect(result.value.analysis.hasUpdates).toBe(false);
        }

        expect(mockFs.writeJson).not.toHaveBeenCalled();
      });

      it('should handle read errors gracefully', async () => {
        const readError: FileSystemError = {
          type: 'FileSystemError',
          message: 'File not found',
          path: '/project/package.json',
        };
        vi.mocked(mockFs.readJson).mockResolvedValue({
          success: false,
          error: readError,
        });

        const result = await analyzeAndUpdateDependencies(mockFs, '/project');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe('Failed to read package.json');
          expect(result.error.cause).toBe(readError);
        }
      });

      it('should handle write errors gracefully', async () => {
        const outdatedPackage: PackageJson = {
          dependencies: { react: '18.0.0' },
        };

        vi.mocked(mockFs.readJson).mockResolvedValue({
          success: true,
          value: outdatedPackage,
        });

        const writeError: FileSystemError = {
          type: 'FileSystemError',
          message: 'Permission denied',
          path: '/project/package.json',
        };
        vi.mocked(mockFs.writeJson).mockResolvedValue({
          success: false,
          error: writeError,
        });

        const result = await analyzeAndUpdateDependencies(mockFs, '/project');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe('Failed to write updated package.json');
          expect(result.error.cause).toBe(writeError);
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should create dependency errors correctly', () => {
      const error = DependencyErr('Test error', new Error('cause'));

      expect(error.type).toBe('DependencyError');
      expect(error.message).toBe('Test error');
      expect(error.cause).toBeInstanceOf(Error);
    });

    it('should create result types correctly', () => {
      const okResult = Ok('success');
      expect(okResult.success).toBe(true);
      if (okResult.success) {
        expect(okResult.value).toBe('success');
      }

      const errResult = Err(DependencyErr('error'));
      expect(errResult.success).toBe(false);
      if (!errResult.success) {
        expect(errResult.error.type).toBe('DependencyError');
      }
    });

    it('should handle malformed package.json structures', () => {
      const malformedPackage: PackageJson = {
        dependencies: 'invalid', // Should be object
      } as any;

      // Should not crash, treat as empty dependencies
      const analysis = analyzeDependencies(malformedPackage);
      expect(analysis.hasUpdates).toBe(true);
      expect(analysis.missingDependencies.length).toBeGreaterThan(0);
    });

    it('should handle empty dependency objects', () => {
      const emptyPackage: PackageJson = {
        dependencies: {},
        devDependencies: {},
      };

      const analysis = analyzeDependencies(emptyPackage);
      expect(analysis.hasUpdates).toBe(true);
      expect(analysis.missingDependencies.length).toBeGreaterThan(0);
    });
  });

  describe('Real-World Integration Scenarios', () => {
    it('should handle typical React 19 migration scenario', () => {
      const react18Package: PackageJson = {
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'next-themes': '^0.2.1',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
        },
      };

      const analysis = analyzeDependencies(react18Package);

      expect(analysis.hasUpdates).toBe(true);
      expect(analysis.outdatedDependencies.react).toBeDefined();
      expect(analysis.outdatedDependencies['react-dom']).toBeDefined();
      expect(analysis.outdatedDevDependencies['@types/react']).toBeDefined();
      expect(analysis.outdatedDevDependencies['@types/react-dom']).toBeDefined();

      const updated = updatePackageJsonDependencies(react18Package);
      expect(updated.dependencies!.react).toBe('19.1.0');
      expect(updated.dependencies!['react-dom']).toBe('19.1.0');
    });

    it('should handle Next.js 15 upgrade scenario', () => {
      const next14Package: PackageJson = {
        dependencies: {
          next: '14.2.0',
          react: '19.1.0',
          'react-dom': '19.1.0',
        },
      };

      const analysis = analyzeDependencies(next14Package);
      expect(analysis.outdatedDependencies.next).toEqual({
        current: '14.2.0',
        expected: '15.3.4',
      });

      const updated = updatePackageJsonDependencies(next14Package);
      expect(updated.dependencies!.next).toBe('15.3.4');
    });

    it('should handle partial migration states gracefully', () => {
      const partialPackage: PackageJson = {
        dependencies: {
          react: '19.1.0', // Already updated
          'react-dom': '18.0.0', // Still old
          'next-themes': '^0.4.6', // Correct
        },
      };

      const analysis = analyzeDependencies(partialPackage);

      expect(analysis.hasUpdates).toBe(true);
      expect(analysis.outdatedDependencies['react-dom']).toBeDefined();
      expect(analysis.outdatedDependencies.react).toBeUndefined(); // Already correct
      expect(analysis.missingDependencies).toContain('framer-motion');
      expect(analysis.missingDependencies).toContain('next');
    });
  });
});
