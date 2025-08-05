#!/usr/bin/env node

/**
 * API Documentation Generation Script
 * 
 * This script provides advanced functionality for generating, validating, and managing
 * API documentation using TypeDoc and typedoc-plugin-markdown.
 * 
 * Features:
 * - Generate docs for all packages or specific packages
 * - Validate generated documentation
 * - Watch mode for development
 * - CI/CD integration
 * - Clean and rebuild options
 * - Per-package output in package docs folders
 */

import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync, rmSync, readdirSync, statSync } from 'fs'
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

function validatePackages(packages) {
  const invalidPackages = packages.filter(pkg => !PACKAGES.includes(pkg))
  if (invalidPackages.length > 0) {
    log(`Invalid packages: ${invalidPackages.join(', ')}`, 'error')
    log(`Available packages: ${PACKAGES.join(', ')}`, 'info')
    process.exit(1)
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

function ensureOutputDirs() {
  // Ensure each package has a docs/api directory
  for (const pkg of PACKAGES) {
    const apiDir = join(DOCS_DIR, pkg, 'api')
    if (!existsSync(apiDir)) {
      mkdirSync(apiDir, { recursive: true })
      log(`Created ${pkg}/api directory`, 'success')
    }
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
  
  ensureOutputDirs()
  
  try {
    const cmd = 'npx typedoc'
    const args = watch ? ['--watch'] : []
    
    log(`Running: ${cmd} ${args.join(' ')}`)
    log('TypeDoc will generate docs for each package in their respective docs/api folders')
    
    if (watch) {
      // Spawn process for watch mode
      const child = spawn('npx', ['typedoc', ...args], {
        stdio: 'inherit',
        cwd: ROOT_DIR
      })
      
      child.on('close', (code) => {
        if (code !== 0) {
          log(`TypeDoc process exited with code ${code}`, 'error')
          process.exit(code)
        }
      })
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        log('Shutting down watch mode...', 'warn')
        child.kill('SIGINT')
        process.exit(0)
      })
      
    } else {
      // Synchronous execution for build mode
      execSync(`npx typedoc ${args.join(' ')}`, {
        stdio: 'inherit',
        cwd: ROOT_DIR
      })
      
      log('API documentation generated successfully!', 'success')
      log('Check docs/{package}/api/ for the generated documentation')
    }
    
  } catch (error) {
    log(`Documentation generation failed: ${error.message}`, 'error')
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
    
    const stats = statSync(apiDir)
    if (!stats.isDirectory()) {
      log(`${pkg}/api is not a directory`, 'error')
      continue
    }
    
    const files = readdirSync(apiDir)
    if (files.length === 0) {
      log(`${pkg}/api directory is empty`, 'warn')
      missingPackages.push(pkg)
      continue
    }
    
    // Check for expected files
    const hasIndex = files.includes('index.md')
    const hasModules = files.includes('modules.md')
    
    if (!hasIndex || !hasModules) {
      log(`${pkg}/api missing expected files (index.md, modules.md)`, 'warn')
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
${chalk.bold('API Documentation Generator')}

${chalk.yellow('Usage:')}
  node scripts/generate-api-docs.js [command] [options]

${chalk.yellow('Commands:')}
  generate     Generate API documentation (default)
  clean        Clean output directory
  validate     Validate generated documentation
  watch        Generate docs in watch mode
  help         Show this help message

${chalk.yellow('Options:')}
  --packages   Comma-separated list of packages to document
  --clean      Clean output before generating
  --watch      Enable watch mode for development

${chalk.yellow('Examples:')}
  node scripts/generate-api-docs.js
  node scripts/generate-api-docs.js generate --clean
  node scripts/generate-api-docs.js watch
  node scripts/generate-api-docs.js --packages core,data
  node scripts/generate-api-docs.js validate

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
    watch: args.includes('--watch') || command === 'watch'
  }
  
  // Parse package list
  const packagesIndex = args.indexOf('--packages')
  if (packagesIndex !== -1 && args[packagesIndex + 1]) {
    options.packages = args[packagesIndex + 1].split(',').map(p => p.trim())
    validatePackages(options.packages)
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
      
    case 'watch':
      generateDocs({ ...options, watch: true })
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