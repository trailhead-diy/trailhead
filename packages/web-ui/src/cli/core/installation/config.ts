/**
 * Configuration detection and validation for Trailhead UI install script
 */

import * as path from 'node:path';
import type {
  InstallConfig,
  InstallationTrailheadConfig,
  InstallError,
  FileSystem,
  Logger,
  Result,
  CLIOptions,
} from './types.js';
import { ok, err, createError, nonEmptyString, object } from '@esteban-url/trailhead-cli/core';
import { isTsxFile } from '../shared/file-filters.js';

// ============================================================================
// CONFIGURATION DETECTION (Pure Functions)
// ============================================================================

/**
 * Pure function: Search for catalyst-ui-kit directory
 */
export const detectCatalystDir = async (
  fs: FileSystem,
  startDir: string = process.cwd()
): Promise<Result<string, InstallError>> => {
  const candidatePaths = [
    path.join(startDir, 'catalyst-ui-kit'),
    path.join(startDir, '..', 'catalyst-ui-kit'),
    path.join(startDir, 'catalyst-ui-kit', 'typescript'),
    path.join(startDir, '..', 'catalyst-ui-kit', 'typescript'),
  ];

  for (const candidatePath of candidatePaths) {
    const existsResult = await fs.access(candidatePath);
    if (!existsResult.isOk()) continue;

    // Check if it contains typescript files
    const typescriptDir = candidatePath.endsWith('typescript')
      ? candidatePath
      : path.join(candidatePath, 'typescript');

    const typescriptExistsResult = await fs.access(typescriptDir);
    if (typescriptExistsResult.isOk()) {
      return ok(typescriptDir);
    }
  }

  return err(
    createError('CATALYST_NOT_FOUND', 'Could not find catalyst-ui-kit directory', {
      details: `Searched in: ${candidatePaths.join(', ')}\n\n💡 Expected Catalyst UI Kit structure:\n   catalyst-ui-kit/\n   └── typescript/\n       ├── button.tsx\n       ├── input.tsx\n       ├── alert.tsx\n       └── ... (27 component files)\n\n📋 To fix this:\n1. Download Catalyst UI Kit from Tailwind Plus\n2. Extract the ZIP file to your project directory\n3. Ensure you're using the TypeScript version\n\n🔍 Try running with:\n   npx tsx scripts/install.ts --catalyst-dir /path/to/catalyst-ui-kit/typescript\n\n💻 Or use the interactive CLI:\n   pnpm trailhead-ui install`,
    })
  );
};

/**
 * Pure function: Search for components directory
 */
export const detectComponentsDir = async (
  fs: FileSystem,
  startDir: string = process.cwd()
): Promise<Result<string, InstallError>> => {
  const candidatePaths = [
    path.join(startDir, 'src', 'components'),
    path.join(startDir, 'components'),
    path.join(startDir, 'app', 'components'),
    path.join(startDir, 'lib', 'components'),
  ];

  for (const candidatePath of candidatePaths) {
    const existsResult = await fs.access(candidatePath);
    if (!existsResult.isOk()) continue;

    return ok(candidatePath);
  }

  // Default to src/components if none found
  const defaultPath = path.join(startDir, 'src', 'components');
  return ok(defaultPath);
};

/**
 * Pure function: Search for lib directory
 */
export const detectLibDir = async (
  fs: FileSystem,
  startDir: string = process.cwd()
): Promise<Result<string, InstallError>> => {
  const candidatePaths = [
    path.join(startDir, 'src', 'lib'),
    path.join(startDir, 'lib'),
    path.join(startDir, 'app', 'lib'),
  ];

  for (const candidatePath of candidatePaths) {
    const existsResult = await fs.access(candidatePath);
    if (!existsResult.isOk()) continue;

    return ok(candidatePath);
  }

  // Default to src/lib if none found
  const defaultPath = path.join(startDir, 'src', 'lib');
  return ok(defaultPath);
};

// ============================================================================
// CONFIGURATION VALIDATION (Pure Functions)
// ============================================================================

/**
 * Pure function: Validate InstallationTrailheadConfig object using CLI framework validation
 */
export const validateTrailheadConfig = (
  config: unknown
): Result<InstallationTrailheadConfig, InstallError> => {
  // Validate object structure first
  const objectResult = object('config')(config);
  if (!objectResult.isOk()) {
    return err(createError('VALIDATION_ERROR', objectResult.error.message));
  }

  const configObj = objectResult.value;

  // Validate each required field
  const fields = ['catalystDir', 'destinationDir', 'componentsDir', 'libDir'];
  const validatedFields: Record<string, string> = {};

  for (const field of fields) {
    const fieldResult = nonEmptyString(field)(configObj[field]);

    if (!fieldResult.isOk()) {
      return err(
        createError('VALIDATION_ERROR', `${field} must be a non-empty string`, {
          details: `Field: ${field}`,
        })
      );
    }

    validatedFields[field] = fieldResult.value.trim();
  }

  return ok({
    catalystDir: validatedFields.catalystDir,
    destinationDir: validatedFields.destinationDir,
    componentsDir: validatedFields.componentsDir,
    libDir: validatedFields.libDir,
  });
};

