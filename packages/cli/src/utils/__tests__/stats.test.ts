import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createStats,
  updateStats,
  getElapsedTime,
  formatStats,
} from '../stats.js';

describe('Stats Utilities', () => {
  let mockDate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockDate = vi.spyOn(Date, 'now');
    mockDate.mockReturnValue(1000000);
  });

  afterEach(() => {
    mockDate.mockRestore();
  });

  describe('createStats', () => {
    it('should create initial stats tracker', () => {
      const stats = createStats();

      expect(stats.filesProcessed).toBe(0);
      expect(stats.filesModified).toBe(0);
      expect(stats.totalOperations).toBe(0);
      expect(stats.operationsByType).toBeInstanceOf(Map);
      expect(stats.operationsByType.size).toBe(0);
      expect(stats.startTime).toBe(1000000);
      expect(stats.custom).toBeUndefined();
    });

    it('should create stats with custom data', () => {
      const customData = { userCount: 5, errors: [] };
      const stats = createStats(customData);

      expect(stats.custom).toEqual(customData);
      expect(stats.filesProcessed).toBe(0);
    });
  });

  describe('updateStats', () => {
    it('should update files processed', () => {
      const stats = createStats();
      const updated = updateStats(stats, { filesProcessed: 3 });

      expect(updated.filesProcessed).toBe(3);
      expect(stats.filesProcessed).toBe(0); // Original unchanged
    });

    it('should update files modified', () => {
      const stats = createStats();
      const updated = updateStats(stats, { filesModified: 2 });

      expect(updated.filesModified).toBe(2);
    });

    it('should update operations', () => {
      const stats = createStats();
      const updated = updateStats(stats, { operations: 5 });

      expect(updated.totalOperations).toBe(5);
    });

    it('should update operation types', () => {
      const stats = createStats();
      const updated = updateStats(stats, {
        operationTypes: [
          { type: 'read', count: 3 },
          { type: 'write', count: 2 },
        ],
      });

      expect(updated.operationsByType.get('read')).toBe(3);
      expect(updated.operationsByType.get('write')).toBe(2);
    });

    it('should accumulate operation counts', () => {
      let stats = createStats();
      stats = updateStats(stats, {
        operationTypes: [{ type: 'read', count: 3 }],
      });
      stats = updateStats(stats, {
        operationTypes: [{ type: 'read', count: 2 }],
      });

      expect(stats.operationsByType.get('read')).toBe(5);
    });

    it('should handle multiple updates', () => {
      const stats = createStats();
      const updated = updateStats(stats, {
        filesProcessed: 5,
        filesModified: 2,
        operations: 10,
        operationTypes: [{ type: 'test' }],
      });

      expect(updated.filesProcessed).toBe(5);
      expect(updated.filesModified).toBe(2);
      expect(updated.totalOperations).toBe(10);
      expect(updated.operationsByType.get('test')).toBe(1);
    });
  });

  describe('getElapsedTime', () => {
    it('should calculate elapsed time', () => {
      const stats = createStats();
      mockDate.mockReturnValue(1005000);

      expect(getElapsedTime(stats)).toBe(5000);
    });
  });

  describe('formatStats', () => {
    it('should format basic stats', () => {
      const stats = updateStats(createStats(), {
        filesProcessed: 10,
        filesModified: 5,
        operations: 15,
      });
      mockDate.mockReturnValue(1005000);

      const formatted = formatStats(stats);

      expect(formatted).toContain('Files processed: 10');
      expect(formatted).toContain('Files modified: 5');
      expect(formatted).toContain('Total operations: 15');
      expect(formatted).toContain('Time elapsed: 5.00s');
    });

    it('should include operation types when present', () => {
      const stats = updateStats(createStats(), {
        operationTypes: [
          { type: 'read', count: 5 },
          { type: 'write', count: 3 },
        ],
      });
      mockDate.mockReturnValue(1003000);

      const formatted = formatStats(stats);

      expect(formatted).toContain('Operations by type:');
      expect(formatted).toContain('read: 5');
      expect(formatted).toContain('write: 3');
    });
  });
});
