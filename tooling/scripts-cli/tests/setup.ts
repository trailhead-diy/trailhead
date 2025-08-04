import { vi } from 'vitest'

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()

  // Reset environment variables
  vi.unstubAllEnvs()
})

// Mock fast-glob for consistent test behavior
vi.mock('fast-glob', () => ({
  glob: vi.fn().mockResolvedValue([]),
}))

// Increase timeout for integration tests
vi.setConfig({
  testTimeout: 30000,
  hookTimeout: 30000,
})
