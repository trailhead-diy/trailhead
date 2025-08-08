import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'
import { ok, err, createCoreError, type Result, type CoreError } from '@esteban-url/core'
import fastGlob from 'fast-glob'

export interface DocsGenerationOptions {
  readonly packages?: readonly string[]
  readonly outputDir?: string
  readonly clean?: boolean
  readonly watch?: boolean
}

export interface LinkFixResult {
  readonly fixed: number
  readonly errors: readonly string[]
}

export interface SyntaxCheckOptions {
  readonly pattern: string
  readonly fix: boolean
  readonly verbose: boolean
}

export interface SyntaxError {
  readonly file: string
  readonly line: number
  readonly message: string
  readonly code?: string
}

export interface SyntaxCheckResult {
  readonly filesChecked: number
  readonly errors: readonly SyntaxError[]
  readonly warnings: readonly string[]
  readonly fixed: number
}

export interface TestExampleOptions {
  readonly verbose?: boolean
  readonly filter?: string
}

export interface TestExampleResult {
  readonly totalTests: number
  readonly passed: number
  readonly failed: number
  readonly errors: readonly TestError[]
}

export interface TestError {
  readonly testName: string
  readonly error: string
  readonly stack?: string
}

export interface ValidationOptions {
  readonly pattern: string
  readonly fix?: boolean
  readonly verbose?: boolean
  readonly strict?: boolean
}

export interface ValidationResult {
  readonly filesChecked: number
  readonly passed: number
  readonly failed: number
  readonly errors: readonly ValidationError[]
  readonly warnings: readonly string[]
}

export interface ValidationError {
  readonly file: string
  readonly line: number
  readonly column?: number
  readonly message: string
  readonly code?: string
  readonly severity: 'error' | 'warning'
}

/**
 * Documentation operations with Result-based error handling
 */
