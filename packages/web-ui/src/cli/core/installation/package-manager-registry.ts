/**
 * Centralized package manager configurations and operations
 */

import type { DependencyStrategy } from './dependency-strategies.js';

// ============================================================================
// TYPES
// ============================================================================

export type PackageManagerName = 'npm' | 'yarn' | 'pnpm' | 'bun';

export interface PackageManagerConfig {
  readonly name: PackageManagerName;
  readonly lockfile: string;
  readonly commands: {
    readonly install: string;
    readonly add: string;
    readonly addDev: string;
    readonly ci: string;
    readonly update: string;
    readonly outdated: string;
    readonly cache: {
      readonly clean: string;
      readonly verify?: string;
    };
  };
  readonly flags: {
    readonly force: string;
    readonly frozen?: string;
    readonly offline?: string;
    readonly verbose: string;
    readonly silent: string;
    readonly timeout?: string;
    readonly workspace?: string;
  };
  readonly env: {
    readonly colorFlag?: string;
    readonly ciFlag?: string;
  };
  readonly progressPatterns: readonly RegExp[];
  readonly errorPatterns: {
    readonly network: RegExp;
    readonly permission: RegExp;
    readonly notFound: RegExp;
    readonly conflict: RegExp;
  };
}

// ============================================================================
// PACKAGE MANAGER CONFIGURATIONS
// ============================================================================

const npmConfig: PackageManagerConfig = {
  name: 'npm',
  lockfile: 'package-lock.json',
  commands: {
    install: 'npm install',
    add: 'npm install',
    addDev: 'npm install -D',
    ci: 'npm ci',
    update: 'npm update',
    outdated: 'npm outdated',
    cache: {
      clean: 'npm cache clean --force',
      verify: 'npm cache verify',
    },
  },
  flags: {
    force: '--force',
    frozen: '--package-lock-only',
    offline: '--offline',
    verbose: '--verbose',
    silent: '--silent',
    timeout: '--network-timeout',
    workspace: '--workspace',
  },
  env: {
    colorFlag: 'FORCE_COLOR',
    ciFlag: 'CI',
  },
  progressPatterns: [
    /added (\d+) packages?/i,
    /(\d+) packages? are looking/i,
    /found (\d+) vulnerabilities/i,
    /resolved (\d+) packages/i,
  ],
  errorPatterns: {
    network: /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN/i,
    permission: /EACCES|EPERM/i,
    notFound: /E404|404 Not Found/i,
    conflict: /ERESOLVE|peer dep/i,
  },
};

const yarnConfig: PackageManagerConfig = {
  name: 'yarn',
  lockfile: 'yarn.lock',
  commands: {
    install: 'yarn install',
    add: 'yarn add',
    addDev: 'yarn add -D',
    ci: 'yarn install --frozen-lockfile',
    update: 'yarn upgrade',
    outdated: 'yarn outdated',
    cache: {
      clean: 'yarn cache clean',
    },
  },
  flags: {
    force: '--force',
    frozen: '--frozen-lockfile',
    offline: '--offline',
    verbose: '--verbose',
    silent: '--silent',
    workspace: '--workspace',
  },
  env: {
    colorFlag: 'FORCE_COLOR',
  },
  progressPatterns: [
    /Resolving packages/i,
    /Fetching packages/i,
    /Linking dependencies/i,
    /Building fresh packages/i,
    /(\d+)\/(\d+)/,
  ],
  errorPatterns: {
    network: /getaddrinfo|ENOTFOUND|ETIMEDOUT/i,
    permission: /EACCES|EPERM/i,
    notFound: /Couldn't find package/i,
    conflict: /Couldn't find any versions/i,
  },
};

const pnpmConfig: PackageManagerConfig = {
  name: 'pnpm',
  lockfile: 'pnpm-lock.yaml',
  commands: {
    install: 'pnpm install',
    add: 'pnpm add',
    addDev: 'pnpm add -D',
    ci: 'pnpm install --frozen-lockfile',
    update: 'pnpm update',
    outdated: 'pnpm outdated',
    cache: {
      clean: 'pnpm store prune',
    },
  },
  flags: {
    force: '--force',
    frozen: '--frozen-lockfile',
    offline: '--offline',
    verbose: '--reporter=default',
    silent: '--reporter=silent',
    workspace: '--workspace-root',
  },
  env: {
    colorFlag: 'FORCE_COLOR',
  },
  progressPatterns: [
    /Progress: resolved (\d+)/i,
    /packages? added/i,
    /Already up to date/i,
    /dependencies:/i,
  ],
  errorPatterns: {
    network: /ERR_SOCKET_TIMEOUT|ENOTFOUND/i,
    permission: /EACCES|EPERM/i,
    notFound: /No matching version/i,
    conflict: /WARN.*peer/i,
  },
};

const bunConfig: PackageManagerConfig = {
  name: 'bun',
  lockfile: 'bun.lockb',
  commands: {
    install: 'bun install',
    add: 'bun add',
    addDev: 'bun add -d',
    ci: 'bun install --frozen-lockfile',
    update: 'bun update',
    outdated: 'bun outdated',
    cache: {
      clean: 'bun pm cache rm',
    },
  },
  flags: {
    force: '--force',
    frozen: '--frozen-lockfile',
    offline: '--offline',
    verbose: '--verbose',
    silent: '--silent',
  },
  env: {
    colorFlag: 'FORCE_COLOR',
  },
  progressPatterns: [/installed (\d+) packages/i, /\[(\d+)\/(\d+)\]/],
  errorPatterns: {
    network: /NetworkError|ENOTFOUND/i,
    permission: /PermissionDenied/i,
    notFound: /PackageNotFound/i,
    conflict: /version conflict/i,
  },
};

