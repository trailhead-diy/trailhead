/**
 * Component installation module
 */

import * as path from 'path';
import type { FileSystem, Result, InstallError, InstallConfig, Logger } from './types.js';
import { Ok, Err } from './types.js';
import { generateSourcePaths, generateDestinationPaths } from '../filesystem/paths.js';
import {
  copyDirectory,
  writeFileWithBackup,
  checkDirectoryContents,
} from '../filesystem/operations.js';
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
  const sourceCheckResult = await checkDirectoryContents(fs, sourcePaths.catalystDir);
  if (!sourceCheckResult.success) return sourceCheckResult;

  if (!sourceCheckResult.value.exists) {
    return Err({
      type: 'FileSystemError',
      message: `Source Catalyst directory not found: ${sourcePaths.catalystDir}`,
      path: sourcePaths.catalystDir,
    });
  }

  // Copy entire catalyst directory
  const copyResult = await copyDirectory(fs, sourcePaths.catalystDir, destPaths.catalystDir, {
    overwrite: force,
    filter: (src: string) => {
      // Only copy .tsx files
      return src.endsWith('.tsx') || !path.extname(src);
    },
  });

  if (!copyResult.success) return copyResult;

  const catalystFiles = copyResult.value.filter(isTsxFile);

  // Install lib/index.ts
  const libIndexResult = await copyFile(fs, sourcePaths.libIndex, destPaths.libIndex, force);
  if (!libIndexResult.success) return libIndexResult;

  logger.success(`Installed ${catalystFiles.length} Catalyst components and lib index`);

  return Ok([...catalystFiles.map((file: string) => `lib/${file}`), 'lib/index.ts']);
};

// ============================================================================
// COMPONENT WRAPPER GENERATION
// ============================================================================

/**
 * Pure function: Generate wrapper component content
 */
export const generateWrapperComponent = (componentName: string): string => {
  return `export * from './lib/${componentName}.js'\n`;
};

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
  const dirCheckResult = await checkDirectoryContents(fs, sourceWrapperDir);
  if (!dirCheckResult.success) return dirCheckResult;

  if (!dirCheckResult.value.exists) {
    return Err({
      type: 'FileSystemError',
      message: `Source wrapper components directory not found: ${sourceWrapperDir}`,
      path: sourceWrapperDir,
    });
  }

  // Get all component wrapper files (excluding theme-related and index files)
  const wrapperFiles = dirCheckResult.value.files.filter(isWrapperComponent);

  for (const wrapperFile of wrapperFiles) {
    const sourcePath = path.join(sourceWrapperDir, wrapperFile);
    const destPath = path.join(config.componentsDir, wrapperFile);

    // Copy the wrapper file
    const copyResult = await copyFile(fs, sourcePath, destPath, force);
    if (!copyResult.success) return copyResult;

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
  if (!componentsIndexResult.success) return componentsIndexResult;
  installedFiles.push('index.ts');
  logger.debug('Installed components index.ts');

  logger.success(`Installed ${installedFiles.length} component wrappers`);
  return Ok(installedFiles);
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
  if (!ensureDirsResult.success) return ensureDirsResult;

  const ensureUtilsResult = await fs.ensureDir(utilsDir);
  if (!ensureUtilsResult.success) return ensureUtilsResult;

  // Install utils/cn.ts
  const cnUtilsResult = await copyFile(fs, sourcePaths.cnUtils, destPaths.cnUtils, force);
  if (!cnUtilsResult.success) return cnUtilsResult;

  installedFiles.push('utils/cn.ts');
  logger.debug('Installed utils/cn.ts');

  // Install utils/semantic-tokens.ts
  const semanticResult = await copyFile(
    fs,
    sourcePaths.semanticTokens,
    destPaths.semanticTokens,
    force
  );
  if (!semanticResult.success) return semanticResult;

  installedFiles.push('utils/semantic-tokens.ts');
  logger.debug('Installed utils/semantic-tokens.ts');

  logger.success(`Installed ${installedFiles.length} utility files`);
  return Ok(installedFiles);
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
  const existsResult = await fs.exists(src);
  if (!existsResult.success) return existsResult;

  if (!existsResult.value) {
    return Err({
      type: 'FileSystemError',
      message: `Source file not found: ${src}`,
      path: src,
    });
  }

  return fs.copy(src, dest, { overwrite: force });
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
  force: boolean = false
): Promise<Result<string[], InstallError>> => {
  const sourcePaths = generateSourcePaths(trailheadRoot);
  const installedFiles: string[] = [];

  // Check if source catalyst directory exists
  const sourceCheckResult = await checkDirectoryContents(fs, sourcePaths.catalystDir);
  if (!sourceCheckResult.success) return sourceCheckResult;

  if (!sourceCheckResult.value.exists) {
    return Err({
      type: 'FileSystemError',
      message: `Source Catalyst directory not found: ${sourcePaths.catalystDir}`,
      path: sourcePaths.catalystDir,
    });
  }

  // Get all catalyst-*.tsx files
  const catalystFiles = sourceCheckResult.value.files.filter(isCatalystComponent);

  // Transform and copy each component file
  for (const fileName of catalystFiles) {
    const sourcePath = path.join(sourcePaths.catalystDir, fileName);
    const newFileName = getTransformedFileName(fileName);
    const destPath = path.join(config.componentsDir, newFileName);

    // Read source file
    const readResult = await fs.readFile(sourcePath);
    if (!readResult.success) return readResult;

    // Get transformation options
    const transformOptions = getTransformOptions(fileName);

    // Transform content
    const transformResult = transformComponentContent(readResult.value, fileName, transformOptions);

    // Validate transformation result
    const validationResult = validateTransformResult(transformResult, fileName);
    if (!validationResult.success) return validationResult;

    // Log transformations in debug mode
    if (transformResult.transformations.length > 0) {
      logger.debug(`Transformations for ${fileName}:`);
      transformResult.transformations.forEach(t => logger.debug(`  - ${t}`));
    }

    // Write transformed file
    const writeResult = force
      ? await fs.writeFile(destPath, transformResult.content)
      : await writeFileWithBackup(fs, destPath, transformResult.content);
    if (!writeResult.success) return writeResult;

    installedFiles.push(newFileName);
    logger.debug(`Installed and transformed ${newFileName}`);
  }

  // Transform and copy lib/index.ts to root index.ts
  const libIndexPath = path.join(sourcePaths.catalystDir, 'index.ts');
  const destIndexPath = path.join(config.componentsDir, 'index.ts');

  const indexReadResult = await fs.readFile(libIndexPath);
  if (!indexReadResult.success) return indexReadResult;

  const transformedIndexResult = transformLibIndexContent(indexReadResult.value);

  // Validate index transformation
  const indexValidationResult = validateTransformResult(transformedIndexResult, 'index.ts');
  if (!indexValidationResult.success) return indexValidationResult;

  // Log index transformations
  if (transformedIndexResult.transformations.length > 0) {
    logger.debug(`Transformations for index.ts:`);
    transformedIndexResult.transformations.forEach(t => logger.debug(`  - ${t}`));
  }

  const indexWriteResult = force
    ? await fs.writeFile(destIndexPath, transformedIndexResult.content)
    : await writeFileWithBackup(fs, destIndexPath, transformedIndexResult.content);
  if (!indexWriteResult.success) return indexWriteResult;

  installedFiles.push('index.ts');

  logger.success(`Installed ${installedFiles.length} transformed components`);
  return Ok(installedFiles);
};
