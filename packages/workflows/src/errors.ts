import { createTrailheadError } from '@trailhead/core/errors';
import type { TrailheadError } from '@trailhead/core/errors';

// ========================================
// Workflow Error Creators
// ========================================

export const createWorkflowError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError({
    type: 'WorkflowError',
    code: 'WORKFLOW_ERROR',
    message,
    suggestion,
    cause,
    recoverable: false,
    details,
  });
};

export const createWorkflowValidationError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError({
    type: 'WorkflowValidationError',
    code: 'WORKFLOW_VALIDATION_ERROR',
    message,
    suggestion,
    cause,
    recoverable: true,
    details,
  });
};

export const createWorkflowExecutionError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError({
    type: 'WorkflowExecutionError',
    code: 'WORKFLOW_EXECUTION_ERROR',
    message,
    suggestion,
    cause,
    recoverable: false,
    details,
  });
};

export const createWorkflowTimeoutError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError({
    type: 'WorkflowTimeoutError',
    code: 'WORKFLOW_TIMEOUT_ERROR',
    message,
    suggestion,
    cause,
    recoverable: false,
    details,
  });
};

export const createStepError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError({
    type: 'StepError',
    code: 'STEP_ERROR',
    message,
    suggestion,
    cause,
    recoverable: false,
    details,
  });
};

export const createStepValidationError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError({
    type: 'StepValidationError',
    code: 'STEP_VALIDATION_ERROR',
    message,
    suggestion,
    cause,
    recoverable: true,
    details,
  });
};

export const createStepExecutionError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError({
    type: 'StepExecutionError',
    code: 'STEP_EXECUTION_ERROR',
    message,
    suggestion,
    cause,
    recoverable: false,
    details,
  });
};

export const createStepTimeoutError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError({
    type: 'StepTimeoutError',
    code: 'STEP_TIMEOUT_ERROR',
    message,
    suggestion,
    cause,
    recoverable: false,
    details,
  });
};

export const createDependencyError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError({
    type: 'DependencyError',
    code: 'DEPENDENCY_ERROR',
    message,
    suggestion,
    cause,
    recoverable: false,
    details,
  });
};

export const createConcurrencyError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError({
    type: 'ConcurrencyError',
    code: 'CONCURRENCY_ERROR',
    message,
    suggestion,
    cause,
    recoverable: false,
    details,
  });
};

// ========================================
// Error Mapping Functions
// ========================================

export const mapLibraryError = (
  operation: string,
  target: string,
  cause: unknown
): TrailheadError => {
  const message = `Failed to ${operation} ${target}`;
  const suggestion = 'Check the operation parameters and try again';

  if (cause instanceof Error) {
    if (cause.name === 'TimeoutError') {
      return createWorkflowTimeoutError(
        `${message}: operation timed out`,
        'Increase timeout or optimize the operation',
        cause,
        { operation, target }
      );
    }

    if (cause.name === 'ValidationError') {
      return createWorkflowValidationError(
        `${message}: validation failed`,
        'Check input parameters and workflow definition',
        cause,
        { operation, target }
      );
    }
  }

  return createWorkflowError(message, suggestion, cause, { operation, target });
};

export const mapStepError = (operation: string, stepId: string, cause: unknown): TrailheadError => {
  const message = `Step '${stepId}' failed during ${operation}`;
  const suggestion = 'Check step configuration and dependencies';

  if (cause instanceof Error) {
    if (cause.name === 'TimeoutError') {
      return createStepTimeoutError(
        `${message}: step timed out`,
        'Increase step timeout or optimize execution',
        cause,
        { operation, stepId }
      );
    }
  }

  return createStepError(message, suggestion, cause, { operation, stepId });
};
