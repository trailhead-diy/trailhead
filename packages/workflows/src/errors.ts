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
  return createTrailheadError('WorkflowError', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  });
};

export const createWorkflowValidationError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError('WorkflowValidationError', message, {
    suggestion,
    cause,
    recoverable: true,
    context: details,
  });
};

export const createWorkflowExecutionError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError('WorkflowExecutionError', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  });
};

export const createWorkflowTimeoutError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError('WorkflowTimeoutError', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  });
};

export const createStepError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError('StepError', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  });
};

export const createStepValidationError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError('StepValidationError', message, {
    suggestion,
    cause,
    recoverable: true,
    context: details,
  });
};

export const createStepExecutionError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError('StepExecutionError', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  });
};

export const createStepTimeoutError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError('StepTimeoutError', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  });
};

export const createDependencyError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError('DependencyError', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
  });
};

export const createConcurrencyError = (
  message: string,
  suggestion: string,
  cause?: unknown,
  details?: Record<string, unknown>
): TrailheadError => {
  return createTrailheadError('ConcurrencyError', message, {
    suggestion,
    cause,
    recoverable: false,
    context: details,
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
