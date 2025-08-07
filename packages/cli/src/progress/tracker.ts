import { SingleBar, Presets } from 'cli-progress'
import type { ProgressTracker, ProgressState, ProgressOptions } from './types.js'

/**
 * Default progress options
 */
const DEFAULT_OPTIONS: Required<Omit<ProgressOptions, 'stepWeights' | 'barOptions'>> = {
  totalSteps: 1,
  format: 'Progress [{bar}] {percentage}% | {step}/{total} | {stepName}',
  showStepNames: true,
}

/**
 * Create a progress tracker for long-running operations
 *
 * Provides visual progress feedback using cli-progress with support
 * for step names, weighted progress, and custom formatting.
 *
 * @param options - Progress tracker configuration
 * @param options.totalSteps - Total number of steps in operation
 * @param options.stepWeights - Optional weights for weighted progress
 * @param options.format - Custom progress bar format string
 * @param options.showStepNames - Whether to display step names
 * @param options.barOptions - Additional cli-progress options
 * @returns Progress tracker instance for managing progress state
 *
 * @example
 * ```typescript
 * const tracker = createProgressTracker({
 *   totalSteps: 5,
 *   format: 'Building [{bar}] {percentage}% | {stepName}'
 * });
 *
 * tracker.nextStep('Compiling TypeScript');
 * tracker.nextStep('Running tests');
 * tracker.complete();
 * ```
 */
export function createProgressTracker(options: ProgressOptions): ProgressTracker {
  const config = { ...DEFAULT_OPTIONS, ...options }

  let state: ProgressState = createInitialState(config)

  // Initialize cli-progress bar
  const progressBar = new SingleBar({
    ...Presets.shades_classic,
    format: config.format,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    ...config.barOptions,
  })

  // Start the progress bar
  progressBar.start(config.totalSteps, 0, {
    step: 0,
    total: config.totalSteps,
    stepName: 'Starting...',
  })

  return {
    nextStep: (stepName: string, metadata: Record<string, unknown> = {}) => {
      const nextStepNumber = Math.min(state.currentStep + 1, state.totalSteps)
      state = updateProgress(state, {
        currentStep: nextStepNumber,
        stepName,
        metadata,
      })

      updateProgressBar(progressBar, state, config)
      return state
    },

    setStep: (step: number, stepName: string, metadata: Record<string, unknown> = {}) => {
      state = updateProgress(state, {
        currentStep: Math.max(0, Math.min(step, state.totalSteps)),
        stepName,
        metadata,
      })

      updateProgressBar(progressBar, state, config)
      return state
    },

    complete: () => {
      state = updateProgress(state, {
        currentStep: state.totalSteps,
        stepName: 'Complete',
        completed: true,
        percentage: 100,
      })

      progressBar.update(state.totalSteps, {
        step: state.totalSteps,
        total: state.totalSteps,
        stepName: 'Complete',
      })

      progressBar.stop()
      return state
    },

    getState: () => ({ ...state }),

    reset: (totalSteps: number) => {
      progressBar.stop()
      state = createInitialState({ ...config, totalSteps })

      progressBar.start(totalSteps, 0, {
        step: 0,
        total: totalSteps,
        stepName: 'Starting...',
      })

      return state
    },

    stop: () => {
      progressBar.stop()
    },
  }
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
 * Update the cli-progress bar with current state
 */
function updateProgressBar(
  progressBar: SingleBar,
  state: ProgressState,
  config: Required<Omit<ProgressOptions, 'stepWeights' | 'barOptions'>>
): void {
  const payload = {
    step: state.currentStep,
    total: state.totalSteps,
    stepName: config.showStepNames ? state.stepName : '',
  }

  progressBar.update(state.currentStep, payload)
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
