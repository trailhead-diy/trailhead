import { describe, it, expect } from 'vitest'
import {
  trailheadConfigSchema,
  transformConfigSchema,
  installConfigSchema,
  devRefreshConfigSchema,
} from '@/cli/config.js'

// Default configuration for tests
const defaultConfig = {
  install: {
    wrappers: true,
  },
  transforms: {
    enabled: true,
    excludePatterns: [],
    disabledTransforms: [],
  },
  devRefresh: {
    prefix: 'catalyst-',
  },
  verbose: false,
  dryRun: false,
}

describe('Configuration Schema', () => {
  describe('trailheadConfigSchema', () => {
    it('should accept valid configuration', () => {
      const validConfig = {
        install: {
          destDir: './components/ui',
          wrappers: true,
        },
        transforms: {
          enabled: true,
          srcDir: './src/components',
          excludePatterns: ['**/*.test.tsx'],
          enabledTransforms: ['button', 'badge'],
          disabledTransforms: ['experimental'],
        },
        devRefresh: {
          srcDir: './catalyst-ui-kit',
          destDir: './src/components/lib',
          prefix: 'catalyst-',
        },
        verbose: true,
        dryRun: false,
      }

      const result = trailheadConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })

    it('should accept empty config (defaults handled by loader)', () => {
      const minimalConfig = {}
      const result = trailheadConfigSchema.safeParse(minimalConfig)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.verbose).toBeUndefined()
        expect(result.data.dryRun).toBeUndefined()
      }
    })

    it('should reject invalid types', () => {
      const invalidConfig = {
        verbose: 'yes', // Should be boolean
        transforms: {
          enabled: 'true', // Should be boolean
        },
      }

      const result = trailheadConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
    })
  })

  describe('transformConfigSchema', () => {
    it('should accept valid transform config', () => {
      const validConfig = {
        enabled: true,
        srcDir: './src/components',
        excludePatterns: ['**/*.test.tsx', '**/legacy/**'],
        enabledTransforms: ['button', 'alert', 'badge'],
        disabledTransforms: ['experimental-component'],
      }

      const result = transformConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.enabled).toBe(true)
        expect(result.data.srcDir).toBe('./src/components')
        expect(result.data.excludePatterns).toHaveLength(2)
        expect(result.data.enabledTransforms).toHaveLength(3)
        expect(result.data.disabledTransforms).toHaveLength(1)
      }
    })

    it('should accept empty transform config', () => {
      const minimalConfig = {}
      const result = transformConfigSchema.safeParse(minimalConfig)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.enabled).toBeUndefined()
        expect(result.data.excludePatterns).toBeUndefined()
        expect(result.data.disabledTransforms).toBeUndefined()
      }
    })
  })

  describe('installConfigSchema', () => {
    it('should accept valid install config', () => {
      const validConfig = {
        destDir: './components/ui',
        wrappers: false,
      }

      const result = installConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.destDir).toBe('./components/ui')
        expect(result.data.wrappers).toBe(false)
      }
    })

    it('should accept empty install config', () => {
      const minimalConfig = {}
      const result = installConfigSchema.safeParse(minimalConfig)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.wrappers).toBeUndefined()
      }
    })
  })

  describe('devRefreshConfigSchema', () => {
    it('should accept valid dev refresh config', () => {
      const validConfig = {
        srcDir: './catalyst-ui-kit/typescript',
        destDir: './src/components/lib',
        prefix: 'cat-',
      }

      const result = devRefreshConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.srcDir).toBe('./catalyst-ui-kit/typescript')
        expect(result.data.destDir).toBe('./src/components/lib')
        expect(result.data.prefix).toBe('cat-')
      }
    })

    it('should accept empty devRefresh config', () => {
      const minimalConfig = {}
      const result = devRefreshConfigSchema.safeParse(minimalConfig)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.prefix).toBeUndefined()
      }
    })
  })

  describe('defaultConfig', () => {
    it('should have valid default configuration', () => {
      const result = trailheadConfigSchema.safeParse(defaultConfig)
      expect(result.success).toBe(true)
    })

    it('should have expected default values', () => {
      expect(defaultConfig.install?.wrappers).toBe(true)
      expect(defaultConfig.transforms?.enabled).toBe(true)
      expect(defaultConfig.transforms?.excludePatterns).toEqual([])
      expect(defaultConfig.transforms?.disabledTransforms).toEqual([])
      expect(defaultConfig.devRefresh?.prefix).toBe('catalyst-')
      expect(defaultConfig.verbose).toBe(false)
      expect(defaultConfig.dryRun).toBe(false)
    })
  })
})
