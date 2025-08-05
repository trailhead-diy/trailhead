import { createCommand, type CommandOptions, type CommandContext } from '@esteban-url/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@esteban-url/core'
import { execCommand } from '../utils/subprocess.js'
import { colorize, withIcon } from '../utils/colors.js'

interface TestRunnerOptions extends CommandOptions {
  readonly dryRun?: boolean
  readonly force?: boolean
  readonly skip?: boolean
  readonly testCommand?: string
  readonly configFile?: string
  readonly timeout?: number
  readonly retryFlaky?: boolean
  readonly maxRetries?: number
  readonly parallelTesting?: boolean
}

interface TestConfig {
  readonly testCommand?: string
  readonly timeout?: number
  readonly retryFlaky?: boolean
  readonly maxRetries?: number
  readonly parallelTesting?: boolean
  readonly highRiskPatterns?: string[]
  readonly skipPatterns?: string[]
  readonly packageMappings?: Record<string, string>
}

type RiskLevel = 'high' | 'medium' | 'skip'

// Cache for staged files
let stagedFilesCache: string[] | null = null
let cacheTimestamp = 0

// Progress indicator support
const createProgressIndicator = (message: string): (() => void) => {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let i = 0
  const interval = setInterval(() => {
    process.stdout.write(`\r${colorize('blue', frames[i])} ${message}`)
    i = (i + 1) % frames.length
  }, 100)

  return () => {
    clearInterval(interval)
    process.stdout.write('\r' + ' '.repeat(message.length + 3) + '\r') // Clear the line
  }
}

// Detect timeout command availability
const getTimeoutCommand = async (context: CommandContext): Promise<string | null> => {
  // Check for timeout command
  const timeoutResult = await execCommand('which', ['timeout'], context, { allowFailure: true })
  if (timeoutResult.isOk()) {
    return 'timeout'
  }

  // Check for gtimeout (macOS with coreutils)
  const gtimeoutResult = await execCommand('which', ['gtimeout'], context, { allowFailure: true })
  if (gtimeoutResult.isOk()) {
    return 'gtimeout'
  }

  // No timeout command available
  if (context.verbose) {
    context.logger.warning(
      colorize(
        'yellow',
        withIcon(
          'warning',
          'Neither timeout nor gtimeout found. Install coreutils for timeout support.'
        )
      )
    )
  }
  return null
}

