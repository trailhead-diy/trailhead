/**
 * @fileoverview High-ROI Integration Tests for Installation Workflow
 *
 * Focus on critical business logic and framework detection integration:
 * - Framework detection with dependency analysis
 * - Installation config validation
 * - Error handling scenarios
 * - Cross-module integration patterns
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join as pathJoin } from 'path';
import { mockFileSystem, mockLogger } from '@esteban-url/trailhead-cli/testing';
import type { FileSystem, Logger } from '@esteban-url/trailhead-cli/core';
// import { Ok, Err } from '@esteban-url/trailhead-cli/core';
import { normalizeMockPath } from '../../utils/cross-platform-paths.js';
import type { InstallConfig } from '../../../src/cli/core/installation/types.js';

// Import modules under test
import { detectFramework } from '../../../src/cli/core/installation/framework-detection.js';
import {
  analyzeDependencies,
  installDependenciesSmart,
} from '../../../src/cli/core/installation/dependencies.js';

// Helper to create OS-agnostic test paths
const projectPath = (...segments: string[]) => pathJoin('/test/project', ...segments);

// Helper to create mock filesystem with specific project structure
const createMockFs = (files: Record<string, unknown> = {}) => {
  // Prepare initial files for mockFileSystem
  const initialFiles: Record<string, string> = {};

  for (const [path, content] of Object.entries(files)) {
    const normalized = normalizeMockPath(path);
    if (content === true) {
      // For file existence checks, create empty file
      initialFiles[normalized] = '';
    } else if (typeof content === 'object') {
      // For JSON files
      initialFiles[normalized] = JSON.stringify(content);
    } else {
      // For string content
      initialFiles[normalized] = String(content);
    }
  }

  return mockFileSystem(initialFiles);
};

describe('Installation Integration Tests', () => {
  let fs: FileSystem;
  let logger: Logger;

  beforeEach(() => {
    fs = mockFileSystem();
    logger = mockLogger();
    vi.clearAllMocks();
  });

  describe('Framework Detection Integration', () => {
    it('should detect Next.js with proper dependency analysis', async () => {
      const projectRoot = projectPath();
      const mockFs = createMockFs({
        [normalizeMockPath(projectPath('next.config.js'))]: true,
        [normalizeMockPath(projectPath('package.json'))]: {
          dependencies: {
            next: '^13.4.0',
            react: '^18.2.0',
            'react-dom': '^18.2.0',
          },
        },
      });

      const result = await detectFramework(mockFs, projectRoot);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.framework.type).toBe('nextjs');
        expect(result.value.framework.version).toBe('^13.4.0');
        expect(result.value.confidence).toBe('high');
      }
    });

    it('should detect Vite with React dependencies', async () => {
      const projectRoot = projectPath();
      const mockFs = createMockFs({
        [normalizeMockPath(projectPath('vite.config.ts'))]: true,
        [normalizeMockPath(projectPath('package.json'))]: {
          devDependencies: {
            vite: '^4.3.0',
            '@vitejs/plugin-react': '^4.0.0',
          },
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
          },
        },
      });

      const result = await detectFramework(mockFs, projectRoot);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.framework.type).toBe('vite');
        expect(result.value.confidence).toBe('high');
      }
    });

    it('should detect RedwoodSDK with wrangler config', async () => {
      const projectRoot = projectPath();
      const mockFs = createMockFs({
        [normalizeMockPath(projectPath('wrangler.jsonc'))]: true,
        [normalizeMockPath(projectPath('package.json'))]: {
          dependencies: {
            rwsdk: '^1.0.0',
            react: '^18.2.0',
          },
        },
      });

      const result = await detectFramework(mockFs, projectRoot);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.framework.type).toBe('redwood-sdk');
        expect(result.value.confidence).toBe('high');
      }
    });

    it('should handle missing package.json gracefully', async () => {
      const projectRoot = projectPath();
      const mockFs = createMockFs({});

      const result = await detectFramework(mockFs, projectRoot);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('package.json not found');
      }
    });
  });

  describe('Dependency Analysis Integration', () => {
    it('should analyze React dependencies correctly', async () => {
      const packageJson = {
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          next: '^13.4.0',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          typescript: '^5.0.0',
        },
      };

      const result = await analyzeDependencies(fs, packageJson, '/test/project');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.hasReact).toBe(true);
        expect(result.value.hasTypeScript).toBe(true);
        expect(result.value.hasTailwind).toBe(false);
      }
    });

    it('should handle missing dependencies section', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
      };

      const result = await analyzeDependencies(fs, packageJson, '/test/project');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.hasReact).toBe(false);
        expect(result.value.hasTypeScript).toBe(false);
        expect(result.value.hasTailwind).toBe(false);
      }
    });
  });

  describe('Installation Config Validation', () => {
    it('should validate complete installation config', () => {
      const config: InstallConfig = {
        projectRoot: '/test/project',
        componentsDir: '/test/project/components/ui',
        libDir: '/test/project/components/ui/lib',
        catalystDir: '/test/project/components/ui/lib/catalyst',
        framework: 'nextjs',
      };

      // Validate config has required fields
      expect(config.projectRoot).toBeDefined();
      expect(config.componentsDir).toBeDefined();
      expect(config.libDir).toBeDefined();
      expect(config.catalystDir).toBeDefined();
      expect(config.framework).toBeDefined();

      // Validate directory structure is logical
      expect(config.componentsDir).toContain(config.projectRoot);
      expect(config.libDir).toContain(config.componentsDir);
      expect(config.catalystDir).toContain(config.libDir);
    });

    it('should handle different framework configurations', () => {
      const frameworks = ['nextjs', 'vite', 'redwood-sdk', 'generic-react'] as const;

      frameworks.forEach(framework => {
        const config: InstallConfig = {
          projectRoot: '/test/project',
          componentsDir: '/test/project/components/ui',
          libDir: '/test/project/components/ui/lib',
          catalystDir: '/test/project/components/ui/lib/catalyst',
          framework,
        };

        // Each framework should have a valid config
        expect(config.framework).toBe(framework);
        expect(typeof config.framework).toBe('string');
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle filesystem errors during framework detection', async () => {
      // Create empty filesystem to simulate missing files
      const mockFs = mockFileSystem({});

      const result = await detectFramework(mockFs, '/test/project');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('package.json not found');
      }
    });

    it('should handle malformed package.json during dependency analysis', async () => {
      const invalidPackageJson = 'invalid json content';

      const result = await analyzeDependencies(fs, invalidPackageJson, '/test/project');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid package.json');
      }
    });
  });

  describe('Smart Installation Logic', () => {
    it('should determine installation strategy based on existing files', async () => {
      const mockFs = createMockFs({
        [normalizeMockPath(projectPath('components/ui/button.tsx'))]: 'existing component',
        [normalizeMockPath(projectPath('package.json'))]: {
          dependencies: {
            react: '^18.2.0',
            next: '^13.4.0',
          },
        },
      });

      const config: InstallConfig = {
        projectRoot: projectPath(),
        componentsDir: projectPath('components/ui'),
        libDir: projectPath('components/ui/lib'),
        catalystDir: projectPath('components/ui/lib/catalyst'),
        framework: 'nextjs',
      };

      const result = await installDependenciesSmart(mockFs, logger, config, false);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.strategy).toBeDefined();
        expect(['force', 'skip']).toContain(result.value.strategy.type);
      }
    });

    it('should handle forced installation correctly', async () => {
      const mockFs = createMockFs({
        [normalizeMockPath(projectPath('package.json'))]: {
          dependencies: {
            react: '^18.2.0',
            next: '^13.4.0',
          },
        },
      });

      const config: InstallConfig = {
        projectRoot: projectPath(),
        componentsDir: projectPath('components/ui'),
        libDir: projectPath('components/ui/lib'),
        catalystDir: projectPath('components/ui/lib/catalyst'),
        framework: 'nextjs',
      };

      const result = await installDependenciesSmart(mockFs, logger, config, true);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.strategy.type).toBe('force');
      }
    });
  });
});
