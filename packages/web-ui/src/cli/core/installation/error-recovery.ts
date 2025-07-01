/**
 * Error recovery module with pattern matching
 */

import { formatCommand, formatBulletList } from './shared-utils.js'

// ============================================================================
// TYPES
// ============================================================================

export type ErrorType =
  | 'network'
  | 'permission'
  | 'peer-dependency'
  | 'file-not-found'
  | 'disk-space'
  | 'timeout'
  | 'registry'
  | 'cache'
  | 'lockfile'
  | 'workspace'
  | 'unknown'

export interface InstallFallback {
  readonly command: string
  readonly instructions: readonly string[]
  readonly troubleshooting: readonly string[]
  readonly canRetry: boolean
  readonly severity: 'warning' | 'error' | 'critical'
}

export interface ErrorPattern {
  readonly pattern: RegExp
  readonly type: ErrorType
  readonly keywords?: readonly string[]
}

export interface RecoveryAction {
  readonly action: string
  readonly command?: string
  readonly description: string
  readonly automated: boolean
}

// ============================================================================
// ERROR PATTERN MATCHING
// ============================================================================

/**
 * Error patterns for detection
 */
const errorPatterns: readonly ErrorPattern[] = [
  // Network errors
  {
    pattern: /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ENETUNREACH|EAI_AGAIN/i,
    type: 'network',
    keywords: ['network', 'internet', 'connection', 'timeout'],
  },
  {
    pattern: /getaddrinfo|EHOSTUNREACH|ECONNRESET/i,
    type: 'network',
  },

  // Permission errors
  {
    pattern: /EACCES|EPERM|permission denied/i,
    type: 'permission',
    keywords: ['permission', 'access', 'denied'],
  },

  // Peer dependency errors
  {
    pattern: /peer dep|peerDependencies|ERESOLVE|conflicting peer dependency/i,
    type: 'peer-dependency',
    keywords: ['peer', 'dependency', 'conflict'],
  },

  // File system errors
  {
    pattern: /ENOENT|no such file or directory/i,
    type: 'file-not-found',
    keywords: ['file', 'not found', 'missing'],
  },
  {
    pattern: /ENOSPC|not enough space|disk full/i,
    type: 'disk-space',
    keywords: ['disk', 'space', 'storage'],
  },

  // Registry errors
  {
    pattern: /E401|E403|authentication|unauthorized/i,
    type: 'registry',
    keywords: ['auth', 'login', 'registry'],
  },
  {
    pattern: /E404|404 Not Found|package.*not found/i,
    type: 'registry',
    keywords: ['package', 'not found', '404'],
  },

  // Cache errors
  {
    pattern: /cache|ECACHE|integrity.*mismatch/i,
    type: 'cache',
    keywords: ['cache', 'integrity', 'corrupt'],
  },

  // Lockfile errors
  {
    pattern: /lockfile|package-lock|yarn\.lock|pnpm-lock/i,
    type: 'lockfile',
    keywords: ['lockfile', 'lock', 'outdated'],
  },

  // Workspace errors
  {
    pattern: /workspace|monorepo|lerna/i,
    type: 'workspace',
    keywords: ['workspace', 'monorepo'],
  },
]

/**
 * Match error message to error type
 */
export const matchErrorType = (message: string): ErrorType => {
  const lowerMessage = message.toLowerCase()

  for (const { pattern, type, keywords } of errorPatterns) {
    if (pattern.test(message)) {
      return type
    }

    // Check keywords as fallback
    if (keywords?.some((keyword) => lowerMessage.includes(keyword))) {
      return type
    }
  }

  return 'unknown'
}

// ============================================================================
// FALLBACK STRATEGIES
// ============================================================================

/**
 * Get fallback strategy for each error type
 */
