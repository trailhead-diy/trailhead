import * as path from 'path';
import { detectPackageManager, installDependencies as nypmInstall } from 'nypm';
import PackageJson from '@npmcli/package-json';

import type {
  DependencyUpdate,
  PackageJsonDeps,
  InstallError,
  FileSystem,
  Logger,
  Result,
  InstallConfig,
  FrameworkType,
} from './types.js';
import { Ok, Err, CORE_DEPENDENCIES, FRAMEWORK_DEPENDENCIES } from './types.js';

import { tryCatchAsync } from './functional-utils.js';
import {
  analyzeDependencies as analyzeCore,
  resolveDependencies,
  type ResolutionStrategy,
} from './dependency-resolution.js';
import { detectWorkspace, detectCIEnvironment, checkOfflineMode } from './workspace-detection.js';
import {
  createDependencyContext,
  recommendStrategy,
  getInstallOptions,
  type DependencyStrategy,
} from './dependency-strategies.js';
import { createProgressState } from './progress-tracking.js';
import {
  getInstallFallback,
  formatRecoveryInstructions,
  type InstallFallback,
} from './error-recovery.js';

// ============================================================================
// TYPES
// ============================================================================

export interface DependencyInstallResult {
  readonly installed: boolean;
  readonly strategy: DependencyStrategy;
  readonly fallback?: InstallFallback;
  readonly warnings: readonly string[];
}

// ============================================================================
// PACKAGE.JSON OPERATIONS (Using @npmcli/package-json)
// ============================================================================

/**
 * Read and parse package.json file using official npm library
 */
export const readPackageJson = async (
  fs: FileSystem,
  projectRoot: string
): Promise<Result<PackageJsonDeps, InstallError>> => {
  return tryCatchAsync(
    async () => {
      const pkgJson = await PackageJson.load(projectRoot);
      const content = pkgJson.content as Record<string, unknown>;

      return {
        dependencies: content.dependencies as Record<string, string> | undefined,
        devDependencies: content.devDependencies as Record<string, string> | undefined,
      };
    },
    error => ({
      type: 'DependencyError',
      message: 'Failed to read package.json',
      cause: error,
    })
  );
};

/**
 * Write updated package.json file using official npm library
 */
