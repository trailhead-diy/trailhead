#!/usr/bin/env node
/**
 * @module validate-docs
 * @description Diátaxis documentation validator for Trailhead monorepo
 *
 * Validates that all documentation follows Diátaxis principles by checking:
 * - Correct frontmatter with required fields (type, title, description)
 * - Content matches declared type using pattern analysis
 * - Proper file organization and naming conventions
 * - No mixed content types (anti-patterns detection)
 *
 * @example
 * ```bash
 * # Validate all documentation
 * pnpm docs:validate
 *
 * # Run from project root
 * node tooling/docs-tooling/src/validate-docs.js
 * ```
 *
 * @since 1.0.0
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname, relative, basename } from 'path'
import matter from 'gray-matter'
import chalk from 'chalk'

interface DocMetadata {
  type: 'tutorial' | 'how-to' | 'reference' | 'explanation'
  title: string
  description: string
  prerequisites?: string[]
  related?: string[]
}

interface ValidationResult {
  file: string
  errors: string[]
  warnings: string[]
  metadata?: DocMetadata
}

interface ValidationSummary {
  totalFiles: number
  validFiles: number
  errorFiles: number
  warningFiles: number
  byType: Record<string, number>
}

const DOCS_DIR = join(process.cwd(), 'docs')
const PACKAGES_DOCS = [
  join(process.cwd(), 'packages/cli/docs'),
  join(process.cwd(), 'packages/create-cli/docs'),
]

// Content patterns that indicate mixed types (anti-patterns)
const ANTI_PATTERNS = {
  tutorial: [
    /there are (several|multiple) ways to/i,
    /you can also/i,
    /alternatively/i,
    /another option/i,
  ],
  'how-to': [
    /first, let me explain/i,
    /before we begin, you should understand/i,
    /it's important to know that/i,
    /let's start by learning/i,
  ],
  reference: [
    /follow these steps/i,
    /first, do this/i,
    /next, you need to/i,
    /to get started/i,
    /let's build/i,
  ],
  explanation: [
    /run the following command/i,
    /copy this code/i,
    /execute this script/i,
    /step \d+/i,
  ],
}

// Required patterns for each type
const REQUIRED_PATTERNS = {
  tutorial: [/you will (build|create|learn)/i, /(step|phase) \d+/i],
  'how-to': [/to (add|configure|setup|install|create)/i, /(problem|issue|task)/i],
  reference: [/(function|interface|type|api)/i, /(parameter|return|example)/i],
  explanation: [/(why|how|concept|design|architecture)/i, /(because|reason|approach)/i],
}

function findMarkdownFiles(dir: string): string[] {
  const files: string[] = []

  try {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // Skip certain directories
        if (['.git', 'node_modules', '.vale', 'dist', 'build'].includes(entry)) {
          continue
        }
        files.push(...findMarkdownFiles(fullPath))
      } else if (extname(entry) === '.md') {
        files.push(fullPath)
      }
    }
  } catch {
    // Directory doesn't exist, skip
  }

  return files
}

function validateFrontmatter(metadata: any, _file: string): string[] {
  const errors: string[] = []

  if (!metadata.type) {
    errors.push('Missing required "type" field in frontmatter')
  } else if (!['tutorial', 'how-to', 'reference', 'explanation'].includes(metadata.type)) {
    errors.push(
      `Invalid type "${metadata.type}". Must be: tutorial, how-to, reference, or explanation`
    )
  }

  if (!metadata.title) {
    errors.push('Missing required "title" field in frontmatter')
  }

  if (!metadata.description) {
    errors.push('Missing required "description" field in frontmatter')
  }

  // Type-specific validations
  if (metadata.type === 'tutorial' && !metadata.prerequisites) {
    errors.push('Tutorials should list prerequisites (even if minimal)')
  }

  return errors
}

function validateContent(
  content: string,
  type: string,
  _file: string
): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for anti-patterns
  const antiPatterns = ANTI_PATTERNS[type as keyof typeof ANTI_PATTERNS] || []
  for (const pattern of antiPatterns) {
    if (pattern.test(content)) {
      errors.push(`Content violates ${type} principles. Found pattern: ${pattern.source}`)
    }
  }

  // Check for required patterns (warnings, not errors)
  const requiredPatterns = REQUIRED_PATTERNS[type as keyof typeof REQUIRED_PATTERNS] || []
  const hasRequiredPattern = requiredPatterns.some((pattern) => pattern.test(content))

  if (requiredPatterns.length > 0 && !hasRequiredPattern) {
    warnings.push(`Content may not match ${type} type. Consider adding typical ${type} elements.`)
  }

  // Check for mixed content indicators
  const mixedContentIndicators = [
    { pattern: /## (api reference|functions|methods)/i, suggests: 'reference' },
    { pattern: /## (step \d+|phase \d+)/i, suggests: 'tutorial' },
    { pattern: /## (how to|solution|troubleshooting)/i, suggests: 'how-to' },
    { pattern: /## (architecture|design|concepts)/i, suggests: 'explanation' },
  ]

  for (const indicator of mixedContentIndicators) {
    if (indicator.pattern.test(content) && indicator.suggests !== type) {
      warnings.push(
        `Content appears to contain ${indicator.suggests} material but is marked as ${type}`
      )
    }
  }

  return { errors, warnings }
}

function validateFile(file: string): ValidationResult {
  const result: ValidationResult = {
    file: relative(process.cwd(), file),
    errors: [],
    warnings: [],
  }

  try {
    const content = readFileSync(file, 'utf-8')
    const parsed = matter(content)

    // Validate frontmatter
    const frontmatterErrors = validateFrontmatter(parsed.data, file)
    result.errors.push(...frontmatterErrors)

    if (parsed.data.type) {
      result.metadata = parsed.data as DocMetadata

      // Validate content matches type
      const contentValidation = validateContent(parsed.content, parsed.data.type, file)
      result.errors.push(...contentValidation.errors)
      result.warnings.push(...contentValidation.warnings)
    }

    // Check for empty content
    if (parsed.content.trim().length < 100) {
      result.warnings.push('Documentation appears to be very short or incomplete')
    }
  } catch (error) {
    result.errors.push(`Failed to parse file: ${error}`)
  }

  return result
}

function generateCoverageReport(results: ValidationResult[]): void {
  const summary: ValidationSummary = {
    totalFiles: results.length,
    validFiles: 0,
    errorFiles: 0,
    warningFiles: 0,
    byType: {},
  }

  for (const result of results) {
    if (result.errors.length > 0) {
      summary.errorFiles++
    } else if (result.warnings.length > 0) {
      summary.warningFiles++
    } else {
      summary.validFiles++
    }

    if (result.metadata?.type) {
      summary.byType[result.metadata.type] = (summary.byType[result.metadata.type] || 0) + 1
    }
  }

  console.log(chalk.bold('\n📊 Documentation Coverage Report\n'))
  console.log(`Total files: ${summary.totalFiles}`)
  console.log(`${chalk.green('✓')} Valid: ${summary.validFiles}`)
  console.log(`${chalk.yellow('⚠')} Warnings: ${summary.warningFiles}`)
  console.log(`${chalk.red('✗')} Errors: ${summary.errorFiles}`)

  console.log(chalk.bold('\nBy Type:'))
  for (const [type, count] of Object.entries(summary.byType)) {
    console.log(`  ${type}: ${count}`)
  }

  const coverage = (summary.validFiles / summary.totalFiles) * 100
  console.log(chalk.bold(`\nOverall Quality: ${coverage.toFixed(1)}%`))

  if (coverage < 80) {
    console.log(chalk.red('📉 Documentation quality is below 80%. Consider improving compliance.'))
  } else if (coverage < 95) {
    console.log(chalk.yellow('📈 Good documentation quality. A few improvements needed.'))
  } else {
    console.log(chalk.green('🎉 Excellent documentation quality!'))
  }
}

function main(): void {
  console.log(chalk.bold('🔍 Validating Diátaxis Documentation Standards\n'))

  // Find all markdown files
  const allFiles = [
    ...findMarkdownFiles(DOCS_DIR),
    ...PACKAGES_DOCS.flatMap((dir) => findMarkdownFiles(dir)),
  ]

  // Filter out templates and other non-docs
  const docFiles = allFiles.filter((file) => {
    const relativePath = relative(process.cwd(), file)
    const filename = basename(file)

    return (
      !relativePath.includes('templates/') &&
      !relativePath.includes('node_modules/') &&
      !filename.endsWith('CHANGELOG.md') &&
      !filename.endsWith('README.md') &&
      !filename.endsWith('CONTRIBUTING.md') &&
      !filename.endsWith('CLAUDE.md') &&
      !filename.endsWith('LICENSE.md') &&
      !filename.endsWith('SECURITY.md') &&
      !filename.endsWith('CODE_OF_CONDUCT.md')
    )
  })

  console.log(`Found ${docFiles.length} documentation files\n`)

  // Validate each file
  const results: ValidationResult[] = []
  for (const file of docFiles) {
    const result = validateFile(file)
    results.push(result)

    // Print results for this file
    if (result.errors.length > 0 || result.warnings.length > 0) {
      console.log(chalk.bold(result.file))

      for (const error of result.errors) {
        console.log(`  ${chalk.red('✗')} ${error}`)
      }

      for (const warning of result.warnings) {
        console.log(`  ${chalk.yellow('⚠')} ${warning}`)
      }

      console.log()
    }
  }

  // Generate summary report
  generateCoverageReport(results)

  // Exit with error code if there are validation errors
  const hasErrors = results.some((r) => r.errors.length > 0)
  if (hasErrors) {
    console.log(chalk.red('\n❌ Documentation validation failed. Please fix the errors above.'))
    process.exit(1)
  } else {
    console.log(chalk.green('\n✅ All documentation follows Diátaxis standards!'))
  }
}

// Only run main if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
