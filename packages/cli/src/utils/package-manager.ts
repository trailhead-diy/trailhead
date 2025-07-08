import { execSync, type ExecSyncOptions } from 'node:child_process';
import { Result, Ok, Err, type CLIError } from '../core/index.js';

/**
 * Package manager configuration
 */
export interface PackageManager {
  name: 'pnpm' | 'npm';
  command: string;
  runCommand: string;
  installCommand: string;
  version: string;
}

/**
 * Minimum version requirements for each package manager
 */
const VERSION_REQUIREMENTS = {
  pnpm: '6.0.0',
  npm: '7.0.0',
} as const;

/**
 * Allowed package manager names for validation
 */
const ALLOWED_MANAGERS = ['pnpm', 'npm'] as const;

/**
 * Default timeout for package manager commands (5 seconds)
 */
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Cache entry with TTL
 */
interface CacheEntry {
  result: Result<PackageManager, CLIError>;
  timestamp: number;
}

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Instance-based cache to avoid global state issues
 */
class PackageManagerCache {
  private cache = new Map<string, CacheEntry>();

  get(key: string): Result<PackageManager, CLIError> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  set(key: string, result: Result<PackageManager, CLIError>): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Create a default cache instance
const defaultCache = new PackageManagerCache();

/**
 * Options for package manager detection
 */
export interface DetectOptions {
  /** Custom cache instance (useful for testing) */
  cache?: PackageManagerCache;
  /** Timeout for package manager commands in milliseconds */
  timeout?: number;
}

/**
 * Clear the package manager cache (useful for testing)
 */
export const clearPackageManagerCache = (): void => {
  defaultCache.clear();
};

/**
 * Create a new cache instance (useful for isolated testing)
 */
export const createPackageManagerCache = (): PackageManagerCache => {
  return new PackageManagerCache();
};

/**
 * Semantic version parser with validation
 */
export class SemVer {
  constructor(
    public readonly major: number,
    public readonly minor: number,
    public readonly patch: number,
    public readonly prerelease?: string,
  ) {}

  static parse(version: string): Result<SemVer, CLIError> {
    // Handle versions with pre-release tags
    const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?/);
    if (!match) {
      return Err({
        code: 'INVALID_VERSION_FORMAT',
        message: `Invalid version format: ${version}`,
        recoverable: false,
      });
    }

    const [, major, minor, patch, prerelease] = match;
    return Ok(
      new SemVer(
        parseInt(major, 10),
        parseInt(minor, 10),
        parseInt(patch, 10),
        prerelease,
      ),
    );
  }

  isGreaterThanOrEqual(other: SemVer): boolean {
    if (this.major > other.major) return true;
    if (this.major < other.major) return false;
    if (this.minor > other.minor) return true;
    if (this.minor < other.minor) return false;
    if (this.patch > other.patch) return true;
    if (this.patch < other.patch) return false;

    // If versions are equal, check pre-release
    // No pre-release is considered greater than having a pre-release
    if (!this.prerelease && other.prerelease) return true;
    if (this.prerelease && !other.prerelease) return false;

    return true; // Equal versions
  }
}

/**
 * Validate and sanitize package manager name
 */
const validatePackageManagerName = (
  name: string,
): Result<(typeof ALLOWED_MANAGERS)[number], CLIError> => {
  // Remove any potentially dangerous characters
  const sanitized = name.toLowerCase().replace(/[^a-z]/g, '');

  if (!ALLOWED_MANAGERS.includes(sanitized as any)) {
    return Err({
      code: 'INVALID_PACKAGE_MANAGER',
      message: `Invalid package manager name: ${name}. Allowed values: ${ALLOWED_MANAGERS.join(', ')}`,
      recoverable: false,
    });
  }

  return Ok(sanitized as (typeof ALLOWED_MANAGERS)[number]);
};

/**
 * Execute command with timeout
 */
const execWithTimeout = (
  command: string,
  options: ExecSyncOptions & { timeout?: number },
): Result<string, CLIError> => {
  try {
    const output = execSync(command, {
      ...options,
      timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
    }) as string;
    return Ok(output.toString().trim());
  } catch (error: any) {
    if (error.code === 'ETIMEDOUT') {
      return Err({
        code: 'COMMAND_TIMEOUT',
        message: `Command timed out after ${options.timeout ?? DEFAULT_TIMEOUT_MS}ms: ${command}`,
        cause: error,
        recoverable: true,
      });
    }
    return Err({
      code: 'COMMAND_FAILED',
      message: error.message || `Command failed: ${command}`,
      cause: error,
      recoverable: false,
    });
  }
};

/**
 * Check if version meets minimum requirement
 */
const meetsVersionRequirement = (
  version: string,
  required: string,
): Result<boolean, CLIError> => {
  const versionResult = SemVer.parse(version);
  if (!versionResult.success) {
    return Err(versionResult.error);
  }

  const requiredResult = SemVer.parse(required);
  if (!requiredResult.success) {
    return Err(requiredResult.error);
  }

  return Ok(versionResult.value.isGreaterThanOrEqual(requiredResult.value));
};

