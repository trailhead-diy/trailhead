#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'

interface Check {
  name: string
  check: () => boolean | string
  fix?: string
}

const checks: Check[] = [
  {
    name: 'Node.js version',
    check: () => {
      const nodeVersion = process.version
      const nvmrcPath = join(process.cwd(), '.nvmrc')
      if (existsSync(nvmrcPath)) {
        const requiredVersion = readFileSync(nvmrcPath, 'utf8').trim()
        const currentMajor = parseInt(nodeVersion.slice(1).split('.')[0])
        const requiredMajor = parseInt(requiredVersion.split('.')[0])
        return currentMajor >= requiredMajor
      }
      return true
    },
    fix: 'Install the correct Node.js version using nvm: nvm install',
  },
  {
    name: 'pnpm installed',
    check: () => {
      try {
        execSync('pnpm --version', { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    },
    fix: 'Install pnpm: npm install -g pnpm',
  },
  {
    name: 'Git installed',
    check: () => {
      try {
        execSync('git --version', { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    },
    fix: 'Install Git from https://git-scm.com',
  },
  {
    name: 'Dependencies installed',
    check: () => existsSync(join(process.cwd(), 'node_modules')),
    fix: 'Run: pnpm install',
  },
  {
    name: 'TypeScript build info cache',
    check: () => {
      const tsBuildInfo = join(process.cwd(), 'dist', '.tsbuildinfo')
      return existsSync(tsBuildInfo)
        ? 'exists (faster builds)'
        : 'not found (first build will be slower)'
    },
  },
  {
    name: 'Husky hooks installed',
    check: () => existsSync(join(process.cwd(), '.husky', '_', 'husky.sh')),
    fix: 'Run: pnpm prepare',
  },
]

console.log(chalk.bold.blue('\n🩺 Trailhead UI Doctor\n'))

let hasIssues = false

for (const check of checks) {
  process.stdout.write(`Checking ${check.name}... `)

  try {
    const result = check.check()

    if (result === true) {
      console.log(chalk.green('✓'))
    } else if (result === false) {
      console.log(chalk.red('✗'))
      if (check.fix) {
        console.log(chalk.yellow(`  Fix: ${check.fix}`))
      }
      hasIssues = true
    } else {
      console.log(chalk.yellow(`⚠ ${result}`))
    }
  } catch (error) {
    console.log(chalk.red('✗ Error'))
    console.log(chalk.red(`  ${error}`))
    hasIssues = true
  }
}

console.log()

if (hasIssues) {
  console.log(
    chalk.yellow('Some issues were found. Please fix them for the best development experience.\n')
  )
  process.exit(1)
} else {
  console.log(chalk.green('Everything looks good! Happy coding! 🚀\n'))
}
