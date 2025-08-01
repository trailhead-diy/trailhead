import { describe, it, expect } from 'vitest';

describe('Slow tests', () => {
  it('should handle database operations', async () => {
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(true).toBe(true);
  });

  it('should handle API calls', async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(true).toBe(true);
  });
});
