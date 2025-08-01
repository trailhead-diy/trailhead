/**
 * Enhanced Progress Tracker Tests - High-ROI Testing
 *
 * Tests focus on:
 * - Multi-step progress coordination
 * - Time estimation and tracking
 * - Step progression logic
 * - Business logic for weighted progress
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEnhancedProgressTracker, type EnhancedProgressStep } from './enhanced-tracker.js'

describe('Enhanced Progress Tracker - Multi-Step Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Step Management', () => {
    it('should initialize with multiple steps', () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Reading files', weight: 1 },
        { name: 'Processing data', weight: 2 },
        { name: 'Writing output', weight: 1 },
      ]

      const tracker = createEnhancedProgressTracker({ steps })
      const state = tracker.getEnhancedState()

      expect(state.steps).toHaveLength(3)
      expect(state.currentStepIndex).toBe(0)
      expect(state.percentage).toBe(0)
      expect(state.stepName).toBe('Reading files')
    })

    it('should advance to next step with startNextStep', () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Step 1', weight: 1 },
        { name: 'Step 2', weight: 1 },
      ]

      const tracker = createEnhancedProgressTracker({ steps })

      // Start next step
      tracker.startNextStep('Custom Step 2')

      const state = tracker.getEnhancedState()
      expect(state.currentStepIndex).toBe(1)
      expect(state.stepName).toBe('Custom Step 2')
      expect(state.stepProgress).toBe(0)
    })

    it('should calculate overall progress correctly with weights', () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Light task', weight: 1 },
        { name: 'Heavy task', weight: 3 },
      ]

      const tracker = createEnhancedProgressTracker({ steps })

      // Complete 50% of first step
      tracker.updateStepProgress(50)

      const state = tracker.getEnhancedState()
      // Overall: (1 * 0.5 + 3 * 0) / 4 = 0.125 = 12.5% rounded to 13%
      expect(state.percentage).toBeCloseTo(13, 0)
    })

    it('should handle step completion correctly', () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Task 1', weight: 1 },
        { name: 'Task 2', weight: 1 },
      ]

      const tracker = createEnhancedProgressTracker({ steps })

      // Complete current step
      tracker.completeStep('Task 1 Complete')

      const state = tracker.getEnhancedState()
      expect(state.stepProgress).toBe(100)
      expect(state.stepName).toBe('Task 1 Complete')

      // Overall progress should be 50% (1 step out of 2 with equal weights)
      expect(state.percentage).toBe(50)
    })

    it('should handle final completion', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Only task', weight: 1 }]

      const tracker = createEnhancedProgressTracker({ steps })

      const finalState = tracker.complete()

      expect(finalState.percentage).toBe(100)
      expect(finalState.completed).toBe(true)
      expect(finalState.stepName).toBe('Complete')
    })
  })

  describe('Step Progress Updates', () => {
    it('should update step progress within bounds', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Test step', weight: 1 }]

      const tracker = createEnhancedProgressTracker({ steps })

      // Update step progress
      tracker.updateStepProgress(75)

      const state = tracker.getEnhancedState()
      expect(state.stepProgress).toBe(75)
    })

    it('should clamp step progress to valid range', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Test step', weight: 1 }]

      const tracker = createEnhancedProgressTracker({ steps })

      // Test upper bound
      tracker.updateStepProgress(150)
      let state = tracker.getEnhancedState()
      expect(state.stepProgress).toBe(100)

      // Test lower bound
      tracker.updateStepProgress(-10)
      state = tracker.getEnhancedState()
      expect(state.stepProgress).toBe(0)
    })

    it('should update overall progress based on step progress', () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Step 1', weight: 2 },
        { name: 'Step 2', weight: 2 },
      ]

      const tracker = createEnhancedProgressTracker({ steps })

      // 50% of first step should be 25% overall
      tracker.updateStepProgress(50)

      const state = tracker.getEnhancedState()
      expect(state.percentage).toBe(25)
    })
  })

  describe('Time Tracking and Estimation', () => {
    it('should track time elapsed', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Timed task', weight: 1 }]

      const tracker = createEnhancedProgressTracker({ steps })

      const state = tracker.getEnhancedState()
      expect(state.timeElapsed).toBeGreaterThanOrEqual(0)
      expect(typeof state.stepStartTime).toBe('number')
    })

    it('should calculate time estimates after step completion', () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Step 1', weight: 1 },
        { name: 'Step 2', weight: 1 },
      ]

      const tracker = createEnhancedProgressTracker({ steps })

      // Simulate time passing and complete step
      vi.useFakeTimers()

      // Advance time and complete step
      vi.advanceTimersByTime(1000) // 1 second
      tracker.completeStep()

      const state = tracker.getEnhancedState()
      expect(state.stepCompletionTimes).toHaveLength(1)
      expect(state.averageStepTime).toBeGreaterThan(0)

      vi.useRealTimers()
    })

    it('should provide time estimates', () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Step 1', weight: 1 },
        { name: 'Step 2', weight: 1 },
      ]

      const tracker = createEnhancedProgressTracker({ steps })

      const timeEstimate = tracker.getTimeEstimate()

      expect(timeEstimate).toHaveProperty('elapsed')
      expect(timeEstimate).toHaveProperty('remaining')
      expect(timeEstimate).toHaveProperty('total')
      expect(timeEstimate.elapsed).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Configuration and Options', () => {
    it('should support estimated duration in steps', () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Quick task', weight: 1, estimatedDuration: 1000 },
        { name: 'Slow task', weight: 2, estimatedDuration: 5000 },
      ]

      const tracker = createEnhancedProgressTracker({ steps })
      const state = tracker.getEnhancedState()

      expect(state.steps[0].estimatedDuration).toBe(1000)
      expect(state.steps[1].estimatedDuration).toBe(5000)
    })

    it('should support custom enhanced format', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Test step', weight: 1 }]

      const customFormat = 'Custom [{bar}] {percentage}% | {stepName}'
      const tracker = createEnhancedProgressTracker({
        steps,
        enhancedFormat: customFormat,
      })

      // Should not throw and should initialize properly
      const state = tracker.getEnhancedState()
      expect(state.steps).toHaveLength(1)
    })

    it('should support disabling time estimates', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Test step', weight: 1 }]

      const tracker = createEnhancedProgressTracker({
        steps,
        showTimeEstimates: false,
      })

      const state = tracker.getEnhancedState()
      expect(state.steps).toHaveLength(1)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty steps array gracefully', () => {
      const tracker = createEnhancedProgressTracker({ steps: [] })

      const state = tracker.getEnhancedState()
      expect(state.steps).toHaveLength(0)
      expect(state.percentage).toBe(0)
    })

    it('should handle single step workflow', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Only step', weight: 1 }]

      const tracker = createEnhancedProgressTracker({ steps })

      tracker.updateStepProgress(50)
      let state = tracker.getEnhancedState()
      expect(state.percentage).toBe(50)

      tracker.completeStep()
      state = tracker.getEnhancedState()
      expect(state.percentage).toBe(100)
    })

    it('should not advance beyond last step', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Last step', weight: 1 }]

      const tracker = createEnhancedProgressTracker({ steps })

      // Try to advance beyond available steps
      tracker.startNextStep()
      tracker.startNextStep() // Should not advance further

      const state = tracker.getEnhancedState()
      expect(state.currentStepIndex).toBe(0) // Should remain at last valid step
    })

    it('should reset properly', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Initial step', weight: 1 }]

      const tracker = createEnhancedProgressTracker({ steps })

      // Make some progress
      tracker.updateStepProgress(50)

      // Reset with new step count
      tracker.reset(3)

      const state = tracker.getEnhancedState()
      expect(state.totalSteps).toBe(3)
      expect(state.currentStepIndex).toBe(0)
      expect(state.stepProgress).toBe(0)
      expect(state.percentage).toBe(0)
    })

    it('should handle stop correctly', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Test step', weight: 1 }]

      const tracker = createEnhancedProgressTracker({ steps })

      // Should not throw when stopping
      expect(() => tracker.stop()).not.toThrow()
    })
  })
})

describe('Integration Scenarios', () => {
  it('should handle typical build pipeline workflow', () => {
    const buildSteps: EnhancedProgressStep[] = [
      { name: 'Installing dependencies', weight: 1 },
      { name: 'Compiling TypeScript', weight: 3 },
      { name: 'Running tests', weight: 2 },
      { name: 'Creating bundle', weight: 1 },
    ]

    const tracker = createEnhancedProgressTracker({ steps: buildSteps })

    // Step 1: Complete deps installation
    tracker.updateStepProgress(100)
    tracker.completeStep()

    // Step 2: Start compilation
    tracker.startNextStep()
    tracker.updateStepProgress(50) // 50% compiled

    const state = tracker.getEnhancedState()

    // Should be past first step (1/7 weight) plus half of second step (1.5/7 weight)
    // Total: 2.5/7 ≈ 35.7% rounded to 36%
    expect(state.percentage).toBeCloseTo(36, 0)
    expect(state.currentStepIndex).toBe(1)
    expect(state.stepName).toBe('Compiling TypeScript')
  })

  it('should handle concurrent progress updates', () => {
    const steps: EnhancedProgressStep[] = [
      { name: 'Parallel task 1', weight: 1 },
      { name: 'Parallel task 2', weight: 1 },
    ]

    const tracker = createEnhancedProgressTracker({ steps })

    // Simulate rapid progress updates
    for (let i = 0; i <= 100; i += 10) {
      tracker.updateStepProgress(i)
    }

    const state = tracker.getEnhancedState()
    expect(state.stepProgress).toBe(100)
    expect(state.percentage).toBe(50) // 100% of first step = 50% overall
  })

  it('should provide meaningful time estimates in real workflow', () => {
    const steps: EnhancedProgressStep[] = [
      { name: 'Setup', weight: 1, estimatedDuration: 1000 },
      { name: 'Processing', weight: 4, estimatedDuration: 4000 },
      { name: 'Cleanup', weight: 1, estimatedDuration: 1000 },
    ]

    const tracker = createEnhancedProgressTracker({
      steps,
      showTimeEstimates: true,
    })

    // Complete setup step
    tracker.completeStep()
    tracker.startNextStep()

    // Get time estimates
    const timeEstimate = tracker.getTimeEstimate()

    expect(timeEstimate.elapsed).toBeGreaterThanOrEqual(0)
    expect(timeEstimate.total).toBeGreaterThanOrEqual(timeEstimate.elapsed)
  })
})
