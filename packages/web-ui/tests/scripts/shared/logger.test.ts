import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createDefaultLogger, createSilentLogger } from '@trailhead/cli/core'

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    red: vi.fn((text: string) => text),
    yellow: vi.fn((text: string) => text),
    blue: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    gray: vi.fn((text: string) => text),
  },
}))

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  describe('Default Logger', () => {
    it('should log info messages', () => {
      const logger = createDefaultLogger(false)
      logger.info('Test info message')

      expect(consoleLogSpy).toHaveBeenCalledWith('Test info message')
    })

    it('should log success messages', () => {
      const logger = createDefaultLogger(false)
      logger.success('Test success message')

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test success message'))
    })

    it('should log warning messages', () => {
      const logger = createDefaultLogger(false)
      logger.warning('Test warning message')

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test warning message'))
    })

    it('should log error messages', () => {
      const logger = createDefaultLogger(false)
      logger.error('Test error message')

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test error message'))
    })

    it('should log step messages', () => {
      const logger = createDefaultLogger(false)
      logger.step('Test step message')

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test step message'))
    })

    it('should not log debug messages in non-verbose mode', () => {
      const logger = createDefaultLogger(false)
      logger.debug('Test debug message')

      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    it('should log debug messages in verbose mode', () => {
      const logger = createDefaultLogger(true)
      logger.debug('Test debug message')

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test debug message'))
    })
  })

  describe('Silent Logger', () => {
    it('should not output any messages', () => {
      const logger = createSilentLogger()

      logger.info('Test info')
      logger.success('Test success')
      logger.warning('Test warning')
      logger.error('Test error')
      logger.debug('Test debug')
      logger.step('Test step')

      expect(consoleLogSpy).not.toHaveBeenCalled()
    })
  })

  describe('Logger Interface', () => {
    it('should implement all required methods', () => {
      const logger = createDefaultLogger(false)

      expect(logger).toHaveProperty('info')
      expect(logger).toHaveProperty('success')
      expect(logger).toHaveProperty('warning')
      expect(logger).toHaveProperty('error')
      expect(logger).toHaveProperty('debug')
      expect(logger).toHaveProperty('step')

      expect(typeof logger.info).toBe('function')
      expect(typeof logger.success).toBe('function')
      expect(typeof logger.warning).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.step).toBe('function')
    })
  })
})
