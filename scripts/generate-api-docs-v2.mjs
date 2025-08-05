#!/usr/bin/env node

/**
 * API Documentation Generation Script V2
 * 
 * Generates TypeDoc documentation per package with proper output paths
 */

import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync, rmSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import chalk from 'chalk'

const ROOT_DIR = resolve(process.cwd())
const PACKAGES_DIR = join(ROOT_DIR, 'packages')
const DOCS_DIR = join(ROOT_DIR, 'docs')

// Available packages
const PACKAGES = [
  'core',
  'data', 
  'fs',
  'validation',
  'config',
  'cli',
  'create-cli'
]

function log(message, level = 'info') {
  const timestamp = new Date().toLocaleTimeString()
  const prefix = chalk.gray(`[${timestamp}]`)
  
  switch (level) {
    case 'success':
      console.log(`${prefix} ${chalk.green('✓')} ${message}`)
      break
    case 'error':
      console.log(`${prefix} ${chalk.red('✗')} ${message}`)
      break
    case 'warn':
      console.log(`${prefix} ${chalk.yellow('⚠')} ${message}`)
      break
    case 'info':
    default:
      console.log(`${prefix} ${chalk.blue('ℹ')} ${message}`)
      break
  }
}

function cleanOutput() {
  log('Cleaning API documentation output...')
  
  // Clean API docs from each package's docs folder
  for (const pkg of PACKAGES) {
    const apiDir = join(DOCS_DIR, pkg, 'api')
    if (existsSync(apiDir)) {
      rmSync(apiDir, { recursive: true, force: true })
      log(`Cleaned ${pkg}/api directory`, 'success')
    }
  }
  
  log('All API documentation cleaned', 'success')
}

function generateDocsForPackage(pkg, watch = false) {
  const packageDir = join(PACKAGES_DIR, pkg)
  const outputDir = join(DOCS_DIR, pkg, 'api')
  
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }
  
  log(`Generating docs for ${pkg}...`)
  
  try {
    const args = [
      'typedoc',
      '--options', 'typedoc.base.json',
      '--out', outputDir,
      '--name', `@esteban-url/${pkg}`,
      '--readme', join(packageDir, 'README.md'),
      '--tsconfig', join(packageDir, 'tsconfig.json'),
      join(packageDir, 'src/index.ts')
    ]
    
    if (watch) {
      args.push('--watch')
    }
    
    execSync(`npx ${args.join(' ')}`, {
      stdio: 'inherit',
      cwd: ROOT_DIR
    })
    
    log(`Generated docs for ${pkg}`, 'success')
    return true
  } catch (error) {
    log(`Failed to generate docs for ${pkg}: ${error.message}`, 'error')
    return false
  }
}

function generateDocs(options = {}) {
  const { packages = PACKAGES, watch = false, clean = false } = options
  
  log(`Starting API documentation generation...`)
  log(`Packages: ${packages.join(', ')}`)
  log(`Watch mode: ${watch ? 'enabled' : 'disabled'}`)
  
  if (clean) {
    cleanOutput()
  }
  
  let successCount = 0
  
  for (const pkg of packages) {
    if (generateDocsForPackage(pkg, watch)) {
      successCount++
    }
  }
  
  log(`API documentation generation complete!`, 'success')
  log(`Successfully generated docs for ${successCount}/${packages.length} packages`)
  
  if (successCount < packages.length) {
    process.exit(1)
  }
}

function validateDocs() {
  log('Validating generated documentation...')
  
  let totalFiles = 0
  let packagesDocumented = 0
  const missingPackages = []
  
  for (const pkg of PACKAGES) {
    const apiDir = join(DOCS_DIR, pkg, 'api')
    
    if (!existsSync(apiDir)) {
      missingPackages.push(pkg)
      continue
    }
    
    const files = readdirSync(apiDir)
    if (files.length === 0) {
      log(`${pkg}/api directory is empty`, 'warn')
      missingPackages.push(pkg)
      continue
    }
    
    // Check for expected files
    const hasIndex = files.includes('index.md') || files.includes('README.md')
    const hasModules = files.includes('modules.md')
    
    if (!hasIndex || !hasModules) {
      log(`${pkg}/api missing expected files`, 'warn')
    }
    
    totalFiles += files.length
    packagesDocumented++
    log(`${pkg}: ${files.length} files generated`, 'success')
  }
  
  log(`Documentation validated successfully!`, 'success')
  log(`Total files generated: ${totalFiles}`)
  log(`Packages documented: ${packagesDocumented}/${PACKAGES.length}`)
  
  if (missingPackages.length > 0) {
    log(`Missing package documentation: ${missingPackages.join(', ')}`, 'warn')
  }
}

function showHelp() {
  console.log(`
${chalk.bold('API Documentation Generator V2')}

${chalk.yellow('Usage:')}
  node scripts/generate-api-docs-v2.js [command] [options]

${chalk.yellow('Commands:')}
  generate     Generate API documentation (default)
  clean        Clean output directory
  validate     Validate generated documentation
  help         Show this help message

${chalk.yellow('Options:')}
  --packages   Comma-separated list of packages to document
  --clean      Clean output before generating
  --watch      Enable watch mode for development

${chalk.yellow('Examples:')}
  node scripts/generate-api-docs-v2.js
  node scripts/generate-api-docs-v2.js generate --clean
  node scripts/generate-api-docs-v2.js --packages core,data
  node scripts/generate-api-docs-v2.js validate

${chalk.yellow('Available packages:')}
  ${PACKAGES.join(', ')}
`)
}

function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'generate'
  
  // Parse options
  const options = {
    packages: PACKAGES,
    clean: args.includes('--clean'),
    watch: args.includes('--watch')
  }
  
  // Parse package list
  const packagesIndex = args.indexOf('--packages')
  if (packagesIndex !== -1 && args[packagesIndex + 1]) {
    options.packages = args[packagesIndex + 1].split(',').map(p => p.trim())
  }
  
  switch (command) {
    case 'generate':
      generateDocs(options)
      break
      
    case 'clean':
      cleanOutput()
      break
      
    case 'validate':
      validateDocs()
      break
      
    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break
      
    default:
      log(`Unknown command: ${command}`, 'error')
      showHelp()
      process.exit(1)
  }
}

// Run the script
main()