export const writePackageJson = async (
  fs: FileSystem,
  projectRoot: string,
  originalPackageJson: Record<string, unknown>,
  updatedDeps: PackageJsonDeps
): Promise<Result<void, InstallError>> => {
  return tryCatchAsync(
    async () => {
      const pkgJson = await PackageJson.load(projectRoot);

      // Update dependencies
      pkgJson.update({
        dependencies: {
          ...((originalPackageJson.dependencies as Record<string, string>) || {}),
          ...updatedDeps.dependencies,
        },
        devDependencies: {
          ...((originalPackageJson.devDependencies as Record<string, string>) || {}),
          ...updatedDeps.devDependencies,
        },
      });

      await pkgJson.save();
    },
    error => ({
      type: 'DependencyError',
      message: 'Failed to write package.json',
      cause: error,
    })
  );
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Pure function: Validate package.json dependencies structure using standardized validator
 */
export const validatePackageJsonDeps = (pkg: unknown): Result<PackageJsonDeps, InstallError> => {
  // Basic type check for object
  if (!pkg || typeof pkg !== 'object') {
    return Err({
      type: 'ValidationError',
      message: 'Value must be an object',
    });
  }

  const validated = pkg as any;

  // Validate dependencies structure if present
  if (validated.dependencies !== undefined) {
    if (typeof validated.dependencies !== 'object' || validated.dependencies === null) {
      return Err({
        type: 'ValidationError',
        message: 'dependencies must be an object',
      });
    }
    // Validate dependency values are strings
    for (const [key, value] of Object.entries(validated.dependencies)) {
      if (typeof value !== 'string') {
        return Err({
          type: 'ValidationError',
          message: `${key} must be a string`,
        });
      }
    }
  }

  // Validate devDependencies structure if present
  if (validated.devDependencies !== undefined) {
    if (typeof validated.devDependencies !== 'object' || validated.devDependencies === null) {
      return Err({
        type: 'ValidationError',
        message: 'devDependencies must be an object',
      });
    }
    // Validate devDependency values are strings
    for (const [key, value] of Object.entries(validated.devDependencies)) {
      if (typeof value !== 'string') {
        return Err({
          type: 'ValidationError',
          message: `${key} must be a string`,
        });
      }
    }
  }

  return Ok({
    dependencies: validated.dependencies,
    devDependencies: validated.devDependencies,
  });
};

// ============================================================================
// DEPENDENCY ANALYSIS (Enhanced with new modules)
// ============================================================================

/**
 * Get required dependencies for a specific framework
 */
export const getFrameworkDependencies = (framework?: FrameworkType): Record<string, string> => {
  if (!framework) {
    // Return all dependencies for backward compatibility
    return { ...CORE_DEPENDENCIES, '@tailwindcss/vite': '^4.0.0' };
  }

  // Start with core dependencies
  const requiredDeps = { ...CORE_DEPENDENCIES };

  // Add framework-specific dependencies
  if (framework in FRAMEWORK_DEPENDENCIES) {
    const frameworkDeps = FRAMEWORK_DEPENDENCIES[framework as keyof typeof FRAMEWORK_DEPENDENCIES];
    Object.assign(requiredDeps, frameworkDeps);
  }

  return requiredDeps;
};

/**
 * Analyze dependencies with enhanced context
 */
export const analyzeDependencies = async (
  fs: FileSystem,
  logger: Logger,
  config: InstallConfig,
  framework?: FrameworkType
): Promise<Result<DependencyUpdate, InstallError>> => {
  try {
    logger.step('Analyzing project dependencies...');

    // Read current package.json
    const currentDepsResult = await readPackageJson(fs, config.projectRoot);
    if (!currentDepsResult.success) return currentDepsResult;

    const currentDeps = currentDepsResult.value;
    const requiredDeps = getFrameworkDependencies(framework);

    // Use the enhanced analysis from dependency-resolution module
    const analysis = analyzeCore(currentDeps, requiredDeps);

    // Log analysis results
    if (logger) {
      const allCurrentDeps = {
        ...currentDeps.dependencies,
        ...currentDeps.devDependencies,
      };

      const existingRequired = Object.keys(requiredDeps).filter(dep => allCurrentDeps[dep]);

      if (existingRequired.length > 0) {
        logger.info(`Found ${existingRequired.length} existing required dependencies`);
        if (analysis.conflicts.length > 0) {
          logger.warning(`Found ${analysis.conflicts.length} version conflicts:`);
          analysis.conflicts.forEach(conflict => {
            logger.warning(`  • ${conflict.name}: ${conflict.current} → ${conflict.required}`);
          });
        }
      }

      if (Object.keys(analysis.missing).length > 0) {
        logger.info(`Need to add ${Object.keys(analysis.missing).length} missing dependencies`);
      }
    }

    const dependencyUpdate: DependencyUpdate = {
      added: analysis.missing,
      existing: analysis.existing,
      needsInstall: Object.keys(analysis.missing).length > 0 || analysis.conflicts.length > 0,
    };

    return Ok(dependencyUpdate);
  } catch (error) {
    return Err({
      type: 'DependencyError',
      message: 'Failed to analyze dependencies',
      cause: error,
    });
  }
};

// ============================================================================
// SMART DEPENDENCY INSTALLATION
// ============================================================================

/**
 * Install dependencies with smart handling
 */
export const installDependenciesSmart = async (
  fs: FileSystem,
  logger: Logger,
  config: InstallConfig,
  dependencyUpdate: DependencyUpdate,
  framework?: FrameworkType,
  userStrategy?: DependencyStrategy
): Promise<Result<DependencyInstallResult, InstallError>> => {
  try {
    // Detect environment
    const [workspaceResult, isOffline] = await Promise.all([
      detectWorkspace(fs, config.projectRoot),
      checkOfflineMode(),
    ]);

    const workspace = workspaceResult.success ? workspaceResult.value : null;
    const ci = detectCIEnvironment();

    // Detect package manager
    const detected = await detectPackageManager(config.projectRoot);
    const packageManager = detected?.name || 'npm';
    const hasLockfile = !!detected?.lockFile;

    logger.debug(`Detected package manager: ${packageManager}`);
    if (workspace) {
      logger.debug(`Detected workspace: ${workspace.type}`);
    }
    if (ci) {
      logger.debug(`CI environment: ${ci.name}`);
    }

    // Analyze dependencies for conflicts
    const currentDepsResult = await readPackageJson(fs, config.projectRoot);
    if (!currentDepsResult.success) return currentDepsResult;

    const requiredDeps = getFrameworkDependencies(framework);
    const analysis = analyzeCore(currentDepsResult.value, requiredDeps);

    // Determine strategy
    const context = createDependencyContext(
      analysis,
      workspace,
      ci,
      packageManager,
      hasLockfile,
      isOffline
    );

    const strategy = userStrategy || recommendStrategy(context);

    if (strategy.type === 'skip') {
      return Ok({
        installed: false,
        strategy,
        warnings: ['Dependency management skipped'],
      });
    }

    // Resolve dependencies
    const resolutionStrategy: ResolutionStrategy =
      strategy.type === 'force'
        ? 'force'
        : strategy.type === 'smart'
          ? 'smart'
          : strategy.type === 'manual'
            ? 'strict'
            : 'smart';

    const resolution = resolveDependencies(analysis, resolutionStrategy);

    // Update package.json if needed
    if (Object.keys(resolution.dependencies).length > 0) {
      logger.step('Updating package.json...');

      const fullPackageJsonResult = await fs.readJson<Record<string, unknown>>(
        path.join(config.projectRoot, 'package.json')
      );
      if (!fullPackageJsonResult.success) return fullPackageJsonResult;

      const updateResult = await writePackageJson(
        fs,
        config.projectRoot,
        fullPackageJsonResult.value,
        {
          dependencies: resolution.dependencies,
          devDependencies: {},
        }
      );

      if (!updateResult.success) return updateResult;
    }

    // Apply overrides if needed
    if (Object.keys(resolution.overrides).length > 0 && packageManager === 'npm') {
      logger.step('Applying dependency overrides...');

      const pkgJson = await PackageJson.load(config.projectRoot);
      pkgJson.update({
        overrides: resolution.overrides,
      });
      await pkgJson.save();
    }

    // Install if strategy allows
    if (strategy.type === 'auto' || strategy.type === 'smart' || strategy.type === 'force') {
      logger.step(`Installing dependencies with ${packageManager}...`);

      const options = getInstallOptions(strategy, packageManager, hasLockfile);

      // Create progress state
      const _progressState = createProgressState(Object.keys(dependencyUpdate.added));

      try {
        await nypmInstall({
          cwd: config.projectRoot,
          silent: false,
          packageManager: packageManager as any,
          // Additional options from our strategy
          ...(options.env && { env: options.env }),
        });

        logger.success('Dependencies installed successfully');

        return Ok({
          installed: true,
          strategy,
          warnings: [...resolution.warnings, ...resolution.suggestions],
        });
      } catch (error) {
        const fallback = getInstallFallback(packageManager, error as Error);

        logger.warning('Automatic installation failed');
        formatRecoveryInstructions(fallback).forEach(line => logger.info(line));

        return Ok({
          installed: false,
          strategy,
          fallback,
          warnings: resolution.warnings,
        });
      }
    }

    // Manual installation
    return Ok({
      installed: false,
      strategy,
      warnings: [...resolution.warnings, `Run "${packageManager} install" to install dependencies`],
    });
  } catch (error) {
    return Err({
      type: 'DependencyError',
      message: 'Failed to install dependencies',
      cause: error,
    });
  }
};

// ============================================================================
