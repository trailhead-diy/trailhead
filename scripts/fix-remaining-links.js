#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Specific fixes for remaining broken links
const fixes = [
  // Fix package README documentation links
  {
    file: '/packages/cli/README.md',
    old: '[documentation](./docs/)',
    new: '[documentation](/packages/cli)',
  },
  {
    file: '/packages/cli/README.md',
    old: './tutorials/getting-started',
    new: '/packages/cli/tutorials/getting-started',
  },
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
  {
    file: '/packages/config/README.md',
    old: './docs/reference/api',
    new: '/packages/config/docs/reference/api',
  },
  {
    file: '/packages/data/README.md',
    old: './docs/reference/api',
    new: '/packages/data/docs/reference/api',
  },
  {
    file: '/packages/fs/README.md',
    old: './docs/reference/api',
    new: '/packages/fs/docs/reference/api',
  },
  {
    file: '/packages/validation/README.md',
    old: './docs/reference/api',
    new: '/packages/validation/docs/reference/api',
  },
  // Fix doc README links
  {
    file: '/packages/cli/docs/README.md',
    old: './tutorials/getting-started',
    new: '/packages/cli/tutorials/getting-started',
  },
  {
    file: '/packages/cli/docs/README.md',
    old: './how-to/testing-guide',
    new: '/packages/cli/how-to/test-cli-applications',
  },
  {
    file: '/packages/cli/docs/README.md',
    old: './reference/core',
    new: '/packages/cli/reference/core',
  },
  {
    file: '/packages/data/docs/README.md',
    old: './how-to/process-data-files',
    new: '/packages/data/docs/how-to/process-data-files',
  },
  {
    file: '/packages/data/docs/README.md',
    old: './reference/api',
    new: '/packages/data/docs/reference/api',
  },
  {
    file: '/packages/data/docs/README.md',
    old: './explanation/format-detection',
    new: '/packages/data/docs/explanation/format-detection',
  },
  {
    file: '/packages/fs/docs/README.md',
    old: './how-to/file-operations',
    new: '/packages/fs/docs/how-to/file-operations',
  },
  {
    file: '/packages/fs/docs/README.md',
    old: './reference/api',
    new: '/packages/fs/docs/reference/api',
  },
  {
    file: '/packages/fs/docs/README.md',
    old: './explanation/result-patterns',
    new: '/packages/fs/docs/explanation/result-patterns',
  },
  {
    file: '/packages/validation/docs/README.md',
    old: './how-to/validate-data',
    new: '/packages/validation/docs/how-to/validate-data',
  },
  {
    file: '/packages/validation/docs/README.md',
    old: './reference/api',
    new: '/packages/validation/docs/reference/api',
  },
  {
    file: '/packages/validation/docs/README.md',
    old: './explanation/composition-patterns',
    new: '/packages/validation/docs/explanation/composition-patterns',
  },
  // Fix incorrect transformations
  {
    file: '/docs/explanation/config-sources.md',
    old: '/docs/tutorials/config-getting-started/config-getting-started',
    new: '/docs/tutorials/config-getting-started',
  },
  {
    file: '/docs/explanation/config-sources.md',
    old: '/docs/how-to/contributing/define-schemas',
    new: '/docs/how-to/define-schemas',
  },
  {
    file: '/docs/how-to/generate-config-docs.md',
    old: '/docs/how-to/contributing/define-schemas',
    new: '/docs/how-to/define-schemas',
  },
  {
    file: '/docs/how-to/generate-config-docs.md',
    old: '/docs/explanation/functional-architecture/config-sources',
    new: '/docs/explanation/config-sources',
  },
]

