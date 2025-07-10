/**
 * Component installation module
 */

import * as path from 'node:path';
import type { FileSystem, Result, InstallError, InstallConfig, Logger } from './types.js';
import { ok, err, createError } from '@esteban-url/trailhead-cli/core';
import { generateSourcePaths, generateDestinationPaths } from '../filesystem/paths.js';
import { pathExists } from '@esteban-url/trailhead-cli/filesystem';
import {
  transformComponentContent,
  getTransformOptions,
  transformLibIndexContent,
  getTransformedFileName,
  validateTransformResult,
} from './component-transformer.js';
import { isTsxFile, isCatalystComponent, isWrapperComponent } from '../shared/file-filters.js';

// ============================================================================
// CATALYST COMPONENT INSTALLATION
// ============================================================================

/**
 * Install Catalyst component files
 */
export const installCatalystComponents = async (
  fs: FileSystem,
  logger: Logger,
  trailheadRoot: string,
  config: InstallConfig,
  force: boolean = false
): Promise<Result<string[], InstallError>> => {
  const sourcePaths = generateSourcePaths(trailheadRoot);
  const destPaths = generateDestinationPaths(config);

  // Check if source catalyst directory exists
  const sourceCheckResult = await pathExists(sourcePaths.catalystDir);
  if (sourceCheckResult.isErr()) {
    return err(sourceCheckResult.error);
  }

  if (!sourceCheckResult.value) {
    return err(
      createError(
        'SOURCE_NOT_FOUND',
        `Source Catalyst directory not found: ${sourcePaths.catalystDir}`
      )
    );
  }

  // Copy entire catalyst directory
  const copyResult = await fs.cp(sourcePaths.catalystDir, destPaths.catalystDir, {
    overwrite: force,
  });

  if (copyResult.isErr()) return err(copyResult.error);

  // Get list of files in catalyst directory
  const readDirResult = await fs.readdir(sourcePaths.catalystDir);
  if (readDirResult.isErr()) return err(readDirResult.error);

  const catalystFiles = readDirResult.value.filter(isTsxFile);

  // Install lib/index.ts
  const libIndexResult = await copyFile(fs, sourcePaths.libIndex, destPaths.libIndex, force);
  if (libIndexResult.isErr()) return err(libIndexResult.error);

  logger.success(`Installed ${catalystFiles.length} Catalyst components and lib index`);

  return ok([...catalystFiles.map((file: string) => `lib/${file}`), 'lib/index.ts']);
};

// ============================================================================
// COMPONENT WRAPPER GENERATION
// ============================================================================

// generateWrapperComponent removed - was unused utility function

/**
 * Install component wrapper files by copying from Trailhead UI source
 */
export const installComponentWrappers = async (
  fs: FileSystem,
  logger: Logger,
  trailheadRoot: string,
  config: InstallConfig,
  force: boolean = false
): Promise<Result<string[], InstallError>> => {
  const sourcePaths = generateSourcePaths(trailheadRoot);
  const destPaths = generateDestinationPaths(config);
  const installedFiles: string[] = [];

  // Read source wrapper components directory
  const sourceWrapperDir = sourcePaths.wrapperComponentsDir;
  const dirCheckResult = await pathExists(sourceWrapperDir);
  if (dirCheckResult.isErr()) return err(dirCheckResult.error);

  if (!dirCheckResult.value) {
    return err(
      createError(
        'SOURCE_NOT_FOUND',
        `Source wrapper components directory not found: ${sourceWrapperDir}`
      )
    );
  }

  // Get all component wrapper files
  const readDirResult = await fs.readdir(sourceWrapperDir);
  if (readDirResult.isErr()) return readDirResult;

  const wrapperFiles = readDirResult.value.filter(isWrapperComponent);

  for (const wrapperFile of wrapperFiles) {
    const sourcePath = path.join(sourceWrapperDir, wrapperFile);
    const destPath = path.join(config.componentsDir, wrapperFile);

    // Copy the wrapper file
    const copyResult = await copyFile(fs, sourcePath, destPath, force);
    if (copyResult.isErr()) return err(copyResult.error);

    installedFiles.push(wrapperFile);
    logger.debug(`Installed wrapper for ${path.basename(wrapperFile, '.tsx')}`);
  }

  // Install the main components index file
  const componentsIndexResult = await copyFile(
    fs,
    sourcePaths.componentsIndex,
    destPaths.componentsIndex,
    force
  );
  if (componentsIndexResult.isErr()) return err(componentsIndexResult.error);
  installedFiles.push('index.ts');
  logger.debug('Installed components index.ts');

  logger.success(`Installed ${installedFiles.length} component wrappers`);
  return ok(installedFiles);
};

// ============================================================================
// UTILITY FILE INSTALLATION
// ============================================================================

/**
 * Install utility files (utils, semantic-tokens, etc.)
 */
