import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock yocto-spinner before importing our module
const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  success: vi.fn().mockReturnThis(),
  error: vi.fn().mockReturnThis(),
  warning: vi.fn().mockReturnThis(),
  info: vi.fn().mockReturnThis(),
  text: '',
  isSpinning: false,
};

const mockYoctoSpinner = vi.fn(() => mockSpinner);

vi.mock('yocto-spinner', () => ({
  default: mockYoctoSpinner,
}));

// Import after mocking
const { createSpinner, withSpinner } = await import('../spinner.js');

describe('Spinner Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSpinner.isSpinning = false;
    mockSpinner.text = '';
  });

  describe('createSpinner', () => {
    it('should create spinner with text', () => {
      const text = 'Loading...';
      const spinner = createSpinner(text);

      expect(mockYoctoSpinner).toHaveBeenCalledWith({
        text,
      });
      expect(spinner).toBe(mockSpinner);
    });

    it('should create spinner with custom text', () => {
      const customText = 'Processing files...';
      const spinner = createSpinner(customText);

      expect(mockYoctoSpinner).toHaveBeenCalledWith({
        text: customText,
      });
      expect(spinner).toBe(mockSpinner);
    });

    it('should handle empty text', () => {
      const _spinner = createSpinner('');

      expect(mockYoctoSpinner).toHaveBeenCalledWith({
        text: '',
      });
    });
  });

  describe('withSpinner', () => {
    it('should execute task with spinner and succeed', async () => {
      const mockTask = vi.fn().mockResolvedValue('success result');
      const text = 'Running task...';

      const result = await withSpinner(text, mockTask);

      expect(mockYoctoSpinner).toHaveBeenCalledWith({
        text,
      });
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockTask).toHaveBeenCalled();
      expect(mockSpinner.success).toHaveBeenCalled();
      expect(result).toBe('success result');
    });

    it('should execute task with spinner and fail on error', async () => {
      const error = new Error('Task failed');
      const mockTask = vi.fn().mockRejectedValue(error);
      const text = 'Running failing task...';

      await expect(withSpinner(text, mockTask)).rejects.toThrow('Task failed');

      expect(mockYoctoSpinner).toHaveBeenCalledWith({
        text,
      });
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockTask).toHaveBeenCalled();
      expect(mockSpinner.error).toHaveBeenCalled();
    });

    it('should handle basic task execution', async () => {
      const mockTask = vi.fn().mockResolvedValue('result');

      const result = await withSpinner('Task', mockTask);

      expect(mockSpinner.success).toHaveBeenCalled();
      expect(result).toBe('result');
    });
  });
});