const getFallbackStrategy = (errorType: ErrorType, packageManager: string): InstallFallback => {
  const strategies: Record<ErrorType, (pm: string) => InstallFallback> = {
    network: (pm) => ({
      command: `${pm} install`,
      instructions: [
        'Network connection error detected',
        'Please check your internet connection and try again',
      ],
      troubleshooting: [
        'Check if you can access https://registry.npmjs.org',
        'Try using a different network',
        "Check if you're behind a proxy or firewall",
        `Configure proxy: ${pm} config set proxy http://proxy.example.com`,
        'Try a different registry: npm config set registry https://registry.npmjs.org',
      ],
      canRetry: true,
      severity: 'warning',
    }),

    permission: (pm) => ({
      command: pm === 'npm' ? 'sudo npm install' : `${pm} install`,
      instructions: [
        'Permission denied while installing packages',
        'You may need elevated permissions',
      ],
      troubleshooting: [
        'Try running with appropriate permissions',
        'Change npm prefix to avoid permission issues:',
        '  npm config set prefix ~/.npm-global',
        '  export PATH=~/.npm-global/bin:$PATH',
        'Check folder ownership with: ls -la node_modules',
        'Fix ownership: sudo chown -R $(whoami) node_modules',
      ],
      canRetry: true,
      severity: 'error',
    }),

    'peer-dependency': (pm) => ({
      command: pm === 'npm' ? `${pm} install --legacy-peer-deps` : `${pm} install`,
      instructions: [
        'Peer dependency conflicts detected',
        'Some packages have incompatible peer dependency requirements',
      ],
      troubleshooting: [
        `Alternative: ${pm} install --force (may cause issues)`,
        'Review conflicting packages and update versions manually',
        'Check for newer versions that resolve conflicts:',
        `  ${pm} outdated`,
        'Consider using overrides/resolutions in package.json',
        'See: https://docs.npmjs.com/cli/v8/configuring-npm/package-json#overrides',
      ],
      canRetry: true,
      severity: 'warning',
    }),

    'file-not-found': (pm) => ({
      command: `rm -rf node_modules package-lock.json && ${pm} install`,
      instructions: ['Required files not found', 'Your node_modules may be corrupted'],
      troubleshooting: [
        'Clean install recommended:',
        '  1. Delete node_modules folder',
        '  2. Delete package-lock.json (or yarn.lock/pnpm-lock.yaml)',
        `  3. Run ${pm} install again`,
        'Ensure package.json exists in the current directory',
        "Check if you're in the correct directory",
      ],
      canRetry: true,
      severity: 'error',
    }),

    'disk-space': (pm) => ({
      command: `${pm} cache clean --force`,
      instructions: ['Insufficient disk space', 'Free up space and try again'],
      troubleshooting: [
        'Clear package manager cache:',
        `  ${pm} cache clean --force`,
        'Remove unused dependencies:',
        `  ${pm} prune`,
        'Check disk usage: df -h',
        'Remove old node_modules folders',
        'Consider moving cache to another disk',
      ],
      canRetry: true,
      severity: 'critical',
    }),

    timeout: (pm) => ({
      command: `${pm} install --network-timeout 600000`,
      instructions: ['Installation timed out', 'This may be due to slow network or large packages'],
      troubleshooting: [
        'Increase network timeout:',
        `  ${pm} install --network-timeout 600000`,
        'Try installing packages in smaller groups',
        'Check network speed and stability',
        'Consider using a faster registry mirror',
      ],
      canRetry: true,
      severity: 'warning',
    }),

    registry: (pm) => ({
      command: `${pm} login`,
      instructions: [
        'Registry authentication or access error',
        'You may need to log in or check registry configuration',
      ],
      troubleshooting: [
        `Verify registry configuration: ${pm} config get registry`,
        `Login to registry: ${pm} login`,
        'Check if package exists: npm view <package-name>',
        'For private packages, ensure you have access',
        'Try the default registry: npm config set registry https://registry.npmjs.org',
      ],
      canRetry: true,
      severity: 'error',
    }),

    cache: (pm) => ({
      command: `${pm} cache clean --force && ${pm} install`,
      instructions: ['Package cache corruption detected', 'Clearing cache and retrying'],
      troubleshooting: [
        `Clear cache: ${pm} cache clean --force`,
        'Verify cache: npm cache verify',
        'Delete node_modules and reinstall',
        'Check file system for corruption',
        'Disable cache temporarily: npm install --prefer-online',
      ],
      canRetry: true,
      severity: 'warning',
    }),

    lockfile: (pm) => ({
      command: `${pm} install --force`,
      instructions: ['Lockfile conflicts or inconsistencies', 'Your lockfile may be out of sync'],
      troubleshooting: [
        'Update lockfile: npm update --package-lock-only',
        'Regenerate lockfile:',
        '  1. Delete package-lock.json',
        `  2. Run ${pm} install`,
        'For CI: use npm ci instead of npm install',
        'Ensure lockfile is committed to version control',
      ],
      canRetry: true,
      severity: 'warning',
    }),

    workspace: (pm) => ({
      command: pm === 'pnpm' ? 'pnpm install --workspace-root' : `${pm} install`,
      instructions: ['Workspace or monorepo configuration issue', 'Check workspace settings'],
      troubleshooting: [
        "Ensure you're in the workspace root",
        'Check workspace configuration:',
        '  - pnpm: pnpm-workspace.yaml',
        '  - npm/yarn: package.json "workspaces" field',
        '  - lerna: lerna.json',
        'Install from workspace root',
        'Use workspace-specific commands',
      ],
      canRetry: true,
      severity: 'error',
    }),

    unknown: (pm) => ({
      command: `${pm} install --verbose`,
      instructions: [
        'An unexpected error occurred',
        'Try running with verbose output for more details',
      ],
      troubleshooting: [
        `Run with verbose logging: ${pm} install --verbose`,
        'Check the full error message above',
        'Common solutions:',
        '  - Clear node_modules and reinstall',
        '  - Update Node.js and npm to latest versions',
        '  - Check package.json for syntax errors',
        '  - Verify all dependencies exist',
        'Search for the specific error message online',
      ],
      canRetry: true,
      severity: 'error',
    }),
  }

  return strategies[errorType](packageManager)
}

