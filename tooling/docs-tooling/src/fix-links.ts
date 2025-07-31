#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { join, resolve, dirname, relative } from 'path'
import { glob } from 'glob'
import chalk from 'chalk'

interface LinkFix {
  file: string
  line: number
  originalLink: string
  fixedLink: string
  reason: string
}

interface LinkFixerOptions {
  repoRoot?: string
}

interface LinkFixerContext {
  repoRoot: string
}

/**
 * Convert relative path to absolute path based on file location
 */
const convertRelativeToAbsolute = (
  relativePath: string,
  currentFilePath: string,
  repoRoot: string
): string => {
  const currentDir = dirname(currentFilePath)
  const absoluteFilePath = resolve(currentDir, relativePath)
  const relativeFromRoot = relative(repoRoot, absoluteFilePath)

  // Convert to forward slashes and add leading slash
  return '/' + relativeFromRoot.replace(/\\/g, '/')
}

/**
 * Fix links in frontmatter related section
 */
const fixFrontmatterLinks = (
  content: string,
  filePath: string,
  repoRoot: string
): { content: string; fixes: LinkFix[] } => {
  const fixes: LinkFix[] = []
  const lines = content.split('\n')
  let inFrontmatter = false
  let inRelated = false
  let lineNumber = 0

  const fixedLines = lines.map((line, index) => {
    lineNumber = index + 1

    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter
      return line
    }

    if (!inFrontmatter) return line

    if (line.trim() === 'related:') {
      inRelated = true
      return line
    }

    if (inRelated) {
      // Check if we're still in the related section
      if (line.match(/^[a-zA-Z]/) && !line.startsWith('  ')) {
        inRelated = false
        return line
      }

      // Fix related link
      const match = line.match(/^(\s*-\s*)(.+\.md)/)
      if (match) {
        const [, prefix, link] = match

        // Only fix relative links (not already absolute)
        if (!link.startsWith('/')) {
          const absoluteLink = convertRelativeToAbsolute(link, filePath, repoRoot)

          fixes.push({
            file: filePath,
            line: lineNumber,
            originalLink: link,
            fixedLink: absoluteLink,
            reason: 'Convert frontmatter relative link to absolute',
          })

          return prefix + absoluteLink
        }
      }
    }

    return line
  })

  return {
    content: fixedLines.join('\n'),
    fixes,
  }
}

/**
 * Fix markdown links in content
 */
const fixMarkdownLinks = (
  content: string,
  filePath: string,
  repoRoot: string
): { content: string; fixes: LinkFix[] } => {
  const fixes: LinkFix[] = []
  const lines = content.split('\n')

  const fixedLines = lines.map((line, index) => {
    const lineNumber = index + 1

    // Skip if this is a README file (they can use relative links)
    if (filePath.includes('README.md')) {
      return line
    }

    // Match markdown links: [text](url)
    return line.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) => {
      // Skip external links, fragments, and already absolute links
      if (
        url.startsWith('http') ||
        url.startsWith('mailto:') ||
        url.startsWith('#') ||
        url.startsWith('/')
      ) {
        return match
      }

      // Skip non-markdown links
      if (!url.includes('.md')) {
        return match
      }

      const absoluteUrl = convertRelativeToAbsolute(url, filePath, repoRoot)

      fixes.push({
        file: filePath,
        line: lineNumber,
        originalLink: `[${text}](${url})`,
        fixedLink: `[${text}](${absoluteUrl})`,
        reason: 'Convert relative markdown link to absolute',
      })

      return `[${text}](${absoluteUrl})`
    })
  })

  return {
    content: fixedLines.join('\n'),
    fixes,
  }
}

/**
 * Fix links in a single file
 */