export const testRunnerCommand = createCommand<TestRunnerOptions>({
  name: 'test-runner',
  description: 'Intelligent test runner with git integration and risk analysis',
  options: [
    {
      flags: '--dry-run',
      description: 'Show what would be executed without running tests',
      type: 'boolean',
      default: false,
    },
    {
      flags: '--force',
      description: 'Force full test suite execution',
      type: 'boolean',
      default: false,
    },
    {
      flags: '--skip',
      description: 'Skip all test execution',
      type: 'boolean',
      default: false,
    },
    {
      flags: '-c, --test-command <command>',
      description: 'Test command to execute',
      type: 'string',
      default: 'pnpm test',
    },
    {
      flags: '--config-file <path>',
      description: 'Path to configuration file',
      type: 'string',
      default: '.smart-test-config.json',
    },
    {
      flags: '--timeout <seconds>',
      description: 'Test execution timeout in seconds',
      type: 'string',
      default: '120',
    },
    {
      flags: '--retry-flaky',
      description: 'Enable retry for flaky tests',
      type: 'boolean',
      default: true,
    },
    {
      flags: '--max-retries <number>',
      description: 'Maximum number of retries for flaky tests',
      type: 'string',
      default: '2',
    },
    {
      flags: '--parallel-testing',
      description: 'Enable parallel test execution for affected packages',
      type: 'boolean',
      default: true,
    },
  ],
  examples: [
    'test-runner',
    'test-runner --dry-run',
    'test-runner --force',
    'test-runner --test-command "pnpm test --coverage"',
    'test-runner --timeout 300 --max-retries 3',
  ],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    // Handle skip flag
    if (options.skip || process.env.SKIP_TESTS === '1') {
      context.logger.warning(
        colorize('yellow', withIcon('warning', 'Skipping all tests (SKIP_TESTS=1 or --skip)'))
      )
      return ok(undefined)
    }

    // Load configuration
    const config = await loadConfiguration(options.configFile || '.smart-test-config.json', context)

    // Get staged files from git
    const stagedFiles = await getStagedFiles(context)

    if (stagedFiles.length === 0) {
      context.logger.warning(colorize('yellow', withIcon('warning', 'No staged files found')))
      return ok(undefined)
    }

    if (context.verbose) {
      context.logger.info(
        colorize('blue', withIcon('info', `Found ${stagedFiles.length} staged files`))
      )
    }

    // Merge options with config
    const mergedOptions = {
      ...options,
      testCommand: options.testCommand || config.testCommand || 'pnpm test',
      timeout: Number(options.timeout || config.timeout || 120),
      retryFlaky: options.retryFlaky ?? config.retryFlaky ?? true,
      maxRetries: Number(options.maxRetries || config.maxRetries || 2),
      parallelTesting: options.parallelTesting ?? config.parallelTesting ?? true,
    }

    // Force full test suite if requested
    if (options.force || process.env.FORCE_TESTS === '1') {
      return executeTests(
        mergedOptions.testCommand,
        '🔴 Forced full test suite execution',
        mergedOptions,
        context
      )
    }

    // Detect risk level based on file patterns
    const riskLevel = detectRiskLevel(stagedFiles, config, context)

    if (context.verbose) {
      context.logger.info(`Detected risk level: ${riskLevel}`)
    }

    // Execute based on risk level
    switch (riskLevel) {
      case 'high':
        return executeTests(
          mergedOptions.testCommand,
          '🔴 Code changes detected - running full test suite',
          mergedOptions,
          context
        )

      case 'medium':
        return runAffectedPackageTests(stagedFiles, mergedOptions, config, context)

      case 'skip':
        context.logger.info(
          colorize(
            'green',
            withIcon('success', '🟢 Documentation/config changes only - skipping tests')
          )
        )
        return ok(undefined)

      default:
        return executeTests(
          mergedOptions.testCommand,
          '🟡 Running full test suite (unknown risk level)',
          mergedOptions,
          context
        )
    }
  },
})

// Helper functions

async function getStagedFiles(context: CommandContext): Promise<string[]> {
  const now = Date.now()

  // Use cache if still valid (5 seconds)
  if (stagedFilesCache && now - cacheTimestamp < 5000) {
    return stagedFilesCache
  }

  const result = await execCommand('git', ['diff', '--cached', '--name-only'], context, {
    allowFailure: true,
  })

  const files = result.isOk() ? result.value.trim().split('\n').filter(Boolean) : []

  stagedFilesCache = files
  cacheTimestamp = now

  return files
}

async function loadConfiguration(configPath: string, context: CommandContext): Promise<TestConfig> {
  try {
    const configExists = await context.fs.exists(configPath)
    if (!configExists) {
      if (context.verbose) {
        context.logger.info(`Config file ${configPath} not found, using defaults`)
      }
      return {}
    }

    const contentResult = await context.fs.readFile(configPath)
    if (contentResult.isOk()) {
      return JSON.parse(contentResult.value) as TestConfig
    }
    return {}
  } catch (error) {
    if (context.verbose) {
      context.logger.warning(`Failed to parse config file: ${error}`)
    }
    return {}
  }
}

