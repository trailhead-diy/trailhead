/**
 * Step execution module - migrated to use enhanced CLI framework
 */

import { createTaskList, createTask } from '@esteban-url/trailhead-cli/workflows';
import { retryableOperation } from '@esteban-url/trailhead-cli/error-recovery';
import { createError } from '@esteban-url/trailhead-cli/core';
import type { Result, InstallError, Logger } from './types.js';
import { ok, err } from './types.js';

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
                  if (!result.isOk()) {
                    throw new Error(result.error.message);
                  }
                  return result.value;
                })
            : async () => {
                const result = await step.execute();
                if (!result.isOk()) {
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

    return ok({
      installedFiles: Object.freeze([...allInstalledFiles]),
      failedSteps: Object.freeze([...failedSteps]),
    });
  } catch (error) {
    // If a critical step fails, suggest cleanup
    if (allInstalledFiles.length > 0) {
      logger.warning('\nPartially installed files remain. To clean up:');
      logger.warning(`  rm -rf ${componentsDir}`);
    }

    return err(
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