const fixFileLinks = (filePath: string, repoRoot: string, dryRun = false): LinkFix[] => {
  try {
    const content = readFileSync(filePath, 'utf-8')
    let fixedContent = content
    const allFixes: LinkFix[] = []

    // Fix frontmatter links
    const frontmatterResult = fixFrontmatterLinks(fixedContent, filePath, repoRoot)
    fixedContent = frontmatterResult.content
    allFixes.push(...frontmatterResult.fixes)

    // Fix markdown links
    const markdownResult = fixMarkdownLinks(fixedContent, filePath, repoRoot)
    fixedContent = markdownResult.content
    allFixes.push(...markdownResult.fixes)

    // Write file if not dry run and there are fixes
    if (!dryRun && allFixes.length > 0) {
      writeFileSync(filePath, fixedContent, 'utf-8')
    }

    return allFixes
  } catch (error) {
    console.error(chalk.red(`❌ Failed to fix links in ${filePath}:`), error)
    return []
  }
}

/**
 * Fix links in all documentation files
 */
const fixAllLinks = async (
  context: LinkFixerContext,
  directory?: string,
  dryRun = false
): Promise<LinkFix[]> => {
  const searchPattern = directory ? join(directory, '**/*.md') : '**/*.md'

  const files = await glob(searchPattern, {
    cwd: context.repoRoot,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
  })

  const fixes: LinkFix[] = []

  for (const file of files) {
    const filePath = join(context.repoRoot, file)
    const fileFixes = fixFileLinks(filePath, context.repoRoot, dryRun)
    fixes.push(...fileFixes)
  }

  return fixes
}

/**
 * Generate fix report
 */
const generateFixReport = (fixes: LinkFix[], repoRoot: string, dryRun = false): string => {
  const lines: string[] = []

  lines.push(chalk.bold(`\n🔧 Link Fix Report ${dryRun ? '(DRY RUN)' : ''}`))
  lines.push('═'.repeat(50))

  if (fixes.length === 0) {
    lines.push(chalk.green('✅ No links needed fixing!'))
    return lines.join('\n')
  }

  lines.push(`🔗 Total fixes: ${fixes.length}`)

  if (dryRun) {
    lines.push(chalk.yellow('⚠️  DRY RUN - No files were modified'))
  } else {
    lines.push(chalk.green('✅ Files have been updated'))
  }

  lines.push('\n📋 Fix Details')
  lines.push('─'.repeat(50))

  // Group by file
  const byFile = fixes.reduce(
    (acc, fix) => {
      if (!acc[fix.file]) acc[fix.file] = []
      acc[fix.file].push(fix)
      return acc
    },
    {} as Record<string, LinkFix[]>
  )

  Object.entries(byFile).forEach(([file, fileFixes]) => {
    const relativePath = file.replace(repoRoot, '').substring(1)
    lines.push(`\n📄 ${relativePath} (${fileFixes.length} fixes)`)

    fileFixes.forEach((fix) => {
      lines.push(`   Line ${fix.line}: ${fix.reason}`)
      lines.push(`     ${chalk.red('- ' + fix.originalLink)}`)
      lines.push(`     ${chalk.green('+ ' + fix.fixedLink)}`)
    })
  })

  lines.push('\n' + '═'.repeat(50))
  if (dryRun) {
    lines.push(chalk.yellow('⚠️  Run without --dry-run to apply fixes'))
  } else {
    lines.push(chalk.green('✅ Link fixes applied successfully!'))
  }

  return lines.join('\n')
}

/**
 * Create a link fixer instance
 */
const createLinkFixer = (options?: LinkFixerOptions): LinkFixerContext => {
  return {
    repoRoot: options?.repoRoot ?? resolve(process.cwd()),
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const directory = args.find((arg) => !arg.startsWith('--') && !arg.startsWith('-'))

  console.log(chalk.blue(`🔧 Starting link fixing${dryRun ? ' (dry run)' : ''}...`))

  if (dryRun) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE: No files will be modified'))
  }

  const context = createLinkFixer()
  const fixes = await fixAllLinks(context, directory, dryRun)

  const report = generateFixReport(fixes, context.repoRoot, dryRun)
  console.log(report)

  process.exit(0)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('❌ Link fixing failed:'), error)
    process.exit(1)
  })
}

export { createLinkFixer, fixAllLinks, generateFixReport, type LinkFix, type LinkFixerContext }
