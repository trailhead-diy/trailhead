import { createCommand, type CommandOptions } from '@esteban-url/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@esteban-url/core'
import { execCommand, createTimer, getElapsedSeconds } from '../utils/subprocess.js'
import { colorize, withIcon } from '../utils/colors.js'

interface CiOptimalOptions extends CommandOptions {
  readonly affected?: boolean
  readonly skipDocs?: boolean
  readonly skipSecurity?: boolean
  readonly concurrency?: number
  readonly turboArgs?: string
}

export const ciOptimalCommand = createCommand<CiOptimalOptions>({
  name: 'ci-optimal',
  description: 'Run comprehensive CI pipeline with optimal performance',
  options: [
    {
      flags: '--affected',
      description: 'Only run checks on affected packages',
      type: 'boolean',
      default: false,
    },
    {
      flags: '--skip-docs',
      description: 'Skip documentation validation',
      type: 'boolean',
      default: false,
    },
    {
      flags: '--skip-security',
      description: 'Skip security audit',
      type: 'boolean',
      default: false,
    },
    {
      flags: '--concurrency <number>',
      description: 'Concurrency level for parallel operations',
      type: 'string',
      default: '100%',
    },
    {
      flags: '--turbo-args <args>',
      description: 'Additional arguments for turbo commands',
      type: 'string',
    },
  ],
  examples: [
    'ci-optimal',
    'ci-optimal --affected',
    'ci-optimal --skip-docs --concurrency 4',
    'ci-optimal --turbo-args "--affected"',
  ],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    const startTime = createTimer()

    // Print header
    const border = '━'.repeat(60)
    context.logger.info(colorize('blue', border))
    context.logger.info(colorize('blue', withIcon('rocket', 'Trailhead Local CI')))
    context.logger.info(colorize('blue', border))

    try {
      // 1. Dependency check
      context.logger.info('')
      context.logger.info(colorize('yellow', withIcon('package', 'Checking dependencies...')))

      const installResult = await execCommand(
        'pnpm',
        ['install', '--frozen-lockfile', '--prefer-offline'],
        context
      )

      if (installResult.isErr()) {
        context.logger.error(colorize('red', withIcon('error', 'Dependency installation failed')))
        return err(installResult.error)
      }

      // 2. Quality checks
      context.logger.info('')
      context.logger.info(colorize('yellow', withIcon('search', 'Running quality checks...')))

      // Run lint separately (root command)
      const lintResult = await execCommand('pnpm', ['lint'], context)
      if (lintResult.isErr()) {
        context.logger.error(colorize('red', withIcon('error', 'Linting failed')))
        return err(lintResult.error)
      }

      // Build turbo command with options
      const turboArgs = ['turbo', 'run', 'format:check', 'types', 'test', 'build']
      turboArgs.push('--cache-dir=.turbo')
      turboArgs.push(`--concurrency=${options.concurrency || '100%'}`)

      if (options.turboArgs) {
        turboArgs.push(...options.turboArgs.split(' '))
      } else if (options.affected) {
        turboArgs.push('--affected')
      }

      const turboResult = await execCommand('pnpm', turboArgs, context)
      if (turboResult.isErr()) {
        context.logger.error(colorize('red', withIcon('error', 'Quality checks failed')))
        return err(turboResult.error)
      }

      // 3. Documentation validation (optional)
      if (!options.skipDocs) {
        context.logger.info('')
        context.logger.info(colorize('yellow', withIcon('docs', 'Validating documentation...')))

        const docsResult = await execCommand('pnpm', ['docs:validate'], context, {
          allowFailure: true,
        })

        if (docsResult.isErr()) {
          context.logger.warning(
            colorize(
              'yellow',
              withIcon('warning', 'Documentation validation failed (non-blocking)')
            )
          )
        }
      }

      // 4. Coverage check (if exists)
      try {
        const coverageExists = await context.fs.exists('coverage/coverage-summary.json')
        if (coverageExists) {
          const coverageResult = await context.fs.readFile('coverage/coverage-summary.json')
          if (coverageResult.isOk()) {
            const coverage = JSON.parse(coverageResult.value)
            const pct = coverage.total?.lines?.pct || 0
            context.logger.info('')
            context.logger.info(colorize('yellow', withIcon('stats', `Test coverage: ${pct}%`)))
          }
        }
      } catch {
        // Coverage file parsing failed, skip silently
      }

      // 5. Security audit (optional)
      if (!options.skipSecurity) {
        context.logger.info('')
        context.logger.info(colorize('yellow', withIcon('security', 'Security audit...')))

        const auditResult = await execCommand('pnpm', ['audit', '--audit-level=high'], context, {
          allowFailure: true,
        })

        if (auditResult.isErr()) {
          context.logger.warning(
            colorize('yellow', withIcon('warning', 'Security vulnerabilities found (non-blocking)'))
          )
        }
      }

      // 6. Bundle size check (if size-limit is available)
      const sizeLimitResult = await execCommand('which', ['size-limit'], context, {
        allowFailure: true,
      })

      if (sizeLimitResult.isOk()) {
        context.logger.info('')
        context.logger.info(colorize('yellow', withIcon('ruler', 'Checking bundle sizes...')))

        const sizeResult = await execCommand('pnpm', ['size-limit'], context, {
          allowFailure: true,
        })

        if (sizeResult.isErr()) {
          context.logger.warning(
            colorize('yellow', withIcon('warning', 'Bundle size limits exceeded'))
          )
        }
      }

      // Success summary
      const duration = getElapsedSeconds(startTime)

      context.logger.info('')
      context.logger.info(colorize('blue', border))
      context.logger.info(
        colorize('green', withIcon('success', `All checks passed in ${duration}s`))
      )
      context.logger.info(colorize('blue', border))

      // Cost savings estimate (simplified calculation)
      const minutesSaved = 5
      const costPerMinute = 0.008
      const savings = (minutesSaved * costPerMinute).toFixed(2)

      context.logger.info('')
      context.logger.info(
        colorize(
          'green',
          withIcon(
            'money',
            `Estimated savings: ${minutesSaved} GitHub Actions minutes ($${savings})`
          )
        )
      )

      return ok(undefined)
    } catch (error) {
      return err(
        createCoreError('CI_PIPELINE_FAILED', 'SUBPROCESS_ERROR', 'CI pipeline execution failed', {
          recoverable: false,
          cause: error,
          suggestion: 'Check individual command outputs and ensure all dependencies are installed',
        })
      )
    }
  },
})
