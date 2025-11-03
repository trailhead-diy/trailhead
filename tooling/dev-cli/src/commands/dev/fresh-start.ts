import { createCommand, type CommandOptions, type CommandContext } from '@trailhead/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'
import { execSync } from 'child_process'
import { colorize, withIcon } from '../../utils/colors.js'
import { gitOperations } from '../../utils/git.js'
import { fsOperations } from '../../utils/fs.js'

interface FreshStartOptions extends CommandOptions {
  readonly pop?: boolean
}

interface ConfirmationResult {
  readonly confirmed: boolean
}

/**
 * Ask user for confirmation with Result-based handling
 */
async function askConfirmation(question: string): Promise<Result<ConfirmationResult, CoreError>> {
  const { createInterface } = await import('readline')

  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question(`${colorize('yellow', question)} (y/N): `, (answer: string) => {
      rl.close()
      const confirmed = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes'
      resolve(ok({ confirmed }))
    })
  })
}

/**
 * Execute pnpm commands with Result-based error handling
 */
function executePnpmCommand(command: string, description: string): Result<void, CoreError> {
  try {
    execSync(`pnpm ${command}`, { stdio: 'inherit' })
    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError(
        'PNPM_COMMAND_ERROR',
        `Failed to ${description}`,
        error instanceof Error ? error.message : String(error)
      )
    )
  }
}

/**
 * Validate environment after fresh start
 */
function validateEnvironment(context: CommandContext): Result<void, CoreError> {
  context.logger.info(colorize('blue', withIcon('info', 'Validating environment...')))

  // Check TypeScript
  context.logger.info('Checking TypeScript...')
  try {
    execSync('pnpm types', { stdio: 'pipe' })
    context.logger.info(colorize('green', '✅ TypeScript validation passed'))
  } catch {
    context.logger.info(
      colorize('yellow', '⚠️  TypeScript validation failed - you may need to fix type errors')
    )
  }

  // Show final git status
  context.logger.info('Final git status:')
  try {
    execSync('git status', { stdio: 'inherit' })
  } catch {
    return err(createCoreError('GIT_STATUS_ERROR', 'SYSTEM_ERROR', 'Failed to show git status'))
  }

  return ok(undefined)
}

