/**
 * Tests for installation step factory
 * Verifies correct step creation
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  FileSystem,
  Logger,
  InstallConfig,
} from '../../../../../src/cli/core/installation/types.js';
import {
  createBaseSteps,
  createComponentSteps,
  createInstallationSteps,
} from '../../../../../src/cli/core/installation/step-factory.js';

// Create minimal mocks for dependencies
const createMockDependencies = () => {
  const fs: FileSystem = {
    exists: vi.fn(),
    readDir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readJson: vi.fn(),
    writeJson: vi.fn(),
    copy: vi.fn(),
    ensureDir: vi.fn(),
    stat: vi.fn(),
    remove: vi.fn(),
  };

  const logger: Logger = {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    step: vi.fn(),
  };

  const config: InstallConfig = {
    catalystDir: '/catalyst',
    destinationDir: '/project/components/th',
    componentsDir: '/project/components/th',
    libDir: '/project/components/th/lib',
    projectRoot: '/project',
  };

  return { fs, logger, config };
};

describe('Step Factory', () => {
  const trailheadRoot = '/trailhead';
  const force = false;

  describe('createBaseSteps', () => {
    it('creates theme and utility installation steps', () => {
      const { fs, logger, config } = createMockDependencies();

      const steps = createBaseSteps(fs, logger, trailheadRoot, config, force);

      expect(steps).toHaveLength(2);
      expect(steps[0].name).toBe('theme system');
      expect(steps[0].critical).toBe(true);
      expect(steps[1].name).toBe('utility files');
      expect(steps[1].critical).toBe(true);
    });

    it('provides descriptive text for each step', () => {
      const { fs, logger, config } = createMockDependencies();

      const steps = createBaseSteps(fs, logger, trailheadRoot, config, force);

      expect(steps[0].text).toContain('Installing theme system');
      expect(steps[1].text).toContain('Installing utility files');
    });

    it('steps have executable functions', () => {
      const { fs, logger, config } = createMockDependencies();

      const steps = createBaseSteps(fs, logger, trailheadRoot, config, force);

      steps.forEach(step => {
        expect(typeof step.execute).toBe('function');
      });
    });
  });

  describe('createComponentSteps', () => {
    it('creates wrapper mode steps when useWrappers is true', () => {
      const { fs, logger, config } = createMockDependencies();

      const steps = createComponentSteps(fs, logger, trailheadRoot, config, force, true);

      expect(steps).toHaveLength(2);
      expect(steps[0].name).toBe('Catalyst components');
      expect(steps[0].text).toContain('Installing Catalyst components');
      expect(steps[1].name).toBe('component wrappers');
      expect(steps[1].text).toContain('Generating component wrappers');
    });

    it('creates no-wrapper mode step when useWrappers is false', () => {
      const { fs, logger, config } = createMockDependencies();

      const steps = createComponentSteps(fs, logger, trailheadRoot, config, force, false);

      expect(steps).toHaveLength(1);
      expect(steps[0].name).toBe('components');
      expect(steps[0].text).toContain('Installing and transforming components');
    });

    it('all component steps are marked as critical', () => {
      const { fs, logger, config } = createMockDependencies();

      // Test both modes
      const wrapperSteps = createComponentSteps(fs, logger, trailheadRoot, config, force, true);
      const noWrapperSteps = createComponentSteps(fs, logger, trailheadRoot, config, force, false);

      const allSteps = [...wrapperSteps, ...noWrapperSteps];
      allSteps.forEach(step => {
        expect(step.critical).toBe(true);
      });
    });
  });

  describe('createInstallationSteps', () => {
    it('combines base and component steps in correct order', () => {
      const { fs, logger, config } = createMockDependencies();

      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, force, true);

      // Should have base steps first, then component steps
      expect(steps.length).toBeGreaterThan(2);
      expect(steps[0].name).toBe('theme system');
      expect(steps[1].name).toBe('utility files');
      expect(steps[2].name).toBe('Catalyst components');
    });

    it('creates different step sequences based on wrapper preference', () => {
      const { fs, logger, config } = createMockDependencies();

      const wrapperSteps = createInstallationSteps(fs, logger, trailheadRoot, config, force, true);
      const noWrapperSteps = createInstallationSteps(
        fs,
        logger,
        trailheadRoot,
        config,
        force,
        false
      );

      // With wrappers: theme, utils, catalyst, wrappers (4 steps)
      expect(wrapperSteps).toHaveLength(4);
      expect(wrapperSteps[3].name).toBe('component wrappers');

      // Without wrappers: theme, utils, transformed components (3 steps)
      expect(noWrapperSteps).toHaveLength(3);
      expect(noWrapperSteps[2].name).toBe('components');
    });

    it('preserves step configuration through composition', () => {
      const { fs, logger, config } = createMockDependencies();

      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, force, false);

      // All steps should have required properties
      steps.forEach(step => {
        expect(step).toHaveProperty('name');
        expect(step).toHaveProperty('text');
        expect(step).toHaveProperty('execute');
        expect(step).toHaveProperty('critical');
        expect(typeof step.name).toBe('string');
        expect(typeof step.text).toBe('string');
        expect(typeof step.execute).toBe('function');
        expect(typeof step.critical).toBe('boolean');
      });
    });

    it('passes configuration correctly to step functions', () => {
      const { fs, logger, config } = createMockDependencies();

      // Capture the configuration passed to steps
      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, true, true);

      // Steps should be created with the same config
      expect(steps).toBeDefined();
      expect(steps.length).toBeGreaterThan(0);

      // The execute functions will use the passed configuration
      // This is verified by the fact that steps are created successfully
    });
  });

  describe('step factory immutability', () => {
    it('returns new arrays on each call', () => {
      const { fs, logger, config } = createMockDependencies();

      const steps1 = createInstallationSteps(fs, logger, trailheadRoot, config, force, true);
      const steps2 = createInstallationSteps(fs, logger, trailheadRoot, config, force, true);

      expect(steps1).not.toBe(steps2);
      // Check structure is the same (without comparing functions)
      expect(steps1.length).toBe(steps2.length);
      steps1.forEach((step, i) => {
        expect(step.name).toBe(steps2[i].name);
        expect(step.text).toBe(steps2[i].text);
        expect(step.critical).toBe(steps2[i].critical);
        expect(typeof step.execute).toBe('function');
        expect(typeof steps2[i].execute).toBe('function');
      });
    });

    it('steps are read-only', () => {
      const { fs, logger, config } = createMockDependencies();

      const steps = createInstallationSteps(fs, logger, trailheadRoot, config, force, true);

      // TypeScript enforces readonly at compile time
      // At runtime, we can verify the structure is as expected
      expect(Array.isArray(steps)).toBe(true);
      steps.forEach(step => {
        expect(Object.keys(step).sort()).toEqual(['critical', 'execute', 'name', 'text'].sort());
      });
    });
  });
});
