import { describe, it, expect } from 'vitest';
import {
  validateModernProjectConfig,
  validateConfigFile,
  validatePresetConfig,
  createConfigFile,
  mergePresetWithConfig,
  // modernProjectConfigSchema,
  // configFileSchema,
  // presetConfigSchema,
} from '../lib/config-schema.js';
import type { ModernProjectConfig } from '../lib/interactive-prompts.js';

describe('Configuration Schema Validation', () => {
  const validConfig: ModernProjectConfig = {
    projectName: 'test-cli',
    projectPath: '/path/to/test-cli',
    description: 'A test CLI application',
    template: 'basic',
    projectType: 'standalone-cli',
    packageManager: 'pnpm',
    author: {
      name: 'Test Author',
      email: 'test@example.com',
    },
    license: 'MIT',
    features: {
      core: true,
      testing: true,
      docs: false,
    },
    nodeVersion: '18',
    typescript: true,
    ide: 'vscode',
    includeDocs: false,
    initGit: true,
    installDependencies: true,
    dryRun: false,
    force: false,
    verbose: false,
  };

  describe('modernProjectConfigSchema', () => {
    it('should validate valid configuration', () => {
      const result = validateModernProjectConfig(validConfig);
      expect(result.isOk()).toBe(true);
    });

    it('should reject invalid project name', () => {
      const invalidConfig = { ...validConfig, projectName: 'Invalid Name!' };
      const result = validateModernProjectConfig(invalidConfig);
      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Project name must be lowercase alphanumeric');
    });

    it('should reject invalid email', () => {
      const invalidConfig = {
        ...validConfig,
        author: { ...validConfig.author, email: 'invalid-email' },
      };
      const result = validateModernProjectConfig(invalidConfig);
      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Invalid email format');
    });

    it('should reject invalid template', () => {
      const invalidConfig = { ...validConfig, template: 'invalid' as any };
      const result = validateModernProjectConfig(invalidConfig);
      expect(result.isErr()).toBe(true);
    });

    it('should reject invalid package manager', () => {
      const invalidConfig = { ...validConfig, packageManager: 'yarn' as any };
      const result = validateModernProjectConfig(invalidConfig);
      expect(result.isErr()).toBe(true);
    });

    it('should reject invalid node version', () => {
      const invalidConfig = { ...validConfig, nodeVersion: '12' };
      const result = validateModernProjectConfig(invalidConfig);
      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Node version must be 14 or higher');
    });

    it('should require core feature to be true', () => {
      const invalidConfig = {
        ...validConfig,
        features: { ...validConfig.features, core: false as any },
      };
      const result = validateModernProjectConfig(invalidConfig);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('configFileSchema', () => {
    it('should validate valid config file', () => {
      const configFile = createConfigFile(validConfig);
      const result = validateConfigFile(configFile);
      expect(result.isOk()).toBe(true);
    });

    it('should create valid config file from project config', () => {
      const configFile = createConfigFile(validConfig);

      expect(configFile.projectName).toBe(validConfig.projectName);
      expect(configFile.author).toEqual(validConfig.author);
      expect(configFile.features).toEqual(validConfig.features);

      // Should not include runtime-only properties
      expect('dryRun' in configFile).toBe(false);
      expect('force' in configFile).toBe(false);
      expect('verbose' in configFile).toBe(false);
    });
  });

  describe('presetConfigSchema', () => {
    const validPreset = {
      name: 'test-preset',
      description: 'A test preset',
      template: 'advanced' as const,
      projectType: 'library' as const,
      features: {
        testing: true,
        docs: true,
      },
      packageManager: 'pnpm' as const,
      nodeVersion: '18',
    };

    it('should validate valid preset', () => {
      const result = validatePresetConfig(validPreset);
      expect(result.isOk()).toBe(true);
    });

    it('should reject invalid preset name', () => {
      const invalidPreset = { ...validPreset, name: 'Invalid Name!' };
      const result = validatePresetConfig(invalidPreset);
      expect(result.isErr()).toBe(true);
    });

    it('should allow partial features in preset', () => {
      const partialPreset = {
        ...validPreset,
        features: { testing: true }, // Only some features
      };
      const result = validatePresetConfig(partialPreset);
      expect(result.isOk()).toBe(true);
    });
  });

  describe('mergePresetWithConfig', () => {
    const preset = {
      name: 'test-preset',
      description: 'A test preset',
      template: 'advanced' as const,
      projectType: 'library' as const,
      features: {
        testing: true,
        docs: true,
      },
      packageManager: 'pnpm' as const,
    };

    it('should merge preset with user config', () => {
      const userConfig = {
        projectName: 'my-project',
        template: 'basic' as const, // Should be overridden by preset
        features: {
          core: true as const,
          validation: true, // Should be merged with preset features
        },
      };

      const merged = mergePresetWithConfig(preset, userConfig);

      expect(merged.projectName).toBe('my-project'); // User value
      expect(merged.template).toBe('advanced'); // Preset value (user override)
      expect(merged.projectType).toBe('library'); // Preset value
      expect(merged.packageManager).toBe('pnpm'); // Preset value
      expect(merged.features).toEqual({
        core: true,
        testing: true, // From preset
        docs: true, // From preset
        validation: true, // From user
      });
    });

    it('should prioritize user config over preset', () => {
      const userConfig = {
        packageManager: 'npm' as const, // Override preset
        features: {
          core: true as const,
          testing: false, // Override preset
        },
      };

      const merged = mergePresetWithConfig(preset, userConfig);

      expect(merged.packageManager).toBe('npm'); // User override
      expect(merged.features?.testing).toBe(false); // User override
      expect(merged.features?.docs).toBe(true); // Still from preset
    });
  });

  describe('Schema edge cases', () => {
    it('should handle empty description', () => {
      const config = { ...validConfig, description: '' };
      const result = validateModernProjectConfig(config);
      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Description is required');
    });

    it('should handle very long project name', () => {
      const config = { ...validConfig, projectName: 'a'.repeat(215) };
      const result = validateModernProjectConfig(config);
      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Project name must be less than 214 characters');
    });

    it('should handle very long description', () => {
      const config = { ...validConfig, description: 'a'.repeat(501) };
      const result = validateModernProjectConfig(config);
      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Description too long');
    });

    it('should handle empty author name', () => {
      const config = {
        ...validConfig,
        author: { ...validConfig.author, name: '' },
      };
      const result = validateModernProjectConfig(config);
      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Author name is required');
    });

    it('should handle invalid node version format', () => {
      const config = { ...validConfig, nodeVersion: 'v18' };
      const result = validateModernProjectConfig(config);
      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Node version must be a number');
    });
  });
});
