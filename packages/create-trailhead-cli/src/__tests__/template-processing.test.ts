import { describe, it, expect } from 'vitest';
import { getTemplateFiles } from '../lib/template-loader.js';
import type { TemplateVariant } from '../lib/types.js';

describe('Template Processing - Nested __tests__ Directories', () => {
  describe('Template File Discovery', () => {
    it('should discover all __tests__ directories in basic template', async () => {
      const files = await getTemplateFiles('basic');

      const testFiles = files.filter(
        (file) =>
          file.source.includes('__tests__') ||
          file.source.includes('test.ts.hbs'),
      );

      expect(testFiles.length).toBeGreaterThan(0);

      // Should find colocated command tests
      const commandTests = testFiles.filter((file) =>
        file.source.includes('commands/__tests__'),
      );
      expect(commandTests.length).toBe(2); // build.test.ts, dev.test.ts

      // Should find integration tests
      const integrationTests = testFiles.filter((file) =>
        file.source.includes('__tests__/integration'),
      );
      expect(integrationTests.length).toBe(1); // cli.test.ts
    });

    it('should discover all __tests__ directories in advanced template', async () => {
      const files = await getTemplateFiles('advanced');

      const testFiles = files.filter(
        (file) =>
          file.source.includes('__tests__') ||
          file.source.includes('test.ts.hbs'),
      );

      expect(testFiles.length).toBeGreaterThan(0);

      // Should find colocated command tests
      const commandTests = testFiles.filter((file) =>
        file.source.includes('commands/__tests__'),
      );
      expect(commandTests.length).toBe(3); // config.test.ts, init.test.ts, validate.test.ts

      // Should find integration tests
      const integrationTests = testFiles.filter((file) =>
        file.source.includes('__tests__/integration'),
      );
      expect(integrationTests.length).toBe(1); // cli.test.ts
    });

    it('should discover all __tests__ directories in enterprise template', async () => {
      const files = await getTemplateFiles('enterprise');

      const testFiles = files.filter(
        (file) =>
          file.source.includes('__tests__') ||
          file.source.includes('test.ts.hbs'),
      );

      expect(testFiles.length).toBeGreaterThan(0);

      // Should find colocated command tests
      const commandTests = testFiles.filter((file) =>
        file.source.includes('commands/__tests__'),
      );
      expect(commandTests.length).toBe(2); // monitor.test.ts, security.test.ts

      // Should find integration tests
      const integrationTests = testFiles.filter((file) =>
        file.source.includes('__tests__/integration'),
      );
      expect(integrationTests.length).toBe(1); // cli.test.ts
    });
  });

  describe('Template File Path Processing', () => {
    it('should correctly process nested __tests__ paths', async () => {
      const variants: TemplateVariant[] = ['basic', 'advanced', 'enterprise'];

      for (const variant of variants) {
        const files = await getTemplateFiles(variant);

        const testFiles = files.filter((file) =>
          file.source.includes('__tests__'),
        );

        testFiles.forEach((testFile) => {
          // Source should include template path prefix
          expect(testFile.source).toMatch(
            /^(basic|advanced|enterprise|shared)\//,
          );

          // Destination should remove .hbs extension
          expect(testFile.destination).not.toContain('.hbs');

          // Should preserve __tests__ directory structure
          if (testFile.source.includes('commands/__tests__')) {
            expect(testFile.destination).toContain('src/commands/__tests__');
          }

          if (testFile.source.includes('__tests__/integration')) {
            expect(testFile.destination).toContain('src/__tests__/integration');
          }

          // Should be marked as template
          if (testFile.source.endsWith('.hbs')) {
            expect(testFile.isTemplate).toBe(true);
          }
        });
      }
    });

    it('should handle command test file mappings correctly', async () => {
      const files = await getTemplateFiles('basic');

      // Find build command and its test
      const buildCommand = files.find((file) =>
        file.source.includes('basic/src/commands/build.ts.hbs'),
      );
      const buildTest = files.find((file) =>
        file.source.includes('basic/src/commands/__tests__/build.test.ts.hbs'),
      );

      expect(buildCommand).toBeDefined();
      expect(buildTest).toBeDefined();

      // Verify correct destination paths
      expect(buildCommand!.destination).toBe('src/commands/build.ts');
      expect(buildTest!.destination).toBe(
        'src/commands/__tests__/build.test.ts',
      );

      // Both should be templates
      expect(buildCommand!.isTemplate).toBe(true);
      expect(buildTest!.isTemplate).toBe(true);
    });

    it('should handle integration test file mappings correctly', async () => {
      const files = await getTemplateFiles('advanced');

      const integrationTest = files.find((file) =>
        file.source.includes(
          'advanced/src/__tests__/integration/cli.test.ts.hbs',
        ),
      );

      expect(integrationTest).toBeDefined();
      expect(integrationTest!.destination).toBe(
        'src/__tests__/integration/cli.test.ts',
      );
      expect(integrationTest!.isTemplate).toBe(true);
    });

    it('should not include any tests/ directory references', async () => {
      const variants: TemplateVariant[] = ['basic', 'advanced', 'enterprise'];

      for (const variant of variants) {
        const files = await getTemplateFiles(variant);

        // Should not have any files in tests/ directory
        const oldTestFiles = files.filter(
          (file) =>
            file.destination.startsWith('tests/') ||
            file.source.includes('/tests/'),
        );

        expect(oldTestFiles).toHaveLength(0);
      }
    });
  });

  describe('Template File Metadata', () => {
    it('should mark test files as templates', async () => {
      const files = await getTemplateFiles('basic');

      const testFiles = files.filter((file) =>
        file.source.includes('test.ts.hbs'),
      );

      testFiles.forEach((testFile) => {
        expect(testFile.isTemplate).toBe(true);
        expect(testFile.executable).toBe(false); // Test files should not be executable
      });
    });

    it('should handle shared template files correctly', async () => {
      const files = await getTemplateFiles('basic');

      const sharedFiles = files.filter((file) =>
        file.source.startsWith('shared/'),
      );

      expect(sharedFiles.length).toBeGreaterThan(0);

      // Check vitest config
      const vitestConfig = sharedFiles.find((file) =>
        file.source.includes('vitest.config.ts.hbs'),
      );

      expect(vitestConfig).toBeDefined();
      expect(vitestConfig!.destination).toBe('vitest.config.ts');
      expect(vitestConfig!.isTemplate).toBe(true);
    });

    it('should correctly identify executable files', async () => {
      const files = await getTemplateFiles('basic');

      const binFiles = files.filter((file) =>
        file.destination.startsWith('bin/'),
      );

      binFiles.forEach((binFile) => {
        expect(binFile.executable).toBe(true);
      });
    });
  });

  describe('Template Consistency', () => {
    it('should have consistent file naming patterns', async () => {
      const variants: TemplateVariant[] = ['basic', 'advanced', 'enterprise'];

      for (const variant of variants) {
        const files = await getTemplateFiles(variant);

        const testFiles = files.filter((file) =>
          file.source.includes('__tests__'),
        );

        testFiles.forEach((testFile) => {
          // All test files should end with .test.ts
          expect(testFile.destination).toMatch(/\.test\.ts$/);

          // Should not have .spec.ts files
          expect(testFile.destination).not.toMatch(/\.spec\.ts$/);
        });
      }
    });

    it('should have proper directory structure depth', async () => {
      const files = await getTemplateFiles('advanced');

      const commandTests = files.filter((file) =>
        file.destination.includes('src/commands/__tests__/'),
      );

      commandTests.forEach((testFile) => {
        // Should be exactly at src/commands/__tests__/filename.test.ts
        const parts = testFile.destination.split('/');
        expect(parts).toHaveLength(4); // ['src', 'commands', '__tests__', 'filename.test.ts']
        expect(parts[0]).toBe('src');
        expect(parts[1]).toBe('commands');
        expect(parts[2]).toBe('__tests__');
        expect(parts[3]).toMatch(/\.test\.ts$/);
      });

      const integrationTests = files.filter((file) =>
        file.destination.includes('src/__tests__/integration/'),
      );

      integrationTests.forEach((testFile) => {
        // Should be exactly at src/__tests__/integration/filename.test.ts
        const parts = testFile.destination.split('/');
        expect(parts).toHaveLength(4); // ['src', '__tests__', 'integration', 'filename.test.ts']
        expect(parts[0]).toBe('src');
        expect(parts[1]).toBe('__tests__');
        expect(parts[2]).toBe('integration');
        expect(parts[3]).toMatch(/\.test\.ts$/);
      });
    });

    it('should not have any orphaned test directories', async () => {
      const variants: TemplateVariant[] = ['basic', 'advanced', 'enterprise'];

      for (const variant of variants) {
        const files = await getTemplateFiles(variant);

        // Get all directories from file paths
        const directories = new Set<string>();
        files.forEach((file) => {
          const parts = file.destination.split('/');
          for (let i = 1; i < parts.length; i++) {
            directories.add(parts.slice(0, i).join('/'));
          }
        });

        // Should not have empty __tests__ directories
        const testDirs = Array.from(directories).filter((dir) =>
          dir.includes('__tests__'),
        );

        testDirs.forEach((testDir) => {
          const filesInDir = files.filter((file) =>
            file.destination.startsWith(testDir + '/'),
          );
          expect(filesInDir.length).toBeGreaterThan(0);
        });
      }
    });
  });
});
