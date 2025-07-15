/**
 * @esteban-url/workflows/testing
 *
 * Workflow testing utilities for pipeline execution, step testing, and workflow validation.
 * Provides domain-focused utilities for testing workflow orchestration and execution patterns.
 *
 * @example
 * ```typescript
 * import {
 *   createMockWorkflow,
 *   createTestPipeline,
 *   assertWorkflowSuccess,
 *   workflowFixtures,
 * } from '@esteban-url/workflows/testing'
 * 
 * // Create test workflow
 * const workflow = createMockWorkflow('data-processing')
 * workflow.addStep('validate', () => ok('validated'))
 * workflow.addStep('transform', () => ok('transformed'))
 * 
 * // Run workflow
 * const result = await workflow.execute()
 * assertWorkflowSuccess(result)
 * ```
 */

import { ok, err, type Result } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'

// ========================================
// Workflow Types and Interfaces
// ========================================

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface WorkflowStep<TInput = any, TOutput = any> {
  readonly id: string
  readonly name: string
  readonly dependencies: string[]
  readonly condition?: (context: WorkflowContext) => boolean
  readonly timeout?: number
  execute(input: TInput, context: WorkflowContext): Promise<Result<TOutput, CoreError>>
}

export interface WorkflowContext {
  readonly workflowId: string
  readonly startTime: number
  readonly variables: Record<string, any>
  readonly stepResults: Map<string, any>
  readonly metadata: Record<string, any>
}

export interface WorkflowExecution {
  readonly workflowId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  readonly steps: Map<string, { status: WorkflowStepStatus; result?: any; error?: CoreError; duration?: number }>
  readonly startTime: number
  endTime?: number
  totalDuration?: number
}

export interface MockWorkflow {
  readonly id: string
  readonly name: string
  readonly steps: Map<string, WorkflowStep>
  addStep<T, R>(stepId: string, executor: (input: T, context: WorkflowContext) => Promise<Result<R, CoreError>> | Result<R, CoreError>): void
  addStepWithDependencies<T, R>(stepId: string, dependencies: string[], executor: (input: T, context: WorkflowContext) => Promise<Result<R, CoreError>> | Result<R, CoreError>): void
  execute(initialInput?: any, context?: Partial<WorkflowContext>): Promise<Result<WorkflowExecution, CoreError>>
  simulateStepFailure(stepId: string, error: CoreError): void
  simulateStepTimeout(stepId: string, timeoutMs: number): void
}

// ========================================
// Mock Workflow Creation
// ========================================

/**
 * Creates a mock workflow for testing
 */
