/**
 * Workspace and monorepo detection module
 */

import * as path from 'path';
import { pathExists } from '@esteban-url/trailhead-cli/filesystem';
import type { FileSystem, Result, InstallError } from './types.js';
import { Ok, Err } from './types.js';
import { createError } from '@esteban-url/trailhead-cli/core';

/**
 * Helper function to check if a path exists using CLI framework pathExists
 * Converts CLI framework Result<boolean, Error> to our InstallError type
 */
const checkPathExists = async (filePath: string): Promise<Result<boolean, InstallError>> => {
  const result = await pathExists(filePath);
  if (result.success) {
    return Ok(result.value);
  } else {
    return Err(
      createError('FILESYSTEM_ERROR', 'Failed to check path existence', {
        details: `Path: ${filePath}`,
        cause: result.error,
      })
    );
  }
};

// ============================================================================
// TYPES
// ============================================================================

export interface WorkspaceInfo {
  readonly type: 'pnpm' | 'lerna' | 'rush' | 'npm' | 'yarn';
  readonly configFile: string;
  readonly workspaces?: readonly string[];
  readonly root: string;
}

export interface CIEnvironment {
  readonly type: 'github' | 'gitlab' | 'circleci' | 'jenkins' | 'netlify' | 'vercel' | 'generic';
  readonly name: string;
  readonly isCI: true;
}

// ============================================================================
// WORKSPACE DETECTION FUNCTIONS
// ============================================================================

/**
 * Check for pnpm workspace
 */
const checkPnpmWorkspace = async (fs: FileSystem, root: string): Promise<WorkspaceInfo | null> => {
  const configPath = path.join(root, 'pnpm-workspace.yaml');
  const existsResult = await checkPathExists(configPath);

  if (!existsResult.success || !existsResult.value) {
    return null;
  }

  return {
    type: 'pnpm',
    configFile: 'pnpm-workspace.yaml',
    root,
  };
};

/**
 * Check for lerna workspace
 */
const checkLernaWorkspace = async (fs: FileSystem, root: string): Promise<WorkspaceInfo | null> => {
  const configPath = path.join(root, 'lerna.json');
  const existsResult = await checkPathExists(configPath);

  if (!existsResult.success || !existsResult.value) {
    return null;
  }

  return {
    type: 'lerna',
    configFile: 'lerna.json',
    root,
  };
};

/**
 * Check for rush workspace
 */
const checkRushWorkspace = async (fs: FileSystem, root: string): Promise<WorkspaceInfo | null> => {
  const configPath = path.join(root, 'rush.json');
  const existsResult = await checkPathExists(configPath);

  if (!existsResult.success || !existsResult.value) {
    return null;
  }

  return {
    type: 'rush',
    configFile: 'rush.json',
    root,
  };
};

/**
 * Check for npm/yarn workspaces in package.json
 */
const checkPackageJsonWorkspace = async (
  fs: FileSystem,
  root: string
): Promise<WorkspaceInfo | null> => {
  const pkgPath = path.join(root, 'package.json');
  const existsResult = await checkPathExists(pkgPath);

  if (!existsResult.success || !existsResult.value) {
    return null;
  }

  const readResult = await fs.readJson<{
    workspaces?: string[] | { packages?: string[] };
  }>(pkgPath);

  if (!readResult.success || !readResult.value.workspaces) {
    return null;
  }

  const workspaces = Array.isArray(readResult.value.workspaces)
    ? readResult.value.workspaces
    : readResult.value.workspaces.packages;

  if (!workspaces || workspaces.length === 0) {
    return null;
  }

  // Determine if it's npm or yarn by checking for yarn.lock
  const yarnLockResult = await checkPathExists(path.join(root, 'yarn.lock'));
  const isYarn = yarnLockResult.success && yarnLockResult.value;

  return {
    type: isYarn ? 'yarn' : 'npm',
    configFile: 'package.json',
    workspaces: Object.freeze(workspaces),
    root,
  };
};

/**
 * Detect workspace configuration
 */
export const detectWorkspace = async (
  fs: FileSystem,
  projectRoot: string
): Promise<Result<WorkspaceInfo | null, InstallError>> => {
  const detectors = [
    checkPnpmWorkspace,
    checkLernaWorkspace,
    checkRushWorkspace,
    checkPackageJsonWorkspace,
  ];

  try {
    for (const detector of detectors) {
      const result = await detector(fs, projectRoot);
      if (result) return Ok(result);
    }
    return Ok(null);
  } catch (error) {
    return Err(
      createError('WORKSPACE_DETECTION_ERROR', 'Failed to detect workspace', {
        details: `Project root: ${projectRoot}`,
        cause: error,
      })
    );
  }
};

