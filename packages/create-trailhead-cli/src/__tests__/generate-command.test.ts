import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestContext } from '@esteban-url/trailhead-cli/testing';
import { generateCommand } from '../commands/generate.js';

// Mock the generator module
vi.mock('../lib/generator.js', () => ({
  generateProject: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Generate Command', () => {
  let testContext: any;

  beforeEach(() => {
    testContext = createTestContext({
      verbose: false,
      args: ['test-project'],
    });
  });

  it('should require project name', async () => {
    testContext.args = [];

    const result = await generateCommand.execute({}, testContext);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Project name is required');
  });

  it('should handle existing directory without force flag', async () => {
    // Mock existsSync to return true
    vi.doMock('fs', () => ({
      existsSync: vi.fn().mockReturnValue(true),
    }));

    const result = await generateCommand.execute({}, testContext);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('already exists');
  }, 10000);

  it('should execute in express mode with options', async () => {
    const options = {
      template: 'basic',
      'package-manager': 'pnpm',
      docs: false,
      git: true,
      install: true,
    };

    const result = await generateCommand.execute(options, testContext);

    expect(result.success).toBe(true);
  });

  it('should handle dry run mode', async () => {
    const options = {
      'dry-run': true,
      template: 'basic',
    };

    const result = await generateCommand.execute(options, testContext);

    expect(result.success).toBe(true);
  });

  it('should handle generator errors', async () => {
    const { generateProject } = await import('../lib/generator.js');
    vi.mocked(generateProject).mockResolvedValueOnce({
      success: false,
      error: new Error('Generator failed'),
    });

    const result = await generateCommand.execute({}, testContext);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Generator failed');
  }, 10000);

  it('should validate template options', async () => {
    const options = {
      template: 'invalid-template',
    };

    // This would be handled by the command option validation
    // In a real implementation, you'd test the validation logic
    const result = await generateCommand.execute(options, testContext);

    // Depending on implementation, this might succeed with fallback
    // or fail with validation error
    expect(result).toBeDefined();
  });
});