export function createMockWorkflow(
  workflowId: string,
  name: string = workflowId
): MockWorkflow {
  const steps = new Map<string, WorkflowStep>()
  const stepOverrides = new Map<string, { shouldFail?: CoreError; shouldTimeout?: number }>()
  
  return {
    id: workflowId,
    name,
    steps,
    
    addStep<T, R>(
      stepId: string,
      executor: (input: T, context: WorkflowContext) => Promise<Result<R, CoreError>> | Result<R, CoreError>
    ): void {
      const step: WorkflowStep<T, R> = {
        id: stepId,
        name: stepId,
        dependencies: [],
        async execute(input: T, context: WorkflowContext): Promise<Result<R, CoreError>> {
          // Check for simulated failures
          const override = stepOverrides.get(stepId)
          if (override?.shouldFail) {
            return err(override.shouldFail)
          }
          if (override?.shouldTimeout) {
            await new Promise(resolve => setTimeout(resolve, override.shouldTimeout! + 100))
            return err({
              type: 'WorkflowError',
              code: 'STEP_TIMEOUT',
              message: `Step ${stepId} timed out after ${override.shouldTimeout}ms`,
              recoverable: true,
              component: 'workflows',
              operation: 'step-execution',
              timestamp: new Date(),
              severity: 'medium' as const,
            } satisfies CoreError)
          }
          
          const result = await executor(input, context)
          return result
        },
      }
      
      steps.set(stepId, step)
    },
    
    addStepWithDependencies<T, R>(
      stepId: string,
      dependencies: string[],
      executor: (input: T, context: WorkflowContext) => Promise<Result<R, CoreError>> | Result<R, CoreError>
    ): void {
      const step: WorkflowStep<T, R> = {
        id: stepId,
        name: stepId,
        dependencies,
        async execute(input: T, context: WorkflowContext): Promise<Result<R, CoreError>> {
          // Check for simulated failures
          const override = stepOverrides.get(stepId)
          if (override?.shouldFail) {
            return err(override.shouldFail)
          }
          
          const result = await executor(input, context)
          return result
        },
      }
      
      steps.set(stepId, step)
    },
    
    async execute(
      initialInput: any = {},
      contextOverrides: Partial<WorkflowContext> = {}
    ): Promise<Result<WorkflowExecution, CoreError>> {
      const startTime = Date.now()
      const context: WorkflowContext = {
        workflowId,
        startTime,
        variables: {},
        stepResults: new Map(),
        metadata: {},
        ...contextOverrides,
      }
      
      const execution: WorkflowExecution = {
        workflowId,
        status: 'running',
        steps: new Map(),
        startTime,
      }
      
      try {
        // Execute steps in dependency order (simplified for testing)
        const stepIds = Array.from(steps.keys())
        let currentInput = initialInput
        
        for (const stepId of stepIds) {
          const step = steps.get(stepId)!
          const stepStartTime = Date.now()
          
          execution.steps.set(stepId, { status: 'running' })
          
          const result = await step.execute(currentInput, context)
          const stepDuration = Date.now() - stepStartTime
          
          if (result.isErr()) {
            execution.steps.set(stepId, {
              status: 'failed',
              error: result.error,
              duration: stepDuration,
            })
            execution.status = 'failed'
            execution.endTime = Date.now()
            execution.totalDuration = execution.endTime - startTime
            
            return ok(execution)
          }
          
          execution.steps.set(stepId, {
            status: 'completed',
            result: result.value,
            duration: stepDuration,
          })
          
          context.stepResults.set(stepId, result.value)
          currentInput = result.value
        }
        
        execution.status = 'completed'
        execution.endTime = Date.now()
        execution.totalDuration = execution.endTime - startTime
        
        return ok(execution)
      } catch (error) {
        execution.status = 'failed'
        execution.endTime = Date.now()
        execution.totalDuration = execution.endTime - startTime
        
        return err({
          type: 'WorkflowError',
          code: 'EXECUTION_FAILED',
          message: `Workflow execution failed: ${error}`,
          recoverable: false,
          component: 'workflows',
          operation: 'workflow-execution',
          timestamp: new Date(),
          severity: 'high' as const,
        } satisfies CoreError)
      }
    },
    
    simulateStepFailure(stepId: string, error: CoreError): void {
      stepOverrides.set(stepId, { shouldFail: error })
    },
    
    simulateStepTimeout(stepId: string, timeoutMs: number): void {
      stepOverrides.set(stepId, { shouldTimeout: timeoutMs })
    },
  }
}

// ========================================
// Pipeline Testing Utilities
// ========================================

/**
 * Creates a test pipeline with common data processing steps
 */
export function createTestPipeline(pipelineId: string): MockWorkflow {
  const pipeline = createMockWorkflow(pipelineId, `Test Pipeline: ${pipelineId}`)
  
  // Add common pipeline steps
  pipeline.addStep('validate', async (input, context) => {
    if (!input || typeof input !== 'object') {
      return err({
        type: 'WorkflowError',
        code: 'VALIDATION_FAILED',
        message: 'Input validation failed',
        recoverable: true,
        component: 'workflows',
        operation: 'validation',
        timestamp: new Date(),
        severity: 'medium' as const,
      } satisfies CoreError)
    }
    return ok({ ...(input as Record<string, any>), validated: true })
  })
  
  pipeline.addStepWithDependencies('transform', ['validate'], async (input, context) => {
    return ok({ ...(input as Record<string, any>), transformed: true, timestamp: Date.now() })
  })
  
  pipeline.addStepWithDependencies('output', ['transform'], async (input, context) => {
    return ok({ ...(input as Record<string, any>), processed: true, outputPath: '/tmp/output.json' })
  })
  
  return pipeline
}

