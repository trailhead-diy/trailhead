import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEnhancedProgressTracker, type EnhancedProgressStep } from '../enhanced-tracker.js';

// Mock cli-progress
const mockProgressBar = {
  start: vi.fn(),
  update: vi.fn(),
  stop: vi.fn(),
};

vi.mock('cli-progress', () => ({
  SingleBar: vi.fn(() => mockProgressBar),
  MultiBar: vi.fn(),
  Presets: {
    shades_classic: {},
  },
}));

describe('EnhancedProgressTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create tracker with weighted steps', () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Step 1', weight: 2, estimatedDuration: 1000 },
        { name: 'Step 2', weight: 3, estimatedDuration: 2000 },
        { name: 'Step 3', weight: 1, estimatedDuration: 500 },
      ];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 3,
        steps,
        showTimeEstimates: true,
      });

      expect(tracker).toBeDefined();
      expect(mockProgressBar.start).toHaveBeenCalledWith(100, 0, {
        step: 1,
        total: 3,
        stepName: 'Step 1',
        eta: 'calculating...',
      });
    });

    it('should initialize with default options', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Step 1', weight: 1 }];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 1,
        steps,
      });

      expect(tracker).toBeDefined();
      expect(mockProgressBar.start).toHaveBeenCalled();
    });
  });

  describe('step progress tracking', () => {
    it('should update step progress correctly', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Step 1', weight: 1 }];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 1,
        steps,
      });

      const state = tracker.updateStepProgress(50);

      expect(state.stepProgress).toBe(50);
      expect(mockProgressBar.update).toHaveBeenCalled();
    });

    it('should clamp step progress to valid range', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Step 1', weight: 1 }];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 1,
        steps,
      });

      let state = tracker.updateStepProgress(-10);
      expect(state.stepProgress).toBe(0);

      state = tracker.updateStepProgress(150);
      expect(state.stepProgress).toBe(100);
    });
  });

  describe('step navigation', () => {
    it('should start next step correctly', async () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Step 1', weight: 1 },
        { name: 'Step 2', weight: 2 },
      ];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 2,
        steps,
      });

      // Add small delay to ensure time tracking works
      await new Promise(resolve => setTimeout(resolve, 5));

      const state = tracker.startNextStep();

      expect(state.currentStepIndex).toBe(1);
      expect(state.stepName).toBe('Step 2');
      expect(state.stepProgress).toBe(0);
      expect(state.stepStartTime).toBeDefined();
    });

    it('should complete step and record completion time', async () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Step 1', weight: 1 }];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 1,
        steps,
      });

      // Add small delay to ensure time tracking works
      await new Promise(resolve => setTimeout(resolve, 5));

      const state = tracker.completeStep();

      expect(state.stepProgress).toBe(100);
      expect(state.stepCompletionTimes).toHaveLength(1);
      expect(state.stepCompletionTimes[0]).toBeGreaterThanOrEqual(0);
    });
  });

  describe('time estimation', () => {
    it('should calculate time estimates based on completion history', async () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Step 1', weight: 1, estimatedDuration: 1000 },
        { name: 'Step 2', weight: 1, estimatedDuration: 2000 },
      ];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 2,
        steps,
      });

      // Add delay and complete first step
      await new Promise(resolve => setTimeout(resolve, 10));
      tracker.completeStep();

      // Move to second step
      tracker.startNextStep();

      const timeEstimate = tracker.getTimeEstimate();

      expect(timeEstimate).toHaveProperty('remaining');
      expect(timeEstimate).toHaveProperty('total');
      expect(timeEstimate).toHaveProperty('elapsed');
      expect(timeEstimate.elapsed).toBeGreaterThanOrEqual(0);
    });

    it('should provide accurate time estimates after multiple completions', async () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Step 1', weight: 1 },
        { name: 'Step 2', weight: 1 },
        { name: 'Step 3', weight: 1 },
      ];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 3,
        steps,
      });

      // Complete first two steps with delays
      await new Promise(resolve => setTimeout(resolve, 10));
      tracker.completeStep();
      tracker.startNextStep();
      await new Promise(resolve => setTimeout(resolve, 10));
      tracker.completeStep();
      tracker.startNextStep();

      const state = tracker.getEnhancedState();
      expect(state.averageStepTime).toBeGreaterThanOrEqual(0);
      expect(state.estimatedTimeRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('weighted progress calculation', () => {
    it('should calculate progress based on step weights', () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Light step', weight: 1 },
        { name: 'Heavy step', weight: 9 },
      ];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 2,
        steps,
      });

      // Complete light step (should be 10% of total)
      tracker.completeStep();
      tracker.startNextStep();

      const state = tracker.getEnhancedState();
      expect(state.percentage).toBe(10);
    });

    it('should handle step progress within weighted calculation', () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Step 1', weight: 5 },
        { name: 'Step 2', weight: 5 },
      ];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 2,
        steps,
      });

      // 50% progress on first step should be 25% total
      tracker.updateStepProgress(50);

      const state = tracker.getEnhancedState();
      expect(state.percentage).toBe(25);
    });
  });

  describe('enhanced state management', () => {
    it('should maintain comprehensive state', () => {
      const steps: EnhancedProgressStep[] = [
        { name: 'Step 1', weight: 1, estimatedDuration: 1000 },
      ];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 1,
        steps,
      });

      const state = tracker.getEnhancedState();

      expect(state).toHaveProperty('currentStepIndex');
      expect(state).toHaveProperty('steps');
      expect(state).toHaveProperty('stepProgress');
      expect(state).toHaveProperty('estimatedTimeRemaining');
      expect(state).toHaveProperty('timeElapsed');
      expect(state).toHaveProperty('averageStepTime');
      expect(state).toHaveProperty('stepStartTime');
      expect(state).toHaveProperty('stepCompletionTimes');
      expect(state.steps).toEqual(steps);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle empty steps array', () => {
      const tracker = createEnhancedProgressTracker({
        totalSteps: 0,
        steps: [],
      });

      const state = tracker.getEnhancedState();
      expect(state.steps).toHaveLength(0);
    });

    it('should handle step navigation at boundaries', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Only step', weight: 1 }];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 1,
        steps,
      });

      // Try to go beyond last step
      tracker.startNextStep();
      tracker.startNextStep();

      const state = tracker.getEnhancedState();
      expect(state.currentStepIndex).toBe(0); // Should stay at last valid index
    });
  });

  describe('progress bar integration', () => {
    it('should update progress bar with enhanced information', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Test step', weight: 1 }];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 1,
        steps,
        showTimeEstimates: true,
      });

      tracker.updateStepProgress(75);

      expect(mockProgressBar.update).toHaveBeenCalledWith(
        75,
        expect.objectContaining({
          step: 1,
          total: 1,
          stepName: 'Test step',
          eta: expect.any(String),
        })
      );
    });

    it('should handle completion correctly', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Test step', weight: 1 }];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 1,
        steps,
      });

      tracker.complete();

      expect(mockProgressBar.update).toHaveBeenCalledWith(
        100,
        expect.objectContaining({
          step: 1,
          total: 1,
          stepName: 'Complete',
          eta: '0s',
        })
      );
      expect(mockProgressBar.stop).toHaveBeenCalled();
    });
  });

  describe('time formatting', () => {
    it('should format time estimates correctly', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Step 1', weight: 1 }];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 1,
        steps,
        showTimeEstimates: true,
      });

      // The time formatting is tested indirectly through progress bar updates
      tracker.updateStepProgress(50);

      expect(mockProgressBar.update).toHaveBeenCalledWith(
        50,
        expect.objectContaining({
          eta: expect.any(String),
        })
      );
    });
  });

  describe('reset functionality', () => {
    it('should reset tracker with new steps', () => {
      const steps: EnhancedProgressStep[] = [{ name: 'Step 1', weight: 1 }];

      const tracker = createEnhancedProgressTracker({
        totalSteps: 1,
        steps,
      });

      const state = tracker.reset(3);

      expect(state.totalSteps).toBe(3);
      expect(state.currentStepIndex).toBe(0);
      expect(state.stepProgress).toBe(0);
      expect(mockProgressBar.stop).toHaveBeenCalled();
      expect(mockProgressBar.start).toHaveBeenCalledTimes(2); // Initial + reset
    });
  });
});
