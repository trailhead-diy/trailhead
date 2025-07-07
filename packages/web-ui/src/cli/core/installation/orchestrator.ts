/**
 * Installation orchestrator module - migrated to use enhanced CLI framework
 */

import { createProgressTracker } from '@esteban-url/trailhead-cli/progress';
import type {
  InstallConfig,
  InstallationSummary,
  InstallError,
  FileSystem,
  Logger,
  Result,
  FrameworkType,
} from './types.js';
import { Ok, Err } from './types.js';
import { createError } from '@esteban-url/trailhead-cli/core';
import { pathExists } from '@esteban-url/trailhead-cli/filesystem';
import { isTsxFile } from '../shared/file-filters.js';
import { generateDestinationPaths } from '../filesystem/paths.js';
import {
  analyzeDependencies,
  installDependencies,
  type DependencyInstallResult,
} from './dependencies.js';
import { executeInstallationSteps } from './step-executor.js';
import { createInstallationSteps } from './step-factory.js';
import { detectWorkspace, detectCIEnvironment, checkOfflineMode } from './workspace-detection.js';
import { analyzeDependencies as analyzeCore } from './dependency-resolution.js';
import { detectPackageManager } from 'nypm';
import { countFilesByPattern, formatFileSummary } from './shared-utils.js';

// ============================================================================
// TYPES
// ============================================================================

export interface InstallOptions {
  readonly interactive?: boolean;
  readonly skipDependencyPrompts?: boolean;
  readonly dependencyStrategy?: 'auto' | 'smart' | 'selective' | 'manual' | 'skip' | 'force';
}

// Lazy import to avoid circular dependencies
const getDependencyPrompts = async () => {
  const module = await import('../../prompts/dependencies.js');
  return {
    runDependencyPrompts: module.runDependencyPrompts,
    showPostInstallInstructions: module.showPostInstallInstructions,
  };
};

// ============================================================================
// INSTALLATION ORCHESTRATION
// ============================================================================

/**
 * Perform complete Trailhead UI installation
 */