// ============================================================================
// REGISTRY
// ============================================================================

const packageManagerRegistry: Record<PackageManagerName, PackageManagerConfig> = {
  npm: npmConfig,
  yarn: yarnConfig,
  pnpm: pnpmConfig,
  bun: bunConfig,
};

/**
 * Get package manager configuration
 */
export const getPackageManagerConfig = (name: PackageManagerName): PackageManagerConfig =>
  packageManagerRegistry[name];

/**
 * Get all package manager names
 */
export const getAllPackageManagers = (): readonly PackageManagerName[] =>
  Object.keys(packageManagerRegistry) as PackageManagerName[];

// ============================================================================
// COMMAND BUILDERS
// ============================================================================

/**
 * Build install command with options
 */
export const buildInstallCommand = (
  pm: PackageManagerName,
  options: {
    ci?: boolean;
    force?: boolean;
    frozen?: boolean;
    offline?: boolean;
    verbose?: boolean;
    timeout?: number;
    workspace?: string;
    legacyPeerDeps?: boolean; // Only for npm
  } = {}
): string => {
  const config = getPackageManagerConfig(pm);
  const parts: string[] = [];

  // Base command
  parts.push(options.ci ? config.commands.ci : config.commands.install);

  // Add flags
  if (options.force) parts.push(config.flags.force);
  if (options.frozen && config.flags.frozen) parts.push(config.flags.frozen);
  if (options.offline && config.flags.offline) parts.push(config.flags.offline);
  if (options.verbose) parts.push(config.flags.verbose);
  if (options.timeout && config.flags.timeout) {
    parts.push(`${config.flags.timeout} ${options.timeout}`);
  }
  if (options.workspace && config.flags.workspace) {
    parts.push(`${config.flags.workspace} ${options.workspace}`);
  }

  return parts.join(' ');
};

/**
 * Build add packages command
 */
export const buildAddCommand = (
  pm: PackageManagerName,
  packages: readonly string[],
  options: {
    dev?: boolean;
    exact?: boolean;
    global?: boolean;
  } = {}
): string => {
  const config = getPackageManagerConfig(pm);
  const parts: string[] = [];

  // Base command
  parts.push(options.dev ? config.commands.addDev : config.commands.add);

  // Add packages
  parts.push(...packages);

  return parts.join(' ');
};

// ============================================================================
// STRATEGY TO OPTIONS MAPPING
// ============================================================================

/**
 * Get install options for a strategy
 */
export const getStrategyOptions = (
  strategy: DependencyStrategy,
  pm: PackageManagerName,
  hasLockfile: boolean
): Parameters<typeof buildInstallCommand>[1] => {
  const baseOptions = {
    verbose: false,
    timeout: 600000, // 10 minutes
  };

  switch (strategy.type) {
    case 'auto':
      return {
        ...baseOptions,
        ci: hasLockfile && pm === 'npm',
        frozen: hasLockfile && pm !== 'npm',
      };

    case 'smart':
      return {
        ...baseOptions,
        legacyPeerDeps: pm === 'npm',
        force: false,
      };

    case 'force':
      return {
        ...baseOptions,
        force: true,
        legacyPeerDeps: pm === 'npm',
      };

    case 'manual':
    case 'selective':
    case 'skip':
      return baseOptions;
  }
};

// ============================================================================
// PROGRESS PARSING
// ============================================================================

/**
 * Parse progress from package manager output
 */
export const parseProgress = (
  output: string,
  pm: PackageManagerName
): {
  phase?: string;
  current?: number;
  total?: number;
  packages?: number;
} => {
  const config = getPackageManagerConfig(pm);
  const result: ReturnType<typeof parseProgress> = {};

  // Try to match progress patterns
  for (const pattern of config.progressPatterns) {
    const match = output.match(pattern);
    if (match) {
      if (match[1] && match[2]) {
        result.current = parseInt(match[1], 10);
        result.total = parseInt(match[2], 10);
      } else if (match[1]) {
        result.packages = parseInt(match[1], 10);
      }

      // Determine phase from output
      if (output.includes('resolv')) result.phase = 'resolving';
      else if (output.includes('fetch')) result.phase = 'fetching';
      else if (output.includes('link')) result.phase = 'linking';
      else if (output.includes('build')) result.phase = 'building';
      else if (output.includes('install')) result.phase = 'installing';

      break;
    }
  }

  return result;
};

// ============================================================================
// ERROR DETECTION
// ============================================================================

/**
 * Detect error type from output
 */
export const detectErrorType = (
  output: string,
  pm: PackageManagerName
): 'network' | 'permission' | 'notFound' | 'conflict' | 'unknown' => {
  const config = getPackageManagerConfig(pm);

  if (config.errorPatterns.network.test(output)) return 'network';
  if (config.errorPatterns.permission.test(output)) return 'permission';
  if (config.errorPatterns.notFound.test(output)) return 'notFound';
  if (config.errorPatterns.conflict.test(output)) return 'conflict';

  return 'unknown';
};

/**
 * Get environment variables for package manager
 */
export const getPackageManagerEnv = (
  pm: PackageManagerName,
  options: {
    color?: boolean;
    ci?: boolean;
  } = {}
): Record<string, string> => {
  const config = getPackageManagerConfig(pm);
  const env: Record<string, string> = {};

  // Copy process.env but filter out undefined values
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }

  if (options.color && config.env.colorFlag) {
    env[config.env.colorFlag] = '1';
  }

  if (options.ci && config.env.ciFlag) {
    env[config.env.ciFlag] = 'true';
  }

  return env;
};