// Apply fixes
fixes.forEach((fix) => {
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

// Fix all incorrect double-path transformations
const doublePathFixes = [
  {
    pattern: /\/docs\/explanation\/functional-architecture\/result-types-pattern/g,
    replacement: '/docs/explanation/result-types-pattern',
  },
  {
    pattern: /\/docs\/explanation\/functional-architecture\/functional-architecture/g,
    replacement: '/docs/explanation/functional-architecture',
  },
  {
    pattern: /\/docs\/explanation\/functional-architecture\/package-ecosystem/g,
    replacement: '/docs/explanation/package-ecosystem',
  },
  {
    pattern: /\/docs\/explanation\/functional-architecture\/config-sources/g,
    replacement: '/docs/explanation/config-sources',
  },
  {
    pattern: /\/docs\/how-to\/contributing\/contributing/g,
    replacement: '/docs/how-to/contributing',
  },
  {
    pattern: /\/docs\/how-to\/contributing\/compose-result-operations/g,
    replacement: '/docs/how-to/compose-result-operations',
  },
  {
    pattern: /\/docs\/how-to\/contributing\/define-schemas/g,
    replacement: '/docs/how-to/define-schemas',
  },
  {
    pattern: /\/docs\/how-to\/contributing\/generate-config-docs/g,
    replacement: '/docs/how-to/generate-config-docs',
  },
  {
    pattern: /\/docs\/how-to\/contributing\/convert-data-formats/g,
    replacement: '/docs/how-to/convert-data-formats',
  },
  {
    pattern: /\/docs\/how-to\/contributing\/create-custom-validators/g,
    replacement: '/docs/how-to/create-custom-validators',
  },
  {
    pattern: /\/docs\/how-to\/contributing\/perform-atomic-file-operations/g,
    replacement: '/docs/how-to/perform-atomic-file-operations',
  },
  {
    pattern: /\/docs\/how-to\/contributing\/apply-functional-patterns/g,
    replacement: '/docs/how-to/apply-functional-patterns',
  },
  {
    pattern: /\/docs\/tutorials\/config-getting-started\/data-pipeline-processing/g,
    replacement: '/docs/tutorials/data-pipeline-processing',
  },
  {
    pattern: /\/docs\/tutorials\/config-getting-started\/form-validation-guide/g,
    replacement: '/docs/tutorials/form-validation-guide',
  },
  {
    pattern: /\/docs\/tutorials\/config-getting-started\/file-operations-basics/g,
    replacement: '/docs/tutorials/file-operations-basics',
  },
  {
    pattern: /\/docs\/tutorials\/config-getting-started\/config-getting-started/g,
    replacement: '/docs/tutorials/config-getting-started',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/api/g,
    replacement: '/packages/cli/reference/api',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/core/g,
    replacement: '/packages/cli/reference/core',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/types/g,
    replacement: '/packages/cli/reference/types',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/testing/g,
    replacement: '/packages/cli/reference/testing',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/command/g,
    replacement: '/packages/cli/reference/command',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/schema/g,
    replacement: '/packages/cli/reference/schema',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/flow-control/g,
    replacement: '/packages/cli/reference/flow-control',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/build-config/g,
    replacement: '/packages/cli/reference/build-config',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/command-enhancements/g,
    replacement: '/packages/cli/reference/command-enhancements',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/api\/core/g,
    replacement: '/packages/cli/reference/core',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/api\/utils/g,
    replacement: '/packages/cli/reference/utils',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/api\/filesystem/g,
    replacement: '/packages/cli/reference/filesystem',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/api\/index/g,
    replacement: '/packages/cli/reference/command',
  },
  {
    pattern: /\/packages\/cli\/reference\/command\/architecture/g,
    replacement: '/packages/cli/explanation/architecture',
  },
  {
    pattern: /\/packages\/fs\/docs\/how-to\/contributing\/file-operations/g,
    replacement: '/packages/fs/docs/how-to/file-operations',
  },
  {
    pattern: /\/packages\/data\/docs\/how-to\/contributing\/process-data-files/g,
    replacement: '/packages/data/docs/how-to/process-data-files',
  },
  {
    pattern: /\.\/packages\/cli\/how-to\/import-patterns/g,
    replacement: '/packages/cli/how-to/import-patterns',
  },
  {
    pattern: /\/packages\/cli\/tutorials\/packages\/cli\/how-to\/import-patterns/g,
    replacement: '/packages/cli/how-to/import-patterns',
  },
  {
    pattern: /\/packages\/cli\/reference\/packages\/cli\/how-to\/import-patterns/g,
    replacement: '/packages/cli/how-to/import-patterns',
  },
  {
    pattern: /\/packages\/cli\/explanation\/packages\/cli\/how-to\/import-patterns/g,
    replacement: '/packages/cli/how-to/import-patterns',
  },
  {
    pattern: /\/docs\/reference\/templates\/tutorial-template\/tutorial-template/g,
    replacement: '/docs/reference/templates/tutorial-template',
  },
  {
    pattern: /\/docs\/reference\/templates\/tutorial-template\/howto-template/g,
    replacement: '/docs/reference/templates/howto-template',
  },
  {
    pattern: /\/docs\/reference\/templates\/tutorial-template\/reference-template/g,
    replacement: '/docs/reference/templates/reference-template',
  },
  {
    pattern: /\/docs\/reference\/templates\/tutorial-template\/explanation-template/g,
    replacement: '/docs/reference/templates/explanation-template',
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

// Apply double-path fixes to all markdown files
const docsDir = path.join(process.cwd(), 'docs')
const packagesDir = path.join(process.cwd(), 'packages')
let totalFixed = 0

function fixDoublePathsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  doublePathFixes.forEach((fix) => {
    const newContent = content.replace(fix.pattern, fix.replacement)
    if (newContent !== content) {
      content = newContent
      modified = true
    }
  })

  if (modified) {
    fs.writeFileSync(filePath, content)
    console.log(`Fixed double paths in: ${filePath}`)
    return true
  }

  return false
}

// Process all markdown files
if (fs.existsSync(docsDir)) {
  for (const file of walkDir(docsDir)) {
    if (fixDoublePathsInFile(file)) {
      totalFixed++
    }
  }
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
        if (fixDoublePathsInFile(file)) {
          totalFixed++
        }
      }
    }
    // Check for README.md in package root
    const readmePath = path.join(pkgPath, 'README.md')
    if (fs.existsSync(readmePath)) {
      if (fixDoublePathsInFile(readmePath)) {
        totalFixed++
      }
    }
  }
}

console.log(`\nFixed double paths in ${totalFixed} files.`)
