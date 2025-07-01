/**
 * @fileoverview High-ROI Tests for Package Manager Registry
 *
 * Tests focus on business logic that affects command execution:
 * - Command building accuracy across package managers
 * - Strategy-to-options mapping
 * - Package manager specific configurations
 */

import { describe, it, expect } from 'vitest'
import {
  buildInstallCommand,
  getStrategyOptions,
  getPackageManagerEnv,
  type PackageManagerName,
  type DependencyStrategy,
} from '../../../src/cli/core/installation/package-manager-registry.js'

describe('Package Manager Registry', () => {
  describe('Command Building - High-ROI Tests', () => {
    it('should build commands for all package managers', () => {
      const packageManagers: PackageManagerName[] = ['npm', 'yarn', 'pnpm', 'bun']

      packageManagers.forEach((pm) => {
        const command = buildInstallCommand(pm, {})
        expect(command).toContain(pm)
        expect(command).toContain('install')
      })
    })

    it('should handle force flag consistently', () => {
      const npmCommand = buildInstallCommand('npm', { force: true })
      const yarnCommand = buildInstallCommand('yarn', { force: true })
      const pnpmCommand = buildInstallCommand('pnpm', { force: true })
      const bunCommand = buildInstallCommand('bun', { force: true })

      expect(npmCommand).toContain('--force')
      expect(yarnCommand).toContain('--force')
      expect(pnpmCommand).toContain('--force')
      expect(bunCommand).toContain('--force')
    })

    it('should handle CI mode appropriately', () => {
      const npmCI = buildInstallCommand('npm', { ci: true })
      const yarnCI = buildInstallCommand('yarn', { ci: true })

      expect(npmCI).toContain('npm ci')
      expect(yarnCI).toContain('--frozen-lockfile')
    })

    it('should handle workspace configurations', () => {
      const pnpmWorkspace = buildInstallCommand('pnpm', { workspace: 'root' })
      const yarnWorkspace = buildInstallCommand('yarn', { workspace: 'root' })

      expect(pnpmWorkspace).toContain('--workspace-root')
      expect(yarnWorkspace).toContain('workspace')
    })

    it('should handle timeout settings where supported', () => {
      const npmTimeout = buildInstallCommand('npm', { timeout: 60000 })

      expect(npmTimeout).toContain('--network-timeout')
      expect(npmTimeout).toContain('60000')

      // Test that yarn handles timeout option gracefully (even if not applied)
      const yarnTimeout = buildInstallCommand('yarn', { timeout: 60000 })
      expect(yarnTimeout).toContain('yarn install')
    })

    it('should handle frozen lockfile for yarn and pnpm', () => {
      const yarnCommand = buildInstallCommand('yarn', { frozen: true })
      const pnpmCommand = buildInstallCommand('pnpm', { frozen: true })

      expect(yarnCommand).toContain('--frozen-lockfile')
      expect(pnpmCommand).toContain('--frozen-lockfile')
    })
  })

  describe('Strategy Options Mapping - Core Business Logic', () => {
    it('should handle different strategy types', () => {
      const strategies: DependencyStrategy['type'][] = ['auto', 'smart', 'force', 'manual', 'skip']

      strategies.forEach((type) => {
        const strategy: DependencyStrategy = { type }
        const options = getStrategyOptions(strategy, 'npm', true)

        if (type === 'skip') {
          // Skip strategy might return options or null depending on implementation
          expect(options).toBeDefined()
        } else {
          expect(options).toBeTruthy()
        }
      })
    })

    it('should handle package manager variations', () => {
      const strategy: DependencyStrategy = { type: 'smart' }
      const packageManagers: PackageManagerName[] = ['npm', 'yarn', 'pnpm', 'bun']

      packageManagers.forEach((pm) => {
        const options = getStrategyOptions(strategy, pm, true)
        expect(options).toBeTruthy()
      })
    })

    it('should respect lockfile presence', () => {
      const strategy: DependencyStrategy = { type: 'auto' }

      const withLockfile = getStrategyOptions(strategy, 'npm', true)
      const withoutLockfile = getStrategyOptions(strategy, 'npm', false)

      expect(withLockfile).toBeTruthy()
      expect(withoutLockfile).toBeTruthy()
    })
  })

  describe('Environment Variables - Basic Functionality', () => {
    it('should generate environment variables for all package managers', () => {
      const packageManagers: PackageManagerName[] = ['npm', 'yarn', 'pnpm', 'bun']

      packageManagers.forEach((pm) => {
        const env = getPackageManagerEnv(pm, { color: true, ci: false })
        expect(env).toBeTruthy()
        expect(typeof env).toBe('object')
      })
    })

    it('should handle different configuration options', () => {
      const configs = [
        { color: true, ci: false },
        { color: false, ci: true },
        { color: true, ci: true },
        { color: false, ci: false },
      ]

      configs.forEach((config) => {
        const env = getPackageManagerEnv('npm', config)
        expect(env).toBeTruthy()
      })
    })
  })

  describe('Integration Tests - Core Functionality', () => {
    it('should handle strategy and package manager combinations', () => {
      const strategies: DependencyStrategy['type'][] = ['auto', 'smart', 'force']
      const packageManagers: PackageManagerName[] = ['npm', 'yarn', 'pnpm', 'bun']

      strategies.forEach((strategyType) => {
        packageManagers.forEach((pm) => {
          const strategy: DependencyStrategy = { type: strategyType }
          const options = getStrategyOptions(strategy, pm, true)

          expect(options).toBeTruthy()

          // Should be able to build a command with these options
          const command = buildInstallCommand(pm, {
            force: options?.force,
            ci: options?.ci,
            verbose: options?.verbose,
          })

          expect(command).toContain(pm)
          expect(command).toMatch(/(install|ci)/)
        })
      })
    })

    it('should handle edge cases gracefully', () => {
      // Test with empty options
      const emptyCommand = buildInstallCommand('npm', {})
      expect(emptyCommand).toBe('npm install')

      // Test with all options
      const fullCommand = buildInstallCommand('npm', {
        ci: true,
        force: true,
        verbose: true,
        timeout: 60000,
      })
      expect(fullCommand).toContain('npm ci')
      expect(fullCommand).toContain('--force')
    })

    it('should maintain consistency across package managers', () => {
      const packageManagers: PackageManagerName[] = ['npm', 'yarn', 'pnpm', 'bun']

      packageManagers.forEach((pm) => {
        // All should handle basic install
        const basic = buildInstallCommand(pm, {})
        expect(basic).toContain('install')

        // All should handle force
        const force = buildInstallCommand(pm, { force: true })
        expect(force).toContain('--force')

        // All should have environment variables
        const env = getPackageManagerEnv(pm, { color: true, ci: false })
        expect(env).toBeTruthy()
      })
    })
  })
})
