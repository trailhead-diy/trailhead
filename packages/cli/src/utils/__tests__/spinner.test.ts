import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock ora before importing our module
const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
  warn: vi.fn().mockReturnThis(),
  info: vi.fn().mockReturnThis(),
  text: '',
  isSpinning: false,
};

const mockOra = vi.fn(() => mockSpinner);

vi.mock('ora', () => ({
  default: mockOra,
}));

// Import after mocking
const { ora, createSpinner, withSpinner } = await import('../spinner.js');

describe('Spinner Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSpinner.isSpinning = false;
    mockSpinner.text = '';
  });

  describe('ora re-export', () => {
    it('should re-export ora', () => {
      expect(ora).toBe(mockOra);
    });
  });

  describe('createSpinner', () => {
    it('should create spinner with text', () => {
      const text = 'Loading...';
      const spinner = createSpinner(text);
      
      expect(mockOra).toHaveBeenCalledWith({
        text,
        spinner: 'dots',
      });
      expect(spinner).toBe(mockSpinner);
    });

    it('should create spinner with custom text', () => {
      const customText = 'Processing files...';
      const spinner = createSpinner(customText);
      
      expect(mockOra).toHaveBeenCalledWith({
        text: customText,
        spinner: 'dots',
      });
      expect(spinner).toBe(mockSpinner);
    });

    it('should handle empty text', () => {
      const spinner = createSpinner('');
      
      expect(mockOra).toHaveBeenCalledWith({
        text: '',
        spinner: 'dots',
      });
    });
  });

  describe('withSpinner', () => {
    it('should execute task with spinner and succeed', async () => {
      const mockTask = vi.fn().mockResolvedValue('success result');
      const text = 'Running task...';
      
      const result = await withSpinner(text, mockTask);
      
      expect(mockOra).toHaveBeenCalledWith({
        text,
        spinner: 'dots',
      });
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockTask).toHaveBeenCalled();
      expect(mockSpinner.succeed).toHaveBeenCalled();
      expect(result).toBe('success result');
    });

    it('should execute task with spinner and fail on error', async () => {
      const error = new Error('Task failed');
      const mockTask = vi.fn().mockRejectedValue(error);
      const text = 'Running failing task...';
      
      await expect(withSpinner(text, mockTask)).rejects.toThrow('Task failed');
      
      expect(mockOra).toHaveBeenCalledWith({
        text,
        spinner: 'dots',
      });
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockTask).toHaveBeenCalled();
      expect(mockSpinner.fail).toHaveBeenCalled();
    });

    it('should handle basic task execution', async () => {
      const mockTask = vi.fn().mockResolvedValue('result');
      
      const result = await withSpinner('Task', mockTask);
      
      expect(mockSpinner.succeed).toHaveBeenCalled();
      expect(result).toBe('result');
    });
  });
});