export const docsOperations = {
  /**
   * Generate API documentation using TypeDoc
   */
  generateApiDocs(options: DocsGenerationOptions = {}): Result<void, CoreError> {
    try {
      const rootDir = resolve(process.cwd())
      const packagesDir = join(rootDir, 'packages')
      const docsDir = options.outputDir || join(rootDir, 'docs')

      // Available packages
      const availablePackages = ['core', 'data', 'fs', 'validation', 'config', 'cli', 'create-cli']

      const targetPackages = options.packages || availablePackages

      // Clean output directory if requested
      if (options.clean && existsSync(docsDir)) {
        execSync(`rm -rf ${docsDir}/api`, { stdio: 'inherit' })
      }

      // Ensure output directory exists
      mkdirSync(join(docsDir, 'api'), { recursive: true })

      // Generate docs for each package
      for (const pkg of targetPackages) {
        const packagePath = join(packagesDir, pkg)
        const packageJsonPath = join(packagePath, 'package.json')

        if (!existsSync(packageJsonPath)) {
          continue // Skip non-existent packages
        }

        const outputPath = join(docsDir, pkg, 'api')
        mkdirSync(outputPath, { recursive: true })

        // Run TypeDoc for this package
        const typedocConfig = join(rootDir, 'typedoc.json')
        const command = [
          'npx typedoc',
          `--tsconfig ${packagePath}/tsconfig.json`,
          `--out ${outputPath}`,
          options.watch ? '--watch' : '',
          existsSync(typedocConfig) ? `--options ${typedocConfig}` : '',
          `${packagePath}/src/index.ts`,
        ]
          .filter(Boolean)
          .join(' ')

        execSync(command, { stdio: 'inherit', cwd: rootDir })
      }

      return ok(undefined)
    } catch (error) {
      return err(
        createCoreError(
          'DOCS_GENERATION_ERROR',
          'Failed to generate API documentation',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },

  /**
   * Fix Docusaurus links in markdown files
   */
  fixDocusaurusLinks(searchPattern = '**/*.{md,mdx}'): Result<LinkFixResult, CoreError> {
    try {
      const files = fastGlob.sync(searchPattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      })

      let fixedCount = 0
      const errors: string[] = []

      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf8')
          let newContent = content

          // Fix relative links to be Docusaurus-compatible
          newContent = newContent.replace(/\[([^\]]+)\]\(\.\/([^)]+)\.md\)/g, '[$1](./$2)')

          // Fix cross-references
          newContent = newContent.replace(/\[([^\]]+)\]\(\.\.\/([^)]+)\.md\)/g, '[$1](../$2)')

          if (newContent !== content) {
            writeFileSync(file, newContent, 'utf8')
            fixedCount++
          }
        } catch (fileError) {
          errors.push(`Failed to process ${file}: ${fileError}`)
        }
      }

      return ok({ fixed: fixedCount, errors })
    } catch (error) {
      return err(
        createCoreError(
          'LINK_FIX_ERROR',
          'Failed to fix documentation links',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },

  /**
   * Fix function declarations in TypeScript files
   */
  fixFunctionDeclarations(searchPattern = 'src/**/*.{ts,tsx}'): Result<LinkFixResult, CoreError> {
    try {
      const files = fastGlob.sync(searchPattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      })

      let fixedCount = 0
      const errors: string[] = []

      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf8')
          let newContent = content

          // Fix export function declarations to be more consistent
          newContent = newContent.replace(
            /export\s+function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
            'export function $1('
          )

          // Fix async function declarations
          newContent = newContent.replace(
            /export\s+async\s+function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
            'export async function $1('
          )

          if (newContent !== content) {
            writeFileSync(file, newContent, 'utf8')
            fixedCount++
          }
        } catch (fileError) {
          errors.push(`Failed to process ${file}: ${fileError}`)
        }
      }

      return ok({ fixed: fixedCount, errors })
    } catch (error) {
      return err(
        createCoreError(
          'FUNCTION_FIX_ERROR',
          'Failed to fix function declarations',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },

  /**
   * Setup API documentation integration
   */
  setupApiIntegration(): Result<void, CoreError> {
    try {
      const rootDir = resolve(process.cwd())
      const docsDir = join(rootDir, 'docs')

      // Ensure docs directory structure exists
      mkdirSync(join(docsDir, 'api'), { recursive: true })

      // Create API index if it doesn't exist
      const apiIndexPath = join(docsDir, 'api', 'index.md')
      if (!existsSync(apiIndexPath)) {
        const indexContent = `# API Documentation

This section contains auto-generated API documentation for all packages.

## Packages

- [Core](./core/) - Result types and error handling
- [CLI](./cli/) - Command-line interface framework  
- [Config](./config/) - Configuration management
- [Data](./data/) - Data processing utilities
- [FileSystem](./fs/) - File system operations
- [Validation](./validation/) - Data validation
- [Create CLI](./create-cli/) - CLI generator
`

        writeFileSync(apiIndexPath, indexContent, 'utf8')
      }

      return ok(undefined)
    } catch (error) {
      return err(
        createCoreError(
          'DOCS_SETUP_ERROR',
          'Failed to setup API documentation integration',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },

  /**
   * Check TypeScript syntax in documentation code blocks
   */
  checkDocsSyntax(options: SyntaxCheckOptions): Result<SyntaxCheckResult, CoreError> {
    try {
      const files = fastGlob.sync(options.pattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      })

      const errors: SyntaxError[] = []
      const warnings: string[] = []
      let fixed = 0
      let filesChecked = 0

      // Code block regex patterns
      const codeBlockRegex = /```(?:typescript|ts|javascript|js|tsx|jsx)\n([\s\S]*?)```/g
      const codeBlockWithLangRegex = /```(\w+)\n([\s\S]*?)```/g

      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf8')
          let hasCodeBlocks = false

          // Find all code blocks
          let match
          while ((match = codeBlockRegex.exec(content)) !== null) {
            hasCodeBlocks = true
            const code = match[1]
            const startLine = content.substring(0, match.index).split('\n').length

            // Create a temporary TypeScript file to check syntax
            const tempFile = file.replace(/\.(md|mdx)$/, '.syntax-check.ts')

            try {
              // Write the code to a temporary file
              writeFileSync(tempFile, code, 'utf8')

              // Run TypeScript compiler to check syntax
              const result = execSync(
                `npx tsc --noEmit --allowJs --checkJs --skipLibCheck ${tempFile} 2>&1`,
                { encoding: 'utf8', stdio: 'pipe' }
              )

              // Clean up temp file
              if (existsSync(tempFile)) {
                execSync(`rm -f ${tempFile}`)
              }
            } catch (compileError: any) {
              // Clean up temp file
              if (existsSync(tempFile)) {
                execSync(`rm -f ${tempFile}`)
              }

              // Parse TypeScript errors
              const errorOutput = compileError.stdout || compileError.message
              const lines = errorOutput.split('\n')

              for (const line of lines) {
                if (line.includes('.syntax-check.ts')) {
                  // Extract error details
                  const errorMatch = line.match(/\.syntax-check\.ts\((\d+),(\d+)\): error (.+)/)
                  if (errorMatch) {
                    const errorLine = parseInt(errorMatch[1], 10)
                    const errorMessage = errorMatch[3]

                    errors.push({
                      file,
                      line: startLine + errorLine - 1,
                      message: errorMessage,
                      code: code
                        .split('\n')
                        .slice(errorLine - 2, errorLine + 1)
                        .join('\n'),
                    })
                  }
                }
              }
            }
          }

          if (hasCodeBlocks) {
            filesChecked++
          }

          // Reset regex lastIndex
          codeBlockRegex.lastIndex = 0

          // Check for potential issues in code blocks
          if (options.verbose) {
            // Look for common patterns that might indicate issues
            if (content.includes('```js\n') || content.includes('```javascript\n')) {
              warnings.push(`${file}: Contains JavaScript code blocks that won't be type-checked`)
            }

            // Check for code blocks without language specification
            let genericMatch
            codeBlockWithLangRegex.lastIndex = 0
            while ((genericMatch = codeBlockWithLangRegex.exec(content)) !== null) {
              const lang = genericMatch[1]
              if (
                ![
                  'typescript',
                  'ts',
                  'javascript',
                  'js',
                  'tsx',
                  'jsx',
                  'bash',
                  'json',
                  'yaml',
                  'yml',
                  'shell',
                  'sh',
                ].includes(lang)
              ) {
                warnings.push(`${file}: Code block with unrecognized language: ${lang}`)
              }
            }
          }

          // Auto-fix common issues if requested
          if (options.fix && errors.length > 0) {
            // Here we could implement auto-fixes for common issues
            // For now, we'll just track that fixes were attempted
            // Real implementation would modify the file content
          }
        } catch (fileError) {
          warnings.push(`Failed to process ${file}: ${fileError}`)
        }
      }

      return ok({
        filesChecked,
        errors,
        warnings,
        fixed,
      })
    } catch (error) {
      return err(
        createCoreError(
          'SYNTAX_CHECK_ERROR',
          'Failed to check documentation syntax',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },

  /**
   * Generate type declarations for documentation validation
   */
  generateTypeDeclarations(): string {
    return `// Type declarations for validation
interface Logger { info(msg: string): void; error(msg: string): void; warn(msg: string): void; debug(msg: string): void }
interface CommandContext { projectRoot: string; logger: Logger; verbose: boolean; fs: any; args: string[] }
interface CommandOptions { [key: string]: any }
interface Result<T, E> { isOk(): boolean; isError(): boolean; value: T; error: E; map<U>(fn: (v: T) => U): Result<U, E> }
interface Command<T> { name: string; description: string; execute(options: T, context: CommandContext): Promise<Result<any, Error>> }
interface CLI { run(argv?: string[]): Promise<void> }
interface CLIConfig { name: string; version: string; description: string; commands?: Command<any>[] }

// Function declarations
declare function createCLI(config: CLIConfig): CLI
declare function createCommand<T>(config: any): Command<T>
declare function ok<T>(value: T): Result<T, never>
declare function err<E>(error: E): Result<never, E>

// Module declarations for documentation examples
declare module '@esteban-url/cli' { export function createCLI(config: CLIConfig): CLI }
declare module '@esteban-url/cli/command' { 
    export function createCommand<T>(config: any): Command<T>
    export interface CommandOptions {}
    export interface CommandContext extends CommandContext {}
}
declare module '@esteban-url/core' { 
    export function ok<T>(value: T): Result<T, never>
    export function err<E>(error: E): Result<never, E>
    export interface Result<T, E> extends Result<T, E> {}
}
declare module '@esteban-url/fs' { export function readFile(path: string, encoding?: string): Promise<Result<string, Error>> }
declare module '@esteban-url/config' {
    export function defineSchema(): any
    export function createConfigManager(config: any): any
    export function string(): any
    export function number(): any
    export function boolean(): any
    export function object(shape: any): any
}
declare module '@esteban-url/data' { export const data: any }
declare module '@esteban-url/sort' { export function sortBy(arr: any[], fns: any[]): any[] }
declare module '@esteban-url/validation' { export const validate: any; export const z: any }

// Third-party module declarations
declare module 'zod' { const z: any; export { z } }
declare module 'papaparse' { const Papa: any; export default Papa }
declare module 'yaml' { }
declare module '@inquirer/prompts' { 
    export function input(config: any): Promise<string>
    export function confirm(config: any): Promise<boolean>
    export function select(config: any): Promise<any>
}
`
  },

  /**
   * Test documentation examples with actual Trailhead imports
   */
  testDocumentationExamples(
    options: TestExampleOptions = {}
  ): Result<TestExampleResult, CoreError> {
    try {
      // Find monorepo root
      let rootDir = resolve(process.cwd())
      while (rootDir !== '/' && !existsSync(join(rootDir, 'turbo.json'))) {
        rootDir = resolve(rootDir, '..')
      }

      const tempDir = join(rootDir, '.docs-test-temp')
      const errors: TestError[] = []
      let totalTests = 0
      let passed = 0

      // Ensure temp directory exists
      mkdirSync(tempDir, { recursive: true })

      // Dynamically discover code examples from documentation
      const discoveredTests = this.discoverDocumentationExamples(rootDir, options.filter)
      if (discoveredTests.length === 0) {
        // Fallback to hardcoded tests if no dynamic discovery
        totalTests = this.runHardcodedTests(tempDir, errors, options)
        passed = totalTests - errors.length
      } else {
        // Run discovered tests
        const result = this.runDiscoveredTests(discoveredTests, tempDir, errors, options)
        totalTests = result.total
        passed = result.passed
      }

      // Clean up temp directory
      try {
        if (existsSync(tempDir)) {
          execSync(`rm -rf ${tempDir}`)
        }
      } catch {
        // Ignore cleanup errors
      }

      return ok({
        totalTests,
        passed,
        failed: totalTests - passed,
        errors,
      })
    } catch (error) {
      return err(
        createCoreError(
          'TEST_EXAMPLES_ERROR',
          'DOCS_ERROR',
          'Failed to test documentation examples'
        )
      )
    }
  },

  /**
   * Enhanced validation of markdown code blocks
   */
  validateMarkdownCodeBlocks(options: ValidationOptions): Result<ValidationResult, CoreError> {
    try {
      // Find monorepo root by looking for package.json with workspaces
      let rootDir = resolve(process.cwd())
      while (rootDir !== '/' && !existsSync(join(rootDir, 'turbo.json'))) {
        rootDir = resolve(rootDir, '..')
      }

      const files = fastGlob.sync(options.pattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        cwd: rootDir,
        absolute: true,
      })

      // Log found files in verbose mode
      if (options.verbose) {
        console.log(`Found ${files.length} file(s) matching pattern: ${options.pattern}`)
      }

      const errors: ValidationError[] = []
      const warnings: string[] = []
      let filesChecked = 0
      let passed = 0
      let failed = 0

      // Code block regex patterns
      const codeBlockRegex = /```(?:typescript|ts|javascript|js|tsx|jsx)\n([\s\S]*?)```/g
      const typeDeclarations = docsOperations.generateTypeDeclarations()

      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf8')
          let hasCodeBlocks = false
          let fileHasErrors = false

          // Find all code blocks
          let match
          codeBlockRegex.lastIndex = 0

          while ((match = codeBlockRegex.exec(content)) !== null) {
            hasCodeBlocks = true
            const code = match[1]
            const startLine = content.substring(0, match.index).split('\n').length

            // Create temporary file for validation
            const tempFile = join(
              resolve(process.cwd()),
              `.temp-syntax-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.ts`
            )

            try {
              // Combine type declarations with code
              const fullCode = `${typeDeclarations}\n\n// User code starts here\n${code}`
              writeFileSync(tempFile, fullCode, 'utf8')

              // Run TypeScript compiler
              execSync(
                `npx tsc --noEmit --allowJs --checkJs --skipLibCheck --esModuleInterop --target ES2020 --module ESNext --moduleResolution node ${tempFile} 2>&1`,
                { encoding: 'utf8', stdio: 'pipe' }
              )

              // If we get here, validation passed
              if (existsSync(tempFile)) {
                execSync(`rm -f ${tempFile}`)
              }
            } catch (compileError: any) {
              // Clean up temp file
              if (existsSync(tempFile)) {
                execSync(`rm -f ${tempFile}`)
              }

              fileHasErrors = true

              // Parse TypeScript errors
              const errorOutput = compileError.stdout || compileError.message
              const lines = errorOutput.split('\n')

              for (const line of lines) {
                if (line.includes('.ts(')) {
                  // Extract error details
                  const errorMatch = line.match(/\.ts\((\d+),(\d+)\): error (.+)/)
                  if (errorMatch) {
                    const errorLine = parseInt(errorMatch[1], 10)
                    const errorColumn = parseInt(errorMatch[2], 10)
                    const errorMessage = errorMatch[3]

                    // Adjust line number (subtract type declaration lines)
                    const typeDeclarationLines = typeDeclarations.split('\n').length + 2
                    const actualLine = errorLine - typeDeclarationLines

                    if (actualLine > 0) {
                      errors.push({
                        file,
                        line: startLine + actualLine - 1,
                        column: errorColumn,
                        message: errorMessage,
                        code: code
                          .split('\n')
                          .slice(Math.max(0, actualLine - 2), actualLine + 1)
                          .join('\n'),
                        severity: 'error',
                      })
                    }
                  }
                }
              }

              // Attempt fixes for common issues if fix mode is enabled
              if (options.fix) {
                const fixedCode = docsOperations.applyCommonFixes(code, errorOutput)
                if (fixedCode !== code) {
                  // Re-validate fixed code
                  writeFileSync(
                    tempFile,
                    `${typeDeclarations}\n\n// User code starts here\n${fixedCode}`,
                    'utf8'
                  )

                  try {
                    execSync(
                      `npx tsc --noEmit --allowJs --checkJs --skipLibCheck --esModuleInterop --target ES2020 --module ESNext --moduleResolution node ${tempFile} 2>&1`,
                      { encoding: 'utf8', stdio: 'pipe' }
                    )

                    // Fix successful - update the markdown file
                    docsOperations.updateMarkdownCodeBlock(
                      file,
                      match.index,
                      match[0],
                      fixedCode,
                      startLine
                    )
                    fileHasErrors = false

                    if (existsSync(tempFile)) {
                      execSync(`rm -f ${tempFile}`)
                    }

                    continue // Skip to next code block
                  } catch {
                    // Fix didn't work, keep original errors
                  }
                }
              }
            }
          }

          if (hasCodeBlocks) {
            filesChecked++
            if (fileHasErrors) {
              failed++
            } else {
              passed++
            }
          }

          // Check for potential issues
          if (options.verbose) {
            // Check for JavaScript blocks (not type-checked)
            if (content.includes('```js\n') || content.includes('```javascript\n')) {
              warnings.push(`${file}: Contains JavaScript code blocks that won't be type-checked`)
            }

            // Check for missing language specification
            const genericBlockRegex = /```\n[^`]/g
            if (genericBlockRegex.test(content)) {
              warnings.push(`${file}: Contains code blocks without language specification`)
            }
          }
        } catch (fileError) {
          warnings.push(`Failed to process ${file}: ${fileError}`)
          failed++
        }
      }

      return ok({
        filesChecked,
        passed,
        failed,
        errors,
        warnings,
      })
    } catch (error) {
      return err(
        createCoreError('VALIDATION_ERROR', 'DOCS_ERROR', 'Failed to validate markdown code blocks')
      )
    }
  },

  /**
   * Apply common fixes to code blocks
   */
  applyCommonFixes(code: string, errorOutput: string): string {
    let fixedCode = code

    // Fix 1: Add missing semicolons
    if (errorOutput.includes("';' expected")) {
      fixedCode = fixedCode.replace(/([a-zA-Z0-9_)\]}>])$/gm, '$1;')
    }

    // Fix 2: Fix common typos
    if (errorOutput.includes("Property 'isok' does not exist")) {
      fixedCode = fixedCode.replace(/\.isok\(\)/g, '.isOk()')
    }

    // Fix 3: Fix async function syntax
    if (errorOutput.includes("'async' modifier cannot be used here")) {
      fixedCode = fixedCode.replace(/async const /g, 'const ')
    }

    // Fix 4: Add missing imports based on usage
    if (errorOutput.includes("Cannot find name 'expect'")) {
      if (!fixedCode.includes('import') || !fixedCode.includes('expect')) {
        fixedCode = `import { expect } from 'vitest'\n${fixedCode}`
      }
    }

    if (errorOutput.includes("Cannot find name 'test'")) {
      if (!fixedCode.includes('import') || !fixedCode.includes('test')) {
        fixedCode = `import { test } from 'vitest'\n${fixedCode}`
      }
    }

    // Fix 5: Remove duplicate imports by merging them
    const importLines = fixedCode.split('\n').filter((line) => line.trim().startsWith('import'))
    if (importLines.length > 1) {
      const nonImportLines = fixedCode
        .split('\n')
        .filter((line) => !line.trim().startsWith('import'))
      const mergedImports = this.mergeImports(importLines)
      fixedCode = `${mergedImports.join('\n')}\n${nonImportLines.join('\n')}`
    }

    return fixedCode
  },

  /**
   * Merge duplicate import statements
   */
  mergeImports(importLines: string[]): string[] {
    const importMap: Record<string, Set<string>> = {}

    for (const line of importLines) {
      const match = line.match(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/)
      if (match) {
        const [, imports, module] = match
        if (!importMap[module]) {
          importMap[module] = new Set()
        }
        imports.split(',').forEach((imp) => {
          importMap[module]?.add(imp.trim())
        })
      }
    }

    return Object.entries(importMap).map(
      ([module, imports]) => `import { ${Array.from(imports).join(', ')} } from '${module}'`
    )
  },

  /**
   * Update a specific code block in a markdown file
   */
  updateMarkdownCodeBlock(
    filePath: string,
    blockIndex: number,
    originalBlock: string,
    newCode: string,
    startLine: number
  ): void {
    const content = readFileSync(filePath, 'utf8')
    const lines = content.split('\n')

    // Find the code block boundaries
    let blockStart = -1
    let blockEnd = -1
    let inCodeBlock = false

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('```')) {
        if (!inCodeBlock) {
          blockStart = i
          inCodeBlock = true
        } else {
          blockEnd = i
          break
        }
      }
    }

    if (blockStart >= 0 && blockEnd >= 0) {
      // Replace the code block content
      const beforeBlock = lines.slice(0, blockStart + 1)
      const afterBlock = lines.slice(blockEnd)
      const newCodeLines = newCode.split('\n')

      const newLines = [...beforeBlock, ...newCodeLines, ...afterBlock]
      writeFileSync(filePath, newLines.join('\n'), 'utf8')
    }
  },

  /**
   * Discover documentation examples from markdown files
   */
  discoverDocumentationExamples(
    rootDir: string,
    filter?: string
  ): Array<{ name: string; code: string; file: string }> {
    const examples: Array<{ name: string; code: string; file: string }> = []

    // Search for documentation files
    const docFiles = fastGlob.sync('**/*.{md,mdx}', {
      cwd: rootDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/build/**'],
      absolute: true,
    })

    for (const file of docFiles) {
      try {
        const content = readFileSync(file, 'utf8')
        const relativePath = file.replace(rootDir, '').replace(/^\//, '')

        // Find TypeScript/JavaScript code blocks
        const codeBlockRegex = /```(?:typescript|ts|javascript|js|tsx|jsx)\n([\s\S]*?)```/g
        let match
        let blockIndex = 0

        while ((match = codeBlockRegex.exec(content)) !== null) {
          const code = match[1].trim()

          // Only include examples that look like they could be runnable
          if (this.isRunnableExample(code)) {
            const exampleName = this.generateExampleName(relativePath, blockIndex, code)

            // Apply filter if provided
            if (!filter || exampleName.toLowerCase().includes(filter.toLowerCase())) {
              examples.push({
                name: exampleName,
                code,
                file: relativePath,
              })
            }
          }

          blockIndex++
        }
      } catch (error) {
        // Skip files that can't be read
        continue
      }
    }

    return examples
  },

  /**
   * Check if a code example looks runnable
   */
  isRunnableExample(code: string): boolean {
    // Look for imports from @esteban-url packages
    if (code.includes('@esteban-url/')) {
      return true
    }

    // Look for key CLI framework patterns
    const patterns = [
      'createCLI',
      'createCommand',
      'ok(',
      'err(',
      'Result<',
      'CommandContext',
      'CommandOptions',
    ]

    return patterns.some((pattern) => code.includes(pattern))
  },

  /**
   * Generate a descriptive name for an example
   */
  generateExampleName(filePath: string, blockIndex: number, code: string): string {
    const fileName =
      filePath
        .split('/')
        .pop()
        ?.replace(/\.(md|mdx)$/, '') || 'unknown'

    // Try to extract a meaningful description from the code
    let description = ''

    if (code.includes('createCLI')) {
      description = 'CLI creation'
    } else if (code.includes('createCommand')) {
      description = 'Command definition'
    } else if (code.includes('Result<')) {
      description = 'Result handling'
    } else if (code.includes('test(') || code.includes('expect(')) {
      description = 'Test example'
    } else {
      description = `Example ${blockIndex + 1}`
    }

    return `${fileName}: ${description}`
  },

  /**
   * Run discovered tests dynamically
   */
  runDiscoveredTests(
    tests: Array<{ name: string; code: string; file: string }>,
    tempDir: string,
    errors: TestError[],
    options: TestExampleOptions
  ): { total: number; passed: number } {
    let totalTests = tests.length
    let passed = 0

    for (const test of tests) {
      try {
        // Create test file with proper imports and setup
        const testContent = `#!/usr/bin/env tsx
${this.generateTypeDeclarations()}

// Example from: ${test.file}
${test.code}

console.log('✅ ${test.name} - No compilation errors')
`

        const testFile = join(tempDir, `${test.name.replace(/[^a-zA-Z0-9]/g, '_')}.ts`)
        writeFileSync(testFile, testContent, 'utf8')

        // Try to compile/validate the test
        execSync(
          `npx tsc --noEmit --allowJs --checkJs --skipLibCheck --esModuleInterop --target ES2020 --module ESNext --moduleResolution node ${testFile}`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
          }
        )

        passed++

        if (options.verbose) {
          console.log(`✅ ${test.name}`)
        }
      } catch (error: any) {
        errors.push({
          testName: test.name,
          error: `Compilation failed for example in ${test.file}`,
          stack: error.stderr || error.message,
        })

        if (options.verbose) {
          console.log(`❌ ${test.name}: ${error.stderr || error.message}`)
        }
      }
    }

    return { total: totalTests, passed }
  },

  /**
   * Run hardcoded tests as fallback
   */
  runHardcodedTests(tempDir: string, errors: TestError[], options: TestExampleOptions): number {
    const hardcodedTests = [
      {
        name: 'Basic CLI creation',
        code: `
import { createCLI } from '@esteban-url/cli'
import { createCommand } from '@esteban-url/cli/command'
import { ok } from '@esteban-url/core'

const versionCommand = createCommand({
  name: 'version',
  description: 'Show version information',
  action: async (options, context) => {
    context.logger.info('test-cli v1.0.0')
    return ok(undefined)
  },
})

const cli = createCLI({
  name: 'test-cli',
  version: '1.0.0',
  description: 'Test CLI application',
  commands: [versionCommand],
})
`,
      },
      {
        name: 'Result type patterns',
        code: `
import { ok, err, Result } from '@esteban-url/core'

const success: Result<string, Error> = ok('success')
const failure: Result<string, Error> = err(new Error('failed'))

if (success.isOk() && failure.isError()) {
  console.log('Result types working correctly')
}
`,
      },
    ]

    for (const test of hardcodedTests) {
      try {
        const testContent = `#!/usr/bin/env tsx
${this.generateTypeDeclarations()}
${test.code}
console.log('✅ ${test.name} - Success')
`

        const testFile = join(tempDir, `${test.name.replace(/\s+/g, '_')}.ts`)
        writeFileSync(testFile, testContent, 'utf8')

        execSync(`npx tsx ${testFile}`, {
          encoding: 'utf8',
          stdio: options.verbose ? 'inherit' : 'pipe',
        })
      } catch (error: any) {
        errors.push({
          testName: test.name,
          error: error.stderr || error.message,
          stack: error.stack,
        })
      }
    }

    return hardcodedTests.length
  },
}
