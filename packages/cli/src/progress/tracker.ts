import { spinner } from '@clack/prompts'
import type { ProgressTracker, ProgressState, ProgressOptions } from './types.js'

/**
 * Default progress options
 */
const DEFAULT_OPTIONS: Required<Omit<ProgressOptions, 'stepWeights'>> = {
  totalSteps: 1,
  format: '', // Ignored in Clack implementation
  showStepNames: true,
}

/**
 * Create a progress tracker for long-running operations
 *
 * Provides visual progress feedback using Clack's spinner with step tracking.
 * Shows step progress as "Step X/Y: stepName" format.
 *
 * @param options - Progress tracker configuration
 * @param options.totalSteps - Total number of steps in operation
 * @param options.stepWeights - Optional weights for weighted progress (kept for API compat)
 * @param options.showStepNames - Whether to display step names
 * @returns Progress tracker instance for managing progress state
 *
 * @example
 * ```typescript
 * const tracker = createProgressTracker({ totalSteps: 5 });
 *
 * tracker.nextStep('Compiling TypeScript');
 * tracker.nextStep('Running tests');
 * tracker.complete();
 * ```
 */
export function createProgressTracker(options: ProgressOptions): ProgressTracker {
  const config = { ...DEFAULT_OPTIONS, ...options }

  let state: ProgressState = createInitialState(config)
  const s = spinner()

  // Start the spinner
  s.start(formatMessage(state, config))

  return {
    nextStep: (stepName: string, metadata: Record<string, unknown> = {}) => {
      const nextStepNumber = Math.min(state.currentStep + 1, state.totalSteps)
      state = updateProgress(state, {
        currentStep: nextStepNumber,
        stepName,
        metadata,
      })

      s.message(formatMessage(state, config))
      return state
    },

    setStep: (step: number, stepName: string, metadata: Record<string, unknown> = {}) => {
      state = updateProgress(state, {
        currentStep: Math.max(0, Math.min(step, state.totalSteps)),
        stepName,
        metadata,
      })

      s.message(formatMessage(state, config))
      return state
    },

    complete: () => {
      state = updateProgress(state, {
        currentStep: state.totalSteps,
        stepName: 'Complete',
        completed: true,
        percentage: 100,
      })

      s.stop('Complete')
      return state
    },

    getState: () => ({ ...state }),

    reset: (totalSteps: number) => {
      s.stop()
      state = createInitialState({ ...config, totalSteps })
      s.start(formatMessage(state, config))
      return state
    },

    stop: () => {
      s.stop()
    },
  }
}

/**
 * Format progress message for spinner display
 */
function formatMessage(
  state: ProgressState,
  config: Required<Omit<ProgressOptions, 'stepWeights'>>
): string {
  const stepInfo = `[${state.currentStep}/${state.totalSteps}]`
  if (config.showStepNames && state.stepName) {
    return `${stepInfo} ${state.stepName}`
  }
  return stepInfo
}

/**
 * Update progress state immutably
 *
 * Creates a new progress state with the provided updates while
 * automatically calculating percentage and completion status.
 *
 * @param currentState - Current progress state
 * @param updates - Partial state updates to apply
 * @returns New progress state with updates applied
 *
 * @example
 * ```typescript
 * const newState = updateProgress(state, {
 *   currentStep: 3,
 *   stepName: 'Processing files'
 * });
 * ```
 */
export function updateProgress(
  currentState: ProgressState,
  updates: Partial<ProgressState>
): ProgressState {
  // Calculate new progress values
  const currentStep = updates.currentStep ?? currentState.currentStep
  const totalSteps = updates.totalSteps ?? currentState.totalSteps
  const percentage = Math.round((currentStep / totalSteps) * 100)

  return {
    ...currentState,
    ...updates,
    currentStep,
    totalSteps,
    percentage,
    completed: updates.completed ?? currentStep >= totalSteps,
  }
}

/**
 * Create initial progress state
 */
function createInitialState(options: ProgressOptions): ProgressState {
  const startTime = Date.now()

  return {
    currentStep: 0,
    totalSteps: options.totalSteps,
    stepName: 'Starting...',
    percentage: 0,
    startTime,
    completed: false,
    metadata: {},
  }
}

/**
 * Calculate weighted progress percentage
 *
 * Computes progress percentage based on step weights, allowing
 * more accurate progress for operations where steps take
 * different amounts of time.
 *
 * @param currentStep - Current step number (0-based)
 * @param totalSteps - Total number of steps
 * @param weights - Array of weights for each step
 * @returns Progress percentage (0-100)
 *
 * @example
 * ```typescript
 * // Step 1 takes 50% of time, steps 2-3 take 25% each
 * const weights = [50, 25, 25];
 * const progress = calculateWeightedProgress(1, 3, weights); // Returns 50
 * ```
 */
export function calculateWeightedProgress(
  currentStep: number,
  totalSteps: number,
  weights?: number[]
): number {
  if (totalSteps === 0) {
    return 0 // Handle 0/0 case
  }

  if (!weights || weights.length !== totalSteps) {
    // Fallback to equal weights
    return Math.round((currentStep / totalSteps) * 100)
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  if (totalWeight === 0) {
    return 0 // Handle case where all weights are 0
  }

  const completedWeight = weights.slice(0, currentStep).reduce((sum, weight) => sum + weight, 0)

  return Math.round((completedWeight / totalWeight) * 100)
}
