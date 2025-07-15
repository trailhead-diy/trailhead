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
 * Create progress tracker with cli-progress backend
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
