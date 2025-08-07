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
}
