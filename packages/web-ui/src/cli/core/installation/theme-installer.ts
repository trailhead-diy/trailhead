/**
 * Theme system installation module
 */

import type { FileSystem, Result, InstallError, InstallConfig, Logger } from './types.js';
import { Ok } from './types.js';
import { generateSourcePaths, generateDestinationPaths } from '../filesystem/paths.js';
import { ensureDirectories, copyFiles } from '../filesystem/operations.js';

// ============================================================================
// THEME INSTALLATION
// ============================================================================

/**
 * Install theme system files
 */
export const installThemeSystem = async (
  fs: FileSystem,
  logger: Logger,
  trailheadRoot: string,
  config: InstallConfig,
  force: boolean = false
): Promise<Result<string[], InstallError>> => {
  const sourcePaths = generateSourcePaths(trailheadRoot);
  const destPaths = generateDestinationPaths(config);

  // Ensure destination theme directory exists
  const ensureDirResult = await ensureDirectories(fs, [destPaths.themeDir]);
  if (!ensureDirResult.success) return ensureDirResult;

  const themeFiles = [
    { src: sourcePaths.themeConfig, dest: destPaths.themeConfig, name: 'theme/config.ts' },
    { src: sourcePaths.themeBuilder, dest: destPaths.themeBuilder, name: 'theme/builder.ts' },
    { src: sourcePaths.themeRegistry, dest: destPaths.themeRegistry, name: 'theme/registry.ts' },
    { src: sourcePaths.themeUtils, dest: destPaths.themeUtils, name: 'theme/utils.ts' },
    { src: sourcePaths.themePresets, dest: destPaths.themePresets, name: 'theme/presets.ts' },
    {
      src: sourcePaths.catalystTheme,
      dest: destPaths.catalystTheme,
      name: 'theme/catalyst-theme.ts',
    },
    {
      src: sourcePaths.semanticTokens,
      dest: destPaths.semanticTokens,
      name: 'theme/semantic-tokens.ts',
    },
    {
      src: sourcePaths.semanticEnhancements,
      dest: destPaths.semanticEnhancements,
      name: 'theme/semantic-enhancements.ts',
    },
    {
      src: sourcePaths.themeProvider,
      dest: destPaths.themeProvider,
      name: 'theme/theme-provider.tsx',
    },
    {
      src: sourcePaths.themeSwitcher,
      dest: destPaths.themeSwitcher,
      name: 'theme/theme-switcher.tsx',
    },
    { src: sourcePaths.themeIndex, dest: destPaths.themeIndex, name: 'theme/index.ts' },
  ];

  const copyResult = await copyFiles(fs, themeFiles, { overwrite: force }, logger);

  if (!copyResult.success) return copyResult;

  logger.success(`Installed ${copyResult.value.length} theme system files`);

  return Ok(themeFiles.map(f => f.name));
};

// ============================================================================
// THEME COMPONENT INSTALLATION
// ============================================================================

/**
 * Install theme component wrappers (ThemeProvider, ThemeSwitcher)
 */
export const installThemeComponents = async (
  fs: FileSystem,
  logger: Logger,
  trailheadRoot: string,
  config: InstallConfig,
  force: boolean = false
): Promise<Result<string[], InstallError>> => {
  const sourcePaths = generateSourcePaths(trailheadRoot);
  const destPaths = generateDestinationPaths(config);

  // Ensure destination components directory exists
  const ensureDirResult = await ensureDirectories(fs, [config.componentsDir]);
  if (!ensureDirResult.success) return ensureDirResult;

  const componentFiles = [
    { src: sourcePaths.themeProvider, dest: destPaths.themeProvider, name: 'theme-provider.tsx' },
    { src: sourcePaths.themeSwitcher, dest: destPaths.themeSwitcher, name: 'theme-switcher.tsx' },
  ];

  const copyResult = await copyFiles(
    fs,
    componentFiles.filter(f => f.src && f.dest), // Filter out any undefined paths
    { overwrite: force },
    logger
  );

  if (!copyResult.success) return copyResult;

  logger.success(`Installed ${copyResult.value.length} theme components`);

  return Ok(copyResult.value);
};
