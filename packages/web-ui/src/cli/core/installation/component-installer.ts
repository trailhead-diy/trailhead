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
  if (!sourceCheckResult.isOk()) {
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

  if (!copyResult.isOk()) return copyResult;

  // Get list of files in catalyst directory
  const readDirResult = await fs.readdir(sourcePaths.catalystDir);
  if (!readDirResult.isOk()) return readDirResult;

  const catalystFiles = readDirResult.value.filter(isTsxFile);

  // Install lib/index.ts
  const libIndexResult = await copyFile(fs, sourcePaths.libIndex, destPaths.libIndex, force);
  if (!libIndexResult.isOk()) return libIndexResult;

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
  if (!dirCheckResult.isOk()) return dirCheckResult;

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
  if (!readDirResult.isOk()) return readDirResult;

  const wrapperFiles = readDirResult.value.filter(isWrapperComponent);

  for (const wrapperFile of wrapperFiles) {
    const sourcePath = path.join(sourceWrapperDir, wrapperFile);
    const destPath = path.join(config.componentsDir, wrapperFile);

    // Copy the wrapper file
    const copyResult = await copyFile(fs, sourcePath, destPath, force);
    if (!copyResult.isOk()) return copyResult;

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
  if (!componentsIndexResult.isOk()) return componentsIndexResult;
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
  if (!ensureDirsResult.isOk()) return ensureDirsResult;

  const ensureUtilsResult = await fs.ensureDir(utilsDir);
  if (!ensureUtilsResult.isOk()) return ensureUtilsResult;

  // Install utils/cn.ts
  const cnUtilsResult = await copyFile(fs, sourcePaths.cnUtils, destPaths.cnUtils, force);
  if (!cnUtilsResult.isOk()) return cnUtilsResult;

  installedFiles.push('utils/cn.ts');
  logger.debug('Installed utils/cn.ts');

  // Install utils/semantic-tokens.ts
  const semanticResult = await copyFile(
    fs,
    sourcePaths.semanticTokens,
    destPaths.semanticTokens,
    force
  );
  if (!semanticResult.isOk()) return semanticResult;

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
  if (!existsResult.isOk()) return existsResult;

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
  if (!sourceCheckResult.isOk()) return sourceCheckResult;

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
  if (!readDirResult.isOk()) return readDirResult;

  const catalystFiles = readDirResult.value.filter(isCatalystComponent);

  // Transform and copy each component file
  for (const fileName of catalystFiles) {
    const sourcePath = path.join(sourcePaths.catalystDir, fileName);
    const newFileName = getTransformedFileName(fileName);
    const destPath = path.join(config.componentsDir, newFileName);

    // Read source file
    const readResult = await fs.readFile(sourcePath);
    if (!readResult.isOk()) return readResult;

    // Get transformation options
    const transformOptions = getTransformOptions(fileName);

    // Transform content
    const transformResult = transformComponentContent(readResult.value, fileName, transformOptions);

    // Validate transformation result
    const validationResult = validateTransformResult(transformResult, fileName);
    if (!validationResult.isOk()) return validationResult;

    // Log transformations in debug mode
    if (transformResult.transformations.length > 0) {
      logger.debug(`Transformations for ${fileName}:`);
      transformResult.transformations.forEach(t => logger.debug(`  - ${t}`));
    }

    // Write transformed file
    const writeResult = await fs.writeFile(destPath, transformResult.content);
    if (!writeResult.isOk()) return writeResult;

    installedFiles.push(newFileName);
    logger.debug(`Installed and transformed ${newFileName}`);
  }

  // Transform and copy lib/index.ts to root index.ts
  const libIndexPath = path.join(sourcePaths.catalystDir, 'index.ts');
  const destIndexPath = path.join(config.componentsDir, 'index.ts');

  const indexReadResult = await fs.readFile(libIndexPath);
  if (!indexReadResult.isOk()) return indexReadResult;

  const transformedIndexResult = transformLibIndexContent(indexReadResult.value);

  // Validate index transformation
  const indexValidationResult = validateTransformResult(transformedIndexResult, 'index.ts');
  if (!indexValidationResult.isOk()) return indexValidationResult;

  // Log index transformations
  if (transformedIndexResult.transformations.length > 0) {
    logger.debug(`Transformations for index.ts:`);
    transformedIndexResult.transformations.forEach(t => logger.debug(`  - ${t}`));
  }

  const indexWriteResult = await fs.writeFile(destIndexPath, transformedIndexResult.content);
  if (!indexWriteResult.isOk()) return indexWriteResult;

  installedFiles.push('index.ts');

  logger.success(`Installed ${installedFiles.length} transformed components`);
  return ok(installedFiles);
};
