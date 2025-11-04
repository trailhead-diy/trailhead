import { execSync, type ExecSyncOptions } from 'node:child_process'
import { Result, ok, err, createCoreError, type CoreError } from '@trailhead/core'

/**
 * Package manager configuration
 *
 * Contains information about a detected package manager including
 * its commands and version.
 */
export interface PackageManager {
  name: 'pnpm' | 'npm'
  command: string
  runCommand: string
  installCommand: string
  version: string
}

/**
 * Allowed package manager names for validation
 */
const ALLOWED_MANAGERS = ['pnpm', 'npm'] as const

/**
 * Minimum version requirements for each package manager
 */
const VERSION_REQUIREMENTS: Record<(typeof ALLOWED_MANAGERS)[number], string> = {
  pnpm: '6.0.0',
  npm: '7.0.0',
} as const

/**
 * Default timeout for package manager commands (5 seconds)
 */
const DEFAULT_TIMEOUT_MS = 5000

/**
 * Cache entry with TTL
 */
interface CacheEntry {
  result: Result<PackageManager, CoreError>
  timestamp: number
}

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Package manager cache interface
 *
 * Provides methods for caching package manager detection results
 * with TTL support to improve performance.
 */
export interface PackageManagerCache {
  get: (key: string) => Result<PackageManager, CoreError> | null
  set: (key: string, result: Result<PackageManager, CoreError>) => void
  clear: () => void
}

/**
 * Create a package manager cache instance
 *
 * Creates a cache for storing package manager detection results
 * with automatic TTL expiration (5 minutes). Uses closure pattern
 * for encapsulation.
 *
 * @returns Package manager cache instance
 *
 * @example
 * ```typescript
 * const cache = createPackageManagerCache();
 * const result = detectPackageManager({ cache });
 * // Subsequent calls use cached result for 5 minutes
 * ```
 */
export const createPackageManagerCache = (): PackageManagerCache => {
  const cache = new Map<string, CacheEntry>()

  return {
    get: (key: string): Result<PackageManager, CoreError> | null => {
      const entry = cache.get(key)
      if (!entry) return null

      // Check if cache entry has expired
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key)
        return null
      }

      return entry.result
    },

    set: (key: string, result: Result<PackageManager, CoreError>): void => {
      cache.set(key, {
        result,
        timestamp: Date.now(),
      })
    },

    clear: (): void => {
      cache.clear()
    },
  }
}

// Create a default cache instance
const defaultCache = createPackageManagerCache()

/**
 * Options for package manager detection
 *
 * Allows customization of detection behavior including
 * custom cache instances and command timeouts.
 */
export interface DetectOptions {
  /** Custom cache instance (useful for testing) */
  cache?: PackageManagerCache
  /** Timeout for package manager commands in milliseconds */
  timeout?: number
}

/**
 * Clear the default package manager cache
 *
 * Removes all cached detection results. Useful for testing
 * or when package managers are installed/updated.
 *
 * @example
 * ```typescript
 * clearPackageManagerCache();
 * // Next detection will check fresh
 * ```
 */
export const clearPackageManagerCache = (): void => {
  defaultCache.clear()
}

/**
 * Semantic version data structure
 *
 * Represents a parsed semantic version with major, minor,
 * patch, and optional prerelease components.
 */
export interface SemVer {
  readonly major: number
  readonly minor: number
  readonly patch: number
  readonly prerelease?: string
}

/**
 * Parse a semantic version string
 *
 * Extracts major, minor, patch, and prerelease components from
 * a version string. Handles optional 'v' prefix.
 *
 * @param version - Version string to parse (e.g., '1.2.3', 'v2.0.0-beta')
 * @returns Parsed semantic version or error
 *
 * @example
 * ```typescript
 * const result = parseSemVer('v1.2.3-beta');
 * if (result.isOk()) {
 *   console.log(result.value); // { major: 1, minor: 2, patch: 3, prerelease: 'beta' }
 * }
 * ```
 */
export const parseSemVer = (version: string): Result<SemVer, CoreError> => {
  // Handle versions with pre-release tags
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?/)
  if (!match) {
    return err(
      createCoreError('PACKAGE_MANAGER_ERROR', 'CLI_ERROR', `Invalid version format: ${version}`)
    )
  }

  const [, major, minor, patch, prerelease] = match
  return ok({
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease,
  })
}

/**
 * Compare two semantic versions
 *
 * Compares versions using standard semver ordering rules.
 * Versions without prerelease are considered greater than
 * versions with prerelease when major.minor.patch are equal.
 *
 * @param a - First version to compare
 * @param b - Second version to compare
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 *
 * @example
 * ```typescript
 * const v1 = { major: 1, minor: 0, patch: 0 };
 * const v2 = { major: 2, minor: 0, patch: 0 };
 * compareSemVer(v1, v2); // Returns -1
 * ```
 */
