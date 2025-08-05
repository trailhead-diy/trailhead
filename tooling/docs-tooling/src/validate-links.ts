#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { glob } from 'glob'
import chalk from 'chalk'

interface LinkValidationResult {
  file: string
  line: number
  link: string
  target: string
  status: 'valid' | 'broken' | 'external' | 'warning'
  message?: string
}

interface ValidationSummary {
  totalFiles: number
  totalLinks: number
  validLinks: number
  brokenLinks: number
  externalLinks: number
  warnings: number
  results: LinkValidationResult[]
}

interface LinkValidatorOptions {
  repoRoot?: string
}

interface LinkValidatorContext {
  repoRoot: string
}

/**
 * Extract markdown links from file content
 */
const extractLinks = (content: string): Array<{ link: string; line: number; text: string }> => {
  const links: Array<{ link: string; line: number; text: string }> = []
  const lines = content.split('\n')
  let inCodeBlock = false

  lines.forEach((line, index) => {
    // Check for code block markers (``` or indented blocks)
    if (line.match(/^```/)) {
      inCodeBlock = !inCodeBlock
      return
    }

    // Skip lines inside code blocks
    if (inCodeBlock) {
      return
    }

    // Skip indented code blocks (4+ spaces or tab)
    if (line.match(/^(\s{4,}|\t)/)) {
      return
    }

    // Match markdown links: [text](url)
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g
    let match

    while ((match = linkRegex.exec(line)) !== null) {
      const [, text, url] = match
      links.push({
        link: url,
        line: index + 1,
        text: text.trim(),
      })
    }
  })

  return links
}

/**
 * Extract frontmatter related links
 */
const extractFrontmatterLinks = (
  content: string
): Array<{ link: string; line: number; text: string }> => {
  const links: Array<{ link: string; line: number; text: string }> = []
  const lines = content.split('\n')
  let inFrontmatter = false
  let inRelated = false

  lines.forEach((line, index) => {
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter
      return
    }

    if (!inFrontmatter) return

    if (line.trim() === 'related:') {
      inRelated = true
      return
    }

    if (inRelated) {
      // Check if we're still in the related section
      if (line.match(/^[a-zA-Z]/) && !line.startsWith('  ')) {
        inRelated = false
        return
      }

      // Extract related link
      const match = line.match(/^\s*-\s*(.+\.md)/)
      if (match) {
        links.push({
          link: match[1],
          line: index + 1,
          text: 'related',
        })
      }
    }
  })

  return links
}

/**
 * Validate if a file path exists
 */
const validateFilePath = (
  link: string,
  currentFile: string,
  repoRoot: string
): { status: 'valid' | 'broken' | 'external' | 'warning'; message?: string } => {
  // External links
  if (link.startsWith('http://') || link.startsWith('https://')) {
    return { status: 'external' }
  }

  // Email links
  if (link.startsWith('mailto:')) {
    return { status: 'external' }
  }

  // Fragment-only links (anchors in same document) - these are valid
  if (link.startsWith('#')) {
    return { status: 'valid' }
  }

  let targetPath: string

  if (link.startsWith('/')) {
    // Absolute path from repo root
    targetPath = join(repoRoot, link.substring(1))
  } else {
    // Relative path
    const currentDir = dirname(currentFile)
    targetPath = resolve(currentDir, link)

    // Allow relative paths for Docusaurus compatibility
    // Only warn if it's a cross-package reference
    const isInDocsApp = currentFile.includes('/apps/docs/')
    const isCrossPackageLink = link.startsWith('../') && link.includes('/packages/')

    if (!isInDocsApp && isCrossPackageLink) {
      return {
        status: 'warning',
        message: 'Cross-package relative link - consider using absolute path',
      }
    }
  }

  // Remove anchor if present
  const [filePath] = targetPath.split('#')

  // Check if file exists as-is
  if (existsSync(filePath)) {
    return { status: 'valid' }
  }

  // For Docusaurus compatibility: if the link doesn't have .md extension,
  // try adding it to see if the file exists
  if (!filePath.endsWith('.md') && !filePath.endsWith('.mdx')) {
    const withMd = `${filePath}.md`
    if (existsSync(withMd)) {
      return { status: 'valid' }
    }

    const withMdx = `${filePath}.mdx`
    if (existsSync(withMdx)) {
      return { status: 'valid' }
    }
  }

  return { status: 'broken', message: `File not found: ${filePath}` }
}

/**
 * Validate links in a single file
 */
const validateFileLinks = (filePath: string, repoRoot: string): LinkValidationResult[] => {
  const results: LinkValidationResult[] = []

  try {
    const content = readFileSync(filePath, 'utf-8')
    const markdownLinks = extractLinks(content)
    const frontmatterLinks = extractFrontmatterLinks(content)
    const allLinks = [...markdownLinks, ...frontmatterLinks]

    for (const { link, line, text } of allLinks) {
      const validation = validateFilePath(link, filePath, repoRoot)

      results.push({
        file: filePath,
        line,
        link: text === 'related' ? `related: ${link}` : `[${text}](${link})`,
        target: link,
        status: validation.status,
        message: validation.message,
      })
    }
  } catch (error) {
    results.push({
      file: filePath,
      line: 0,
      link: 'FILE_ERROR',
      target: filePath,
      status: 'broken',
      message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  return results
}

/**
 * Validate all documentation files
 */
const validateAllLinks = async (
  context: LinkValidatorContext,
  directory?: string
): Promise<ValidationSummary> => {
  const searchPattern = directory ? join(directory, '**/*.md') : '**/*.md'

  const files = await glob(searchPattern, {
    cwd: context.repoRoot,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
  })

  const results: LinkValidationResult[] = []

  for (const file of files) {
    const filePath = join(context.repoRoot, file)
    const fileResults = validateFileLinks(filePath, context.repoRoot)
    results.push(...fileResults)
  }

  const summary: ValidationSummary = {
    totalFiles: files.length,
    totalLinks: results.length,
    validLinks: results.filter((r) => r.status === 'valid').length,
    brokenLinks: results.filter((r) => r.status === 'broken').length,
    externalLinks: results.filter((r) => r.status === 'external').length,
    warnings: results.filter((r) => r.status === 'warning').length,
    results,
  }

  return summary
}

/**
 * Generate validation report
 */
const generateValidationReport = (
  summary: ValidationSummary,
  repoRoot: string,
  verbose = false
): string => {
  const lines: string[] = []

  lines.push(chalk.bold('\n📋 Link Validation Report'))
  lines.push('═'.repeat(50))

  // Summary statistics
  lines.push(`📁 Files scanned:     ${summary.totalFiles}`)
  lines.push(`🔗 Total links:      ${summary.totalLinks}`)
  lines.push(`✅ Valid links:      ${chalk.green(summary.validLinks)}`)
  lines.push(`❌ Broken links:     ${chalk.red(summary.brokenLinks)}`)
  lines.push(`🌐 External links:   ${chalk.blue(summary.externalLinks)}`)
  if (summary.warnings > 0) {
    lines.push(`⚠️  Warnings:        ${chalk.yellow(summary.warnings)}`)
  }

  // Detailed results
  if (verbose || summary.brokenLinks > 0 || summary.warnings > 0) {
    lines.push('\n📋 Detailed Results')
    lines.push('─'.repeat(50))

    const issueResults = summary.results.filter(
      (r) => r.status === 'broken' || (verbose && r.status === 'warning')
    )

    if (issueResults.length === 0) {
      lines.push(chalk.green('✅ All links are valid!'))
    } else {
      // Group by file
      const byFile = issueResults.reduce(
        (acc, result) => {
          if (!acc[result.file]) acc[result.file] = []
          acc[result.file].push(result)
          return acc
        },
        {} as Record<string, LinkValidationResult[]>
      )

      Object.entries(byFile).forEach(([file, results]) => {
        const relativePath = file.replace(repoRoot, '').substring(1)
        lines.push(`\n📄 ${relativePath}`)

        results.forEach((result) => {
          const status =
            result.status === 'broken' ? chalk.red('❌ BROKEN') : chalk.yellow('⚠️  WARNING')

          lines.push(`   ${status} Line ${result.line}: ${result.link}`)
          if (result.message) {
            lines.push(`      ${chalk.gray(result.message)}`)
          }
        })
      })
    }
  }

  // Success/failure status
  lines.push('\n' + '═'.repeat(50))
  if (summary.brokenLinks === 0) {
    lines.push(chalk.green('✅ Link validation passed!'))
  } else {
    lines.push(chalk.red(`❌ Link validation failed: ${summary.brokenLinks} broken links found`))
  }

  return lines.join('\n')
}

/**
 * Create a link validator instance
 */
const createLinkValidator = (options?: LinkValidatorOptions): LinkValidatorContext => {
  return {
    repoRoot: options?.repoRoot ?? resolve(process.cwd()),
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose') || args.includes('-v')
  const directory = args.find((arg) => !arg.startsWith('--') && !arg.startsWith('-'))

  console.log(chalk.blue('🔍 Starting link validation...'))

  const context = createLinkValidator()
  const summary = await validateAllLinks(context, directory)

  const report = generateValidationReport(summary, context.repoRoot, verbose)
  console.log(report)

  // Exit with error code if there are broken links
  process.exit(summary.brokenLinks > 0 ? 1 : 0)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(chalk.red('❌ Link validation failed:'), error)
    process.exit(1)
  })
}

export {
  createLinkValidator,
  validateAllLinks,
  generateValidationReport,
  type ValidationSummary,
  type LinkValidationResult,
  type LinkValidatorContext,
}
