/**
 * Shared dependency management utilities
 * Dependency management utilities
 */

import type { Result } from '../installation/types.js'
import type { FileSystem } from '@esteban-url/trailhead-cli/filesystem'

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export interface PackageJson {
  readonly name?: string
  readonly version?: string
  readonly description?: string
  readonly dependencies?: Record<string, string>
  readonly devDependencies?: Record<string, string>
  readonly scripts?: Record<string, string>
  readonly [key: string]: unknown
}

export interface ExpectedDependencies {
  readonly dependencies: Record<string, string>
  readonly devDependencies: Record<string, string>
}

export interface DependencyAnalysis {
  readonly hasUpdates: boolean
  readonly missingDependencies: string[]
  readonly missingDevDependencies: string[]
  readonly outdatedDependencies: Record<string, { current: string; expected: string }>
  readonly outdatedDevDependencies: Record<string, { current: string; expected: string }>
}

export interface VersionSyncCheck {
  readonly hasIssues: boolean
  readonly warnings: string[]
}

export interface DependencyError {
  readonly type: 'DependencyError'
  readonly message: string
  readonly cause?: unknown
}

export const DependencyErr = (message: string, cause?: unknown): DependencyError => ({
  type: 'DependencyError',
  message,
  cause,
})

export const Ok = <T>(value: T): Result<T, DependencyError> => ({ success: true, value })
export const Err = (error: DependencyError): Result<never, DependencyError> => ({
  success: false,
  error,
})

// ============================================================================
// PURE DEPENDENCY CONFIGURATION
// ============================================================================

/**
 * Pure function: Generate expected package.json dependencies
 * Generate expected package.json dependencies
 */
export const generateExpectedDependencies = (): ExpectedDependencies => ({
  dependencies: {
    react: '19.1.0',
    'react-dom': '19.1.0',
    'framer-motion': '12.16.0',
    next: '15.3.4',
    'next-themes': '^0.4.6',
    'tailwind-merge': '3.3.0',
  },
  devDependencies: {
    '@types/react': '19.1.8',
    '@types/react-dom': '19.1.6',
  },
})

/**
 * Pure function: Generate minimal required dependencies for install script
 */
export const generateMinimalDependencies = (): ExpectedDependencies => ({
  dependencies: {
    '@headlessui/react': '^2.0.0',
    'framer-motion': '^12.0.0',
    clsx: '^2.0.0',
    culori: '^4.0.0',
    'next-themes': '^0.4.0',
    'tailwind-merge': '^3.0.0',
  },
  devDependencies: {},
})

// ============================================================================
// DEPENDENCY ANALYSIS
// ============================================================================

/**
 * Pure function: Check if package.json needs dependency updates
 * Core dependency utilities
 */
export const needsDependencyUpdate = (
  packageJson: PackageJson,
  expected?: ExpectedDependencies
): boolean => {
  const expectedDeps = expected || generateExpectedDependencies()

  const checkDeps = (
    current: Record<string, string> | undefined,
    expectedDeps: Record<string, string>
  ): boolean => {
    if (!current) return Object.keys(expectedDeps).length > 0

    return Object.entries(expectedDeps).some(([dep, version]) => current[dep] !== version)
  }

  return (
    checkDeps(packageJson.dependencies, expectedDeps.dependencies) ||
    checkDeps(packageJson.devDependencies, expectedDeps.devDependencies)
  )
}

/**
 * Pure function: Analyze package.json for missing or outdated dependencies
 */
export const analyzeDependencies = (
  packageJson: PackageJson,
  expected?: ExpectedDependencies
): DependencyAnalysis => {
  const expectedDeps = expected || generateExpectedDependencies()
  const current = packageJson.dependencies || {}
  const currentDev = packageJson.devDependencies || {}

  const missingDependencies: string[] = []
  const outdatedDependencies: Record<string, { current: string; expected: string }> = {}

  // Check regular dependencies
  Object.entries(expectedDeps.dependencies).forEach(([dep, expectedVersion]) => {
    if (!current[dep]) {
      missingDependencies.push(dep)
    } else if (current[dep] !== expectedVersion) {
      outdatedDependencies[dep] = {
        current: current[dep],
        expected: expectedVersion,
      }
    }
  })

  const missingDevDependencies: string[] = []
  const outdatedDevDependencies: Record<string, { current: string; expected: string }> = {}

  // Check dev dependencies
  Object.entries(expectedDeps.devDependencies).forEach(([dep, expectedVersion]) => {
    if (!currentDev[dep]) {
      missingDevDependencies.push(dep)
    } else if (currentDev[dep] !== expectedVersion) {
      outdatedDevDependencies[dep] = {
        current: currentDev[dep],
        expected: expectedVersion,
      }
    }
  })

  const hasUpdates =
    missingDependencies.length > 0 ||
    missingDevDependencies.length > 0 ||
    Object.keys(outdatedDependencies).length > 0 ||
    Object.keys(outdatedDevDependencies).length > 0

  return {
    hasUpdates,
    missingDependencies,
    missingDevDependencies,
    outdatedDependencies,
    outdatedDevDependencies,
  }
}

/**
 * Pure function: Update package.json with correct dependencies
 * Core dependency utilities
 */
export const updatePackageJsonDependencies = (
  packageJson: PackageJson,
  expected?: ExpectedDependencies
): PackageJson => {
  const expectedDeps = expected || generateExpectedDependencies()

  return {
    ...packageJson,
    dependencies: {
      ...packageJson.dependencies,
      ...expectedDeps.dependencies,
    },
    devDependencies: {
      ...packageJson.devDependencies,
      ...expectedDeps.devDependencies,
    },
  }
}

