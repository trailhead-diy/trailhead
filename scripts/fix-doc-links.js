#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Link transformation rules based on Docusaurus structure
const linkTransformations = {
  // Main docs transformations
  '/docs/explanation/result-types-pattern.md': '/docs/explanation/result-types-pattern',
  '/docs/explanation/functional-architecture.md': '/docs/explanation/functional-architecture',
  '/docs/explanation/package-ecosystem.md': '/docs/explanation/package-ecosystem',
  '/docs/reference/core-api.md': '/docs/reference/core-api',
  '/docs/reference/cross-reference-style-guide.md': '/docs/reference/cross-reference-style-guide',
  '/docs/reference/documentation-standards.md': '/docs/reference/documentation-standards',
  '/docs/tutorials/config-getting-started.md': '/docs/tutorials/config-getting-started',
  '/docs/tutorials/data-pipeline-processing.md': '/docs/tutorials/data-pipeline-processing',
  '/docs/tutorials/file-operations-basics.md': '/docs/tutorials/file-operations-basics',
  '/docs/tutorials/form-validation-guide.md': '/docs/tutorials/form-validation-guide',
  '/docs/how-to/define-schemas.md': '/docs/how-to/define-schemas',
  '/docs/how-to/generate-config-docs.md': '/docs/how-to/generate-config-docs',
  '/docs/how-to/convert-data-formats.md': '/docs/how-to/convert-data-formats',
  '/docs/how-to/create-custom-validators.md': '/docs/how-to/create-custom-validators',
  '/docs/how-to/perform-atomic-file-operations.md': '/docs/how-to/perform-atomic-file-operations',
  '/docs/how-to/apply-functional-patterns.md': '/docs/how-to/apply-functional-patterns',
  '/docs/how-to/compose-result-operations.md': '/docs/how-to/compose-result-operations',

  // Package-specific transformations
  '/packages/config/docs/reference/api.md': '/packages/config/docs/reference/api',
  '/packages/data/docs/reference/api.md': '/packages/data/docs/reference/api',
  '/packages/fs/docs/reference/api.md': '/packages/fs/docs/reference/api',
  '/packages/validation/docs/reference/api.md': '/packages/validation/docs/reference/api',
  '/packages/fs/docs/how-to/file-operations.md': '/packages/fs/docs/how-to/file-operations',
  '/packages/data/docs/how-to/process-data-files.md':
    '/packages/data/docs/how-to/process-data-files',

  // Fix LICENSE and CONTRIBUTING paths
  '../../../LICENSE': 'https://github.com/esteban-url/trailhead/blob/main/LICENSE',
  '../../LICENSE': 'https://github.com/esteban-url/trailhead/blob/main/LICENSE',
  '../LICENSE': 'https://github.com/esteban-url/trailhead/blob/main/LICENSE',
  '../CONTRIBUTING.md': 'https://github.com/esteban-url/trailhead/blob/main/CONTRIBUTING.md',

  // Fix relative paths that don't exist
  './TESTING_GUIDELINES.md': '/docs/testing-guide',
  './DOCUMENTATION_STANDARDS.md': '/docs/reference/documentation-standards',
  './WRITING_DOCUMENTATION.md': '/docs/reference/writing-guide',
  './templates': '/docs/reference/templates/tutorial-template',
  '../tooling/docs-tooling':
    'https://github.com/esteban-url/trailhead/tree/main/tooling/docs-tooling',
  '../packages/cli/docs': '/packages/cli',
  '../packages/create-cli/docs': '/packages/create-cli',

  // Non-existent pages
  '/docs/how-to/handle-errors.md': '/docs/how-to/compose-result-operations',
  '/docs/how-to/write-tests.md': '/docs/testing-guide',
  '/docs/how-to/create-package.md': '/docs/how-to/contributing',
  '/docs/how-to/handle-large-files.md': '/docs/how-to/convert-data-formats',
  '/docs/how-to/test-file-operations.md': '/docs/how-to/perform-atomic-file-operations',
  '/docs/explanation/validation-patterns.md': '/docs/explanation/result-types-pattern',
  '/docs/explanation/error-handling.md': '/docs/explanation/result-types-pattern',
  '/docs/tutorials': '/docs/tutorials/config-getting-started',
  '/docs/how-to': '/docs/how-to/contributing',
  '/docs/explanation': '/docs/explanation/functional-architecture',

  // CLI package specific fixes
  '../getting-started.md': '/packages/cli/tutorials/getting-started',
  '../how-to/testing-guide.md': '/packages/cli/how-to/test-cli-applications',
  '../how-to/common-patterns.md': '/packages/cli/how-to/use-result-pipelines',
  '../guides/error-handling.md': '/packages/cli/how-to/handle-errors-in-cli',
  '../guides/functional-patterns.md': '/docs/how-to/apply-functional-patterns',
  '../reference': '/packages/cli/reference/command',
  './reference/config.md': '/packages/cli/reference/config',
  '../../cli/docs': '/packages/cli',
  '../reference/api/core.md': '/packages/cli/reference/core',
  '../reference/api/index.md': '/packages/cli/reference/command',
  '../reference/api/utils.md': '/packages/cli/reference/utils',
  '../reference/api/filesystem.md': '/packages/cli/reference/filesystem',
  '../reference/architecture.md': '/packages/cli/explanation/architecture',
  '../how-to/error-handling.md': '/packages/cli/how-to/handle-errors-in-cli',
  './bundle-analysis.md': '/packages/cli/how-to/optimization-guide',
  './module-loading.md': '/packages/cli/how-to/import-patterns',
  './error-handling.md': '/packages/cli/how-to/handle-errors-in-cli',
  './testing-cli-apps.md': '/packages/cli/how-to/test-cli-applications',
  './workflows.md': '/packages/cli/reference/flow-control',
  './how-to/import-patterns.md': '/packages/cli/how-to/import-patterns',
  './reference/command.md': '/packages/cli/reference/command',
  './how-to/testing-guide.md': '/packages/cli/how-to/test-cli-applications',

  // Fix contributing links
  '../../../docs/how-to/contributing.md': '/docs/how-to/contributing',
}

function* walkDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true })
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkDir(path.join(dir, file.name))
    } else if (file.name.endsWith('.md')) {
      yield path.join(dir, file.name)
    }
  }
}

function fixLinksInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  // Apply transformations
  for (const [search, replace] of Object.entries(linkTransformations)) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    const newContent = content.replace(regex, replace)
    if (newContent !== content) {
      content = newContent
      modified = true
    }
  }

  // Fix markdown links that end with .md
  const mdLinkRegex = /(\[.*?\]\()([^)]+\.md)(#[^)]+)?(\))/g
  content = content.replace(mdLinkRegex, (match, prefix, link, anchor, suffix) => {
    // Don't modify external links
    if (link.startsWith('http')) {
      return match
    }
    modified = true
    return prefix + link.replace('.md', '') + (anchor || '') + suffix
  })

  if (modified) {
    fs.writeFileSync(filePath, content)
    console.log(`Fixed links in: ${filePath}`)
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
    if (fixLinksInFile(file)) {
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
        if (fixLinksInFile(file)) {
          totalFixed++
        }
      }
    }
    // Check for README.md in package root
    const readmePath = path.join(pkgPath, 'README.md')
    if (fs.existsSync(readmePath)) {
      if (fixLinksInFile(readmePath)) {
        totalFixed++
      }
    }
  }
}

console.log(`\nFixed links in ${totalFixed} files.`)
