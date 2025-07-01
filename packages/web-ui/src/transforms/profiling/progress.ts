/**
 * Progress indicators using ora spinners
 */

import ora, { type Ora } from 'ora'
import chalk from 'chalk'
import type { ProfileOptions } from './types.js'
import { PROGRESS_MESSAGES } from './constants.js'
import { formatDuration, formatMemory, createProgressBar } from './utils.js'

/**
 * Progress tracker for profiling operations
 */
export class ProgressTracker {
  private spinners: Map<string, Ora> = new Map()
  private startTimes: Map<string, number> = new Map()
  private readonly verbose: boolean

  constructor(verbose: boolean = false) {
    this.verbose = verbose
  }

  /**
   * Start a progress indicator
   */
  start(key: string, message: string, spinner: any = 'dots'): void {
    const ora_spinner = ora({
      text: message,
      spinner,
      color: 'blue',
    }).start()

    this.spinners.set(key, ora_spinner)
    this.startTimes.set(key, Date.now())
  }

  /**
   * Update progress message
   */
  update(key: string, message: string): void {
    const spinner = this.spinners.get(key)
    if (spinner) {
      spinner.text = message
    }
  }

  /**
   * Mark operation as successful
   */
  succeed(key: string, message?: string): void {
    const spinner = this.spinners.get(key)
    const startTime = this.startTimes.get(key)

    if (spinner) {
      const duration = startTime ? Date.now() - startTime : 0
      const finalMessage = message || spinner.text
      const withDuration =
        duration > 0
          ? `${finalMessage} ${chalk.gray(`(${formatDuration(duration)})`)}`
          : finalMessage

      spinner.succeed(withDuration)
      this.spinners.delete(key)
      this.startTimes.delete(key)
    }
  }

  /**
   * Mark operation as failed
   */
  fail(key: string, message?: string): void {
    const spinner = this.spinners.get(key)

    if (spinner) {
      spinner.fail(message || spinner.text)
      this.spinners.delete(key)
      this.startTimes.delete(key)
    }
  }

  /**
   * Show warning
   */
  warn(key: string, message?: string): void {
    const spinner = this.spinners.get(key)

    if (spinner) {
      spinner.warn(message || spinner.text)
      this.spinners.delete(key)
      this.startTimes.delete(key)
    }
  }

  /**
   * Show info
   */
  info(message: string): void {
    if (this.verbose) {
      ora().info(message)
    }
  }

  /**
   * Stop all spinners
   */
  stopAll(): void {
    this.spinners.forEach((spinner) => spinner.stop())
    this.spinners.clear()
    this.startTimes.clear()
  }
}

/**
 * Factory function to create progress tracker
 */
export function createProgressTracker(options: ProfileOptions): ProgressTracker {
  return new ProgressTracker(options.verbose)
}

/**
 * Progress manager for profiling workflow
 */
export class ProfileProgressManager {
  private tracker: ProgressTracker
  private currentIteration: number = 0
  private totalIterations: number = 0

  constructor(tracker: ProgressTracker) {
    this.tracker = tracker
  }

  /**
   * Start environment setup
   */
  startSetup(): void {
    this.tracker.start('setup', PROGRESS_MESSAGES.setup, 'bouncingBar')
  }

  /**
   * Complete environment setup
   */
  completeSetup(): void {
    this.tracker.succeed('setup', 'Environment setup complete')
  }

  /**
   * Start profiling phase
   */
  startProfiling(approach: string, iterations: number): void {
    this.totalIterations = iterations
    this.currentIteration = 0

    const message = `Profiling ${approach} approach (${iterations} iterations)`
    this.tracker.start('profile', message, 'dots2')
  }

  /**
   * Update profiling progress
   */
  updateProfiling(approach: string, iteration: number, additionalInfo?: string): void {
    this.currentIteration = iteration
    const progress = createProgressBar(iteration, this.totalIterations, 15)
    const info = additionalInfo ? ` - ${additionalInfo}` : ''
    const message = `${approach}: ${progress}${info}`

    this.tracker.update('profile', message)
  }