// ========================================
// Workflow Test Fixtures
// ========================================

export const workflowFixtures = {
  /**
   * Simple workflow configurations
   */
  simpleWorkflows: {
    dataProcessing: {
      id: 'data-processing',
      steps: ['validate', 'transform', 'save'],
    },
    
    fileProcessing: {
      id: 'file-processing',
      steps: ['read', 'parse', 'validate', 'convert', 'write'],
    },
    
    deployment: {
      id: 'deployment',
      steps: ['build', 'test', 'package', 'deploy', 'verify'],
    },
  },
  
  /**
   * Complex workflow with dependencies
   */
  complexWorkflow: {
    id: 'complex-pipeline',
    steps: [
      { id: 'fetch-data', dependencies: [] },
      { id: 'validate-schema', dependencies: ['fetch-data'] },
      { id: 'clean-data', dependencies: ['validate-schema'] },
      { id: 'analyze-data', dependencies: ['clean-data'] },
      { id: 'generate-report', dependencies: ['analyze-data'] },
      { id: 'send-notification', dependencies: ['generate-report'] },
    ],
  },
  
  /**
   * Parallel workflow branches
   */
  parallelWorkflow: {
    id: 'parallel-processing',
    branches: {
      imageProcessing: ['resize', 'optimize', 'watermark'],
      metadataExtraction: ['extract-exif', 'generate-tags', 'store-metadata'],
      backup: ['compress', 'encrypt', 'upload'],
    },
    merge: 'finalize',
  },
  
  /**
   * Sample workflow inputs
   */
  inputs: {
    simple: { data: 'test', id: 1 },
    complex: {
      users: [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' },
      ],
      settings: { debug: true, version: '1.0.0' },
    },
    invalid: null,
    malformed: { missingRequiredField: true },
  },
  
  /**
   * Expected outputs
   */
  outputs: {
    processed: { data: 'test', id: 1, validated: true, transformed: true, processed: true },
    failed: { error: 'VALIDATION_FAILED', message: 'Input validation failed' },
  },
}

// ========================================
// Workflow Testing Assertions
// ========================================

/**
 * Asserts that a workflow execution completed successfully
 */
export function assertWorkflowSuccess(
  result: Result<WorkflowExecution, CoreError>,
  expectedSteps?: string[]
): void {
  if (result.isErr()) {
    throw new Error(`Expected workflow to succeed, but got error: ${result.error.message}`)
  }
  
  const execution = result.value
  if (execution.status !== 'completed') {
    throw new Error(`Expected workflow status to be 'completed', but got '${execution.status}'`)
  }
  
  if (expectedSteps) {
    const completedSteps = Array.from(execution.steps.keys()).filter(
      stepId => execution.steps.get(stepId)?.status === 'completed'
    )
    
    for (const expectedStep of expectedSteps) {
      if (!completedSteps.includes(expectedStep)) {
        throw new Error(`Expected step '${expectedStep}' to be completed`)
      }
    }
  }
}

/**
 * Asserts that a workflow execution failed at a specific step
 */
export function assertWorkflowFailure(
  result: Result<WorkflowExecution, CoreError>,
  expectedFailedStep?: string
): void {
  if (result.isErr()) {
    // Workflow failed to start - this might be expected
    return
  }
  
  const execution = result.value
  if (execution.status !== 'failed') {
    throw new Error(`Expected workflow status to be 'failed', but got '${execution.status}'`)
  }
  
  if (expectedFailedStep) {
    const failedStep = execution.steps.get(expectedFailedStep)
    if (!failedStep || failedStep.status !== 'failed') {
      throw new Error(`Expected step '${expectedFailedStep}' to have failed`)
    }
  }
}