export const performInstallation = async (
  fs: FileSystem,
  logger: Logger,
  config: InstallConfig,
  trailheadRoot: string,
  force: boolean = false,
  framework?: FrameworkType,
  useWrappers: boolean = true,
  options: InstallOptions = {}
): Promise<Result<InstallationSummary, InstallError>> => {
  // Use enhanced framework progress tracking instead of ora spinner
  const progressTracker = createProgressTracker({
    totalSteps: 6, // Directory creation, file checking, installation steps, dependencies, verification, summary
    showStepNames: true,
    format: 'Trailhead UI Installation [{bar}] {percentage}% | {stepName}',
  });

  try {
    // Step 1: Create directory structure
    progressTracker.nextStep('Creating directories...');
    const directories = useWrappers
      ? [
          config.componentsDir,
          `${config.componentsDir}/lib`,
          `${config.componentsDir}/theme`,
          `${config.componentsDir}/utils`,
        ]
      : [config.componentsDir, `${config.componentsDir}/theme`, `${config.componentsDir}/utils`];

    // Create directories using CLI filesystem
    for (const dir of directories) {
      const ensureDirResult = await fs.ensureDir(dir);
      if (!ensureDirResult.success) {
        progressTracker.stop();
        return ensureDirResult;
      }
    }

    // Step 2: Check for existing files if not forcing
    if (!force) {
      progressTracker.nextStep('Checking for existing files...');
      const destPaths = generateDestinationPaths(config);
      const pathsToCheck = [
        destPaths.themeConfig,
        destPaths.themeBuilder,
        destPaths.themeRegistry,
        destPaths.themeUtils,
        destPaths.themePresets,
        destPaths.themeIndex,
        destPaths.cnUtils,
        destPaths.semanticTokens,
        destPaths.themeProvider,
        destPaths.themeSwitcher,
        destPaths.catalystDir,
      ];

      // Check for existing files using CLI filesystem
      const existingFiles: string[] = [];
      for (const path of pathsToCheck) {
        const existsResult = await pathExists(path);
        if (existsResult.success && existsResult.value) {
          existingFiles.push(path);
        }
      }

      if (existingFiles.length > 0) {
        progressTracker.stop();
        logger.warning('Found existing files that would be overwritten');
        logger.warning('The following files already exist:');
        existingFiles.forEach((file: string) => logger.warning(`  • ${file}`));
        logger.warning('Use --force to overwrite existing files');

        return Err(
          createError('FILESYSTEM_ERROR', 'Installation would overwrite existing files', {
            details: `Path: ${config.componentsDir}`,
          })
        );
      }
    }

    // Create installation steps
    const allSteps = createInstallationSteps(fs, logger, trailheadRoot, config, force, useWrappers);

    // Execute all installation steps
    progressTracker.nextStep('Installing components...');
    const executionResult = await executeInstallationSteps(
      allSteps,
      logger,
      null, // No spinner needed - using listr2 now
      config.componentsDir
    );

    if (!executionResult.success) {
      return executionResult;
    }

    const { installedFiles: allInstalledFiles, failedSteps } = executionResult.value;

    // Step 3: Analyze and update dependencies
    progressTracker.nextStep('Analyzing project dependencies...');
    const depAnalysisResult = await analyzeDependencies(fs, logger, config, framework);
    if (!depAnalysisResult.success) {
      progressTracker.stop();
      return depAnalysisResult;
    }

    const dependencyUpdate = depAnalysisResult.value;
    const dependenciesAdded = Object.keys(dependencyUpdate.added);

    if (dependencyUpdate.needsInstall) {
      let installResult: Result<DependencyInstallResult, InstallError>;

      // Handle interactive mode
      if (options.interactive && !options.skipDependencyPrompts) {
        // Stop progress for interactive prompts
        progressTracker.stop();

        // Prepare dependency analysis
        const [workspaceResult, isOffline, detected] = await Promise.all([
          detectWorkspace(fs, config.projectRoot),
          checkOfflineMode(),
          detectPackageManager(config.projectRoot),
        ]);

        // Workspace detection for future features
        workspaceResult.success ? workspaceResult.value : null;
        const ci = detectCIEnvironment();
        const packageManager = detected?.name || 'npm';

        // Get current deps for analysis
        const currentDepsResult = await fs.readJson<Record<string, unknown>>(
          `${config.projectRoot}/package.json`
        );

        let strategy: { type: 'auto' | 'smart' | 'selective' | 'manual' | 'skip' | 'force' };

        if (!ci) {
          // Run interactive prompts
          const {
            runDependencyPrompts,
            showPostInstallInstructions: _showPostInstallInstructions,
          } = await getDependencyPrompts();

          const analysis = analyzeCore(
            currentDepsResult.success
              ? {
                  dependencies:
                    (currentDepsResult.value.dependencies as Record<string, string>) || {},
                  devDependencies:
                    (currentDepsResult.value.devDependencies as Record<string, string>) || {},
                }
              : { dependencies: {}, devDependencies: {} },
            dependencyUpdate.added
          );

          const promptOptions = {
            analysis: {
              missing: Object.keys(analysis.missing),
              outdated: [], // Not used in current implementation
              hasConflicts: analysis.hasConflicts,
            },
            currentDependencies: currentDepsResult.success
              ? (currentDepsResult.value.dependencies as Record<string, string>) || {}
              : {},
            existingDependencies: analysis.existing,
            canInstall: true, // We're in the install flow
            isNpmOnline: !isOffline,
            isYarnOnline: !isOffline,
            isPnpmOnline: !isOffline,
            hasExisting: Object.keys(analysis.existing).length > 0,
            isOffline,
            isCI: !!ci,
          };

          const promptResult = await runDependencyPrompts(promptOptions);
          strategy = promptResult.strategy;
        } else {
          // In CI, use auto mode
          strategy = { type: 'auto' };
        }

        // Restart progress tracking
        progressTracker.nextStep('Installing dependencies...');

        // Install with selected strategy
        installResult = await installDependencies(
          fs,
          logger,
          config,
          dependencyUpdate,
          framework,
          strategy
        );

        // Show post-install instructions if needed
        if (installResult.success && !installResult.value.installed) {
          progressTracker.stop();
          const { showPostInstallInstructions } = await getDependencyPrompts();
          showPostInstallInstructions(packageManager, strategy);
          progressTracker.nextStep('Completing installation...');
        }
      } else {
        // Non-interactive mode
        progressTracker.nextStep('Installing dependencies smartly...');

        const strategy = options.dependencyStrategy
          ? { type: options.dependencyStrategy }
          : { type: 'auto' as const };

        installResult = await installDependencies(
          fs,
          logger,
          config,
          dependencyUpdate,
          framework,
          strategy
        );
      }

      if (!installResult.success) {
        progressTracker.stop();
        return installResult;
      }

      const installData = installResult.value;

      if (installData.installed) {
        progressTracker.nextStep('Dependencies installed successfully');
      } else {
        progressTracker.nextStep('Package.json updated, manual installation required');
      }

      // Log any warnings
      installData.warnings.forEach((warning: string) => logger.warning(warning));
    } else {
      progressTracker.nextStep('All dependencies already installed');
    }

    // Create installation summary with failure tracking
    const summary: InstallationSummary = {
      filesInstalled: Object.freeze([...allInstalledFiles]),
      dependenciesAdded: Object.freeze([...dependenciesAdded]),
      conversionsApplied: false, // Will be updated by conversion step
      configCreated: false, // Will be updated by config creation step
      ...(failedSteps.length > 0 && { failedSteps: Object.freeze([...failedSteps]) }),
    };

    buildSuccessMessage(allInstalledFiles.length, dependenciesAdded.length, failedSteps.length);
    progressTracker.stop();

    // Log detailed summary
    logInstallationSummary(logger, allInstalledFiles, dependenciesAdded, failedSteps);

    return Ok(summary);
  } catch (error) {
    progressTracker.stop();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return Err(
      createError('INSTALLATION_ERROR', `Installation failed: ${errorMessage}`, {
        details: `Path: ${config.componentsDir}`,
        cause: error,
      })
    );
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build success message based on installation results
 */
function buildSuccessMessage(
  filesCount: number,
  dependenciesCount: number,
  failedStepsCount: number
): string {
  const parts = [`Installation complete! Installed ${filesCount} files`];

  if (dependenciesCount > 0) {
    parts.push(`${dependenciesCount} dependencies`);
  }

  if (failedStepsCount > 0) {
    parts.push(`(${failedStepsCount} non-critical steps skipped)`);
  }

  return parts.join(' and ') + ' successfully';
}

/**
 * Log detailed installation summary
 */
function logInstallationSummary(
  logger: Logger,
  installedFiles: readonly string[],
  dependenciesAdded: readonly string[],
  failedSteps: readonly string[]
): void {
  logger.success('Installation Summary:');

  const categories = [
    { name: 'Theme system', pattern: 'theme/' },
    { name: 'Components', pattern: '.tsx' },
    { name: 'Utilities', pattern: 'utils' },
  ];

  formatFileSummary(installedFiles, categories).forEach(line => logger.info(line));
  logger.info(`  • Total: ${installedFiles.length} files`);

  if (dependenciesAdded.length > 0) {
    logger.info(`  • Dependencies: ${dependenciesAdded.length} packages added`);
  }

  if (failedSteps.length > 0) {
    logger.warning(`  • Skipped steps: ${failedSteps.join(', ')}`);
  }
}

/**
 * Validate installation prerequisites
 */
export const validatePrerequisites = async (
  fs: FileSystem,
  config: InstallConfig,
  trailheadRoot: string
): Promise<Result<void, InstallError>> => {
  // Check if Trailhead root exists
  const rootExistsResult = await pathExists(trailheadRoot);
  if (!rootExistsResult.success) return Err(rootExistsResult.error);
  if (!rootExistsResult.value) {
    return Err(
      createError('CONFIGURATION_ERROR', `Trailhead UI root not found: ${trailheadRoot}`, {
        details: `Path: ${trailheadRoot}`,
      })
    );
  }

  // Check if project root exists
  const projectExistsResult = await pathExists(config.projectRoot);
  if (!projectExistsResult.success) return Err(projectExistsResult.error);
  if (!projectExistsResult.value) {
    return Err(
      createError('CONFIGURATION_ERROR', `Project root not found: ${config.projectRoot}`, {
        details: `Path: ${config.projectRoot}`,
      })
    );
  }

  // Check write permissions
  const destDirParent = config.componentsDir.split('/').slice(0, -1).join('/');
  const writeTestPath = `${destDirParent}/.trailhead-test-${Date.now()}`;
  const writeResult = await fs.writeFile(writeTestPath, 'test');
  if (!writeResult.success) {
    return Err(
      createError('FILESYSTEM_ERROR', 'No write permission in destination directory', {
        details: `Path: ${destDirParent}`,
      })
    );
  }

  // Clean up test file
  await fs.rm(writeTestPath);

  return Ok(undefined);
};

// ============================================================================
// DRY RUN INSTALLATION
// ============================================================================

/**
 * Perform a dry run of the installation
 */
export const performDryRunInstallation = async (
  fs: FileSystem,
  logger: Logger,
  config: InstallConfig,
  trailheadRoot: string,
  framework?: FrameworkType,
  useWrappers: boolean = true
): Promise<Result<string[], InstallError>> => {
  logger.info('Performing dry run installation...');
  logger.info(`Component structure: ${useWrappers ? 'With wrappers' : 'Without wrappers'}`);

  // Check what dependencies would be installed
  const depAnalysisResult = await analyzeDependencies(fs, logger, config, framework);
  if (depAnalysisResult.success) {
    const dependencyUpdate = depAnalysisResult.value;
    const missingDeps = Object.keys(dependencyUpdate.added);

    if (missingDeps.length > 0) {
      logger.info(`\nWould add ${missingDeps.length} dependencies:`);
      missingDeps.forEach(dep => {
        logger.info(`  • ${dep}@${dependencyUpdate.added[dep]}`);
      });
    } else {
      logger.success('All required dependencies are already installed');
    }
  }

  // Check what files would be installed
  const plannedFiles: string[] = [];

  // Theme system files
  plannedFiles.push(
    'theme/config.ts',
    'theme/builder.ts',
    'theme/registry.ts',
    'theme/utils.ts',
    'theme/presets.ts',
    'theme/index.ts',
    'theme/semantic-tokens.ts'
  );

  // Theme components
  plannedFiles.push('theme-provider.tsx', 'theme-switcher.tsx');

  // Utility files
  plannedFiles.push('utils/cn.ts');

  // Check for Catalyst components
  const catalystDir = `${trailheadRoot}/src/components/lib`;
  const dirCheckResult = await fs.readdir(catalystDir);
  if (dirCheckResult.success) {
    const catalystFiles = dirCheckResult.value
      .filter(isTsxFile)
      .map((file: string) => `lib/${file}`);
    plannedFiles.push(...catalystFiles);

    // Component wrappers
    const wrapperFiles = dirCheckResult.value
      .filter(isTsxFile)
      .map((file: string) => file.replace('.tsx', ''))
      .map((name: string) => `${name}.tsx`);
    plannedFiles.push(...wrapperFiles);
  }

  // Check for conflicts
  const existingFiles: string[] = [];
  for (const file of plannedFiles) {
    const fullPath = `${config.componentsDir}/${file}`;
    const existsResult = await pathExists(fullPath);
    if (existsResult.success && existsResult.value) {
      existingFiles.push(file);
    }
  }

  logger.info(`\nWould install ${plannedFiles.length} files:`);
  logger.info(`  • Theme system: ${countFilesByPattern(plannedFiles, 'theme/')} files`);
  logger.info(
    `  • Components: ${countFilesByPattern(plannedFiles, '.tsx')} files (${useWrappers ? 'with wrappers' : 'transformed'})`
  );
  logger.info(`  • Utilities: ${countFilesByPattern(plannedFiles, 'utils')} files`);
  logger.info(
    `  • Component structure: ${useWrappers ? 'With lib/ directory' : 'Direct (no lib/)'}`
  );

  if (existingFiles.length > 0) {
    logger.warning(`\nWould overwrite ${existingFiles.length} existing files:`);
    existingFiles.slice(0, 5).forEach(file => logger.warning(`  • ${file}`));
    if (existingFiles.length > 5) {
      logger.warning(`  ... and ${existingFiles.length - 5} more`);
    }
  }

  return Ok(plannedFiles);
};
