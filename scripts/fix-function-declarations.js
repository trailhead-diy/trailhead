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
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }

  return files
}

function fixFunctionDeclarations(content) {
  let inCodeBlock = false
  let codeBlockLang = ''
  const lines = content.split('\n')
  const result = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for code block markers
    if (line.match(/^```(\w*)/)) {
      const match = line.match(/^```(\w*)/)
      if (inCodeBlock) {
        inCodeBlock = false
        codeBlockLang = ''
      } else {
        inCodeBlock = true
        codeBlockLang = match[1] || ''
      }
      result.push(line)
      continue
    }

    // Only fix function declarations inside TypeScript/JavaScript code blocks
    if (
      inCodeBlock &&
      (codeBlockLang === 'typescript' ||
        codeBlockLang === 'ts' ||
        codeBlockLang === 'javascript' ||
        codeBlockLang === 'js' ||
        codeBlockLang === 'jsx' ||
        codeBlockLang === 'tsx')
    ) {
      // Fix function declarations
      const functionMatch = line.match(
        /^(\s*)(async\s+)?function\s+(\w+)\s*(\([^)]*\).*?)\s*{?\s*$/
      )
      if (functionMatch) {
        const [, indent, asyncKeyword, functionName, params] = functionMatch
        const newLine = `${indent}${asyncKeyword || ''}const ${functionName} = ${asyncKeyword ? 'async ' : ''}${params} => {`
        result.push(newLine)
        continue
      }
    }

    result.push(line)
  }

  return result.join('\n')
}

async function main() {
  console.log('🔍 Scanning for function declarations in markdown files...')

  const files = [...findMarkdownFiles('docs'), ...findMarkdownFiles('packages')]

  let totalFixed = 0
  const fixedFiles = []

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    const newContent = fixFunctionDeclarations(content)

    if (content !== newContent) {
      fs.writeFileSync(file, newContent)
      const fixes = (content.match(/^(\s*)(async\s+)?function\s+/gm) || []).length
      fixedFiles.push({ file, count: fixes })
      totalFixed += fixes
    }
  }

  console.log(`\n✅ Fixed ${totalFixed} function declarations across ${fixedFiles.length} files`)
  fixedFiles.forEach(({ file, count }) => {
    console.log(`   - ${file}: ${count} functions`)
  })
}

main().catch(console.error)
