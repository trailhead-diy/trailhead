import * as path from 'node:path';
import { createError, ok, err } from '@esteban-url/trailhead-cli/core';
import { createConfig, z } from '@esteban-url/trailhead-cli/config';
import type { FileSystem, Result, InstallError } from './types.js';

export type FrameworkType = 'redwood-sdk' | 'nextjs' | 'vite' | 'generic-react';

export const VALID_FRAMEWORKS: readonly FrameworkType[] = [
  'nextjs',
  'vite',
  'redwood-sdk',
  'generic-react',
] as const;

export interface FrameworkInfo {
  readonly type: FrameworkType;
  readonly name: string;
  readonly version?: string;
  readonly configFiles: readonly string[];
  readonly packageJsonDeps: readonly string[];
}

export interface FrameworkDetectionResult {
  readonly framework: FrameworkInfo;
  readonly confidence: 'high' | 'medium' | 'low';
  readonly projectRoot: string;
}

export const getFrameworkDefinitions = (): readonly FrameworkInfo[] =>
  [
    {
      type: 'redwood-sdk',
      name: 'RedwoodSDK',
      configFiles: ['wrangler.jsonc', 'wrangler.json'],
      packageJsonDeps: ['rwsdk', '@redwoodjs/sdk'],
    },
    {
      type: 'nextjs',
      name: 'Next.js',
      configFiles: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
      packageJsonDeps: ['next'],
    },
    {
      type: 'vite',
      name: 'Vite',
      configFiles: ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'],
      packageJsonDeps: ['vite'],
    },
    {
      type: 'generic-react',
      name: 'React',
      configFiles: [],
      packageJsonDeps: ['react'],
    },
  ] as const;

// ============================================================================
// DETECTION FUNCTIONS (Pure Functions)
// ============================================================================

/**
 * Pure function: Check if package.json contains specific dependencies
 */
export const checkPackageJsonDependencies = (
  packageJson: unknown,
  targetDeps: readonly string[]
): boolean => {
  if (!packageJson || typeof packageJson !== 'object') {
    return false;
  }

  const pkg = packageJson as Record<string, unknown>;
  const dependencies = (pkg.dependencies as Record<string, string>) || {};
  const devDependencies = (pkg.devDependencies as Record<string, string>) || {};

  const allDeps = { ...dependencies, ...devDependencies };

  return targetDeps.some(dep => dep in allDeps);
};

/**
 * Pure function: Calculate detection confidence based on matches
 */
export const calculateConfidence = (
  configFileMatches: number,
  packageJsonMatches: boolean,
  _totalConfigFiles: number
): 'high' | 'medium' | 'low' => {
  if (packageJsonMatches && configFileMatches > 0) {
    return 'high';
  }

  if (packageJsonMatches || configFileMatches > 0) {
    return 'medium';
  }

  return 'low';
};

/**
 * Pure function: Extract version from package.json dependencies
 */
export const extractFrameworkVersion = (
  packageJson: unknown,
  mainDep: string
): string | undefined => {
  if (!packageJson || typeof packageJson !== 'object') {
    return undefined;
  }

  const pkg = packageJson as Record<string, unknown>;
  const dependencies = (pkg.dependencies as Record<string, string>) || {};
  const devDependencies = (pkg.devDependencies as Record<string, string>) || {};

  return dependencies[mainDep] || devDependencies[mainDep];
};

// ============================================================================
// ASYNC DETECTION FUNCTIONS (Dependency Injection)
// ============================================================================

/**
 * Check if config files exist for a framework
 * Uses the provided filesystem interface for proper dependency injection
 */
export const checkConfigFiles = async (
  fs: FileSystem,
  projectRoot: string,
  configFiles: readonly string[]
): Promise<Result<number, InstallError>> => {
  try {
    let matches = 0;

    for (const configFile of configFiles) {
      const configPath = path.join(projectRoot, configFile);
      const existsResult = await fs.access(configPath);

      if (existsResult.isOk()) {
        matches++;
      }
    }

    return ok(matches);
  } catch (error) {
    return err(
      createError('FILESYSTEM_ERROR', 'Failed to check config files', {
        details: `Project root: ${projectRoot}`,
        cause: error,
      })
    );
  }
};

/**
 * Enhanced config detection using CLI framework config system
 */
export const detectConfigWithFramework = async (
  moduleName: string,
  projectRoot: string
): Promise<Result<boolean, InstallError>> => {
  try {
    const configLoader = createConfig({
      name: moduleName,
      schema: z.unknown(), // Accept any config structure for detection
      searchPlaces: [
        `${moduleName}.config.js`,
        `${moduleName}.config.ts`,
        `${moduleName}.config.mjs`,
        `${moduleName}.config.cjs`,
        `.${moduleName}rc`,
        `.${moduleName}rc.js`,
        `.${moduleName}rc.json`,
        `.${moduleName}rc.yaml`,
        `.${moduleName}rc.yml`,
        `package.json`,
      ],
    });

    const result = await configLoader.load(projectRoot);
    return ok(result.filepath !== null);
  } catch (error) {
    return err(
      createError('FILESYSTEM_ERROR', `Failed to detect ${moduleName} configuration`, {
        details: `Project root: ${projectRoot}`,
        cause: error,
      })
    );
  }
};

/**
 * Read and parse package.json
 */
