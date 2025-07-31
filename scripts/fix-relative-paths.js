#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Map of relative paths to absolute paths
const pathMappings = {
  // Cross-package references from main docs
  '../explanation/result-types-pattern': '/docs/explanation/result-types-pattern',
  '../explanation/functional-architecture': '/docs/explanation/functional-architecture',
  '../explanation/package-ecosystem': '/docs/explanation/package-ecosystem',
  '../how-to/example': '/docs/how-to/contributing',
  '../how-to/': '/docs/how-to/',
  '../../tutorials/data-pipeline-processing': '/docs/tutorials/data-pipeline-processing',

  // References within main docs
  './RELEASE_PROCESS': '/docs/RELEASE_PROCESS',
  './apply-functional-patterns': '/docs/how-to/apply-functional-patterns',
  './documentation-standards': '/docs/reference/documentation-standards',
  './writing-guide': '/docs/reference/writing-guide',
  './review-checklist': '/docs/reference/review-checklist',

  // CLI package internal references
  '../tutorials/getting-started': '/packages/cli/tutorials/getting-started',
  '../explanation/architecture': '/packages/cli/explanation/architecture',
  '../explanation/design-decisions': '/packages/cli/explanation/design-decisions',
  './design-decisions': '/packages/cli/explanation/design-decisions',
  './architecture': '/packages/cli/explanation/architecture',
  '../how-to/migrate-to-command-enhancements':
    '/packages/cli/how-to/migrate-to-command-enhancements',
  '../how-to/use-result-pipelines': '/packages/cli/how-to/use-result-pipelines',
  '../how-to/migrate-to-pipelines': '/packages/cli/how-to/migrate-to-pipelines',
  './use-result-pipelines': '/packages/cli/how-to/use-result-pipelines',
  './test-cli-applications': '/packages/cli/how-to/test-cli-applications',
  './optimization-guide': '/packages/cli/how-to/optimization-guide',
  './import-patterns': '/packages/cli/how-to/import-patterns',
  './handle-errors-in-cli': '/packages/cli/how-to/handle-errors-in-cli',

  // Cross-package references from CLI to main docs
  '../../../docs/how-to/compose-result-operations': '/docs/how-to/compose-result-operations',

  // Generic patterns
  './docs/README': '/packages/cli',
  './docs/reference/command': '/packages/cli/reference/command',
  './reference/api': '/packages/cli/reference/core',
  '../docs/': '/packages/cli/',
}

function* walkDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true })
  for (const file of files) {
    if (file.isDirectory() && !file.name.includes('node_modules')) {
      yield* walkDir(path.join(dir, file.name))
    } else if (file.name.endsWith('.md')) {
      yield path.join(dir, file.name)
    }
  }
}

function fixRelativePathsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  // Fix markdown links with relative paths
  const linkRegex = /\[([^\]]+)\]\((\.\.[^)]+|\.\/[^)]+)\)/g
  content = content.replace(linkRegex, (match, text, link) => {
    // Skip if it's a code example or URL
    if (link.includes('http') || link.includes('src/') || link.includes('__dirname')) {
      return match
    }

    // Remove .md extension if present
    const cleanLink = link.replace(/\.md$/, '')

    // Check if we have a mapping for this path
    for (const [from, to] of Object.entries(pathMappings)) {
      if (cleanLink === from || cleanLink.startsWith(from + '/')) {
        modified = true
        const newLink = cleanLink.replace(from, to)
        return `[${text}](${newLink})`
      }
    }

    // If no specific mapping, try to convert to absolute path based on file location
    if (cleanLink.startsWith('../') || cleanLink.startsWith('./')) {
      const fileDir = path.dirname(filePath)
      const resolvedPath = path.resolve(fileDir, cleanLink)
      const rootPath = path.resolve(process.cwd())

      if (resolvedPath.startsWith(rootPath)) {
        let absolutePath = resolvedPath.substring(rootPath.length)

        // Convert file system path to URL path
        if (absolutePath.includes('/docs/')) {
          if (absolutePath.includes('/packages/')) {
            // Package docs
            const match = absolutePath.match(/\/packages\/([^/]+)\/docs\/(.*)/)
            if (match) {
              modified = true
              return `[${text}](/packages/${match[1]}/${match[2]})`
            }
          } else {
            // Main docs
            const match = absolutePath.match(/\/docs\/(.*)/)
            if (match) {
              modified = true
              return `[${text}](/docs/${match[1]})`
            }
          }
        }
      }
    }

    return match
  })

  // Fix YAML frontmatter related paths
  const yamlRegex = /^(related:\s*\n(?: {2}- .*\n)*)/m
  content = content.replace(yamlRegex, (match) => {
    const lines = match.split('\n')
    let yamlModified = false
    const newLines = lines.map((line) => {
      if (line.match(/^ {2}- (\.\.|\.\/)/)) {
        const pathMatch = line.match(/^ {2}- (.+)$/)
        if (pathMatch) {
          const relativePath = pathMatch[1].replace(/\.md$/, '')
          for (const [from, to] of Object.entries(pathMappings)) {
            if (relativePath === from || relativePath.startsWith(from + '/')) {
              yamlModified = true
              return `  - ${relativePath.replace(from, to)}`
            }
          }
        }
      }
      return line
    })

    if (yamlModified) {
      modified = true
      return newLines.join('\n')
    }
    return match
  })

  if (modified) {
    fs.writeFileSync(filePath, content)
    console.log(`Fixed relative paths in: ${filePath}`)
    return true
  }

  return false
}

// Process all markdown files
const docsDir = path.join(process.cwd(), 'docs')
const packagesDir = path.join(process.cwd(), 'packages')
let totalFixed = 0

// Process main docs
if (fs.existsSync(docsDir)) {
  for (const file of walkDir(docsDir)) {
    if (fixRelativePathsInFile(file)) {
      totalFixed++
    }
  }
}

// Process package docs
if (fs.existsSync(packagesDir)) {
  const packages = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  for (const pkg of packages) {
    const pkgPath = path.join(packagesDir, pkg)
    // Check for docs folder
    const docsPath = path.join(pkgPath, 'docs')
    if (fs.existsSync(docsPath)) {
      for (const file of walkDir(docsPath)) {
        if (fixRelativePathsInFile(file)) {
          totalFixed++
        }
      }
    }
  }
}

console.log(`\nFixed relative paths in ${totalFixed} files.`)
