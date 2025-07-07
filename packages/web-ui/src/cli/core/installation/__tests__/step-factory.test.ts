/**
 * High-ROI tests for installation step factory
 * Focus: Step creation logic, business rules, proper step ordering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { InstallConfig, FrameworkType } from '../types.js';
import { createBaseSteps, createComponentSteps, createInstallationSteps } from '../step-factory.js';
import { mockFileSystem, mockLogger } from '@esteban-url/trailhead-cli/testing';
import type { Logger } from '@esteban-url/trailhead-cli/core';

describe('step-factory - High-ROI Tests', () => {
  let config: InstallConfig;
  let fs: ReturnType<typeof mockFileSystem>;
  let logger: Logger;
  const trailheadRoot = '/trailhead';
  const force = false;

  beforeEach(() => {
    config = {
      projectRoot: '/project',
      destinationDir: '/project/components',
      componentsDir: '/project/components',
      libDir: '/project/components/lib',
      catalystDir: '/project/components/lib/catalyst',
    };
    fs = mockFileSystem();
    logger = mockLogger();
  });

  describe('createBaseSteps - Core Installation Steps', () => {
    it('should create theme system installation step', () => {
      const steps = createBaseSteps(fs, logger, trailheadRoot, config, force);

      // Should include theme system step
      const themeStep = steps.find(step => step.name === 'theme system');
      expect(themeStep).toBeDefined();
      expect(themeStep!.text).toBe('Installing theme system...');
      expect(themeStep!.critical).toBe(true);
      expect(typeof themeStep!.execute).toBe('function');
    });

    it('should create utility files installation step', () => {
      const steps = createBaseSteps(fs, logger, trailheadRoot, config, force);

      // Should include utility files step
      const utilityStep = steps.find(step => step.name === 'utility files');
      expect(utilityStep).toBeDefined();
      expect(utilityStep!.text).toBe('Installing utility files...');
      expect(utilityStep!.critical).toBe(true);
      expect(typeof utilityStep!.execute).toBe('function');
    });

    it('should create steps in correct execution order', () => {
      const steps = createBaseSteps(fs, logger, trailheadRoot, config, force);

      // Theme system should come before utility files
      const themeIndex = steps.findIndex(step => step.name === 'theme system');
      const utilityIndex = steps.findIndex(step => step.name === 'utility files');

      expect(themeIndex).toBe(0);
      expect(utilityIndex).toBe(1);
      expect(themeIndex).toBeLessThan(utilityIndex);
    });

    it('should create consistent base steps regardless of framework', () => {
      const nextjsConfig = { ...config, framework: 'nextjs' as FrameworkType };
      const viteConfig = { ...config, framework: 'vite' as FrameworkType };

      const nextjsSteps = createBaseSteps(fs, logger, trailheadRoot, nextjsConfig, force);
      const viteSteps = createBaseSteps(fs, logger, trailheadRoot, viteConfig, force);

      // Base steps should be the same for all frameworks
      expect(nextjsSteps.length).toBe(viteSteps.length);
      expect(nextjsSteps.map(s => s.name)).toEqual(viteSteps.map(s => s.name));

      // Both should include theme and utility steps
      expect(nextjsSteps.some(step => step.name === 'theme system')).toBe(true);
      expect(nextjsSteps.some(step => step.name === 'utility files')).toBe(true);
    });
  });

  describe('createComponentSteps - Component Installation', () => {
    it('should create wrapper-based steps when useWrappers is true', () => {
      const useWrappers = true;
      const steps = createComponentSteps(fs, logger, trailheadRoot, config, force, useWrappers);

      // Should have Catalyst components and wrapper steps
      expect(steps.length).toBe(2);

      const catalystStep = steps.find(step => step.name === 'Catalyst components');
      const wrapperStep = steps.find(step => step.name === 'component wrappers');

      expect(catalystStep).toBeDefined();
      expect(catalystStep!.text).toBe('Installing Catalyst components...');
      expect(catalystStep!.critical).toBe(true);

      expect(wrapperStep).toBeDefined();
      expect(wrapperStep!.text).toBe('Generating component wrappers...');
      expect(wrapperStep!.critical).toBe(true);
    });

    it('should create transformed component step when useWrappers is false', () => {
      const useWrappers = false;
      const steps = createComponentSteps(fs, logger, trailheadRoot, config, force, useWrappers);

      // Should have single transformed components step
      expect(steps.length).toBe(1);

      const transformStep = steps[0];
      expect(transformStep.name).toBe('components');
      expect(transformStep.text).toBe('Installing and transforming components...');
      expect(transformStep.critical).toBe(true);
      expect(typeof transformStep.execute).toBe('function');
    });

    it('should create different step patterns based on wrapper preference', () => {
      const wrapperSteps = createComponentSteps(fs, logger, trailheadRoot, config, force, true);
      const transformSteps = createComponentSteps(fs, logger, trailheadRoot, config, force, false);

      // Wrapper approach should have 2 steps, transform approach should have 1
      expect(wrapperSteps.length).toBe(2);
      expect(transformSteps.length).toBe(1);

      // Steps should have different names
      expect(wrapperSteps.map(s => s.name)).toEqual(['Catalyst components', 'component wrappers']);
      expect(transformSteps.map(s => s.name)).toEqual(['components']);
    });

    it('should ensure all component steps are marked as critical', () => {
      const wrapperSteps = createComponentSteps(fs, logger, trailheadRoot, config, force, true);
      const transformSteps = createComponentSteps(fs, logger, trailheadRoot, config, force, false);

      // All steps should be critical
      wrapperSteps.forEach(step => {
        expect(step.critical).toBe(true);
      });

      transformSteps.forEach(step => {
        expect(step.critical).toBe(true);
      });
    });
  });

  describe('createInstallationSteps - Complete Installation Plan', () => {
    it('should create comprehensive installation plan with wrappers', () => {
      const useWrappers = true;
      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, force, useWrappers);

      // Should include base steps (2) and component steps (2)
      expect(steps.length).toBe(4);

      // Should have different step names
      const stepNames = steps.map(step => step.name);
      expect(stepNames).toEqual([
        'theme system',
        'utility files',
        'Catalyst components',
        'component wrappers',
      ]);
    });

    it('should create comprehensive installation plan with transforms', () => {
      const useWrappers = false;
      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, force, useWrappers);

      // Should include base steps (2) and component step (1)
      expect(steps.length).toBe(3);

      // Should have different step names
      const stepNames = steps.map(step => step.name);
      expect(stepNames).toEqual(['theme system', 'utility files', 'components']);
    });

    it('should maintain proper installation sequence', () => {
      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, force, true);

      // Base steps should come before component steps
      const themeIndex = steps.findIndex(step => step.name === 'theme system');
      const utilityIndex = steps.findIndex(step => step.name === 'utility files');
      const catalystIndex = steps.findIndex(step => step.name === 'Catalyst components');
      const wrapperIndex = steps.findIndex(step => step.name === 'component wrappers');

      expect(themeIndex).toBe(0);
      expect(utilityIndex).toBe(1);
      expect(catalystIndex).toBe(2);
      expect(wrapperIndex).toBe(3);

      // Infrastructure should come before components
      expect(themeIndex).toBeLessThan(catalystIndex);
      expect(utilityIndex).toBeLessThan(catalystIndex);
    });

    it('should validate all steps have required properties', () => {
      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, force, true);

      steps.forEach(step => {
        expect(step.name).toBeDefined();
        expect(step.text).toBeDefined();
        expect(step.execute).toBeDefined();
        expect(step.critical).toBeDefined();

        expect(typeof step.name).toBe('string');
        expect(typeof step.text).toBe('string');
        expect(typeof step.execute).toBe('function');
        expect(typeof step.critical).toBe('boolean');
      });
    });

    it('should ensure all steps are marked as critical', () => {
      const wrapperSteps = createInstallationSteps(fs, logger, trailheadRoot, config, force, true);
      const transformSteps = createInstallationSteps(
        fs,
        logger,
        trailheadRoot,
        config,
        force,
        false
      );

      // All steps should be critical for installation to succeed
      wrapperSteps.forEach(step => {
        expect(step.critical).toBe(true);
      });

      transformSteps.forEach(step => {
        expect(step.critical).toBe(true);
      });
    });

    it('should combine base and component steps correctly', () => {
      const useWrappers = true;
      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, force, useWrappers);

      // Should combine base steps with component steps
      const baseStepNames = ['theme system', 'utility files'];
      const componentStepNames = ['Catalyst components', 'component wrappers'];

      const stepNames = steps.map(s => s.name);
      baseStepNames.forEach(name => {
        expect(stepNames).toContain(name);
      });
      componentStepNames.forEach(name => {
        expect(stepNames).toContain(name);
      });
    });
  });
});