  /**
   * Complete profiling phase
   */
  completeProfiling(approach: string, averageTime: number): void {
    const message = `${approach} profiling complete - avg ${formatDuration(averageTime)}`
    this.tracker.succeed('profile', message)
  }

  /**
   * Start comparison phase
   */
  startComparison(): void {
    this.tracker.start('comparison', PROGRESS_MESSAGES.comparison, 'triangle')
  }

  /**
   * Complete comparison
   */
  completeComparison(speedup: number): void {
    const message = `Comparison complete - ${speedup.toFixed(1)}x speedup`
    this.tracker.succeed('comparison', message)
  }

  /**
   * Start cleanup
   */
  startCleanup(): void {
    this.tracker.start('cleanup', PROGRESS_MESSAGES.cleanup, 'clock')
  }

  /**
   * Complete cleanup
   */
  completeCleanup(): void {
    this.tracker.succeed('cleanup', 'Cleanup complete')
  }

  /**
   * Handle error
   */
  error(phase: string, error: string): void {
    this.tracker.fail(phase, `${phase} failed: ${error}`)
  }

  /**
   * Show warning
   */
  warn(phase: string, warning: string): void {
    this.tracker.warn(phase, `${phase}: ${warning}`)
  }

  /**
   * Show info
   */
  info(message: string): void {
    this.tracker.info(message)
  }

  /**
   * Stop all progress indicators
   */
  stop(): void {
    this.tracker.stopAll()
  }
}

/**
 * Create progress manager for profiling
 */
export function createProgressManager(options: ProfileOptions): ProfileProgressManager {
  const tracker = createProgressTracker(options)
  return new ProfileProgressManager(tracker)
}

/**
 * Progress utilities for specific profiling tasks
 */
export const ProgressUtils = {
  /**
   * Show component processing progress
   */
  showComponentProgress(current: number, total: number, componentName: string): string {
    const progress = createProgressBar(current, total, 20)
    return `Processing components: ${progress} (${componentName})`
  },

  /**
   * Show memory usage
   */
  showMemoryUsage(currentMB: number, peakMB: number): string {
    return `Memory: ${formatMemory(currentMB)} (peak: ${formatMemory(peakMB)})`
  },

  /**
   * Show timing statistics
   */
  showTimingStats(current: number, average: number, min: number, max: number): string {
    return `Timing: ${formatDuration(current)} (avg: ${formatDuration(average)}, range: ${formatDuration(min)}-${formatDuration(max)})`
  },

  /**
   * Create iteration status message
   */
  iterationStatus(iteration: number, total: number, currentTime?: number): string {
    const progress = createProgressBar(iteration, total, 10)
    const timeInfo = currentTime ? ` - ${formatDuration(currentTime)}` : ''
    return `Iteration ${iteration}/${total} ${progress}${timeInfo}`
  },
}

/**
 * Multi-step progress for complex operations
 */
export class MultiStepProgress {
  private tracker: ProgressTracker
  private steps: Array<{ key: string; message: string; completed: boolean }> = []
  private currentStep: number = 0

  constructor(tracker: ProgressTracker, steps: Array<{ key: string; message: string }>) {
    this.tracker = tracker
    this.steps = steps.map((step) => ({ ...step, completed: false }))
  }

  /**
   * Start next step
   */
  nextStep(): void {
    if (this.currentStep < this.steps.length) {
      const step = this.steps[this.currentStep]
      const progress = `(${this.currentStep + 1}/${this.steps.length})`
      this.tracker.start(step.key, `${step.message} ${chalk.gray(progress)}`)
    }
  }

  /**
   * Complete current step
   */
  completeStep(): void {
    if (this.currentStep < this.steps.length) {
      const step = this.steps[this.currentStep]
      step.completed = true
      this.tracker.succeed(step.key)
      this.currentStep++
    }
  }

  /**
   * Fail current step
   */
  failStep(error: string): void {
    if (this.currentStep < this.steps.length) {
      const step = this.steps[this.currentStep]
      this.tracker.fail(step.key, `${step.message} failed: ${error}`)
    }
  }

  /**
   * Check if all steps completed
   */
  isComplete(): boolean {
    return this.steps.every((step) => step.completed)
  }
}
