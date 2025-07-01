/**
 * Step execution module - handles individual installation step execution
 */

import type { Result, InstallError, Logger } from './types.js'
import { Ok, Err } from './types.js'
import type { Ora } from 'ora'

// ============================================================================
// TYPES
// ============================================================================

export interface InstallationStep {
  readonly name: string
  readonly text: string
  readonly execute: () => Promise<Result<readonly string[], InstallError>>
  readonly critical?: boolean
  readonly retryable?: boolean
}

export interface StepExecutionResult {
  readonly installedFiles: readonly string[]
  readonly failedSteps: readonly string[]
}

// ============================================================================
// STEP EXECUTION
// ============================================================================

/**
 * Execute a single installation step with proper error handling
 */
const executeStep = async (
  step: InstallationStep,
  logger: Logger
): Promise<Result<readonly string[], InstallError>> => {
  try {
    const result = await step.execute()

    if (result.success) {
      logger.debug(`Completed ${step.name}: ${result.value.length} files`)
    }

    return result
  } catch (error) {
    return Err({
      type: 'FileSystemError',
      message: `Unexpected error during ${step.name}`,
      path: '.',
      cause: error,
      details: error instanceof Error ? error.stack : undefined,
    })
  }
}

/**
 * Log error details for a failed step
 */
const logStepError = (step: InstallationStep, error: InstallError, logger: Logger): void => {
  logger.error(
    `Installation failed at ${step.critical ? 'critical' : 'non-critical'} step: ${step.name}`
  )

  if ('message' in error) {
    logger.error(`Error: ${error.message}`)
  }

  if ('details' in error && error.details) {
    logger.debug(
      `Details: ${typeof error.details === 'string' ? error.details : JSON.stringify(error.details, null, 2)}`
    )
  }
}

/**
 * Handle cleanup recommendation after failure
 */
const suggestCleanup = (
  installedFiles: readonly string[],
  componentsDir: string,
  logger: Logger
): void => {
  if (installedFiles.length > 0) {
    logger.warning('\nPartially installed files remain. To clean up:')
    logger.warning(`  rm -rf ${componentsDir}`)
  }
}

/**
 * Execute all installation steps
 */
export const executeInstallationSteps = async (
  steps: readonly InstallationStep[],
  logger: Logger,
  spinner: Ora,
  componentsDir: string
): Promise<Result<StepExecutionResult, InstallError>> => {
  const allInstalledFiles: string[] = []
  const failedSteps: string[] = []

  for (const step of steps) {
    spinner.text = step.text

    const result = await executeStep(step, logger)

    if (!result.success) {
      if (step.critical) {
        spinner.fail(`Failed to install ${step.name} (critical step)`)
        logStepError(step, result.error, logger)
        suggestCleanup(allInstalledFiles, componentsDir, logger)
        return result as Result<never, InstallError>
      } else {
        // Non-critical failure - log and continue
        spinner.warn(`Failed to install ${step.name} (non-critical, continuing)`)
        failedSteps.push(step.name)
        logger.warning(`Skipping ${step.name}: ${result.error.message}`)
        continue
      }
    }

    allInstalledFiles.push(...result.value)
  }

  return Ok({
    installedFiles: Object.freeze([...allInstalledFiles]),
    failedSteps: Object.freeze([...failedSteps]),
  })
}