/**
 * Pure function: Validate InstallConfig object using CLI framework validation
 */
export const validateInstallConfig = (config: unknown): Result<InstallConfig, InstallError> => {
  // Validate object structure first
  const objectResult = object('config')(config);
  if (!objectResult.isOk()) {
    return err(createError('VALIDATION_ERROR', objectResult.error.message));
  }

  const configObj = objectResult.value;

  // Validate each required field (including projectRoot for InstallConfig)
  const fields = ['catalystDir', 'destinationDir', 'componentsDir', 'libDir', 'projectRoot'];
  const validatedFields: Record<string, string> = {};

  for (const field of fields) {
    const fieldResult = nonEmptyString(field)(configObj[field]);

    if (!fieldResult.isOk()) {
      return err(
        createError('VALIDATION_ERROR', `${field} must be a non-empty string`, {
          details: `Field: ${field}`,
        })
      );
    }

    validatedFields[field] = fieldResult.value.trim();
  }

  return ok({
    catalystDir: validatedFields.catalystDir,
    destinationDir: validatedFields.destinationDir,
    componentsDir: validatedFields.componentsDir,
    libDir: validatedFields.libDir,
    projectRoot: validatedFields.projectRoot,
  });
};

// ============================================================================
// CONFIGURATION FILE OPERATIONS
// ============================================================================

/**
 * Read existing trailhead.config.json file
 */
export const readTrailheadConfig = async (
  fs: FileSystem,
  projectRoot: string
): Promise<Result<InstallationTrailheadConfig | null, InstallError>> => {
  const configPath = path.join(projectRoot, 'trailhead.config.json');

  const existsResult = await fs.access(configPath);
  if (!existsResult.isOk()) {
    return ok(null);
  }

  const readResult = await fs.readJson<unknown>(configPath);
  if (!readResult.isOk()) return readResult;

  const validateResult = validateTrailheadConfig(readResult.value);
  if (!validateResult.isOk()) return validateResult;

  return ok(validateResult.value);
};

/**
 * Write trailhead.config.json file
 */
export const writeTrailheadConfig = async (
  fs: FileSystem,
  projectRoot: string,
  config: InstallationTrailheadConfig
): Promise<Result<void, InstallError>> => {
  const configPath = path.join(projectRoot, 'trailhead.config.json');

  return await fs.writeJson(configPath, config, { spaces: 2 });
};

// ============================================================================
// CONFIGURATION RESOLUTION (Functional Composition)
// ============================================================================

/**
 * Resolve configuration from multiple sources with precedence:
 * 1. CLI options (highest priority)
 * 2. Existing config file
 * 3. Auto-detection (lowest priority)
 */
export const resolveConfiguration = async (
  fs: FileSystem,
  logger: Logger,
  options: CLIOptions,
  projectRoot: string = process.cwd()
): Promise<Result<InstallConfig, InstallError>> => {
  try {
    logger.step('Resolving configuration...');

    // Read existing config file
    const existingConfigResult = await readTrailheadConfig(fs, projectRoot);
    if (!existingConfigResult.isOk()) return existingConfigResult;

    const existingConfig = existingConfigResult.value;

    // Auto-detect directories only if not provided via CLI
    let catalystDir: string;
    let destinationDir: string;
    let componentsDir: string;
    let libDir: string;

    // Catalyst directory resolution
    if (options.catalystDir) {
      catalystDir = options.catalystDir;
    } else if (existingConfig?.catalystDir) {
      catalystDir = existingConfig.catalystDir;
    } else {
      const catalystDirResult = await detectCatalystDir(fs, projectRoot);
      if (!catalystDirResult.isOk()) {
        return catalystDirResult;
      }
      catalystDir = catalystDirResult.value;
    }

    // Destination directory resolution (new single destination approach)
    if (options.destinationDir) {
      destinationDir = options.destinationDir;
    } else if (existingConfig?.destinationDir) {
      destinationDir = existingConfig.destinationDir;
    } else {
      // Detect default destination directory based on project structure
      const srcComponentsExists = await fs.access(path.join(projectRoot, 'src', 'components'));
      if (srcComponentsExists.isOk()) {
        destinationDir = path.join('src', 'components', 'th');
      } else {
        destinationDir = path.join('components', 'th');
      }
    }

    // Derive componentsDir and libDir from destinationDir
    componentsDir = path.resolve(projectRoot, destinationDir);
    libDir = path.resolve(projectRoot, destinationDir, 'lib');

    // Create resolved configuration
    const resolvedConfig: InstallConfig = {
      projectRoot,
      catalystDir,
      destinationDir,
      componentsDir,
      libDir,
    };

    // Validate the resolved configuration
    const validateResult = validateInstallConfig(resolvedConfig);
    if (!validateResult.isOk()) return validateResult;

    // Log what was resolved
    if (options.verbose) {
      logger.debug(`Resolved configuration:`);
      logger.debug(`  Project root: ${resolvedConfig.projectRoot}`);
      logger.debug(`  Catalyst dir: ${resolvedConfig.catalystDir}`);
      logger.debug(`  Destination dir: ${resolvedConfig.destinationDir}`);
      logger.debug(`  Components dir: ${resolvedConfig.componentsDir}`);
      logger.debug(`  Lib dir: ${resolvedConfig.libDir}`);
    }

    return ok(validateResult.value);
  } catch (error) {
    return err(
      createError('CONFIGURATION_ERROR', 'Failed to resolve configuration', {
        details: error instanceof Error ? error.message : 'Unknown error',
        cause: error,
      })
    );
  }
};