export const installUtilityFiles = async (
  fs: FileSystem,
  logger: Logger,
  trailheadRoot: string,
  config: InstallConfig,
  force: boolean = false
): Promise<Result<string[], InstallError>> => {
  const sourcePaths = generateSourcePaths(trailheadRoot);
  const destPaths = generateDestinationPaths(config);
  const installedFiles: string[] = [];

  // Ensure destination directories exist
  const libDir = path.join(config.componentsDir, 'lib');
  const utilsDir = path.join(config.componentsDir, 'utils');

  const ensureDirsResult = await fs.ensureDir(libDir);
  if (ensureDirsResult.isErr()) return err(ensureDirsResult.error);

  const ensureUtilsResult = await fs.ensureDir(utilsDir);
  if (ensureUtilsResult.isErr()) return err(ensureUtilsResult.error);

  // Install utils/cn.ts
  const cnUtilsResult = await copyFile(fs, sourcePaths.cnUtils, destPaths.cnUtils, force);
  if (cnUtilsResult.isErr()) return err(cnUtilsResult.error);

  installedFiles.push('utils/cn.ts');
  logger.debug('Installed utils/cn.ts');

  // Install utils/semantic-tokens.ts
  const semanticResult = await copyFile(
    fs,
    sourcePaths.semanticTokens,
    destPaths.semanticTokens,
    force
  );
  if (semanticResult.isErr()) return err(semanticResult.error);

  installedFiles.push('utils/semantic-tokens.ts');
  logger.debug('Installed utils/semantic-tokens.ts');

  logger.success(`Installed ${installedFiles.length} utility files`);
  return ok(installedFiles);
};

/**
 * Copy a single file with proper error handling
 */
async function copyFile(
  fs: FileSystem,
  src: string,
  dest: string,
  force: boolean
): Promise<Result<void, InstallError>> {
  const existsResult = await pathExists(src);
  if (existsResult.isErr()) return err(existsResult.error);

  if (!existsResult.value) {
    return err(createError('FILE_NOT_FOUND', `Source file not found: ${src}`));
  }

  return fs.cp(src, dest, { overwrite: force });
}

// ============================================================================
// TRANSFORMED COMPONENTS INSTALLATION (NO WRAPPERS)
// ============================================================================

/**
 * Install components without wrappers, applying transformations
 */
export const installTransformedComponents = async (
  fs: FileSystem,
  logger: Logger,
  trailheadRoot: string,
  config: InstallConfig,
  _force: boolean = false
): Promise<Result<string[], InstallError>> => {
  const sourcePaths = generateSourcePaths(trailheadRoot);
  const installedFiles: string[] = [];

  // Check if source catalyst directory exists
  const sourceCheckResult = await pathExists(sourcePaths.catalystDir);
  if (sourceCheckResult.isErr()) return err(sourceCheckResult.error);

  if (!sourceCheckResult.value) {
    return err(
      createError(
        'SOURCE_NOT_FOUND',
        `Source Catalyst directory not found: ${sourcePaths.catalystDir}`
      )
    );
  }

  // Get all catalyst-*.tsx files
  const readDirResult = await fs.readdir(sourcePaths.catalystDir);
  if (readDirResult.isErr()) return err(readDirResult.error);

  const catalystFiles = readDirResult.value.filter(isCatalystComponent);

  // Transform and copy each component file
  for (const fileName of catalystFiles) {
    const sourcePath = path.join(sourcePaths.catalystDir, fileName);
    const newFileName = getTransformedFileName(fileName);
    const destPath = path.join(config.componentsDir, newFileName);

    // Read source file
    const readResult = await fs.readFile(sourcePath);
    if (readResult.isErr()) return err(readResult.error);

    // Get transformation options
    const transformOptions = getTransformOptions(fileName);

    // Transform content
    const transformResult = transformComponentContent(readResult.value, fileName, transformOptions);

    // Validate transformation result
    const validationResult = validateTransformResult(transformResult, fileName);
    if (validationResult.isErr()) return err(validationResult.error);

    // Log transformations in debug mode
    if (transformResult.transformations.length > 0) {
      logger.debug(`Transformations for ${fileName}:`);
      transformResult.transformations.forEach(t => logger.debug(`  - ${t}`));
    }

    // Write transformed file
    const writeResult = await fs.writeFile(destPath, transformResult.content);
    if (writeResult.isErr()) return err(writeResult.error);

    installedFiles.push(newFileName);
    logger.debug(`Installed and transformed ${newFileName}`);
  }

  // Transform and copy lib/index.ts to root index.ts
  const libIndexPath = path.join(sourcePaths.catalystDir, 'index.ts');
  const destIndexPath = path.join(config.componentsDir, 'index.ts');

  const indexReadResult = await fs.readFile(libIndexPath);
  if (indexReadResult.isErr()) return err(indexReadResult.error);

  const transformedIndexResult = transformLibIndexContent(indexReadResult.value);

  // Validate index transformation
  const indexValidationResult = validateTransformResult(transformedIndexResult, 'index.ts');
  if (indexValidationResult.isErr()) return err(indexValidationResult.error);

  // Log index transformations
  if (transformedIndexResult.transformations.length > 0) {
    logger.debug(`Transformations for index.ts:`);
    transformedIndexResult.transformations.forEach(t => logger.debug(`  - ${t}`));
  }

  const indexWriteResult = await fs.writeFile(destIndexPath, transformedIndexResult.content);
  if (indexWriteResult.isErr()) return err(indexWriteResult.error);

  installedFiles.push('index.ts');

  logger.success(`Installed ${installedFiles.length} transformed components`);
  return ok(installedFiles);
};
