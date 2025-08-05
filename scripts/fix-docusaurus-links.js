#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function findMarkdownFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (!entry.name.includes('node_modules') && !entry.name.includes('dist')) {
        findMarkdownFiles(fullPath, files)
      }
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

async function fixDocusaurusLinks() {
  console.log('🔍 Scanning for markdown files with broken links...')

  // Find all markdown files in docs and packages
  const files = [...findMarkdownFiles('docs'), ...findMarkdownFiles('packages')]

  let totalFixed = 0
  const fixes = []

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    let newContent = content
    let fileFixed = 0

    // Fix /docs/ prefix links - convert to relative
    newContent = newContent.replace(/\[([^\]]+)\]\(\/docs\/([^)]+)\)/g, (match, text, path) => {
      const fromDir = file.split('/').slice(0, -1).join('/')
      const targetPath = `docs/${path}`
      const relativePath = getRelativePath(fromDir, targetPath)
      fileFixed++
      return `[${text}](${relativePath})`
    })

    // Fix /packages/ links - convert to relative
    newContent = newContent.replace(/\[([^\]]+)\]\(\/packages\/([^)]+)\)/g, (match, text, path) => {
      const fromDir = file.split('/').slice(0, -1).join('/')
      const targetPath = `packages/${path}`
      const relativePath = getRelativePath(fromDir, targetPath)
      fileFixed++
      return `[${text}](${relativePath})`
    })

    if (fileFixed > 0) {
      fs.writeFileSync(file, newContent)
      fixes.push({ file, count: fileFixed })
      totalFixed += fileFixed
    }
  }

  console.log(`\n✅ Fixed ${totalFixed} links across ${fixes.length} files`)
  fixes.forEach(({ file, count }) => {
    console.log(`   - ${file}: ${count} links`)
  })
}

function getRelativePath(from, to) {
  // Calculate relative path
  const fromParts = from.split('/')
  const toParts = to.split('/')

  // Find common prefix
  let common = 0
  while (
    common < fromParts.length &&
    common < toParts.length &&
    fromParts[common] === toParts[common]
  ) {
    common++
  }

  // Build relative path
  const upCount = fromParts.length - common
  const up = upCount > 0 ? '../'.repeat(upCount) : './'
  const down = toParts.slice(common).join('/')

  return up + down
}

fixDocusaurusLinks().catch(console.error)
