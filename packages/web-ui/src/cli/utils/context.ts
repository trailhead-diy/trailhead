/**
 * CLI context utilities
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createNodeFileSystem } from '@esteban-url/trailhead-cli/filesystem';
import type { CLIContext } from './types.js';

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
 * Pure function: Create CLI context
 */
export const createCLIContext = async (baseDir: string): Promise<CLIContext> => {
  const projectRoot = process.cwd();

  return {
    version: await getPackageVersion(baseDir),
    projectRoot,
    isTrailheadProject: false,
  };
};

/**
 * Pure function: Get script directory
 */
export const getScriptDir = (): string => {
  const __filename = fileURLToPath(import.meta.url);
  return dirname(__filename);
};
