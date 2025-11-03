import { createCommand, type CommandOptions } from '@trailhead/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'
import { execCommand } from '../../utils/subprocess.js'
import { colorize, withIcon } from '../../utils/colors.js'
import { fs } from '@trailhead/fs'
import path from 'path'

interface CoverageCheckOptions extends CommandOptions {
  readonly changed?: boolean
  readonly threshold?: string
  readonly reportOnly?: boolean
  readonly packageFilter?: string
}

interface CoverageSummary {
  total: {
    lines: { total: number; covered: number; skipped: number; pct: number }
    statements: { total: number; covered: number; skipped: number; pct: number }
    functions: { total: number; covered: number; skipped: number; pct: number }
    branches: { total: number; covered: number; skipped: number; pct: number }
  }
}

export const coverageCheckCommand = createCommand<CoverageCheckOptions>({
  name: 'coverage-check',
  description: 'Check test coverage with intelligent reporting and trend tracking',
  options: [
    {
      flags: '--changed',
      description: 'Only check coverage for changed packages',
      type: 'boolean',
      default: false,
    },
    {
      flags: '--threshold <number>',
      description: 'Override default coverage threshold',
      type: 'string',
    },
    {
      flags: '--report-only',
      description: 'Generate report without enforcing thresholds',
      type: 'boolean',
      default: false,
    },
    {
      flags: '--package-filter <filter>',
      description: 'Filter packages to check (e.g., "@trailhead/core")',
      type: 'string',
    },
  ],
  examples: [
    'coverage-check',
    'coverage-check --changed',
    'coverage-check --report-only',
    'coverage-check --package-filter "@trailhead/core"',
  ],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    try {
      context.logger.info(colorize('blue', withIcon('stats', 'Coverage Check')))
      context.logger.info(colorize('blue', '━'.repeat(60)))

      // Only run tests if not in report-only mode
      if (!options.reportOnly) {
        // Build test command
        const testArgs = ['test:coverage']
        if (options.changed) {
          testArgs.push('--affected')
        }
        if (options.packageFilter) {
          testArgs.push('--filter', options.packageFilter)
        }

        // Run tests with coverage
        context.logger.info('')
        context.logger.info(
          colorize('yellow', withIcon('progress', 'Running tests with coverage...'))
        )

        // Create a clean environment object
        const testEnv: Record<string, string> = {}
        for (const [key, value] of Object.entries(process.env)) {
          if (value !== undefined) {
            testEnv[key] = value
          }
        }
        testEnv.COVERAGE = 'true'

        const testResult = await execCommand('pnpm', testArgs, context, {
          env: testEnv,
        })

        if (testResult.isErr()) {
          return err(
            createCoreError('COVERAGE_TEST_FAILED', 'TEST_ERROR', 'Coverage tests failed', {
              recoverable: false,
              cause: testResult.error,
            })
          )
        }
      } else {
        context.logger.info('')
        context.logger.info(
          colorize('yellow', withIcon('info', 'Reading existing coverage reports...'))
        )
      }

      // Find all coverage-summary.json files
      const coverageFiles: string[] = []
      const findCoverageFiles = async (dir: string): Promise<void> => {
        const dirResult = await fs.readDir(dir)
        if (dirResult.isOk()) {
          for (const item of dirResult.value) {
            const fullPath = path.join(dir, item)
            const statResult = await fs.stat(fullPath)
            if (statResult.isOk()) {
              if (statResult.value.isDirectory && item !== 'node_modules') {
                if (item === 'coverage') {
                  const summaryPath = path.join(fullPath, 'coverage-summary.json')
                  const existsResult = await fs.exists(summaryPath)
                  if (existsResult) {
                    coverageFiles.push(summaryPath)
                  }
                } else {
                  await findCoverageFiles(fullPath)
                }
              }
            }
          }
        }
      }

      await findCoverageFiles(context.projectRoot)

      if (coverageFiles.length === 0) {
        context.logger.warning(colorize('yellow', withIcon('warning', 'No coverage reports found')))
        return ok(undefined)
      }

      // Read and analyze coverage
      let totalLines = 0
      let coveredLines = 0
      let totalFunctions = 0
      let coveredFunctions = 0
      let totalBranches = 0
      let coveredBranches = 0
      let totalStatements = 0
      let coveredStatements = 0

      const packageCoverage: Array<{ name: string; coverage: CoverageSummary }> = []

      for (const file of coverageFiles) {
        const contentResult = await fs.readFile(file)
        if (contentResult.isOk()) {
          try {
            const coverage: CoverageSummary = JSON.parse(contentResult.value)
            const packageName = path.dirname(file).split('/').slice(-2, -1)[0]

            packageCoverage.push({ name: packageName, coverage })

            totalLines += coverage.total.lines.total
            coveredLines += coverage.total.lines.covered
            totalFunctions += coverage.total.functions.total
            coveredFunctions += coverage.total.functions.covered
            totalBranches += coverage.total.branches.total
            coveredBranches += coverage.total.branches.covered
            totalStatements += coverage.total.statements.total
            coveredStatements += coverage.total.statements.covered
          } catch {
            context.logger.warning(
              colorize('yellow', withIcon('warning', `Failed to parse coverage for ${file}`))
            )
          }
        }
      }

      // Calculate percentages
      const linesPct = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
      const functionsPct = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0
      const branchesPct = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0
      const statementsPct = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0

      // Display results
      context.logger.info('')
      context.logger.info(colorize('blue', withIcon('stats', 'Coverage Summary')))
      context.logger.info(colorize('blue', '─'.repeat(60)))

      // Per-package coverage
      packageCoverage.sort((a, b) => a.name.localeCompare(b.name))
      for (const { name, coverage } of packageCoverage) {
        const pct = coverage.total.lines.pct
        const color = pct >= 80 ? 'green' : pct >= 70 ? 'yellow' : 'red'
        const icon = pct >= 80 ? 'success' : pct >= 70 ? 'warning' : 'error'

        context.logger.info(
          colorize(
            color,
            withIcon(
              icon,
              `${name.padEnd(20)} Lines: ${pct.toFixed(1)}% | Functions: ${coverage.total.functions.pct.toFixed(1)}%`
            )
          )
        )
      }

      // Overall coverage
      context.logger.info('')
      context.logger.info(colorize('blue', withIcon('info', 'Overall Coverage')))
      context.logger.info(colorize('blue', '─'.repeat(60)))

      const threshold = options.threshold ? parseFloat(options.threshold) : 70
      const overallColor = linesPct >= threshold ? 'green' : 'red'
      const overallIcon = linesPct >= threshold ? 'success' : 'error'

      context.logger.info(
        colorize(overallColor as any, withIcon(overallIcon, `Lines:      ${linesPct.toFixed(1)}%`))
      )
      context.logger.info(
        colorize(
          overallColor as any,
          withIcon(overallIcon, `Functions:  ${functionsPct.toFixed(1)}%`)
        )
      )
      context.logger.info(
        colorize(
          overallColor as any,
          withIcon(overallIcon, `Branches:   ${branchesPct.toFixed(1)}%`)
        )
      )
      context.logger.info(
        colorize(
          overallColor as any,
          withIcon(overallIcon, `Statements: ${statementsPct.toFixed(1)}%`)
        )
      )

      // Check thresholds
      if (!options.reportOnly) {
        const failed = linesPct < threshold || functionsPct < threshold || statementsPct < threshold

        if (failed) {
          context.logger.error('')
          context.logger.error(
            colorize('red', withIcon('error', `Coverage below threshold (${threshold}%)`))
          )
          return err(
            createCoreError(
              'COVERAGE_THRESHOLD_NOT_MET',
              'VALIDATION_ERROR',
              `Coverage below ${threshold}% threshold`,
              {
                recoverable: false,
                context: {
                  lines: linesPct.toFixed(1),
                  functions: functionsPct.toFixed(1),
                  branches: branchesPct.toFixed(1),
                  statements: statementsPct.toFixed(1),
                  threshold,
                },
              }
            )
          )
        }
      }

      context.logger.info('')
      context.logger.info(colorize('green', withIcon('success', 'Coverage check passed!')))

      // Generate badge suggestion
      context.logger.info('')
      context.logger.info(colorize('blue', withIcon('info', 'Add coverage badge to README:')))
      context.logger.info(
        `![Coverage](https://img.shields.io/badge/coverage-${Math.floor(linesPct)}%25-${linesPct >= 80 ? 'bright-green' : linesPct >= 70 ? 'yellow' : 'red'})`
      )

      return ok(undefined)
    } catch (error) {
      return err(
        createCoreError('COVERAGE_CHECK_FAILED', 'UNKNOWN_ERROR', 'Coverage check failed', {
          recoverable: false,
          cause: error,
        })
      )
    }
  },
})