/**
 * Asserts that specific steps completed within time limits
 */
export function assertStepPerformance(
  execution: WorkflowExecution,
  stepId: string,
  maxDurationMs: number
): void {
  const step = execution.steps.get(stepId)
  if (!step) {
    throw new Error(`Step '${stepId}' not found in execution`)
  }
  
  if (!step.duration) {
    throw new Error(`Step '${stepId}' has no duration recorded`)
  }
  
  if (step.duration > maxDurationMs) {
    throw new Error(
      `Step '${stepId}' took ${step.duration}ms, expected <= ${maxDurationMs}ms`
    )
  }
}

/**
 * Asserts that workflow completed within overall time limit
 */
export function assertWorkflowPerformance(
  execution: WorkflowExecution,
  maxTotalDurationMs: number
): void {
  if (!execution.totalDuration) {
    throw new Error('Workflow has no total duration recorded')
  }
  
  if (execution.totalDuration > maxTotalDurationMs) {
    throw new Error(
      `Workflow took ${execution.totalDuration}ms, expected <= ${maxTotalDurationMs}ms`
    )
  }
}

// ========================================
// Workflow Test Scenarios
// ========================================

/**
 * Creates a test scenario for workflow execution
 */
export function createWorkflowTestScenario(options: {
  workflowId: string
  steps: Array<{
    id: string
    dependencies?: string[]
    shouldFail?: boolean
    duration?: number
  }>
  input?: any
}): {
  workflow: MockWorkflow
  runScenario: () => Promise<Result<WorkflowExecution, CoreError>>
  simulateFailure: (stepId: string) => void
  getExecution: () => Promise<Result<WorkflowExecution, CoreError>>
} {
  const workflow = createMockWorkflow(options.workflowId)
  
  // Add steps based on scenario configuration
  for (const stepConfig of options.steps) {
    const executor = async (input: any, context: WorkflowContext) => {
      // Simulate step duration
      if (stepConfig.duration) {
        await new Promise(resolve => setTimeout(resolve, stepConfig.duration))
      }
      
      return ok({ ...input, [`${stepConfig.id}Completed`]: true })
    }
    
    if (stepConfig.dependencies && stepConfig.dependencies.length > 0) {
      workflow.addStepWithDependencies(stepConfig.id, stepConfig.dependencies, executor)
    } else {
      workflow.addStep(stepConfig.id, executor)
    }
    
    // Simulate failures if configured
    if (stepConfig.shouldFail) {
      workflow.simulateStepFailure(stepConfig.id, {
        type: 'WorkflowError',
        code: 'STEP_FAILED',
        message: `Step ${stepConfig.id} failed as configured`,
        recoverable: true,
        component: 'workflows',
        operation: 'step-execution',
        timestamp: new Date(),
        severity: 'medium' as const,
      } satisfies CoreError)
    }
  }
  
  return {
    workflow,
    
    async runScenario(): Promise<Result<WorkflowExecution, CoreError>> {
      return workflow.execute(options.input)
    },
    
    simulateFailure(stepId: string): void {
      workflow.simulateStepFailure(stepId, {
        type: 'WorkflowError',
        code: 'SIMULATED_FAILURE',
        message: `Simulated failure for step ${stepId}`,
        recoverable: true,
        component: 'workflows',
        operation: 'step-execution',
        timestamp: new Date(),
        severity: 'low' as const,
      } satisfies CoreError)
    },
    
    async getExecution(): Promise<Result<WorkflowExecution, CoreError>> {
      return workflow.execute(options.input)
    },
  }
}

// ========================================
// Export Collections
// ========================================

/**
 * Workflow testing utilities grouped by functionality
 */
export const workflowTesting = {
  // Workflow creation
  createMockWorkflow,
  createTestPipeline,
  createWorkflowTestScenario,
  
  // Fixtures and test data
  fixtures: workflowFixtures,
  
  // Assertions
  assertWorkflowSuccess,
  assertWorkflowFailure,
  assertStepPerformance,
  assertWorkflowPerformance,
}