import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateApiCommand } from '../../src/commands/docs/generate-api.js'
import { fixLinksCommand } from '../../src/commands/docs/fix-links.js'
import { fixDeclarationsCommand } from '../../src/commands/docs/fix-declarations.js'
import { setupIntegrationCommand } from '../../src/commands/docs/setup-integration.js'
import { docsOperations } from '../../src/utils/docs.js'
import { ok, err, createCoreError } from '@esteban-url/core'

// Mock docs operations
vi.mock('../../src/utils/docs.js', () => ({
  docsOperations: {
    generateApiDocs: vi.fn(),
    fixDocusaurusLinks: vi.fn(),
    fixFunctionDeclarations: vi.fn(),
    setupApiIntegration: vi.fn(),
  },
}))

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
}

const mockContext = {
  logger: mockLogger,
  cwd: '/test',
  args: [],
}

describe('Documentation Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateApiCommand', () => {
    it('should have correct configuration', () => {
      expect(generateApiCommand.name).toBe('generate-api')
      expect(generateApiCommand.description).toContain('Generate API documentation')
    })

    it('should generate docs for all packages by default', async () => {
      vi.mocked(docsOperations.generateApiDocs).mockReturnValue(ok(undefined))

      const result = await generateApiCommand.execute({}, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(docsOperations.generateApiDocs).toHaveBeenCalledWith({
        packages: undefined,
        outputDir: undefined,
        clean: undefined,
        watch: undefined,
      })
    })

    it('should generate docs for specific packages', async () => {
      vi.mocked(docsOperations.generateApiDocs).mockReturnValue(ok(undefined))

      const result = await generateApiCommand.execute({ packages: 'core,cli' }, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(docsOperations.generateApiDocs).toHaveBeenCalledWith({
        packages: ['core', 'cli'],
        outputDir: undefined,
        clean: undefined,
        watch: undefined,
      })
    })

    it('should handle generation errors', async () => {
      const error = createCoreError('DOCS_ERROR', 'Generation failed')
      vi.mocked(docsOperations.generateApiDocs).mockReturnValue(err(error))

      const result = await generateApiCommand.execute({}, mockContext as any)

      expect(result.isErr()).toBe(true)
    })
  })

  describe('fixLinksCommand', () => {
    it('should have correct configuration', () => {
      expect(fixLinksCommand.name).toBe('fix-links')
      expect(fixLinksCommand.description).toContain('Fix Docusaurus-compatible links')
    })

    it('should fix links with default pattern', async () => {
      const fixResult = { fixed: 3, errors: [] }
      vi.mocked(docsOperations.fixDocusaurusLinks).mockReturnValue(ok(fixResult))

      const result = await fixLinksCommand.execute({}, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(docsOperations.fixDocusaurusLinks).toHaveBeenCalledWith(undefined)
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('3 files'))
    })

    it('should fix links with custom pattern', async () => {
      const fixResult = { fixed: 1, errors: [] }
      vi.mocked(docsOperations.fixDocusaurusLinks).mockReturnValue(ok(fixResult))

      const result = await fixLinksCommand.execute({ pattern: 'docs/**/*.md' }, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(docsOperations.fixDocusaurusLinks).toHaveBeenCalledWith('docs/**/*.md')
    })

    it('should report when no fixes needed', async () => {
      const fixResult = { fixed: 0, errors: [] }
      vi.mocked(docsOperations.fixDocusaurusLinks).mockReturnValue(ok(fixResult))

      const result = await fixLinksCommand.execute({}, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('No links needed fixing')
      )
    })

    it('should report errors', async () => {
      const fixResult = { fixed: 1, errors: ['Error in file.md'] }
      vi.mocked(docsOperations.fixDocusaurusLinks).mockReturnValue(ok(fixResult))

      const result = await fixLinksCommand.execute({}, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('1 errors'))
    })
  })

  describe('fixDeclarationsCommand', () => {
    it('should have correct configuration', () => {
      expect(fixDeclarationsCommand.name).toBe('fix-declarations')
      expect(fixDeclarationsCommand.description).toContain('Fix function declarations')
    })

    it('should fix declarations with default pattern', async () => {
      const fixResult = { fixed: 2, errors: [] }
      vi.mocked(docsOperations.fixFunctionDeclarations).mockReturnValue(ok(fixResult))

      const result = await fixDeclarationsCommand.execute({}, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(docsOperations.fixFunctionDeclarations).toHaveBeenCalledWith(undefined)
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('2 files'))
    })

    it('should handle dry run mode', async () => {
      const fixResult = { fixed: 2, errors: [] }
      vi.mocked(docsOperations.fixFunctionDeclarations).mockReturnValue(ok(fixResult))

      const result = await fixDeclarationsCommand.execute({ dryRun: true }, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('dry-run mode'))
    })
  })

  describe('setupIntegrationCommand', () => {
    it('should have correct configuration', () => {
      expect(setupIntegrationCommand.name).toBe('setup-integration')
      expect(setupIntegrationCommand.description).toContain('Setup API documentation integration')
    })

    it('should setup integration successfully', async () => {
      vi.mocked(docsOperations.setupApiIntegration).mockReturnValue(ok(undefined))

      const result = await setupIntegrationCommand.execute({}, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(docsOperations.setupApiIntegration).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('setup complete'))
    })

    it('should handle force mode', async () => {
      vi.mocked(docsOperations.setupApiIntegration).mockReturnValue(ok(undefined))

      const result = await setupIntegrationCommand.execute({ force: true }, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Force mode enabled'))
    })

    it('should handle setup errors', async () => {
      const error = createCoreError('SETUP_ERROR', 'Setup failed')
      vi.mocked(docsOperations.setupApiIntegration).mockReturnValue(err(error))

      const result = await setupIntegrationCommand.execute({}, mockContext as any)

      expect(result.isErr()).toBe(true)
    })
  })
})