// ============================================================================
// CI ENVIRONMENT DETECTION
// ============================================================================

/**
 * Detect CI environment from environment variables
 */
export const detectCIEnvironment = (): CIEnvironment | null => {
  const env = process.env;

  // Check specific CI environments
  if (env.GITHUB_ACTIONS) {
    return { type: 'github', name: 'GitHub Actions', isCI: true };
  }

  if (env.GITLAB_CI) {
    return { type: 'gitlab', name: 'GitLab CI', isCI: true };
  }

  if (env.CIRCLECI) {
    return { type: 'circleci', name: 'CircleCI', isCI: true };
  }

  if (env.JENKINS_URL || env.JENKINS_HOME) {
    return { type: 'jenkins', name: 'Jenkins', isCI: true };
  }

  if (env.NETLIFY) {
    return { type: 'netlify', name: 'Netlify', isCI: true };
  }

  if (env.VERCEL || env.NOW_BUILDER) {
    return { type: 'vercel', name: 'Vercel', isCI: true };
  }

  // Generic CI detection
  if (env.CI === 'true' || env.CONTINUOUS_INTEGRATION === 'true') {
    return { type: 'generic', name: 'CI', isCI: true };
  }

  return null;
};

// ============================================================================
// OFFLINE MODE DETECTION
// ============================================================================

/**
 * Check if running in offline mode
 */
export const checkOfflineMode = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://registry.npmjs.org/-/ping', {
      signal: controller.signal,
      method: 'HEAD',
    });

    clearTimeout(timeoutId);
    return !response.ok;
  } catch {
    return true;
  }
};

// ============================================================================
// WORKSPACE PATH RESOLUTION
// ============================================================================

/**
 * Resolve actual workspace root from a subdirectory
 */
export const findWorkspaceRoot = async (
  fs: FileSystem,
  startPath: string
): Promise<Result<string | null, InstallError>> => {
  try {
    let currentPath = startPath;
    const root = path.parse(currentPath).root;

    while (currentPath !== root) {
      const workspaceResult = await detectWorkspace(fs, currentPath);

      if (workspaceResult.success && workspaceResult.value) {
        return Ok(currentPath);
      }

      currentPath = path.dirname(currentPath);
    }

    return Ok(null);
  } catch (error) {
    return Err(
      createError('WORKSPACE_ROOT_SEARCH_ERROR', 'Failed to find workspace root', {
        details: `Start path: ${startPath}`,
        cause: error,
      })
    );
  }
};

/**
 * Check if a path is within a workspace
 */
export const isInWorkspace = async (fs: FileSystem, projectPath: string): Promise<boolean> => {
  const rootResult = await findWorkspaceRoot(fs, projectPath);
  return rootResult.success && rootResult.value !== null;
};

// ============================================================================
// WORKSPACE UTILITIES
// ============================================================================

/**
 * Get workspace package directories
 */
export const getWorkspacePackages = async (
  fs: FileSystem,
  workspace: WorkspaceInfo
): Promise<Result<readonly string[], InstallError>> => {
  if (!workspace.workspaces) {
    return Ok([]);
  }

  try {
    const _packages: string[] = [];

    // TODO: Implement glob pattern matching for workspace paths
    // For now, return the workspace patterns as-is
    return Ok(Object.freeze(workspace.workspaces!));
  } catch (error) {
    return Err(
      createError('WORKSPACE_PACKAGES_ERROR', 'Failed to get workspace packages', {
        details: `Workspace root: ${workspace.root}`,
        cause: error,
      })
    );
  }
};

/**
 * Determine if dependencies should be installed at workspace root
 */
export const shouldInstallAtRoot = (
  workspace: WorkspaceInfo | null,
  isSharedDependency: boolean
): boolean => {
  if (!workspace) return false;

  // For pnpm workspaces, shared dependencies go to root
  if (workspace.type === 'pnpm' && isSharedDependency) {
    return true;
  }

  // For lerna, depends on configuration (default to false)
  if (workspace.type === 'lerna') {
    return false; // Would need to read lerna.json for actual behavior
  }

  // For npm/yarn workspaces, typically install at package level
  return false;
};
