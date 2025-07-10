/**
 * Theme system installation module
 */

import type { FileSystem, Result, InstallError, InstallConfig, Logger } from './types.js';
import { ok, err } from '@esteban-url/trailhead-cli/core';
import { generateSourcePaths, generateDestinationPaths } from '../filesystem/paths.js';

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
  const ensureDirResult = await fs.ensureDir(destPaths.themeDir);
  if (!ensureDirResult.isOk()) return err(ensureDirResult.error);

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

  // Copy theme files using CLI filesystem
  const copiedFiles: string[] = [];
  for (const file of themeFiles) {
    const copyResult = await fs.cp(file.src, file.dest, { overwrite: force });
    if (!copyResult.isOk()) return err(copyResult.error);
    copiedFiles.push(file.name);
  }

  logger.success(`Installed ${copiedFiles.length} theme system files`);

  return ok(themeFiles.map(f => f.name));
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
  const ensureDirResult = await fs.ensureDir(config.componentsDir);
  if (!ensureDirResult.isOk()) return err(ensureDirResult.error);

  const componentFiles = [
    { src: sourcePaths.themeProvider, dest: destPaths.themeProvider, name: 'theme-provider.tsx' },
    { src: sourcePaths.themeSwitcher, dest: destPaths.themeSwitcher, name: 'theme-switcher.tsx' },
  ];

  // Copy component files using CLI filesystem
  const copiedFiles: string[] = [];
  for (const file of componentFiles) {
    const copyResult = await fs.cp(file.src, file.dest, { overwrite: force });
    if (!copyResult.isOk()) return err(copyResult.error);
    copiedFiles.push(file.name);
  }

  logger.success(`Installed ${copiedFiles.length} theme components`);

  return ok(copiedFiles);
};
