import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @clack/prompts before importing the module
vi.mock('@clack/prompts', () => ({
  text: vi.fn(),
  confirm: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  group: vi.fn(),
  groupMultiselect: vi.fn(),
  isCancel: vi.fn(),
  cancel: vi.fn(),
  intro: vi.fn(),
  outro: vi.fn(),
  log: {
    info: vi.fn(),
    message: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  spinner: vi.fn(),
  note: vi.fn(),
  password: vi.fn(),
  selectKey: vi.fn(),
}))

import { confirmWithDetails, directoryPrompt } from '../src/prompts/index.js'
import { confirm, text, isCancel, cancel, log } from '@clack/prompts'

describe('CLI Prompts', () => {
  let originalExit: typeof process.exit

  beforeEach(() => {
    vi.clearAllMocks()
    originalExit = process.exit
    process.exit = vi.fn() as unknown as typeof process.exit
  })

  afterEach(() => {
    process.exit = originalExit
  })

  describe('confirmWithDetails', () => {
    it('should display details as bullet points when provided', async () => {
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(isCancel).mockReturnValue(false)

      const details = ['First action', 'Second action', 'Third action']
      await confirmWithDetails('Proceed with changes?', details)

      expect(log.info).toHaveBeenCalledWith('This will:')
      expect(log.message).toHaveBeenCalledWith('  • First action', { symbol: '' })
      expect(log.message).toHaveBeenCalledWith('  • Second action', { symbol: '' })
      expect(log.message).toHaveBeenCalledWith('  • Third action', { symbol: '' })
    })

    it('should not display details section when details is empty', async () => {
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(isCancel).mockReturnValue(false)

      await confirmWithDetails('Proceed?', [])

      expect(log.info).not.toHaveBeenCalled()
    })

    it('should not display details section when details is undefined', async () => {
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(isCancel).mockReturnValue(false)

      await confirmWithDetails('Proceed?')

      expect(log.info).not.toHaveBeenCalled()
    })

    it('should return true when user confirms', async () => {
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(isCancel).mockReturnValue(false)

      const result = await confirmWithDetails('Continue?')

      expect(result).toBe(true)
    })

    it('should return false when user declines', async () => {
      vi.mocked(confirm).mockResolvedValue(false)
      vi.mocked(isCancel).mockReturnValue(false)

      const result = await confirmWithDetails('Continue?')

      expect(result).toBe(false)
    })

    it('should use defaultValue for initial value', async () => {
      vi.mocked(confirm).mockResolvedValue(false)
      vi.mocked(isCancel).mockReturnValue(false)

      await confirmWithDetails('Continue?', undefined, false)

      expect(confirm).toHaveBeenCalledWith({
        message: 'Continue?',
        initialValue: false,
      })
    })

    it('should exit process when user cancels', async () => {
      const cancelSymbol = Symbol('cancel')
      vi.mocked(confirm).mockResolvedValue(cancelSymbol as unknown as boolean)
      vi.mocked(isCancel).mockReturnValue(true)

      await confirmWithDetails('Continue?')

      expect(cancel).toHaveBeenCalledWith('Operation cancelled.')
      expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('should call confirm with the message', async () => {
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(isCancel).mockReturnValue(false)

      await confirmWithDetails('Are you sure?')

      expect(confirm).toHaveBeenCalledWith({
        message: 'Are you sure?',
        initialValue: true,
      })
    })
  })

  describe('directoryPrompt', () => {
    it('should return trimmed and normalized path', async () => {
      vi.mocked(text).mockResolvedValue('  path/to/dir  ')
      vi.mocked(isCancel).mockReturnValue(false)

      const result = await directoryPrompt('Enter directory:')

      expect(result).toBe('path/to/dir')
    })

    it('should normalize backslashes to forward slashes', async () => {
      vi.mocked(text).mockResolvedValue('path\\to\\dir')
      vi.mocked(isCancel).mockReturnValue(false)

      const result = await directoryPrompt('Enter directory:')

      expect(result).toBe('path/to/dir')
    })

    it('should use default path as placeholder and initial value', async () => {
      vi.mocked(text).mockResolvedValue('custom/path')
      vi.mocked(isCancel).mockReturnValue(false)

      await directoryPrompt('Enter directory:', 'default/path')

      expect(text).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Enter directory:',
          placeholder: 'default/path',
          initialValue: 'default/path',
        })
      )
    })

    it('should exit process when user cancels', async () => {
      const cancelSymbol = Symbol('cancel')
      vi.mocked(text).mockResolvedValue(cancelSymbol as unknown as string)
      vi.mocked(isCancel).mockReturnValue(true)

      await directoryPrompt('Enter directory:')

      expect(cancel).toHaveBeenCalledWith('Operation cancelled.')
      expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('should validate empty input', async () => {
      vi.mocked(text).mockImplementation(async (opts) => {
        // Extract and call the validate function
        const validate = opts.validate
        if (validate) {
          const error = validate('')
          expect(error).toBe('Please enter a valid directory path')
        }
        return 'valid/path'
      })
      vi.mocked(isCancel).mockReturnValue(false)

      await directoryPrompt('Enter directory:')
    })

    it('should validate whitespace-only input', async () => {
      vi.mocked(text).mockImplementation(async (opts) => {
        const validate = opts.validate
        if (validate) {
          const error = validate('   ')
          expect(error).toBe('Please enter a valid directory path')
        }
        return 'valid/path'
      })
      vi.mocked(isCancel).mockReturnValue(false)

      await directoryPrompt('Enter directory:')
    })

    it('should reject paths with parent directory traversal', async () => {
      vi.mocked(text).mockImplementation(async (opts) => {
        const validate = opts.validate
        if (validate) {
          const error = validate('../parent/dir')
          expect(error).toBe('Please enter a relative path without ".." segments')
        }
        return 'valid/path'
      })
      vi.mocked(isCancel).mockReturnValue(false)

      await directoryPrompt('Enter directory:')
    })

    it('should reject absolute paths starting with /', async () => {
      vi.mocked(text).mockImplementation(async (opts) => {
        const validate = opts.validate
        if (validate) {
          const error = validate('/absolute/path')
          expect(error).toBe('Please enter a relative path without ".." segments')
        }
        return 'valid/path'
      })
      vi.mocked(isCancel).mockReturnValue(false)

      await directoryPrompt('Enter directory:')
    })

    it('should accept valid relative paths', async () => {
      vi.mocked(text).mockImplementation(async (opts) => {
        const validate = opts.validate
        if (validate) {
          const error = validate('valid/relative/path')
          expect(error).toBeUndefined()
        }
        return 'valid/relative/path'
      })
      vi.mocked(isCancel).mockReturnValue(false)

      const result = await directoryPrompt('Enter directory:')
      expect(result).toBe('valid/relative/path')
    })
  })
})
