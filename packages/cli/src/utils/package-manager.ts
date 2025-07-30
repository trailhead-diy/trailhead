import { execSync, type ExecSyncOptions } from 'node:child_process'
import { Result, ok, err, type CoreError } from '@esteban-url/core'
import { createCoreError } from '@esteban-url/core'

/**
 * Package manager configuration
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
 * Instance-based cache to avoid global state issues
 */
class PackageManagerCache {
  private cache = new Map<string, CacheEntry>()

  get(key: string): Result<PackageManager, CoreError> | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key)
      return null
    }

    return entry.result
  }

  set(key: string, result: Result<PackageManager, CoreError>): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

// Create a default cache instance
const defaultCache = new PackageManagerCache()

/**
 * Options for package manager detection
 */
export interface DetectOptions {
  /** Custom cache instance (useful for testing) */
  cache?: PackageManagerCache
  /** Timeout for package manager commands in milliseconds */
  timeout?: number
}

/**
 * Clear the package manager cache (useful for testing)
 */
export const clearPackageManagerCache = (): void => {
  defaultCache.clear()
}

/**
 * Create a new cache instance (useful for isolated testing)
 */
export const createPackageManagerCache = (): PackageManagerCache => {
  return new PackageManagerCache()
}

/**
 * Semantic version parser with validation
 */
export class SemVer {
  constructor(
    public readonly major: number,
    public readonly minor: number,
    public readonly patch: number,
    public readonly prerelease?: string
  ) {}

  static parse(version: string): Result<SemVer, CoreError> {
    // Handle versions with pre-release tags
    const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?/)
    if (!match) {
      return err(
        createCoreError('PACKAGE_MANAGER_ERROR', 'CLI_ERROR', `Invalid version format: ${version}`)
      )
    }

    const [, major, minor, patch, prerelease] = match
    return ok(new SemVer(parseInt(major, 10), parseInt(minor, 10), parseInt(patch, 10), prerelease))
  }

  isGreaterThanOrEqual(other: SemVer): boolean {
    if (this.major > other.major) return true
    if (this.major < other.major) return false
    if (this.minor > other.minor) return true
    if (this.minor < other.minor) return false
    if (this.patch > other.patch) return true
    if (this.patch < other.patch) return false

    // If versions are equal, check pre-release
    // No pre-release is considered greater than having a pre-release
    if (!this.prerelease && other.prerelease) return true
    if (this.prerelease && !other.prerelease) return false

    return true // Equal versions
  }
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
  const versionResult = SemVer.parse(version)
  if (versionResult.isErr()) {
    return err(versionResult.error)
  }

  const requiredResult = SemVer.parse(required)
  if (requiredResult.isErr()) {
    return err(requiredResult.error)
  }

  return ok(versionResult.value.isGreaterThanOrEqual(requiredResult.value))
}

/**
 * Detect available package manager with preference order: pnpm > npm
 * Results are cached for performance. Use FORCE_PACKAGE_MANAGER env var to override.
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
    const minVersion = VERSION_REQUIREMENTS[managerName]
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
 * Get the command to run a script with the detected package manager
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

/**
 * Get information about the detected package manager
 */
export const getPackageManagerInfo = (
  options?: DetectOptions
): Result<PackageManager, CoreError> => {
  return detectPackageManager(options)
}
