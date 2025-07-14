import { createCoreError } from '@esteban-url/core/errors'
import type { CoreError } from '@esteban-url/core/errors'

// ========================================
// Workflow Error Creators
// ========================================

export const createWorkflowError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): CoreError => {
  return createCoreError('WorkflowError', 'WORKFLOW_ERROR', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  })
}

export const createWorkflowValidationError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): CoreError => {
  return createCoreError('WorkflowValidationError', 'WORKFLOW_VALIDATION_ERROR', message, {
    suggestion,
    cause,
    recoverable: true,
    context: details,
  })
}

export const createWorkflowExecutionError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): CoreError => {
  return createCoreError('WorkflowExecutionError', 'WORKFLOW_EXECUTION_ERROR', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  })
}

export const createWorkflowTimeoutError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): CoreError => {
  return createCoreError('WorkflowTimeoutError', 'WORKFLOW_TIMEOUT_ERROR', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  })
}

export const createStepError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): CoreError => {
  return createCoreError('StepError', 'STEP_ERROR', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  })
}

export const createStepValidationError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): CoreError => {
  return createCoreError('StepValidationError', 'STEP_VALIDATION_ERROR', message, {
    suggestion,
    cause,
    recoverable: true,
    context: details,
  })
}

export const createStepExecutionError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): CoreError => {
  return createCoreError('StepExecutionError', 'STEP_EXECUTION_ERROR', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  })
}

export const createStepTimeoutError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): CoreError => {
  return createCoreError('StepTimeoutError', 'STEP_TIMEOUT_ERROR', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  })
}

export const createDependencyError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): CoreError => {
  return createCoreError('DependencyError', 'DEPENDENCY_ERROR', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  })
}

export const createConcurrencyError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): CoreError => {
  return createCoreError('ConcurrencyError', 'CONCURRENCY_ERROR', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  })
}

// ========================================
// Error Mapping Functions
// ========================================

export const mapLibraryError = (operation: string, target: string, cause: unknown): CoreError => {
  const message = `Failed to ${operation} ${target}`
  const suggestion = 'Check the operation parameters and try again'

  if (cause instanceof Error) {
    if (cause.name === 'TimeoutError') {
      return createWorkflowTimeoutError(
        `${message}: operation timed out`,
        'Increase timeout or optimize the operation',
        cause,
        { operation, target }
      )
    }

    if (cause.name === 'ValidationError') {
      return createWorkflowValidationError(
        `${message}: validation failed`,
        'Check input parameters and workflow definition',
        cause,
        { operation, target }
      )
    }
  }

  return createWorkflowError(message, suggestion, cause, { operation, target })
}

export const mapStepError = (operation: string, stepId: string, cause: unknown): CoreError => {
  const message = `Step '${stepId}' failed during ${operation}`
  const suggestion = 'Check step configuration and dependencies'

  if (cause instanceof Error) {
    if (cause.name === 'TimeoutError') {
      return createStepTimeoutError(
        `${message}: step timed out`,
        'Increase step timeout or optimize execution',
        cause,
        { operation, stepId }
      )
    }
  }

  return createStepError(message, suggestion, cause, { operation, stepId })
}