export const freshStartCommand = createCommand<FreshStartOptions>({
  name: 'fresh-start',
  description: 'Complete development environment reset to clean, up-to-date state',
  options: [
    {
      flags: '-p, --pop',
      description: 'Restore stashed changes after reset',
      type: 'boolean',
      default: false,
    },
  ],
  examples: ['fresh-start', 'fresh-start --pop', 'fresh-start -p'],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    try {
      context.logger.info(
        colorize('blue', '🧹 Fresh Start - Complete Development Environment Reset')
      )
      context.logger.info(
        colorize('yellow', 'This will reset your environment to a clean, up-to-date state.\n')
      )

      // Pre-flight checks
      const branchResult = gitOperations.getCurrentBranch()
      if (branchResult.isErr()) {
        return err(branchResult.error)
      }
      const currentBranch = branchResult.value

      const statusResult = gitOperations.getStatus()
      if (statusResult.isErr()) {
        return err(statusResult.error)
      }
      const { hasChanges } = statusResult.value

      context.logger.info(colorize('blue', `Current branch: ${currentBranch}`))
      if (hasChanges) {
        context.logger.info(colorize('yellow', 'Uncommitted changes detected - will be stashed'))
        if (options.pop) {
          context.logger.info(
            colorize('blue', 'Changes will be restored after fresh start (--pop flag)')
          )
        }
      }

      // Confirmation
      const stashAction =
        options.pop && hasChanges
          ? 'Stash changes and restore after reset'
          : 'Stash any uncommitted changes'

      const confirmationResult = await askConfirmation(
        '\nThis will:\n' +
          `• ${stashAction}\n` +
          '• Reset to main branch (origin/main)\n' +
          '• Clean all dependencies and caches\n' +
          '• Reinstall dependencies and rebuild\n' +
          '\nContinue?'
      )

      if (confirmationResult.isErr() || !confirmationResult.value.confirmed) {
        context.logger.info(colorize('yellow', '\nFresh start cancelled.'))
        return ok(undefined)
      }

      // Step 1: Prepare environment
      context.logger.info(colorize('blue', '\n1. Preparing environment'))

      let stashInfo = null
      if (hasChanges) {
        const stashResult = gitOperations.stashChanges()
        if (stashResult.isErr()) {
          return err(stashResult.error)
        }
        stashInfo = stashResult.value
        if (stashInfo) {
          context.logger.info(
            colorize('green', `✅ Stashed uncommitted changes: "${stashInfo.message}"`)
          )
        } else {
          context.logger.info('No uncommitted changes to stash')
        }
      } else {
        context.logger.info('No uncommitted changes to stash')
      }

      // Step 2: Reset to main
      context.logger.info(colorize('blue', '\n2. Resetting to latest main branch'))
      const resetResult = gitOperations.resetToMain()
      if (resetResult.isErr()) {
        return resetResult
      }
      context.logger.info(colorize('green', '✅ Git state reset to latest main'))

      // Step 3: Clean dependencies and caches
      context.logger.info(colorize('blue', '\n3. Cleaning dependencies and caches'))

      const pathsToClean = [
        'node_modules',
        'packages/*/node_modules',
        '.turbo/cache',
        '.turbo/cookies',
        'packages/*/dist',
        'packages/*/.next',
        'packages/*/build',
      ] as const

      const cleanResult = fsOperations.cleanPaths(pathsToClean)
      if (cleanResult.isErr()) {
        return err(cleanResult.error)
      }

      const { cleaned } = cleanResult.value
      for (const path of cleaned) {
        context.logger.info(`Cleaned: ${path}`)
      }
      context.logger.info(colorize('green', '✅ Dependencies and caches cleaned'))

      // Step 4: Fresh dependency installation
      context.logger.info(colorize('blue', '\n4. Fresh dependency installation'))
      const installResult = executePnpmCommand('install --frozen-lockfile', 'install dependencies')
      if (installResult.isErr()) {
        return installResult
      }
      context.logger.info(colorize('green', '✅ Dependencies installed'))

      // Step 5: Build all packages
      context.logger.info(colorize('blue', '\n5. Building all packages'))
      const buildResult = executePnpmCommand('build', 'build packages')
      if (buildResult.isErr()) {
        return buildResult
      }
      context.logger.info(colorize('green', '✅ All packages built successfully'))

      // Step 6: Validate environment
      const validationResult = validateEnvironment(context)
      if (validationResult.isErr()) {
        return validationResult
      }

      // Final step: Pop stash if requested
      if (options.pop && stashInfo) {
        context.logger.info(colorize('blue', '\nFinal. Restoring stashed changes'))
        const popResult = gitOperations.popStash(stashInfo.ref)
        if (popResult.isErr()) {
          context.logger.info(
            colorize(
              'yellow',
              'Failed to restore stashed changes - you may need to resolve manually'
            )
          )
          context.logger.info(`To restore manually, run: git stash pop ${stashInfo.ref}`)
        } else {
          context.logger.info(colorize('green', '✅ Stashed changes restored successfully'))
        }
      }

      // Show summary
      context.logger.info('\n' + '='.repeat(60))
      context.logger.info(colorize('green', '🎉 Fresh Start Complete!'))
      context.logger.info('='.repeat(60))
      context.logger.info(
        colorize('blue', 'Your development environment has been reset to a clean state:')
      )
      context.logger.info(colorize('green', '• Git: Reset to latest main branch'))
      context.logger.info(colorize('green', '• Dependencies: Freshly installed'))
      context.logger.info(colorize('green', '• Build: All packages rebuilt'))
      context.logger.info(colorize('green', '• Cache: Cleaned and regenerated'))
      context.logger.info(colorize('blue', "\nYou're ready to start fresh development! 🚀"))
      context.logger.info('='.repeat(60))

      return ok(undefined)
    } catch {
      return err(
        createCoreError('FRESH_START_ERROR', 'SYSTEM_ERROR', 'Fresh start operation failed')
      )
    }
  },
})
