#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Final fixes for package READMEs
const packageReadmeFixes = [
  // CLI package
  {
    file: '/packages/cli/README.md',
    old: './explanation/architecture',
    new: '/packages/cli/explanation/architecture',
  },
  {
    file: '/packages/cli/README.md',
    old: './reference/core',
    new: '/packages/cli/reference/core',
  },
  {
    file: '/packages/cli/README.md',
    old: './reference/filesystem',
    new: '/packages/cli/reference/filesystem',
  },
  {
    file: '/packages/cli/README.md',
    old: './reference/prompts',
    new: '/packages/cli/reference/prompts',
  },
  {
    file: '/packages/cli/README.md',
    old: './reference/testing',
    new: '/packages/cli/reference/testing',
  },
  {
    file: '/packages/cli/README.md',
    old: './reference/utils',
    new: '/packages/cli/reference/utils',
  },
  {
    file: '/packages/cli/README.md',
    old: './reference/types',
    new: '/packages/cli/reference/types',
  },
  {
    file: '/packages/cli/README.md',
    old: './how-to/optimization-guide',
    new: '/packages/cli/how-to/optimization-guide',
  },
  // Create CLI package
  {
    file: '/packages/create-cli/README.md',
    old: './tutorials/getting-started',
    new: '/packages/create-cli/tutorials/getting-started',
  },
  {
    file: '/packages/create-cli/README.md',
    old: './explanation/templates',
    new: '/packages/create-cli/explanation/templates',
  },
  {
    file: '/packages/create-cli/README.md',
    old: './reference/api',
    new: '/packages/create-cli/reference/api',
  },
  {
    file: '/packages/create-cli/README.md',
    old: './reference/schema',
    new: '/packages/create-cli/reference/schema',
  },
  {
    file: '/packages/create-cli/README.md',
    old: './reference/templates',
    new: '/packages/create-cli/reference/templates',
  },
  {
    file: '/packages/create-cli/README.md',
    old: './how-to/customize-templates',
    new: '/packages/create-cli/how-to/customize-templates',
  },
  {
    file: '/packages/create-cli/README.md',
    old: './how-to/custom-prompts',
    new: '/packages/create-cli/how-to/custom-prompts',
  },
  {
    file: '/packages/create-cli/README.md',
    old: './how-to/configure-defaults',
    new: '/packages/create-cli/how-to/configure-defaults',
  },
]

// Apply fixes
packageReadmeFixes.forEach((fix) => {
  const filePath = path.join(process.cwd(), fix.file)
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8')
    if (content.includes(fix.old)) {
      content = content.replace(
        new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        fix.new
      )
      fs.writeFileSync(filePath, content)
      console.log(`Fixed: ${fix.file} - "${fix.old}" -> "${fix.new}"`)
    }
  }
})

// Fix the /handle-errors reference
const handleErrorFix = {
  file: '/docs/how-to/compose-result-operations.md',
  old: './handle-errors',
  new: '/docs/how-to/compose-result-operations#error-handling',
}

const filePath = path.join(process.cwd(), handleErrorFix.file)
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8')
  if (content.includes(handleErrorFix.old)) {
    content = content.replace(
      new RegExp(handleErrorFix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      handleErrorFix.new
    )
    fs.writeFileSync(filePath, content)
    console.log(
      `Fixed: ${handleErrorFix.file} - "${handleErrorFix.old}" -> "${handleErrorFix.new}"`
    )
  }
}

// Fix remaining CLI reference/api links
const cliApiFixes = [
  {
    pattern: /\/packages\/cli\/reference\/api\/core/g,
    replacement: '/packages/cli/reference/core',
  },
  {
    pattern: /\/packages\/cli\/reference\/api\/index/g,
    replacement: '/packages/cli/reference/command',
  },
  {
    pattern: /\/packages\/cli\/reference\/api\/utils/g,
    replacement: '/packages/cli/reference/utils',
  },
  {
    pattern: /\/packages\/cli\/reference\/api\/filesystem/g,
    replacement: '/packages/cli/reference/filesystem',
  },
  {
    pattern: /\/packages\/cli\/reference\/api(?!\/)/g,
    replacement: '/packages/cli/reference/core',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/templates/g,
    replacement: '/packages/cli/reference/templates',
  },
  {
    pattern: /\/packages\/cli\/reference\/schema/g,
    replacement: '/packages/cli/reference/config',
  },
]

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

// Apply CLI API fixes to all markdown files
const packagesDir = path.join(process.cwd(), 'packages')
let totalFixed = 0

function fixCliApiInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  cliApiFixes.forEach((fix) => {
    const newContent = content.replace(fix.pattern, fix.replacement)
    if (newContent !== content) {
      content = newContent
      modified = true
    }
  })

  if (modified) {
    fs.writeFileSync(filePath, content)
    console.log(`Fixed CLI API references in: ${filePath}`)
    return true
  }

  return false
}

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
        if (fixCliApiInFile(file)) {
          totalFixed++
        }
      }
    }
    // Check for README.md in package root
    const readmePath = path.join(pkgPath, 'README.md')
    if (fs.existsSync(readmePath)) {
      if (fixCliApiInFile(readmePath)) {
        totalFixed++
      }
    }
  }
}

console.log(`\nFixed CLI API references in ${totalFixed} files.`)
