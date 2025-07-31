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

class LinkFixer {
  private repoRoot: string
  private fixes: LinkFix[] = []
  
  constructor() {
    this.repoRoot = resolve(process.cwd())
  }

  /**
   * Convert relative path to absolute path based on file location
   */
  private convertRelativeToAbsolute(relativePath: string, currentFilePath: string): string {
    const currentDir = dirname(currentFilePath)
    const absoluteFilePath = resolve(currentDir, relativePath)
    const relativeFromRoot = relative(this.repoRoot, absoluteFilePath)
    
    // Convert to forward slashes and add leading slash
    return '/' + relativeFromRoot.replace(/\\/g, '/')
  }

  /**
   * Fix links in frontmatter related section
   */
  private fixFrontmatterLinks(content: string, filePath: string): { content: string; fixes: LinkFix[] } {
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
            const absoluteLink = this.convertRelativeToAbsolute(link, filePath)
            
            fixes.push({
              file: filePath,
              line: lineNumber,
              originalLink: link,
              fixedLink: absoluteLink,
              reason: 'Convert frontmatter relative link to absolute'
            })
            
            return prefix + absoluteLink
          }
        }
      }
      
      return line
    })
    
    return {
      content: fixedLines.join('\n'),
      fixes
    }
  }

  /**
   * Fix markdown links in content
   */
  private fixMarkdownLinks(content: string, filePath: string): { content: string; fixes: LinkFix[] } {
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
        if (url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('#') || url.startsWith('/')) {
          return match
        }
        
        // Skip non-markdown links
        if (!url.includes('.md')) {
          return match
        }
        
        const absoluteUrl = this.convertRelativeToAbsolute(url, filePath)
        
        fixes.push({
          file: filePath,
          line: lineNumber,
          originalLink: `[${text}](${url})`,
          fixedLink: `[${text}](${absoluteUrl})`,
          reason: 'Convert relative markdown link to absolute'
        })
        
        return `[${text}](${absoluteUrl})`
      })
    })
    
    return {
      content: fixedLines.join('\n'),
      fixes
    }
  }

  /**
   * Fix links in a single file
   */
  private fixFileLinks(filePath: string, dryRun = false): LinkFix[] {
    try {
      const content = readFileSync(filePath, 'utf-8')
      let fixedContent = content
      const allFixes: LinkFix[] = []
      
      // Fix frontmatter links
      const frontmatterResult = this.fixFrontmatterLinks(fixedContent, filePath)
      fixedContent = frontmatterResult.content
      allFixes.push(...frontmatterResult.fixes)
      
      // Fix markdown links
      const markdownResult = this.fixMarkdownLinks(fixedContent, filePath)
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
  async fixAll(directory?: string, dryRun = false): Promise<LinkFix[]> {
    const searchPattern = directory 
      ? join(directory, '**/*.md')
      : '**/*.md'
      
    const files = await glob(searchPattern, {
      cwd: this.repoRoot,
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**'
      ]
    })
    
    this.fixes = []
    
    for (const file of files) {
      const filePath = join(this.repoRoot, file)
      const fileFixes = this.fixFileLinks(filePath, dryRun)
      this.fixes.push(...fileFixes)
    }
    
    return this.fixes
  }

  /**
   * Generate fix report
   */
  generateReport(fixes: LinkFix[], dryRun = false): string {
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
    const byFile = fixes.reduce((acc, fix) => {
      if (!acc[fix.file]) acc[fix.file] = []
      acc[fix.file].push(fix)
      return acc
    }, {} as Record<string, LinkFix[]>)
    
    Object.entries(byFile).forEach(([file, fileFixes]) => {
      const relativePath = file.replace(this.repoRoot, '').substring(1)
      lines.push(`\n📄 ${relativePath} (${fileFixes.length} fixes)`)
      
      fileFixes.forEach(fix => {
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
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const directory = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-'))
  
  console.log(chalk.blue(`🔧 Starting link fixing${dryRun ? ' (dry run)' : ''}...`))
  
  if (dryRun) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE: No files will be modified'))
  }
  
  const fixer = new LinkFixer()
  const fixes = await fixer.fixAll(directory, dryRun)
  
  const report = fixer.generateReport(fixes, dryRun)
  console.log(report)
  
  process.exit(0)
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('❌ Link fixing failed:'), error)
    process.exit(1)
  })
}

export { LinkFixer, type LinkFix }