/**
 * Interactive configuration prompting (for when auto-detection needs confirmation)
 */
export const promptForConfiguration = async (
  detectedConfig: Partial<InstallConfig>,
  logger: Logger
): Promise<Result<InstallConfig, InstallError>> => {
  logger.info('Configuration detected:');

  if (detectedConfig.catalystDir) {
    logger.info(`  Catalyst UI Kit: ${detectedConfig.catalystDir}`);
  } else {
    logger.warning('  Catalyst UI Kit: Not found');
  }

  if (detectedConfig.destinationDir) {
    logger.info(`  Destination directory: ${detectedConfig.destinationDir}`);
  }

  if (detectedConfig.componentsDir) {
    logger.info(`  Components directory: ${detectedConfig.componentsDir}`);
  }

  if (detectedConfig.libDir) {
    logger.info(`  Library directory: ${detectedConfig.libDir}`);
  }

  // For now, we'll proceed with auto-detection
  // In a future enhancement, we could add readline prompting here
  const projectRoot = detectedConfig.projectRoot || process.cwd();
  const destinationDir = detectedConfig.destinationDir || path.join('components', 'th');
  const config: InstallConfig = {
    projectRoot,
    catalystDir: detectedConfig.catalystDir || '',
    destinationDir,
    componentsDir: path.resolve(projectRoot, destinationDir),
    libDir: path.resolve(projectRoot, destinationDir, 'lib'),
  };

  return validateInstallConfig(config);
};

// ============================================================================
// CONFIGURATION VERIFICATION
// ============================================================================

/**
 * Verify that the resolved configuration paths are valid
 */
export const verifyConfiguration = async (
  fs: FileSystem,
  config: InstallConfig
): Promise<Result<void, InstallError>> => {
  // Check if catalyst directory exists and contains TypeScript files
  const catalystExistsResult = await fs.access(config.catalystDir);
  if (!catalystExistsResult.isOk()) {
    return err(
      createError(
        'CONFIGURATION_ERROR',
        `Catalyst UI Kit directory not found: ${config.catalystDir}`,
        {
          details: `💡 Expected Catalyst UI Kit structure:\n   catalyst-ui-kit/\n   └── typescript/\n       ├── button.tsx\n       ├── input.tsx\n       ├── alert.tsx\n       └── ... (27 component files)\n\n📋 To fix this:\n1. Download Catalyst UI Kit from Tailwind Plus\n2. Extract the ZIP file to your project directory\n3. Point to the typescript/ directory within catalyst-ui-kit\n\n🔍 Try running with:\n   npx tsx scripts/install.ts --catalyst-dir /path/to/catalyst-ui-kit/typescript\n\n💻 Or use the interactive CLI:\n   pnpm trailhead-ui install`,
        }
      )
    );
  }

  // Check if catalyst directory contains component files
  const readDirResult = await fs.readdir(config.catalystDir);
  if (!readDirResult.isOk()) return readDirResult;

  const hasComponents = readDirResult.value.some(isTsxFile);
  if (!hasComponents) {
    return err(
      createError(
        'CONFIGURATION_ERROR',
        `No TypeScript component files found in: ${config.catalystDir}`,
        {
          details: `💡 Expected Catalyst UI Kit structure:\n   catalyst-ui-kit/\n   └── typescript/\n       ├── button.tsx ← Missing\n       ├── input.tsx ← Missing\n       ├── alert.tsx ← Missing\n       └── ... (27 component files)\n\n📋 To fix this:\n1. Ensure you downloaded the TypeScript version from Tailwind Plus\n2. Point to the typescript/ directory (not the root catalyst-ui-kit/)\n3. Check that component files (.tsx) are present\n\n🔍 Try running with:\n   npx tsx scripts/install.ts --catalyst-dir /path/to/catalyst-ui-kit/typescript\n\n💻 Or use the interactive CLI:\n   pnpm trailhead-ui install`,
        }
      )
    );
  }

  return ok(undefined);
};