/**
 * Pure function: Check for version mismatches between main and demo projects
 * Core dependency utilities
 */
export const checkVersionSync = (
  mainPackageJson: PackageJson,
  demoPackageJson: PackageJson,
  expected?: ExpectedDependencies
): VersionSyncCheck => {
  const warnings: string[] = []
  const expectedDeps = expected || generateExpectedDependencies()

  // Check React types specifically
  const mainReactTypes = mainPackageJson.devDependencies?.['@types/react']
  const demoReactTypes = demoPackageJson.devDependencies?.['@types/react']
  const expectedReactTypes = expectedDeps.devDependencies['@types/react']

  if (mainReactTypes !== expectedReactTypes) {
    warnings.push(
      `Main project @types/react (${mainReactTypes}) doesn't match expected version (${expectedReactTypes})`
    )
  }

  // Only warn about demo if it exists and doesn't match expected
  if (demoReactTypes && demoReactTypes !== expectedReactTypes) {
    warnings.push(
      `Demo @types/react (${demoReactTypes}) doesn't match expected version (${expectedReactTypes})`
    )
  }

  // Check other critical dependencies
  const criticalDeps = ['react', 'react-dom', '@types/react-dom'] as const

  for (const dep of criticalDeps) {
    const isDevDep = dep.startsWith('@types')
    const mainVersion = isDevDep
      ? mainPackageJson.devDependencies?.[dep]
      : mainPackageJson.dependencies?.[dep]
    const expectedVersion = isDevDep
      ? expectedDeps.devDependencies[dep as keyof typeof expectedDeps.devDependencies]
      : expectedDeps.dependencies[dep as keyof typeof expectedDeps.dependencies]

    if (mainVersion && expectedVersion && mainVersion !== expectedVersion) {
      warnings.push(
        `Main project ${dep} (${mainVersion}) doesn't match expected version (${expectedVersion})`
      )
    }
  }

  return {
    hasIssues: warnings.length > 0,
    warnings,
  }
}

// ============================================================================
// INSTALLATION DETECTION
// ============================================================================

/**
 * Pure function: Check if installation is needed
 * Core dependency utilities - intelligent build detection
 */
export const isInstallationNeeded = (
  nodeModulesExists: boolean,
  lockfileExists: boolean,
  packageJsonMtime: Date,
  lockfileMtime: Date | null,
  keyDependenciesExist: boolean
): boolean => {
  if (!nodeModulesExists || !lockfileExists || !keyDependenciesExist) {
    return true
  }

  return lockfileMtime ? packageJsonMtime > lockfileMtime : true
}

/**
 * Check if key dependencies exist in node_modules
 */
export const checkKeyDependencies = async (
  fs: FileSystem,
  projectRoot: string,
  dependencies: string[]
): Promise<Result<boolean, DependencyError>> => {
  try {
    for (const dep of dependencies) {
      const depPath = `${projectRoot}/node_modules/${dep}`
      const existsResult = await fs.exists(depPath)

      if (!existsResult.success) {
        return Err(DependencyErr(`Failed to check dependency: ${dep}`, existsResult.error))
      }

      if (!existsResult.value) {
        return Ok(false)
      }
    }

    return Ok(true)
  } catch (error) {
    return Err(DependencyErr('Failed to check key dependencies', error))
  }
}

// ============================================================================
// PACKAGE MANAGER UTILITIES
// ============================================================================

/**
 * Generate install command based on available package managers
 */
export const generateInstallCommand = (
  hasYarn: boolean = false,
  hasPnpm: boolean = false
): string => {
  if (hasPnpm) return 'pnpm install'
  if (hasYarn) return 'yarn install'
  return 'npm install'
}

/**
 * Get package manager lockfile name
 */
export const getLockfileName = (hasYarn: boolean = false, hasPnpm: boolean = false): string => {
  if (hasPnpm) return 'pnpm-lock.yaml'
  if (hasYarn) return 'yarn.lock'
  return 'package-lock.json'
}

// ============================================================================
// HIGH-LEVEL WORKFLOW FUNCTIONS
// ============================================================================

/**
 * Analyze and update package.json dependencies with comprehensive error handling
 */
export const analyzeAndUpdateDependencies = async (
  fs: FileSystem,
  projectRoot: string,
  expectedDeps?: ExpectedDependencies
): Promise<
  Result<
    { updated: boolean; analysis: DependencyAnalysis; packageJson: PackageJson },
    DependencyError
  >
> => {
  try {
    const packageJsonPath = `${projectRoot}/package.json`

    // Read current package.json
    const readResult = await fs.readJson<PackageJson>(packageJsonPath)
    if (!readResult.success) {
      return Err(DependencyErr('Failed to read package.json', readResult.error))
    }

    const currentPackageJson = readResult.value
    const analysis = analyzeDependencies(currentPackageJson, expectedDeps)

    if (!analysis.hasUpdates) {
      return Ok({
        updated: false,
        analysis,
        packageJson: currentPackageJson,
      })
    }

    // Update package.json
    const updatedPackageJson = updatePackageJsonDependencies(currentPackageJson, expectedDeps)

    const writeResult = await fs.writeJson(packageJsonPath, updatedPackageJson, { spaces: 2 })
    if (!writeResult.success) {
      return Err(DependencyErr('Failed to write updated package.json', writeResult.error))
    }

    return Ok({
      updated: true,
      analysis,
      packageJson: updatedPackageJson,
    })
  } catch (error) {
    return Err(DependencyErr('Unexpected error during dependency analysis', error))
  }
}
