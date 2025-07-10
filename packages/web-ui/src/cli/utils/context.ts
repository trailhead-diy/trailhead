/**
 * CLI context utilities
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createNodeFileSystem } from '@esteban-url/trailhead-cli/filesystem';
import type { CLIContext } from './types.js';

// Import new CLI package-based configuration
import { loadConfigSync } from '../config.js';

/**
 * Internal helper: Get package version from package.json
 */
const getPackageVersion = async (baseDir: string): Promise<string> => {
  const fs = createNodeFileSystem();
  try {
    const packagePath = join(baseDir, '..', '..', 'package.json');
    const result = await fs.readJson(packagePath);
    if (result.isOk()) {
      const packageJson = result.value as { version?: string };
      return packageJson.version || '1.0.0';
    }
    return '1.0.0';
  } catch {
    return '1.0.0';
  }
};

/**
 * Pure function: Check if current directory is a Trailhead UI project
 */
export const isTrailheadProject = async (projectRoot: string): Promise<boolean> => {
  const fs = createNodeFileSystem();
  try {
    const packageJsonPath = join(projectRoot, 'package.json');
    const accessResult = await fs.access(packageJsonPath);
    if (!accessResult.isOk()) return false;

    const readResult = await fs.readJson(packageJsonPath);
    if (!readResult.isOk()) return false;

    const packageJson = readResult.value as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return !!(
      packageJson.dependencies?.['trailhead-ui'] || packageJson.devDependencies?.['trailhead-ui']
    );
  } catch {
    return false;
  }
};

/**
 * Pure function: Create CLI context
 */
export const createCLIContext = async (baseDir: string): Promise<CLIContext> => {
  const projectRoot = process.cwd();

  // Load configuration using simplified CLI package system
  try {
    const configResult = loadConfigSync(projectRoot);

    return {
      version: await getPackageVersion(baseDir),
      projectRoot,
      isTrailheadProject: await isTrailheadProject(projectRoot),
      config: {
        loaded: true,
        filepath: configResult.filepath,
        data: configResult.config,
      },
    };
  } catch (_error) {
    return {
      version: await getPackageVersion(baseDir),
      projectRoot,
      isTrailheadProject: await isTrailheadProject(projectRoot),
    };
  }
};

/**
 * Pure function: Get script directory
 */
export const getScriptDir = (): string => {
  const __filename = fileURLToPath(import.meta.url);
  return dirname(__filename);
};

/**
 * Pure function: Get Trailhead UI package root
 * Resolves to the installed package location
 */
export const getTrailheadPackageRoot = (): string => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Check if we're running from source or dist
  if (__dirname.includes('/dist/')) {
    // From dist/src/cli/utils/context.js, go up to package root
    return join(__dirname, '..', '..', '..', '..');
  } else {
    // From src/cli/utils/context.ts, go up to package root
    return join(__dirname, '..', '..', '..');
  }
};
