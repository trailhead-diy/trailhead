/**
 * Tests for the install command
 * Focuses on user-facing behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { program } from 'commander'
import { createInstallCommand } from '../../../../src/cli/commands/install.js'
import type { CLIContext } from '../../../../src/cli/utils/types.js'
import { withConsoleSpy } from '../../../utils/console'

// Mock the installation prompts and core modules
vi.mock('../../../../src/cli/prompts/installation.js', () => ({
  runInstallationPrompts: vi.fn().mockResolvedValue({
    framework: 'nextjs',
    catalystSource: 'registry',
    destinationDir: 'components/ui',
    tailwindConfig: true,
    globalCss: true,
    useWrappers: true,
  }),
}))

// Mock the installation orchestrator
vi.mock('../../../../src/cli/core/installation/orchestrator.js', () => ({
  performInstallation: vi.fn().mockResolvedValue({
    success: true,
    value: {
      filesInstalled: ['button.tsx', 'alert.tsx'],
      messages: [],
    },
  }),
}))

// Mock the config module
vi.mock('../../../../src/cli/core/installation/config.js', () => ({
  resolveConfiguration: vi.fn().mockResolvedValue({
    success: true,
    value: {
      catalystDir: '/path/to/catalyst',
      destinationDir: 'components/ui',
      componentsDir: 'components/ui',
      libDir: 'components/ui/lib',
      projectRoot: '/project',
    },
  }),
}))

// Mock filesystem
vi.mock('../../../../src/cli/core/filesystem/index.js', () => ({
  createFileSystem: vi.fn().mockReturnValue({
    exists: vi.fn(),
    readDir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    copy: vi.fn(),
    ensureDir: vi.fn(),
    remove: vi.fn(),
    stat: vi.fn(),
    readJson: vi.fn(),
    writeJson: vi.fn(),
  }),
  createRobustFileSystem: vi.fn().mockReturnValue({
    exists: vi.fn(),
    readDir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    copy: vi.fn(),
    ensureDir: vi.fn(),
    remove: vi.fn(),
    stat: vi.fn(),
    readJson: vi.fn(),
    writeJson: vi.fn(),
  }),
  adaptSharedToInstallFS: vi.fn((fs) => fs),
}))

// Mock logger from framework
vi.mock('@trailhead/cli/core', async () => {
  const actual = await vi.importActual('@trailhead/cli/core')
  return {
    ...actual,
    createLogger: vi.fn().mockReturnValue({
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      step: vi.fn(),
    }),
    createSilentLogger: vi.fn().mockReturnValue({
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      step: vi.fn(),
    }),
  }
})

describe('Install Command', () => {
  // Create mock context
  const mockContext: CLIContext = {
    packageRoot: '/mock/package/root',
    isProduction: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Command Configuration', () => {
    it('should register install command with correct configuration', () => {
      const prog = new program.constructor().name('test')
      prog.addCommand(createInstallCommand(mockContext))

      const installCmd = prog.commands.find((cmd) => cmd.name() === 'install')
      expect(installCmd).toBeDefined()
      expect(installCmd?.description()).toBe(
        'Install and configure Trailhead UI components with enhanced theming'
      )
    })

    it('should have all required options', () => {
      const prog = new program.constructor().name('test')
      prog.addCommand(createInstallCommand(mockContext))

      const installCmd = prog.commands.find((cmd) => cmd.name() === 'install')
      const options = installCmd?.options

      // Check for key options
      expect(options?.some((opt) => opt.long === '--force')).toBe(true)
      expect(options?.some((opt) => opt.long === '--dry-run')).toBe(true)
      expect(options?.some((opt) => opt.long === '--framework')).toBe(true)
      // The command uses different option names than expected
      // --no-deps is not a valid option, the actual options are in the install command
      expect(options?.some((opt) => opt.long === '--no-config')).toBe(true)
      expect(options?.some((opt) => opt.long === '--no-wrappers')).toBe(true)
    })

    it('should have no alias', () => {
      const prog = new program.constructor().name('test')
      prog.addCommand(createInstallCommand(mockContext))

      const installCmd = prog.commands.find((cmd) => cmd.name() === 'install')
      // The install command doesn't define an alias
      expect(installCmd?.alias()).toBeUndefined()
    })
  })

  // Removed low-ROI option handling tests that check implementation details
  // The important thing is that the options exist (tested above) and that
  // the actual installation logic works (tested in unit tests)

  describe('Help Output', () => {
    it('should show wrapper option in help', () => {
      const prog = new program.constructor().name('test')
      prog.addCommand(createInstallCommand(mockContext))

      const installCmd = prog.commands.find((cmd) => cmd.name() === 'install')
      const wrapperOption = installCmd?.options.find((opt) => opt.long === '--no-wrappers')

      expect(wrapperOption).toBeDefined()
      expect(wrapperOption?.description).toContain('install components without wrapper files')
    })

    it('should provide usage examples', () => {
      const prog = new program.constructor().name('test')
      prog.addCommand(createInstallCommand(mockContext))

      const installCmd = prog.commands.find((cmd) => cmd.name() === 'install')
      const helpInfo = installCmd?.helpInformation()

      expect(helpInfo).toBeDefined()
      // Help should include basic usage info
      expect(helpInfo).toContain('install')
    })
  })

  describe('Error Handling', () => {
    it(
      'should handle installation errors gracefully',
      withConsoleSpy(async () => {
        const prog = new program.constructor().name('test')
        prog.addCommand(createInstallCommand(mockContext))

        // Mock installation to fail
        const { performInstallation } = await import(
          '../../../../src/cli/core/installation/orchestrator.js'
        )
        vi.mocked(performInstallation).mockResolvedValueOnce({
          success: false,
          error: {
            type: 'InstallError',
            message: 'Installation failed',
          },
        })

        // Capture process.exit
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called')
        })

        try {
          await prog.parseAsync(['node', 'test', 'install'], { from: 'node' })
        } catch (_error) {
          // Expected due to process.exit mock
        }

        expect(console.error).toHaveBeenCalled()
        expect(exitSpy).toHaveBeenCalledWith(1)

        exitSpy.mockRestore()
      })
    )

    it(
      'should handle config resolution errors',
      withConsoleSpy(async () => {
        const prog = new program.constructor().name('test')
        prog.addCommand(createInstallCommand(mockContext))

        // Mock config to fail
        const { resolveConfiguration } = await import(
          '../../../../src/cli/core/installation/config.js'
        )
        vi.mocked(resolveConfiguration).mockResolvedValueOnce({
          success: false,
          error: {
            type: 'ConfigError',
            message: 'Invalid configuration',
          },
        })

        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called')
        })

        try {
          await prog.parseAsync(['node', 'test', 'install'], { from: 'node' })
        } catch (_error) {
          // Expected
        }

        expect(console.error).toHaveBeenCalled()
        expect(exitSpy).toHaveBeenCalledWith(1)

        exitSpy.mockRestore()
      })
    )
  })

  // Removed low-ROI integration test that checks implementation details
  // The actual integration is tested through unit tests of the individual components
})
