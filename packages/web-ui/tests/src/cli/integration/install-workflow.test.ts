/**
 * High-ROI integration tests for install workflow
 * Tests end-to-end installation scenarios and critical user paths
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mockFileSystem, mockLogger } from '@esteban-url/trailhead-cli/testing';
import type { FileSystem, Logger } from '@esteban-url/trailhead-cli/core';
import {
  createBaseSteps,
  createComponentSteps,
  createInstallationSteps,
} from '../../../../src/cli/core/installation/step-factory.js';
import type { InstallConfig, FrameworkType } from '../../../../src/cli/core/installation/types.js';

describe('Install Workflow Integration', () => {
  let fs: FileSystem;
  let logger: Logger;
  let config: InstallConfig;
  const trailheadRoot = '/trailhead';

  beforeEach(() => {
    fs = mockFileSystem();
    logger = mockLogger();
    config = {
      projectRoot: '/test/project',
      componentsDir: '/test/project/components/ui',
      libDir: '/test/project/components/ui/lib',
      catalystDir: '/test/project/components/ui/lib/catalyst',
      framework: 'nextjs' as FrameworkType,
    };
  });

  describe('Complete Installation Workflow', () => {
    it('should create complete installation plan for wrapper-based approach', () => {
      const useWrappers = true;
      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, false, useWrappers);

      // Should have comprehensive installation plan
      expect(steps.length).toBe(4);
      expect(steps.map(s => s.name)).toEqual([
        'theme system',
        'utility files',
        'Catalyst components',
        'component wrappers',
      ]);

      // All steps should be critical for installation success
      steps.forEach(step => {
        expect(step.critical).toBe(true);
        expect(typeof step.execute).toBe('function');
      });
    });

    it('should create complete installation plan for transform-based approach', () => {
      const useWrappers = false;
      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, false, useWrappers);

      // Should have streamlined installation plan
      expect(steps.length).toBe(3);
      expect(steps.map(s => s.name)).toEqual(['theme system', 'utility files', 'components']);

      // All steps should be critical for installation success
      steps.forEach(step => {
        expect(step.critical).toBe(true);
        expect(typeof step.execute).toBe('function');
      });
    });

    it('should maintain proper execution order across installation approaches', () => {
      const wrapperSteps = createInstallationSteps(fs, logger, trailheadRoot, config, false, true);
      const transformSteps = createInstallationSteps(
        fs,
        logger,
        trailheadRoot,
        config,
        false,
        false
      );

      // Both approaches should start with infrastructure
      expect(wrapperSteps[0].name).toBe('theme system');
      expect(wrapperSteps[1].name).toBe('utility files');
      expect(transformSteps[0].name).toBe('theme system');
      expect(transformSteps[1].name).toBe('utility files');

      // Components should come after infrastructure
      const wrapperComponentIndex = wrapperSteps.findIndex(s => s.name.includes('component'));
      const transformComponentIndex = transformSteps.findIndex(s => s.name.includes('component'));

      expect(wrapperComponentIndex).toBeGreaterThan(1);
      expect(transformComponentIndex).toBeGreaterThan(1);
    });
  });

  describe('Framework-Specific Installation Plans', () => {
    it('should create consistent plans across different frameworks', () => {
      const nextjsConfig = { ...config, framework: 'nextjs' as FrameworkType };
      const viteConfig = { ...config, framework: 'vite' as FrameworkType };
      const redwoodConfig = { ...config, framework: 'redwood-sdk' as FrameworkType };

      const nextjsSteps = createInstallationSteps(
        fs,
        logger,
        trailheadRoot,
        nextjsConfig,
        false,
        true
      );
      const viteSteps = createInstallationSteps(fs, logger, trailheadRoot, viteConfig, false, true);
      const redwoodSteps = createInstallationSteps(
        fs,
        logger,
        trailheadRoot,
        redwoodConfig,
        false,
        true
      );

      // All frameworks should have the same basic installation structure
      expect(nextjsSteps.length).toBe(viteSteps.length);
      expect(viteSteps.length).toBe(redwoodSteps.length);

      // Step names should be consistent across frameworks
      expect(nextjsSteps.map(s => s.name)).toEqual(viteSteps.map(s => s.name));
      expect(viteSteps.map(s => s.name)).toEqual(redwoodSteps.map(s => s.name));

      // All should include essential steps
      const essentialSteps = ['theme system', 'utility files'];
      [nextjsSteps, viteSteps, redwoodSteps].forEach(steps => {
        essentialSteps.forEach(stepName => {
          expect(steps.some(s => s.name === stepName)).toBe(true);
        });
      });
    });

    it('should handle force installation flag consistently', () => {
      const normalSteps = createInstallationSteps(fs, logger, trailheadRoot, config, false, true);
      const forceSteps = createInstallationSteps(fs, logger, trailheadRoot, config, true, true);

      // Force flag should not change the basic installation plan
      expect(normalSteps.length).toBe(forceSteps.length);
      expect(normalSteps.map(s => s.name)).toEqual(forceSteps.map(s => s.name));

      // All steps should remain critical regardless of force flag
      [...normalSteps, ...forceSteps].forEach(step => {
        expect(step.critical).toBe(true);
      });
    });
  });

  describe('Installation Step Validation', () => {
    it('should ensure all steps have required execution interface', () => {
      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, false, true);

      steps.forEach(step => {
        // Validate step interface
        expect(step.name).toBeDefined();
        expect(step.text).toBeDefined();
        expect(step.execute).toBeDefined();
        expect(step.critical).toBeDefined();

        // Validate types
        expect(typeof step.name).toBe('string');
        expect(typeof step.text).toBe('string');
        expect(typeof step.execute).toBe('function');
        expect(typeof step.critical).toBe('boolean');

        // Validate content quality
        expect(step.name.length).toBeGreaterThan(0);
        expect(step.text.length).toBeGreaterThan(0);
        expect(step.text).toMatch(/\.\.\./); // Should end with ellipsis for progress indication
      });
    });

    it('should create independent step execution contexts', () => {
      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, false, true);

      // Each step should have its own execution function
      const executeFunctions = steps.map(s => s.execute);
      const uniqueFunctions = new Set(executeFunctions);

      // All execute functions should be unique (no shared references)
      expect(uniqueFunctions.size).toBe(executeFunctions.length);
    });

    it('should handle different installation configuration variations', () => {
      const variations = [
        { framework: 'nextjs' as FrameworkType, useWrappers: true },
        { framework: 'nextjs' as FrameworkType, useWrappers: false },
        { framework: 'vite' as FrameworkType, useWrappers: true },
        { framework: 'vite' as FrameworkType, useWrappers: false },
        { framework: 'generic-react' as FrameworkType, useWrappers: true },
        { framework: 'redwood-sdk' as FrameworkType, useWrappers: false },
      ];

      variations.forEach(({ framework, useWrappers }) => {
        const testConfig = { ...config, framework };
        const steps = createInstallationSteps(
          fs,
          logger,
          trailheadRoot,
          testConfig,
          false,
          useWrappers
        );

        // Each variation should produce a valid installation plan
        expect(steps.length).toBeGreaterThan(0);
        expect(steps.length).toBeLessThan(10); // Reasonable upper bound

        // Should always include essential infrastructure
        expect(steps.some(s => s.name === 'theme system')).toBe(true);
        expect(steps.some(s => s.name === 'utility files')).toBe(true);
      });
    });
  });

  describe('Step Factory Business Logic', () => {
    it('should differentiate between base and component steps correctly', () => {
      const baseSteps = createBaseSteps(fs, logger, trailheadRoot, config, false);
      const componentSteps = createComponentSteps(fs, logger, trailheadRoot, config, false, true);
      const allSteps = createInstallationSteps(fs, logger, trailheadRoot, config, false, true);

      // Installation steps should be combination of base + component steps
      expect(allSteps.length).toBe(baseSteps.length + componentSteps.length);

      // Base steps should be infrastructure-focused
      const baseStepNames = baseSteps.map(s => s.name);
      expect(baseStepNames).toContain('theme system');
      expect(baseStepNames).toContain('utility files');

      // Component steps should be component-focused
      const componentStepNames = componentSteps.map(s => s.name);
      expect(componentStepNames.some(name => name.includes('component'))).toBe(true);
    });

    it('should handle edge cases in step creation', () => {
      // Test with minimal config
      const minimalConfig: InstallConfig = {
        projectRoot: '/',
        componentsDir: '/components',
        libDir: '/components/lib',
        catalystDir: '/components/lib/catalyst',
        framework: 'generic-react' as FrameworkType,
      };

      const steps = createInstallationSteps(fs, logger, trailheadRoot, minimalConfig, false, true);

      // Should handle minimal config gracefully
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.every(s => s.critical === true)).toBe(true);
    });
  });
});
