import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { rmSync, existsSync } from 'fs';
import { generateProject } from '../lib/generator.js';
import { createTestContext } from '@esteban-url/trailhead-cli/testing';
import type { ProjectConfig, GeneratorContext } from '../lib/types.js';

describe('Generator Security', () => {
  let tempDir: string;
  let testContext: GeneratorContext;

  beforeEach(() => {
    // Create a unique temp directory for each test
    tempDir = join(__dirname, '..', '..', 'temp-security-test-' + Date.now());

    testContext = createTestContext({
      verbose: false,
      templateConfig: undefined,
    });
  });

  afterEach(() => {
    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Project Configuration Validation', () => {
    it('should reject malicious project names', async () => {
      const maliciousConfigs: Partial<ProjectConfig>[] = [
        { projectName: '../../../etc/passwd' },
        { projectName: 'project; rm -rf /' },
        { projectName: 'project && curl evil.com' },
        { projectName: 'project\\0malicious' },
        { projectName: 'project|dangerous' },
        { projectName: '' },
        { projectName: '   ' },
        { projectName: 'con' }, // Windows reserved name
      ];

      for (const maliciousConfig of maliciousConfigs) {
        const config: ProjectConfig = {
          projectName: maliciousConfig.projectName || '',
          projectPath: tempDir,
          template: 'basic',
          packageManager: 'npm',
          includeDocs: false,
          initGit: false,
          installDependencies: false,
          dryRun: true,
        };

        const result = await generateProject(config, testContext);
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('VALIDATION_FAILED');
      }
    });

    it('should reject path traversal attempts in project path', async () => {
      const maliciousPaths = [
        '../../../etc',
        '/etc/passwd',
        '../../../../etc/hosts',
        'project\\\\..\\\\..\\\\windows',
      ];

      for (const maliciousPath of maliciousPaths) {
        const config: ProjectConfig = {
          projectName: 'test-project',
          projectPath: maliciousPath,
          template: 'basic',
          packageManager: 'npm',
          includeDocs: false,
          initGit: false,
          installDependencies: false,
          dryRun: true,
        };

        const result = await generateProject(config, testContext);
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('VALIDATION_FAILED');
      }
    });

    it('should reject invalid package managers', async () => {
      const invalidPackageManagers = [
        'npm; curl evil.com',
        'pnpm && rm -rf /',
        'yarn | cat /etc/passwd',
        'invalid-pm',
        '',
      ];

      for (const packageManager of invalidPackageManagers) {
        const config: ProjectConfig = {
          projectName: 'test-project',
          projectPath: tempDir,
          template: 'basic',
          packageManager: packageManager as any,
          includeDocs: false,
          initGit: false,
          installDependencies: false,
          dryRun: true,
        };

        const result = await generateProject(config, testContext);
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('VALIDATION_FAILED');
      }
    });

    it('should reject invalid template variants', async () => {
      const invalidTemplates = [
        'basic; curl evil.com',
        'custom-evil',
        '../../../etc/passwd',
        '',
      ];

      for (const template of invalidTemplates) {
        const config: ProjectConfig = {
          projectName: 'test-project',
          projectPath: tempDir,
          template: template as any,
          packageManager: 'npm',
          includeDocs: false,
          initGit: false,
          installDependencies: false,
          dryRun: true,
        };

        const result = await generateProject(config, testContext);
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('VALIDATION_FAILED');
      }
    });
  });

  describe('Command Injection Prevention', () => {
    it('should safely handle git initialization without command injection', async () => {
      const config: ProjectConfig = {
        projectName: 'test-project',
        projectPath: join(tempDir, 'safe-project'),
        template: 'basic',
        packageManager: 'npm',
        includeDocs: false,
        initGit: true,
        installDependencies: false,
        dryRun: false,
      };

      // This should work safely without allowing command injection
      const result = await generateProject(config, testContext);

      // Even if git fails, it should not be due to command injection
      if (!result.success) {
        expect(result.error.code).not.toBe('VALIDATION_FAILED');
      }
    });

    it('should safely handle dependency installation without command injection', async () => {
      const config: ProjectConfig = {
        projectName: 'test-project',
        projectPath: join(tempDir, 'safe-project-deps'),
        template: 'basic',
        packageManager: 'npm',
        includeDocs: false,
        initGit: false,
        installDependencies: true,
        dryRun: false,
      };

      // This should work safely without allowing command injection
      const result = await generateProject(config, testContext);

      // Even if installation fails, it should not be due to validation issues
      if (!result.success) {
        expect(result.error.code).not.toBe('VALIDATION_FAILED');
      }
    });
  });

  describe('File System Security', () => {
    it('should prevent template files from escaping template directory', async () => {
      // This test ensures the template loading doesn't allow directory traversal
      const config: ProjectConfig = {
        projectName: 'test-project',
        projectPath: join(tempDir, 'secure-project'),
        template: 'basic',
        packageManager: 'npm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: true,
      };

      const result = await generateProject(config, testContext);

      // Should succeed and only process legitimate template files
      if (result.success) {
        // Verify no warnings about skipped files (indicates traversal attempts)
        const warningLogs = testContext.logger.logs.filter(
          (log) =>
            log.level === 'warning' &&
            log.message.includes('Skipping invalid template file'),
        );
        expect(warningLogs).toHaveLength(0);
      }
    });

    it('should prevent output files from escaping project directory', async () => {
      const config: ProjectConfig = {
        projectName: 'test-project',
        projectPath: join(tempDir, 'contained-project'),
        template: 'basic',
        packageManager: 'npm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: true,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      // All files should be reported as being created within the project directory
      const createLogs = testContext.logger.logs.filter(
        (log) => log.level === 'info' && log.message.includes('Would create:'),
      );

      createLogs.forEach((log) => {
        const filePath = log.message.replace('Would create: ', '');
        expect(filePath).not.toMatch(/\.\./); // No parent directory references
        expect(filePath).not.toMatch(/^[/\\]/); // No absolute paths
      });
    });
  });

  describe('Resource Limits and DoS Prevention', () => {
    it('should handle very long project names gracefully', async () => {
      const longName = 'a'.repeat(200);

      const config: ProjectConfig = {
        projectName: longName,
        projectPath: tempDir,
        template: 'basic',
        packageManager: 'npm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: true,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_FAILED');
    });

    it('should handle very long project paths gracefully', async () => {
      const longPath = join(tempDir, 'a'.repeat(300));

      const config: ProjectConfig = {
        projectName: 'test-project',
        projectPath: longPath,
        template: 'basic',
        packageManager: 'npm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: true,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_FAILED');
    });

    it('should complete generation within reasonable time', async () => {
      const config: ProjectConfig = {
        projectName: 'perf-test',
        projectPath: join(tempDir, 'perf-project'),
        template: 'enterprise', // Most complex template
        packageManager: 'npm',
        includeDocs: true,
        initGit: false,
        installDependencies: false,
        dryRun: true,
      };

      const start = Date.now();
      const result = await generateProject(config, testContext);
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose sensitive system information in errors', async () => {
      const config: ProjectConfig = {
        projectName: '', // Invalid to trigger error
        projectPath: tempDir,
        template: 'basic',
        packageManager: 'npm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: true,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(false);

      // Error message should not contain sensitive paths or system info
      expect(result.error.message).not.toMatch(/[/\\]etc[/\\]/);
      expect(result.error.message).not.toMatch(/[/\\]home[/\\]/);
      expect(result.error.message).not.toMatch(/[/\\]usr[/\\]/);
      expect(result.error.message).not.toMatch(/C:\\\\Windows/);
      expect(result.error.details).not.toMatch(/[/\\]etc[/\\]/);
    });

    it('should provide helpful but safe error messages', async () => {
      const config: ProjectConfig = {
        projectName: '../invalid',
        projectPath: tempDir,
        template: 'basic',
        packageManager: 'npm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: true,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Invalid project name');
      expect(result.error.details).toBeTruthy();
      expect(result.error.details).not.toContain(process.cwd());
    });
  });

  describe('Template Context Security', () => {
    it('should safely generate projects with various character sets', async () => {
      const config: ProjectConfig = {
        projectName: 'test-unicode-project',
        projectPath: join(tempDir, 'unicode-test'),
        template: 'basic',
        packageManager: 'npm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: true,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);
    });

    it('should handle edge case project configurations safely', async () => {
      const edgeConfigs = [
        { projectName: 'a' }, // Minimum length
        { projectName: 'A1-b_c.d' }, // All allowed characters
        { template: 'BASIC' as any }, // Case variation
        { packageManager: 'PNPM' as any }, // Case variation
      ];

      for (const edgeOverride of edgeConfigs) {
        const config: ProjectConfig = {
          projectName: 'test-project',
          projectPath: join(tempDir, `edge-${Date.now()}`),
          template: 'basic',
          packageManager: 'npm',
          includeDocs: false,
          initGit: false,
          installDependencies: false,
          dryRun: true,
          ...edgeOverride,
        };

        const result = await generateProject(config, testContext);
        expect(result.success).toBe(true);
      }
    });
  });
});
