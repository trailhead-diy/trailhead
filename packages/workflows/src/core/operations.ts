import { ok, err } from '@trailhead/core';
import type {
  WorkflowOperations,
  WorkflowDefinition,
  StepDefinition,
  WorkflowResult,
  ExecutionPlan,
  ExecutionOptions,
  StepExecutionPlan,
} from '../types.js';
import { createWorkflowValidationError, createDependencyError } from '../errors.js';

// ========================================
// Workflow Operations
// ========================================

export const createWorkflowOperations = (): WorkflowOperations => {
  const createWorkflow = <TInput, TOutput>(
    definition: Omit<WorkflowDefinition<TInput, TOutput>, 'id'>
  ): WorkflowDefinition<TInput, TOutput> => {
    return {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...definition,
    };
  };

  const createStep = <TInput, TOutput>(
    definition: Omit<StepDefinition<TInput, TOutput>, 'id'>
  ): StepDefinition<TInput, TOutput> => {
    return {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...definition,
    };
  };

  const validateWorkflow = (workflow: WorkflowDefinition): WorkflowResult<void> => {
    try {
      // Check basic properties
      if (!workflow.id) {
        return err(
          createWorkflowValidationError(
            'Workflow ID is required',
            'Provide a unique identifier for the workflow'
          )
        );
      }

      if (!workflow.name) {
        return err(
          createWorkflowValidationError(
            'Workflow name is required',
            'Provide a descriptive name for the workflow'
          )
        );
      }

      if (!workflow.steps || workflow.steps.length === 0) {
        return err(
          createWorkflowValidationError(
            'Workflow must have at least one step',
            'Add step definitions to the workflow'
          )
        );
      }

      // Validate steps
      const stepIds = new Set<string>();
      for (const step of workflow.steps) {
        if (!step.id) {
          return err(
            createWorkflowValidationError(
              'Step ID is required',
              'Provide a unique identifier for each step'
            )
          );
        }

        if (stepIds.has(step.id)) {
          return err(
            createWorkflowValidationError(
              `Duplicate step ID: ${step.id}`,
              'Ensure all step IDs are unique within the workflow'
            )
          );
        }
        stepIds.add(step.id);

        if (!step.name) {
          return err(
            createWorkflowValidationError(
              `Step '${step.id}' is missing a name`,
              'Provide a descriptive name for each step'
            )
          );
        }

        if (!step.execute) {
          return err(
            createWorkflowValidationError(
              `Step '${step.id}' is missing an execute function`,
              'Provide an execute function for each step'
            )
          );
        }
      }

      // Validate dependencies
      const dependencyValidation = validateDependencies(workflow.steps);
      if (dependencyValidation.isErr()) {
        return dependencyValidation;
      }

      return ok(undefined);
    } catch (error) {
      return err(
        createWorkflowValidationError(
          'Workflow validation failed',
          'Check the workflow definition and fix any issues',
          error
        )
      );
    }
  };

  const planExecution = (
    workflow: WorkflowDefinition,
    options: ExecutionOptions = {}
  ): WorkflowResult<ExecutionPlan> => {
    try {
      const validation = validateWorkflow(workflow);
      if (validation.isErr()) {
        return validation;
      }

      // Build dependency graph
      const dependencies = new Map<string, readonly string[]>();
      const stepMap = new Map<string, StepDefinition>();

      for (const step of workflow.steps) {
        stepMap.set(step.id, step);
        dependencies.set(step.id, step.dependencies || []);
      }

      // Topological sort to determine execution order
      const sorted = topologicalSort(dependencies);
      if (sorted.isErr()) {
        return sorted;
      }

      const executionOrder = sorted.value;

      // Create step execution plans
      const stepPlans: StepExecutionPlan[] = executionOrder.map((stepId, index) => {
        const step = stepMap.get(stepId)!;
        const stepDependencies = step.dependencies || [];

        // Determine if step can run in parallel
        const canRunInParallel =
          options.parallel !== false &&
          stepDependencies.every(depId => executionOrder.indexOf(depId) < index);

        return {
          stepId,
          order: index,
          dependencies: stepDependencies,
          canRunInParallel,
          estimatedDuration: step.timeout,
        };
      });

      const plan: ExecutionPlan = {
        workflowId: workflow.id,
        steps: stepPlans,
        dependencies,
        parallel: options.parallel !== false,
        estimatedDuration: workflow.timeout,
      };

      return ok(plan);
    } catch (error) {
      return err(
        createWorkflowValidationError(
          'Failed to create execution plan',
          'Check the workflow definition and options',
          error
        )
      );
    }
  };

  return {
    createWorkflow,
    createStep,
    validateWorkflow,
    planExecution,
  };
};

// ========================================
// Helper Functions
// ========================================

const validateDependencies = (steps: readonly StepDefinition[]): WorkflowResult<void> => {
  const stepIds = new Set(steps.map(step => step.id));

  for (const step of steps) {
    if (step.dependencies) {
      for (const depId of step.dependencies) {
        if (!stepIds.has(depId)) {
          return err(
            createDependencyError(
              `Step '${step.id}' depends on non-existent step '${depId}'`,
              'Ensure all step dependencies reference valid step IDs'
            )
          );
        }
      }
    }
  }

  // Check for circular dependencies
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = (stepId: string): boolean => {
    if (recursionStack.has(stepId)) {
      return true;
    }
    if (visited.has(stepId)) {
      return false;
    }

    visited.add(stepId);
    recursionStack.add(stepId);

    const step = steps.find(s => s.id === stepId);
    if (step?.dependencies) {
      for (const depId of step.dependencies) {
        if (hasCycle(depId)) {
          return true;
        }
      }
    }

    recursionStack.delete(stepId);
    return false;
  };

  for (const step of steps) {
    if (hasCycle(step.id)) {
      return err(
        createDependencyError(
          'Circular dependency detected in workflow',
          'Remove circular dependencies between steps'
        )
      );
    }
  }

  return ok(undefined);
};

const topologicalSort = (
  dependencies: Map<string, readonly string[]>
): WorkflowResult<string[]> => {
  const result: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (stepId: string): boolean => {
    if (visiting.has(stepId)) {
      return false; // Circular dependency
    }
    if (visited.has(stepId)) {
      return true;
    }

    visiting.add(stepId);

    const deps = dependencies.get(stepId) || [];
    for (const depId of deps) {
      if (!visit(depId)) {
        return false;
      }
    }

    visiting.delete(stepId);
    visited.add(stepId);
    result.push(stepId);

    return true;
  };

  for (const stepId of dependencies.keys()) {
    if (!visited.has(stepId)) {
      if (!visit(stepId)) {
        return err(
          createDependencyError(
            'Circular dependency detected during topological sort',
            'Remove circular dependencies between steps'
          )
        );
      }
    }
  }

  return ok(result);
};