/**
 * Get install fallback for an error
 */
export const getInstallFallback = (
  packageManager: string,
  error: Error | { message: string }
): InstallFallback => {
  const errorType = matchErrorType(error.message)
  return getFallbackStrategy(errorType, packageManager)
}

// ============================================================================
// RECOVERY ACTIONS
// ============================================================================

/**
 * Get automated recovery actions
 */
export const getRecoveryActions = (
  errorType: ErrorType,
  packageManager: string
): readonly RecoveryAction[] => {
  const actions: Record<ErrorType, RecoveryAction[]> = {
    network: [
      {
        action: 'retry',
        description: 'Retry installation',
        automated: true,
      },
      {
        action: 'offline',
        command: `${packageManager} install --offline`,
        description: 'Try offline mode',
        automated: true,
      },
    ],

    cache: [
      {
        action: 'clear-cache',
        command: `${packageManager} cache clean --force`,
        description: 'Clear package cache',
        automated: true,
      },
    ],

    'file-not-found': [
      {
        action: 'clean-install',
        command: 'rm -rf node_modules',
        description: 'Remove node_modules',
        automated: false,
      },
    ],

    'peer-dependency': [
      {
        action: 'legacy-deps',
        command: `${packageManager} install --legacy-peer-deps`,
        description: 'Use legacy peer deps resolution',
        automated: true,
      },
    ],

    // Other error types have manual recovery only
    permission: [],
    'disk-space': [],
    timeout: [],
    registry: [],
    lockfile: [],
    workspace: [],
    unknown: [],
  }

  return Object.freeze(actions[errorType] || [])
}

/**
 * Check if error is retryable
 */
export const isRetryableError = (errorType: ErrorType): boolean => {
  const retryableTypes: readonly ErrorType[] = ['network', 'timeout', 'cache', 'registry']

  return retryableTypes.includes(errorType)
}

/**
 * Get retry delay based on attempt number
 */
export const getRetryDelay = (attempt: number): number => {
  // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
  return Math.min(Math.pow(2, attempt - 1) * 1000, 10000)
}

// ============================================================================
// ERROR FORMATTING
// ============================================================================

/**
 * Format error message for display
 */
export const formatErrorMessage = (
  error: Error | { message: string },
  verbose: boolean = false
): readonly string[] => {
  const lines: string[] = []

  lines.push('❌ Installation failed')
  lines.push('')

  if (verbose && error instanceof Error && error.stack) {
    lines.push('Stack trace:')
    lines.push(error.stack)
  } else {
    lines.push('Error: ' + error.message)
  }

  return Object.freeze(lines)
}

/**
 * Format recovery instructions
 */
export const formatRecoveryInstructions = (fallback: InstallFallback): readonly string[] => {
  const lines: string[] = []

  // Instructions
  if (fallback.instructions.length > 0) {
    lines.push(...fallback.instructions)
    lines.push('')
  }

  // Suggested command
  lines.push('💡 Suggested command:')
  lines.push(formatCommand(fallback.command))
  lines.push('')

  // Troubleshooting
  if (fallback.troubleshooting.length > 0) {
    lines.push('🔧 Troubleshooting steps:')
    formatBulletList(fallback.troubleshooting).forEach((line) => lines.push(line))
  }

  return Object.freeze(lines)
}
