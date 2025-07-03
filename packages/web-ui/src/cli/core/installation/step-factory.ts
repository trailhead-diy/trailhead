/**
 * Installation step factory - creates installation steps
 */

import type { FileSystem, Logger, InstallConfig } from './types.js';
import type { InstallationStep } from './step-executor.js';
import { installThemeSystem } from './theme-installer.js';
import {
  installCatalystComponents,
  installComponentWrappers,
  installUtilityFiles,
  installTransformedComponents,
} from './component-installer.js';

// ============================================================================
// STEP CREATION
// ============================================================================

/**
 * Create base installation steps (always required)
 */
export const createBaseSteps = (
  fs: FileSystem,
  logger: Logger,
  trailheadRoot: string,
  config: InstallConfig,
  force: boolean
): readonly InstallationStep[] => [
  {
    name: 'theme system',
    text: 'Installing theme system...',
    execute: () => installThemeSystem(fs, logger, trailheadRoot, config, force),
    critical: true,
  },
  {
    name: 'utility files',
    text: 'Installing utility files...',
    execute: () => installUtilityFiles(fs, logger, trailheadRoot, config, force),
    critical: true,
  },
];

/**
 * Create component installation steps based on wrapper preference
 */
export const createComponentSteps = (
  fs: FileSystem,
  logger: Logger,
  trailheadRoot: string,
  config: InstallConfig,
  force: boolean,
  useWrappers: boolean
): readonly InstallationStep[] => {
  if (useWrappers) {
    return [
      {
        name: 'Catalyst components',
        text: 'Installing Catalyst components...',
        execute: () => installCatalystComponents(fs, logger, trailheadRoot, config, force),
        critical: true,
      },
      {
        name: 'component wrappers',
        text: 'Generating component wrappers...',
        execute: () => installComponentWrappers(fs, logger, trailheadRoot, config, force),
        critical: true,
      },
    ];
  } else {
    return [
      {
        name: 'components',
        text: 'Installing and transforming components...',
        execute: () => installTransformedComponents(fs, logger, trailheadRoot, config, force),
        critical: true,
      },
    ];
  }
};

/**
 * Create all installation steps
 */
export const createInstallationSteps = (
  fs: FileSystem,
  logger: Logger,
  trailheadRoot: string,
  config: InstallConfig,
  force: boolean,
  useWrappers: boolean
): readonly InstallationStep[] => {
  const baseSteps = createBaseSteps(fs, logger, trailheadRoot, config, force);
  const componentSteps = createComponentSteps(
    fs,
    logger,
    trailheadRoot,
    config,
    force,
    useWrappers
  );

  return [...baseSteps, ...componentSteps];
};