export const readPackageJson = async (
  fs: FileSystem,
  projectRoot: string
): Promise<Result<unknown, InstallError>> => {
  const packageJsonPath = path.join(projectRoot, 'package.json');

  const existsResult = await fs.access(packageJsonPath);
  if (!existsResult.isOk()) {
    return err(
      createError('FILESYSTEM_ERROR', 'package.json not found', {
        details: `Path: ${packageJsonPath}`,
      })
    );
  }

  return await fs.readJson(packageJsonPath);
};

/**
 * Detect single framework
 */
export const detectSingleFramework = async (
  fs: FileSystem,
  projectRoot: string,
  framework: FrameworkInfo,
  packageJson: unknown
): Promise<Result<FrameworkDetectionResult | null, InstallError>> => {
  // Check config files
  const configCheckResult = await checkConfigFiles(fs, projectRoot, framework.configFiles);
  if (configCheckResult.isErr()) {
    return err(configCheckResult.error);
  }

  const configMatches = configCheckResult.value;
  const packageMatches = checkPackageJsonDependencies(packageJson, framework.packageJsonDeps);

  // Skip if no matches at all
  if (configMatches === 0 && !packageMatches) {
    return ok(null);
  }

  const confidence = calculateConfidence(
    configMatches,
    packageMatches,
    framework.configFiles.length
  );
  const version = framework.packageJsonDeps[0]
    ? extractFrameworkVersion(packageJson, framework.packageJsonDeps[0])
    : undefined;

  const detectionResult: FrameworkDetectionResult = {
    framework: {
      ...framework,
      ...(version && { version }),
    },
    confidence,
    projectRoot,
  };

  return ok(detectionResult);
};

/**
 * Detect framework from project directory
 */
export const detectFramework = async (
  fs: FileSystem,
  projectRoot: string,
  forceFramework?: FrameworkType
): Promise<Result<FrameworkDetectionResult, InstallError>> => {
  // Read package.json first
  const packageJsonResult = await readPackageJson(fs, projectRoot);
  if (!packageJsonResult.isOk()) {
    return err(packageJsonResult.error);
  }

  const packageJson = packageJsonResult.value;
  const frameworks = getFrameworkDefinitions();

  // Try enhanced detection for specific frameworks using CLI framework config
  const tailwindDetected = await detectConfigWithFramework('tailwind', projectRoot);
  if (tailwindDetected.isOk() && tailwindDetected.value) {
    // Project uses Tailwind CSS, which is good for our components
  }

  // If framework is forced, only check that one
  if (forceFramework) {
    const targetFramework = frameworks.find(f => f.type === forceFramework);
    if (!targetFramework) {
      return err(
        createError('CONFIGURATION_ERROR', `Unknown framework: ${forceFramework}`, {
          details: `Available frameworks: ${frameworks.map(f => f.type).join(', ')}`,
        })
      );
    }

    const result = await detectSingleFramework(fs, projectRoot, targetFramework, packageJson);
    if (result.isErr()) {
      return err(result.error);
    }

    if (!result.value) {
      // For forced frameworks, create a synthetic detection result with low confidence
      const syntheticResult: FrameworkDetectionResult = {
        framework: targetFramework,
        confidence: 'low',
        projectRoot,
      };
      return ok(syntheticResult);
    }

    return ok(result.value);
  }

  // Detect all frameworks and find best match
  const detectionResults: FrameworkDetectionResult[] = [];

  for (const framework of frameworks) {
    const result = await detectSingleFramework(fs, projectRoot, framework, packageJson);
    if (result.isErr()) {
      return err(result.error);
    }

    if (result.value) {
      detectionResults.push(result.value);
    }
  }

  // No frameworks detected
  if (detectionResults.length === 0) {
    // Fallback to generic React if React is present
    const reactFramework = frameworks.find(f => f.type === 'generic-react')!;
    const reactResult = await detectSingleFramework(fs, projectRoot, reactFramework, packageJson);

    if (reactResult.isErr()) {
      return err(reactResult.error);
    }

    if (reactResult.value) {
      return ok(reactResult.value);
    }

    return err(
      createError('CONFIGURATION_ERROR', 'No supported React framework detected', {
        details: 'Make sure you have React installed or use --framework to specify manually',
      })
    );
  }

  // Sort by confidence and framework priority (RedwoodSDK first, then by definition order)
  detectionResults.sort((a, b) => {
    // High confidence first
    if (a.confidence !== b.confidence) {
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    }

    // Then by framework priority (earlier in array = higher priority)
    const aIndex = frameworks.findIndex(f => f.type === a.framework.type);
    const bIndex = frameworks.findIndex(f => f.type === b.framework.type);
    return aIndex - bIndex;
  });

  return ok(detectionResults[0]);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Pure function: Get human-readable framework name with version
 */
export const getFrameworkDisplayName = (framework: FrameworkInfo): string => {
  if (framework.version) {
    return `${framework.name} (${framework.version})`;
  }
  return framework.name;
};

/**
 * Pure function: Check if framework supports specific features
 */
export const getFrameworkCapabilities = (frameworkType: FrameworkType) => ({
  hasSSR: ['redwood-sdk', 'nextjs'].includes(frameworkType),
  hasFileBasedRouting: ['redwood-sdk', 'nextjs'].includes(frameworkType),
  supportsAppDirectory: frameworkType === 'nextjs',
  usesTailwindV4: frameworkType === 'redwood-sdk',
  supportsServerComponents: ['redwood-sdk', 'nextjs'].includes(frameworkType),
});