export const compareSemVer = (a: SemVer, b: SemVer): -1 | 0 | 1 => {
  if (a.major !== b.major) return a.major > b.major ? 1 : -1
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1

  // If versions are equal, check pre-release
  // No pre-release is considered greater than having a pre-release
  if (!a.prerelease && b.prerelease) return 1
  if (a.prerelease && !b.prerelease) return -1

  return 0 // Equal versions
}

/**
 * Check if version a is greater than or equal to version b
 *
 * Convenience function for version comparison checks.
 *
 * @param a - Version to check
 * @param b - Minimum required version
 * @returns True if a >= b
 *
 * @example
 * ```typescript
 * const current = { major: 2, minor: 0, patch: 0 };
 * const required = { major: 1, minor: 5, patch: 0 };
 * if (isGreaterThanOrEqual(current, required)) {
 *   // Version meets requirement
 * }
 * ```
 */
export const isGreaterThanOrEqual = (a: SemVer, b: SemVer): boolean => {
  return compareSemVer(a, b) >= 0
}

/**
 * Validate and sanitize package manager name
 */
const validatePackageManagerName = (
  name: string
): Result<(typeof ALLOWED_MANAGERS)[number], CoreError> => {
  // Remove any potentially dangerous characters
  const sanitized = name.toLowerCase().replace(/[^a-z]/g, '')

  if (!ALLOWED_MANAGERS.includes(sanitized as any)) {
    return err(
      createCoreError(
        'PACKAGE_MANAGER_ERROR',
        'CLI_ERROR',
        `Invalid package manager name: ${name}. Allowed values: ${ALLOWED_MANAGERS.join(', ')}`
      )
    )
  }

  return ok(sanitized as (typeof ALLOWED_MANAGERS)[number])
}

/**
 * Execute command with timeout
 */
const execWithTimeout = (
  command: string,
  options: ExecSyncOptions & { timeout?: number }
): Result<string, CoreError> => {
  try {
    const output = execSync(command, {
      ...options,
      timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
    }) as string
    return ok(output.toString().trim())
  } catch (error: any) {
    if (error.code === 'ETIMEDOUT') {
      return err(
        createCoreError(
          'PACKAGE_MANAGER_ERROR',
          'CLI_ERROR',
          `Command timed out after ${options.timeout ?? DEFAULT_TIMEOUT_MS}ms: ${command}`,
          { cause: error }
        )
      )
    }
    return err(
      createCoreError(
        'PACKAGE_MANAGER_ERROR',
        'CLI_ERROR',
        error.message || `Command failed: ${command}`,
        {
          cause: error,
        }
      )
    )
  }
}

/**
 * Check if version meets minimum requirement
 */
const meetsVersionRequirement = (version: string, required: string): Result<boolean, CoreError> => {
  const versionResult = parseSemVer(version)
  if (versionResult.isErr()) {
    return err(versionResult.error)
  }

  const requiredResult = parseSemVer(required)
  if (requiredResult.isErr()) {
    return err(requiredResult.error)
  }

  return ok(isGreaterThanOrEqual(versionResult.value, requiredResult.value))
}

/**
 * Detect available package manager
 *
 * Detects installed package managers with preference order: pnpm > npm.
 * Results are cached for 5 minutes to improve performance. Checks version
 * requirements and can be overridden with FORCE_PACKAGE_MANAGER env var.
 *
 * @param options - Detection options including custom cache and timeout
 * @returns Detected package manager configuration or error
 *
 * @example
 * ```typescript
 * const result = detectPackageManager();
 * if (result.isOk()) {
 *   console.log(`Using ${result.value.name} v${result.value.version}`);
 * }
 *
 * // Force specific manager
 * process.env.FORCE_PACKAGE_MANAGER = 'pnpm';
 * const forced = detectPackageManager();
 * ```
 */
