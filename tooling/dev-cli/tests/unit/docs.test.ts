import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateApiCommand } from '../../src/commands/docs/generate-api.js'
import { fixLinksCommand } from '../../src/commands/docs/fix-links.js'
import { fixDeclarationsCommand } from '../../src/commands/docs/fix-declarations.js'
import { setupIntegrationCommand } from '../../src/commands/docs/setup-integration.js'
import { testExamplesCommand } from '../../src/commands/docs/test-examples.js'
import { validateDocsCommand } from '../../src/commands/docs/validate-docs.js'
import { docsOperations } from '../../src/utils/docs.js'
import { ok, err, createCoreError } from '@trailhead/core'

// Mock docs operations
vi.mock('../../src/utils/docs.js', () => ({
  docsOperations: {
    generateApiDocs: vi.fn(),
    fixDocusaurusLinks: vi.fn(),
    fixFunctionDeclarations: vi.fn(),
    setupApiIntegration: vi.fn(),
    testDocumentationExamples: vi.fn(),
    validateMarkdownCodeBlocks: vi.fn(),
    checkDocsSyntax: vi.fn(),
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

  describe('testExamplesCommand', () => {
    it('should have correct configuration', () => {
      expect(testExamplesCommand.name).toBe('test-examples')
      expect(testExamplesCommand.description).toContain('Test documentation examples')
    })

    it('should run tests successfully', async () => {
      const testResult = { totalTests: 3, passed: 3, failed: 0, errors: [] }
      vi.mocked(docsOperations.testDocumentationExamples).mockReturnValue(ok(testResult))

      const result = await testExamplesCommand.execute({}, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(docsOperations.testDocumentationExamples).toHaveBeenCalledWith({
        verbose: false,
        filter: undefined,
      })
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('All 3 documentation examples passed!')
      )
    })

    it('should handle test failures', async () => {
      const testResult = {
        totalTests: 3,
        passed: 2,
        failed: 1,
        errors: [{ testName: 'Test 1', error: 'Failed assertion' }],
      }
      vi.mocked(docsOperations.testDocumentationExamples).mockReturnValue(ok(testResult))

      const result = await testExamplesCommand.execute({ verbose: true }, mockContext as any)

      expect(result.isErr()).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('1 of 3 tests failed'))
    })

    it('should handle filter option', async () => {
      const testResult = { totalTests: 1, passed: 1, failed: 0, errors: [] }
      vi.mocked(docsOperations.testDocumentationExamples).mockReturnValue(ok(testResult))

      const result = await testExamplesCommand.execute(
        { filter: 'CLI creation' },
        mockContext as any
      )

      expect(result.isOk()).toBe(true)
      expect(docsOperations.testDocumentationExamples).toHaveBeenCalledWith({
        verbose: false,
        filter: 'CLI creation',
      })
    })

    it('should handle verbose mode', async () => {
      const testResult = {
        totalTests: 2,
        passed: 1,
        failed: 1,
        errors: [{ testName: 'Test failure', error: 'Error message', stack: 'Stack trace' }],
      }
      vi.mocked(docsOperations.testDocumentationExamples).mockReturnValue(ok(testResult))

      const result = await testExamplesCommand.execute({ verbose: true }, mockContext as any)

      expect(result.isErr()).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Stack trace'))
    })
  })

  describe('validateDocsCommand', () => {
    it('should have correct configuration', () => {
      expect(validateDocsCommand.name).toBe('validate-docs')
      expect(validateDocsCommand.description).toContain('Comprehensive documentation validation')
    })

    it('should validate docs successfully', async () => {
      const validationResult = {
        filesChecked: 5,
        errors: [],
        warnings: [],
        passed: 5,
        failed: 0,
      }
      vi.mocked(docsOperations.validateMarkdownCodeBlocks).mockReturnValue(ok(validationResult))

      const result = await validateDocsCommand.execute({}, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(docsOperations.validateMarkdownCodeBlocks).toHaveBeenCalledWith({
        pattern: '**/*.{md,mdx}',
        fix: false,
        verbose: false,
        strict: false,
      })
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('All 5 files passed code validation!')
      )
    })

    it('should handle validation failures', async () => {
      const validationResult = {
        filesChecked: 3,
        errors: [
          {
            file: 'test.md',
            line: 10,
            message: 'Type error',
            code: 'const x = y',
            severity: 'error',
          },
        ],
        warnings: [],
        passed: 2,
        failed: 1,
      }
      vi.mocked(docsOperations.validateMarkdownCodeBlocks).mockReturnValue(ok(validationResult))

      const result = await validateDocsCommand.execute({ verbose: true }, mockContext as any)

      expect(result.isErr()).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('1 files have validation errors')
      )
      expect(mockLogger.error).toHaveBeenCalledWith('\n1. test.md:10')
    })

    it('should handle custom pattern', async () => {
      const validationResult = {
        filesChecked: 2,
        errors: [],
        warnings: [],
        passed: 2,
        failed: 0,
      }
      vi.mocked(docsOperations.validateMarkdownCodeBlocks).mockReturnValue(ok(validationResult))

      const result = await validateDocsCommand.execute(
        {
          pattern: 'docs/**/*.md',
        },
        mockContext as any
      )

      expect(result.isOk()).toBe(true)
      expect(docsOperations.validateMarkdownCodeBlocks).toHaveBeenCalledWith({
        pattern: 'docs/**/*.md',
        fix: false,
        verbose: false,
        strict: false,
      })
    })

    it('should handle strict mode with API testing', async () => {
      const validationResult = {
        filesChecked: 3,
        errors: [],
        warnings: [],
        passed: 3,
        failed: 0,
      }
      const testResult = { totalTests: 2, passed: 2, failed: 0, errors: [] }

      vi.mocked(docsOperations.validateMarkdownCodeBlocks).mockReturnValue(ok(validationResult))
      vi.mocked(docsOperations.testDocumentationExamples).mockReturnValue(ok(testResult))

      const result = await validateDocsCommand.execute({ strict: true }, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(docsOperations.testDocumentationExamples).toHaveBeenCalledWith({ verbose: false })
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('All 2 API tests passed!')
      )
    })

    it('should show warnings in verbose mode', async () => {
      const validationResult = {
        filesChecked: 2,
        errors: [],
        warnings: ['test.md: Contains JavaScript code blocks'],
        passed: 2,
        failed: 0,
      }
      vi.mocked(docsOperations.validateMarkdownCodeBlocks).mockReturnValue(ok(validationResult))

      const result = await validateDocsCommand.execute({ verbose: true }, mockContext as any)

      expect(result.isOk()).toBe(true)
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('1 warnings found'))
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Contains JavaScript code blocks')
      )
    })

    it('should handle fix mode', async () => {
      const validationResult = {
        filesChecked: 3,
        errors: [],
        warnings: [],
        passed: 3,
        failed: 0,
      }
      vi.mocked(docsOperations.validateMarkdownCodeBlocks).mockReturnValue(ok(validationResult))

      const result = await validateDocsCommand.execute(
        { fix: true, verbose: true },
        mockContext as any
      )

      expect(result.isOk()).toBe(true)
      expect(docsOperations.validateMarkdownCodeBlocks).toHaveBeenCalledWith({
        pattern: '**/*.{md,mdx}',
        fix: true,
        verbose: true,
        strict: false,
      })
      expect(mockLogger.info).toHaveBeenCalledWith('Fix mode: enabled')
    })
  })
})
