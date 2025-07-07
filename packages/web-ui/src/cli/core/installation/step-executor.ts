/**
 * Step execution module - migrated to use enhanced CLI framework
 */

import { createTaskList, createTask } from '@esteban-url/trailhead-cli/workflows';
import { retryableOperation } from '@esteban-url/trailhead-cli/error-recovery';
import { createError } from '@esteban-url/trailhead-cli/core';
import type { Result, InstallError, Logger } from './types.js';
import { Ok, Err } from './types.js';

// ============================================================================
// TYPES
// ============================================================================

export interface InstallationStep {
  readonly name: string;
  readonly text: string;
  readonly execute: () => Promise<Result<readonly string[], InstallError>>;
  readonly critical?: boolean;
  readonly retryable?: boolean;
}

export interface StepExecutionResult {
  readonly installedFiles: readonly string[];
  readonly failedSteps: readonly string[];
}

// ============================================================================
// STEP EXECUTION
// ============================================================================

/**
 * Execute a single installation step with proper error handling
 */
const _executeStep = async (
  step: InstallationStep,
  logger: Logger
): Promise<Result<readonly string[], InstallError>> => {
  try {
    const result = await step.execute();

    if (result.success) {
      logger.debug(`Completed ${step.name}: ${result.value.length} files`);
    }

    return result;
  } catch (error) {
    return Err(
      createError('FILESYSTEM_ERROR', `Unexpected error during ${step.name}`, {
        details: error instanceof Error ? error.stack : undefined,
        cause: error,
      })
    );
  }
};

/**
 * Log error details for a failed step
 */
const _logStepError = (step: InstallationStep, error: InstallError, logger: Logger): void => {
  logger.error(
    `Installation failed at ${step.critical ? 'critical' : 'non-critical'} step: ${step.name}`
  );

  if ('message' in error) {
    logger.error(`Error: ${error.message}`);
  }

  if ('details' in error && error.details) {
    logger.debug(
      `Details: ${typeof error.details === 'string' ? error.details : JSON.stringify(error.details, null, 2)}`
    );
  }
};

/**
 * Handle cleanup recommendation after failure
 */
const _suggestCleanup = (
  installedFiles: readonly string[],
  componentsDir: string,
  logger: Logger
): void => {
  if (installedFiles.length > 0) {
    logger.warning('\nPartially installed files remain. To clean up:');
    logger.warning(`  rm -rf ${componentsDir}`);
  }
};

/**
 * Execute all installation steps using enhanced CLI framework with listr2
 */
export const executeInstallationSteps = async (
  steps: readonly InstallationStep[],
  logger: Logger,
  _spinner: any, // Keep for compatibility but don't use
  componentsDir: string
): Promise<Result<StepExecutionResult, InstallError>> => {
  const allInstalledFiles: string[] = [];
  const failedSteps: string[] = [];

  try {
    // Convert installation steps to listr2 tasks
    const tasks = steps.map(step =>
      createTask(
        step.name,
        async () => {
          // Use retry for retryable steps
          const executeWithRetry = step.retryable
            ? () =>
                retryableOperation(async () => {
                  const result = await step.execute();
                  if (!result.success) {
                    throw new Error(result.error.message);
                  }
                  return result.value;
                })
            : async () => {
                const result = await step.execute();
                if (!result.success) {
                  throw new Error(result.error.message);
                }
                return result.value;
              };

          const files = await executeWithRetry();
          allInstalledFiles.push(...files);
          logger.debug(`Completed ${step.name}: ${files.length} files`);
          return files;
        },
        {
          skip: () => false,
          retry: step.retryable ? 3 : 0,
        }
      )
    );

    // Create and run task list
    const taskList = createTaskList(tasks, {
      concurrent: false,
      exitOnError: true, // Fail hard on any error - for proper error handling
    });

    await taskList.run();

    return Ok({
      installedFiles: Object.freeze([...allInstalledFiles]),
      failedSteps: Object.freeze([...failedSteps]),
    });
  } catch (error) {
    // If a critical step fails, suggest cleanup
    if (allInstalledFiles.length > 0) {
      logger.warning('\nPartially installed files remain. To clean up:');
      logger.warning(`  rm -rf ${componentsDir}`);
    }

    return Err(
      createError(
        'INSTALLATION_STEP_EXECUTION_FAILED',
        error instanceof Error ? error.message : 'Installation step execution failed',
        {
          details: `Failed during installation in directory: ${componentsDir}`,
          cause: error,
        }
      )
    );
  }
};