function detectRiskLevel(
  stagedFiles: string[],
  config: TestConfig,
  context?: CommandContext
): RiskLevel {
  if (context?.verbose) {
    context.logger.info(`Analyzing ${stagedFiles.length} staged files`)
  }

  // Get patterns from config or use defaults
  const highRiskPatterns =
    config.highRiskPatterns?.join('|') ||
    '.(ts|tsx|js|jsx)$|tsconfig|package.json$|turbo.json$|vitest.config|vite.config'

  const skipPatterns =
    config.skipPatterns?.join('|') ||
    '.md$|README|CHANGELOG|LICENSE|.github/|.vscode/|.gitignore$|.prettierrc|.prettierignore|docs/|.smart-test-config.json$|.mcp.json$|scripts/.*.sh$'

  const highRiskRegex = new RegExp(highRiskPatterns)
  const skipRegex = new RegExp(skipPatterns)

  // Check for high-risk files
  const hasHighRiskFiles = stagedFiles.some((file) => highRiskRegex.test(file))
  if (hasHighRiskFiles) {
    if (context?.verbose) {
      context.logger.info('Found high-risk files')
    }
    return 'high'
  }

  // Check for package-specific changes
  const hasPackageChanges = stagedFiles.some((file) => file.startsWith('packages/'))
  if (hasPackageChanges) {
    if (context?.verbose) {
      context.logger.info('Found package-specific changes')
    }
    return 'medium'
  }

  // Check if all files match skip patterns
  const nonSkipFiles = stagedFiles.filter((file) => !skipRegex.test(file))
  if (nonSkipFiles.length === 0) {
    if (context?.verbose) {
      context.logger.info('All files match skip patterns')
    }
    return 'skip'
  }

  if (context?.verbose) {
    context.logger.info('Defaulting to medium risk')
  }
  return 'medium'
}