export const detectPackageManager = (
  options?: DetectOptions
): Result<PackageManager, CoreError> => {
  const cache = options?.cache ?? defaultCache
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS

  // Check for environment variable override
  const forcedManager = process.env.FORCE_PACKAGE_MANAGER
  if (forcedManager && forcedManager.trim()) {
    const validationResult = validatePackageManagerName(forcedManager)
    if (validationResult.isErr()) {
      return err(validationResult.error)
    }

    const managerName = validationResult.value
    const manager = getManagerConfig(managerName)

    const versionResult = execWithTimeout(`${manager.command} --version`, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout,
    })

    if (versionResult.isErr()) {
      return err(
        createCoreError(
          'PACKAGE_MANAGER_ERROR',
          'CLI_ERROR',
          `Forced package manager '${managerName}' is not installed or not responding`,
          {
            suggestion: `Install ${managerName} or unset FORCE_PACKAGE_MANAGER environment variable`,
            cause: versionResult.error,
          }
        )
      )
    }

    const version = versionResult.value
    const minVersion = VERSION_REQUIREMENTS[managerName as keyof typeof VERSION_REQUIREMENTS]
    const meetsReqResult = meetsVersionRequirement(version, minVersion)

    if (meetsReqResult.isErr()) {
      return err(
        createCoreError(
          'PACKAGE_MANAGER_ERROR',
          'CLI_ERROR',
          `Failed to parse version for ${managerName}: ${version}`,
          {
            cause: meetsReqResult.error,
          }
        )
      )
    }

    if (!meetsReqResult.value) {
      return err(
        createCoreError(
          'PACKAGE_MANAGER_ERROR',
          'CLI_ERROR',
          `${managerName} version ${version} is below minimum required version ${minVersion}`,
          { suggestion: `Please update ${managerName} to version ${minVersion} or higher` }
        )
      )
    }

    return ok({ ...manager, version })
  }

  // Check cache
  const cacheKey = 'default'
  const cachedResult = cache.get(cacheKey)
  if (cachedResult) {
    return cachedResult
  }

  const managers: Array<{
    name: (typeof ALLOWED_MANAGERS)[number]
    command: string
  }> = [
    { name: 'pnpm', command: 'pnpm' },
    { name: 'npm', command: 'npm' },
  ]

  const tried: string[] = []
  const versionIssues: string[] = []

  for (const { name, command } of managers) {
    tried.push(name)

    const versionResult = execWithTimeout(`${command} --version`, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout,
    })

    if (versionResult.isErr()) {
      continue
    }

    const version = versionResult.value
    const minVersion = VERSION_REQUIREMENTS[name]
    const meetsReqResult = meetsVersionRequirement(version, minVersion)

    if (meetsReqResult.isErr()) {
      versionIssues.push(`${name} v${version} (invalid version format)`)
      continue
    }

    if (!meetsReqResult.value) {
      versionIssues.push(`${name} v${version} (requires v${minVersion}+)`)
      continue
    }

    const manager = getManagerConfig(name)
    const result = ok({ ...manager, version })
    cache.set(cacheKey, result)
    return result
  }

  const errorMessage =
    versionIssues.length > 0
      ? `No package manager found with required versions. Found: ${versionIssues.join(', ')}`
      : `No package manager found. Tried: ${tried.join(', ')}`

  const suggestion =
    versionIssues.length > 0
      ? 'Please update your package manager to meet the minimum version requirements'
      : 'Please install pnpm (recommended) or npm'

  const error = err(
    createCoreError('PACKAGE_MANAGER_ERROR', 'CLI_ERROR', errorMessage, { suggestion })
  )

  cache.set(cacheKey, error)
  return error
}

/**
 * Get configuration for a specific package manager
 */
const getManagerConfig = (
  name: (typeof ALLOWED_MANAGERS)[number]
): Omit<PackageManager, 'version'> => {
  const configs = {
    pnpm: {
      name: 'pnpm' as const,
      command: 'pnpm',
      runCommand: 'pnpm run',
      installCommand: 'pnpm install',
    },
    npm: {
      name: 'npm' as const,
      command: 'npm',
      runCommand: 'npm run',
      installCommand: 'npm install',
    },
  }

  return configs[name]
}

/**
 * Get the command to run a script with detected package manager
 *
 * Constructs the appropriate run command for the detected package
 * manager, including script name and optional arguments.
 *
 * @param scriptName - Name of the script to run
 * @param args - Optional arguments to pass to the script
 * @param options - Detection options
 * @returns Complete run command or error
 *
 * @example
 * ```typescript
 * const result = getRunCommand('build', ['--watch']);
 * if (result.isOk()) {
 *   console.log(result.value); // 'pnpm run build -- --watch'
 * }
 * ```
 */
export const getRunCommand = (
  scriptName: string,
  args?: string[],
  options?: DetectOptions
): Result<string, CoreError> => {
  const managerResult = detectPackageManager(options)
  if (managerResult.isErr()) {
    return err(managerResult.error)
  }

  const manager = managerResult.value
  const argsString = args?.length ? ` -- ${args.join(' ')}` : ''
  return ok(`${manager.runCommand} ${scriptName}${argsString}`)
}

/**
 * Execute a package manager command with automatic detection
 *
 * Detects the available package manager and executes a command
 * with it. Handles timeouts and proper error reporting.
 *
 * @param command - Command to execute
 * @param execOptions - Node.js exec options
 * @param detectOptions - Package manager detection options
 * @returns Command output or error
 *
 * @example
 * ```typescript
 * const result = execPackageManagerCommand('install express');
 * if (result.isOk()) {
 *   console.log('Package installed successfully');
 * }
 * ```
 */
export const execPackageManagerCommand = (
  command: string,
  execOptions?: ExecSyncOptions,
  detectOptions?: DetectOptions
): Result<string, CoreError> => {
  const managerResult = detectPackageManager(detectOptions)
  if (managerResult.isErr()) {
    return err(managerResult.error)
  }

  return execWithTimeout(command, {
    encoding: 'utf8',
    ...execOptions,
    timeout: execOptions?.timeout ?? detectOptions?.timeout ?? DEFAULT_TIMEOUT_MS,
  })
}
