import type { Options as CliProgressOptions } from 'cli-progress'

/**
 * Progress state represents the current state of a long-running operation
 */
export interface ProgressState {
  /** Current step being executed */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
  /** Current step name/description */
  stepName: string
  /** Progress percentage (0-100) */
  percentage: number
  /** Start time of the operation */
  startTime: number
  /** Whether the operation is complete */
  completed: boolean
  /** Optional metadata for the current step */
  metadata: Record<string, unknown>
}

/**
 * Progress tracker manages progress state updates
 */
export interface ProgressTracker {
  /** Update progress to next step */
  nextStep: (stepName: string, metadata?: Record<string, unknown>) => ProgressState
  /** Update progress to specific step */
  setStep: (step: number, stepName: string, metadata?: Record<string, unknown>) => ProgressState
  /** Mark operation as complete */
  complete: () => ProgressState
  /** Get current progress state */
  getState: () => ProgressState
  /** Reset progress tracker */
  reset: (totalSteps: number) => ProgressState
  /** Stop and clean up progress display */
  stop: () => void
}

/**
 * Configuration options for progress tracking
 */
export interface ProgressOptions {
  /** Total number of steps in the operation */
  totalSteps: number
  /** Step weights for weighted progress calculation */
  stepWeights?: number[]
  /** Custom cli-progress options */
  barOptions?: Partial<CliProgressOptions>
  /** Format template for progress display */
  format?: string
  /** Whether to show step names in progress */
  showStepNames?: boolean
}