function getAffectedPackages(stagedFiles: string[]): string[] {
  const packages = new Set<string>()

  for (const file of stagedFiles) {
    const match = file.match(/^packages\/([^/]+)\//)
    if (match) {
      packages.add(match[1])
    }
  }

  return Array.from(packages)
}

function getPackageFilter(packageName: string, config: TestConfig): string {
  // Check config for package mappings
  if (config.packageMappings?.[packageName]) {
    return config.packageMappings[packageName]
  }

  // Default mappings
  switch (packageName) {
    case 'cli':
      return '@esteban-url/cli'
    case 'create-cli':
      return '@esteban-url/create-cli'
    default:
      return packageName
  }
}

async function detectPackageManager(context: CommandContext): Promise<string> {
  if (await context.fs.exists('pnpm-lock.yaml')) {
    return 'pnpm'
  } else if (await context.fs.exists('yarn.lock')) {
    return 'yarn'
  } else if (await context.fs.exists('package-lock.json')) {
    return 'npm'
  }
  return 'npm' // default
}

async function executeTests(
  testCommand: string,
  description: string,
  options: TestRunnerOptions & { timeout: number; maxRetries: number },
  context: CommandContext
): Promise<Result<void, CoreError>> {
  if (options.dryRun) {
    context.logger.info(colorize('yellow', `DRY RUN: Would execute: ${testCommand}`))
    context.logger.info(colorize('yellow', `Reason: ${description}`))
    return ok(undefined)
  }

  context.logger.info(colorize('blue', withIcon('info', description)))

  const maxRetries = options.retryFlaky ? options.maxRetries : 1
  let attempt = 1

  // Check if we should use progress indicator (for long timeouts and non-verbose mode)
  const showProgress = options.timeout > 30 && !context.verbose

  while (attempt <= maxRetries) {
    if (maxRetries > 1 && context.verbose) {
      context.logger.info(`🔄 Attempt ${attempt} of ${maxRetries}`)
    }

    // Start progress indicator if needed
    let stopProgress: (() => void) | null = null
    if (showProgress) {
      stopProgress = createProgressIndicator('Tests running...')
    }

    // Parse command and prepare execution
    const [baseCommand, ...baseArgs] = testCommand.split(' ')
    let finalCommand = baseCommand
    let finalArgs = baseArgs

    // Handle timeout command if available
    const timeoutCommand = await getTimeoutCommand(context)
    if (timeoutCommand && options.timeout > 0) {
      finalCommand = timeoutCommand
      finalArgs = [`${options.timeout}s`, baseCommand, ...baseArgs]
    }

    try {
      const result = await execCommand(finalCommand, finalArgs, context, {
        // If we're using external timeout command, don't use internal timeout
        timeout: timeoutCommand ? undefined : options.timeout * 1000,
      })

      // Stop progress indicator
      if (stopProgress) {
        stopProgress()
      }

      if (result.isOk()) {
        context.logger.info(colorize('green', withIcon('success', 'Tests completed successfully')))
        return ok(undefined)
      }

      const error = result.error

      // Check for timeout (exit code 124 for timeout/gtimeout commands)
      if (error.message.includes('timed out') || error.message.includes('exit code 124')) {
        context.logger.error(
          colorize('red', withIcon('error', `Tests timed out after ${options.timeout}s`))
        )
        return err(error)
      }

      if (attempt < maxRetries) {
        context.logger.warning(
          colorize(
            'yellow',
            withIcon('warning', `Tests failed (attempt ${attempt}/${maxRetries}), retrying...`)
          )
        )
        await new Promise((resolve) => setTimeout(resolve, 2000)) // 2 second pause
      } else {
        context.logger.error(
          colorize('red', withIcon('error', `Tests failed after ${maxRetries} attempts`))
        )
        return err(error)
      }
    } catch (error) {
      // Stop progress indicator on error
      if (stopProgress) {
        stopProgress()
      }
      throw error
    }

    attempt++
  }

  return err(
    createCoreError(
      'TEST_EXECUTION_FAILED',
      'SUBPROCESS_ERROR',
      'Test execution failed after all retries',
      {
        recoverable: false,
        suggestion: 'Check test output and fix failing tests',
      }
    )
  )
}

async function runAffectedPackageTests(
  stagedFiles: string[],
  options: TestRunnerOptions & {
    testCommand: string
    timeout: number
    maxRetries: number
    parallelTesting: boolean
  },
  config: TestConfig,
  context: CommandContext
): Promise<Result<void, CoreError>> {
  const affectedPackages = getAffectedPackages(stagedFiles)

  if (affectedPackages.length === 0) {
    return executeTests(
      options.testCommand,
      '🟡 Running full test suite (package detection failed)',
      options,
      context
    )
  }

  const pm = await detectPackageManager(context)

  if (options.parallelTesting && pm === 'pnpm') {
    // Parallel execution for pnpm
    const packageFilters = affectedPackages.map((pkg) => getPackageFilter(pkg, config))
    const parallelFilter = `{${packageFilters.join(',')}}`
    const parallelTestCommand = `${options.testCommand} --filter=${parallelFilter}`

    return executeTests(
      parallelTestCommand,
      `🟡 Testing packages in parallel: ${packageFilters.join(', ')}`,
      options,
      context
    )
  } else {
    // Sequential execution
    let overallError: CoreError | null = null

    for (const packageName of affectedPackages) {
      const packageFilter = getPackageFilter(packageName, config)
      let packageTestCommand: string

      if (pm === 'pnpm') {
        packageTestCommand = `${options.testCommand} --filter=${packageFilter}`
      } else {
        // For non-pnpm, try to cd into package directory
        const packageDir = `packages/${packageName}`
        if (await context.fs.exists(packageDir)) {
          packageTestCommand = `cd ${packageDir} && ${options.testCommand}`
        } else {
          packageTestCommand = options.testCommand
        }
      }

      const result = await executeTests(
        packageTestCommand,
        `🟡 Testing package: ${packageName} (${packageFilter})`,
        options,
        context
      )

      if (result.isErr() && !overallError) {
        overallError = result.error
      }
    }

    return overallError ? err(overallError) : ok(undefined)
  }
}