/**
 * Detect available package manager with preference order: pnpm > npm
 * Results are cached for performance. Use FORCE_PACKAGE_MANAGER env var to override.
 */
export const detectPackageManager = (
  options?: DetectOptions,
): Result<PackageManager, CLIError> => {
  const cache = options?.cache ?? defaultCache;
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;

  // Check for environment variable override
  const forcedManager = process.env.FORCE_PACKAGE_MANAGER;
  if (forcedManager && forcedManager.trim()) {
    const validationResult = validatePackageManagerName(forcedManager);
    if (!validationResult.success) {
      return Err(validationResult.error);
    }

    const managerName = validationResult.value;
    const manager = getManagerConfig(managerName);

    const versionResult = execWithTimeout(`${manager.command} --version`, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout,
    });

    if (!versionResult.success) {
      return Err({
        code: 'FORCED_PACKAGE_MANAGER_NOT_FOUND',
        message: `Forced package manager '${managerName}' is not installed or not responding`,
        suggestion: `Install ${managerName} or unset FORCE_PACKAGE_MANAGER environment variable`,
        cause: versionResult.error,
        recoverable: false,
      });
    }

    const version = versionResult.value;
    const minVersion = VERSION_REQUIREMENTS[managerName];
    const meetsReqResult = meetsVersionRequirement(version, minVersion);

    if (!meetsReqResult.success) {
      return Err({
        code: 'PACKAGE_MANAGER_VERSION_PARSE_ERROR',
        message: `Failed to parse version for ${managerName}: ${version}`,
        cause: meetsReqResult.error,
        recoverable: false,
      });
    }

    if (!meetsReqResult.value) {
      return Err({
        code: 'PACKAGE_MANAGER_VERSION_TOO_OLD',
        message: `${managerName} version ${version} is below minimum required version ${minVersion}`,
        suggestion: `Please update ${managerName} to version ${minVersion} or higher`,
        recoverable: true,
      });
    }

    return Ok({ ...manager, version });
  }

  // Check cache
  const cacheKey = 'default';
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const managers: Array<{
    name: (typeof ALLOWED_MANAGERS)[number];
    command: string;
  }> = [
    { name: 'pnpm', command: 'pnpm' },
    { name: 'npm', command: 'npm' },
  ];

  const tried: string[] = [];
  const versionIssues: string[] = [];

  for (const { name, command } of managers) {
    tried.push(name);

    const versionResult = execWithTimeout(`${command} --version`, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout,
    });

    if (!versionResult.success) {
      continue;
    }

    const version = versionResult.value;
    const minVersion = VERSION_REQUIREMENTS[name];
    const meetsReqResult = meetsVersionRequirement(version, minVersion);

    if (!meetsReqResult.success) {
      versionIssues.push(`${name} v${version} (invalid version format)`);
      continue;
    }

    if (!meetsReqResult.value) {
      versionIssues.push(`${name} v${version} (requires v${minVersion}+)`);
      continue;
    }

    const manager = getManagerConfig(name);
    const result = Ok({ ...manager, version });
    cache.set(cacheKey, result);
    return result;
  }

  const errorMessage =
    versionIssues.length > 0
      ? `No package manager found with required versions. Found: ${versionIssues.join(', ')}`
      : `No package manager found. Tried: ${tried.join(', ')}`;

  const suggestion =
    versionIssues.length > 0
      ? 'Please update your package manager to meet the minimum version requirements'
      : 'Please install pnpm (recommended) or npm';

  const error = Err({
    code: 'NO_PACKAGE_MANAGER',
    message: errorMessage,
    suggestion,
    details: `You can also set FORCE_PACKAGE_MANAGER=npm (or pnpm) to override detection`,
    recoverable: false,
  });

  cache.set(cacheKey, error);
  return error;
};

/**
 * Get configuration for a specific package manager
 */
const getManagerConfig = (
  name: (typeof ALLOWED_MANAGERS)[number],
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
  };

  return configs[name];
};

/**
 * Get the command to run a script with the detected package manager
 */
export const getRunCommand = (
  scriptName: string,
  args?: string[],
  options?: DetectOptions,
): Result<string, CLIError> => {
  const managerResult = detectPackageManager(options);
  if (!managerResult.success) {
    return Err(managerResult.error);
  }

  const manager = managerResult.value;
  const argsString = args?.length ? ` -- ${args.join(' ')}` : '';
  return Ok(`${manager.runCommand} ${scriptName}${argsString}`);
};

/**
 * Execute a package manager command with automatic detection
 */
export const execPackageManagerCommand = (
  command: string,
  execOptions?: ExecSyncOptions,
  detectOptions?: DetectOptions,
): Result<string, CLIError> => {
  const managerResult = detectPackageManager(detectOptions);
  if (!managerResult.success) {
    return Err(managerResult.error);
  }

  return execWithTimeout(command, {
    encoding: 'utf8',
    ...execOptions,
    timeout:
      execOptions?.timeout ?? detectOptions?.timeout ?? DEFAULT_TIMEOUT_MS,
  });
};

/**
 * Get information about the detected package manager
 */
export const getPackageManagerInfo = (
  options?: DetectOptions,
): Result<PackageManager, CLIError> => {
  return detectPackageManager(options);
};
