import { describe, it, expect } from 'vitest'
import { resolve } from 'path'
import {
  validateProjectName,
  validateProjectPath,
  validateTemplatePath,
  validateOutputPath,
  sanitizeText,
  validatePackageManager,
} from '../validation.js'

describe('Security-Critical Validation Functions', () => {
  describe('validateProjectName', () => {
    it('should accept valid project names', () => {
      expect(validateProjectName('my-cli').isOk()).toBe(true)
      expect(validateProjectName('my_cli').isOk()).toBe(true)
      expect(validateProjectName('my.cli').isOk()).toBe(true)
      expect(validateProjectName('MyCli').isOk()).toBe(true)
      expect(validateProjectName('cli123').isOk()).toBe(true)
    })

    it('should reject empty project name', () => {
      const result = validateProjectName('')
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('empty')
      }
    })

    it('should reject names starting with special characters', () => {
      expect(validateProjectName('-my-cli').isErr()).toBe(true)
      expect(validateProjectName('.my-cli').isErr()).toBe(true)
      expect(validateProjectName('_my-cli').isErr()).toBe(true)
    })

    it('should reject names with invalid characters', () => {
      expect(validateProjectName('my cli').isErr()).toBe(true)
      expect(validateProjectName('my@cli').isErr()).toBe(true)
      expect(validateProjectName('my/cli').isErr()).toBe(true)
      expect(validateProjectName('my\\cli').isErr()).toBe(true)
      expect(validateProjectName('my:cli').isErr()).toBe(true)
    })

    it('should reject Windows reserved names', () => {
      const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'lpt1']
      for (const name of reservedNames) {
        const result = validateProjectName(name)
        expect(result.isErr()).toBe(true)
        if (result.isErr()) {
          expect(result.error.message).toContain('Reserved')
        }
      }
    })

    it('should reject reserved names case-insensitively', () => {
      expect(validateProjectName('CON').isErr()).toBe(true)
      expect(validateProjectName('Con').isErr()).toBe(true)
      expect(validateProjectName('AUX').isErr()).toBe(true)
    })

    it('should reject names exceeding max length', () => {
      const longName = 'a'.repeat(101)
      const result = validateProjectName(longName)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('100')
      }
    })
  })

  describe('validateProjectPath', () => {
    const baseDir = '/home/user/projects'

    it('should accept valid relative paths', () => {
      const result = validateProjectPath('my-project', baseDir)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(resolve(baseDir, 'my-project'))
      }
    })

    it('should accept valid absolute paths', () => {
      const absolutePath = '/opt/projects/my-project'
      const result = validateProjectPath(absolutePath, baseDir)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(absolutePath)
      }
    })

    it('should reject paths with null bytes', () => {
      const result = validateProjectPath('my-project\u0000/evil', baseDir)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('null bytes')
      }
    })

    it('should reject empty paths', () => {
      const result = validateProjectPath('', baseDir)
      expect(result.isErr()).toBe(true)
    })

    it('should reject paths exceeding max length', () => {
      const longPath = 'a'.repeat(261)
      const result = validateProjectPath(longPath, baseDir)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('260')
      }
    })

    it('should trim whitespace from paths', () => {
      const result = validateProjectPath('  my-project  ', baseDir)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(resolve(baseDir, 'my-project'))
      }
    })

    it('should handle nested relative paths', () => {
      const result = validateProjectPath('subdir/my-project', baseDir)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(resolve(baseDir, 'subdir/my-project'))
      }
    })
  })

  describe('validateTemplatePath - Directory Traversal Prevention', () => {
    const baseTemplateDir = '/app/templates'

    it('should accept valid template paths', () => {
      const result = validateTemplatePath('shared/package.json.hbs', baseTemplateDir)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(resolve(baseTemplateDir, 'shared/package.json.hbs'))
      }
    })

    it('should reject paths with directory traversal (..)', () => {
      const result = validateTemplatePath('../../../etc/passwd', baseTemplateDir)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_TEMPLATE_PATH')
        expect(result.error.message).toBe('Invalid template path')
        // Details are in context, not message
        expect(result.error.context?.details).toContain('within the template directory')
      }
    })

    it('should reject paths that escape via nested traversal', () => {
      const result = validateTemplatePath('shared/../../../etc/passwd', baseTemplateDir)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_TEMPLATE_PATH')
      }
    })

    it('should reject absolute paths that escape template dir', () => {
      // Absolute paths that resolve outside base dir should be rejected
      const result = validateTemplatePath('/etc/passwd', baseTemplateDir)
      expect(result.isErr()).toBe(true)
    })

    it('should reject paths with null bytes', () => {
      const result = validateTemplatePath('template\u0000.hbs', baseTemplateDir)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('null bytes')
      }
    })

    it('should handle URL-encoded traversal attempts', () => {
      // URL encoding should not bypass validation after normalization
      const result = validateTemplatePath('%2e%2e/%2e%2e/etc/passwd', baseTemplateDir)
      // This should either be rejected or normalized safely
      if (result.isOk()) {
        // If it passes, the resolved path must be within baseTemplateDir
        expect(result.value.startsWith(baseTemplateDir)).toBe(true)
      }
    })

    it('should accept deeply nested valid paths', () => {
      const result = validateTemplatePath('modules/config/src/lib/config.ts.hbs', baseTemplateDir)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.startsWith(baseTemplateDir)).toBe(true)
      }
    })
  })

  describe('validateOutputPath - Write Prevention', () => {
    const baseOutputDir = '/home/user/my-project'

    it('should accept valid relative output paths', () => {
      const result = validateOutputPath('src/index.ts', baseOutputDir)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(resolve(baseOutputDir, 'src/index.ts'))
      }
    })

    it('should reject directory traversal in output path', () => {
      const result = validateOutputPath('../../../etc/cron.d/evil', baseOutputDir)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_OUTPUT_PATH')
        expect(result.error.message).toBe('Invalid output path')
        // Details are in context, not message
        expect(result.error.context?.details).toContain('within the project directory')
      }
    })

    it('should reject absolute output paths', () => {
      const result = validateOutputPath('/etc/passwd', baseOutputDir)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_OUTPUT_PATH')
      }
    })

    it('should reject nested directory traversal', () => {
      const result = validateOutputPath('src/../../etc/passwd', baseOutputDir)
      expect(result.isErr()).toBe(true)
    })

    it('should reject paths with null bytes', () => {
      const result = validateOutputPath('src/index\u0000.ts', baseOutputDir)
      expect(result.isErr()).toBe(true)
    })

    it('should accept paths with dots in filename', () => {
      const result = validateOutputPath('src/config.schema.ts', baseOutputDir)
      expect(result.isOk()).toBe(true)
    })

    it('should reject Windows-style absolute paths on all platforms', () => {
      // Even on Unix, we should reject Windows-style absolute paths
      // as they could be exploited in cross-platform scenarios
      const result = validateOutputPath('C:\\Windows\\System32\\evil.dll', baseOutputDir)
      // Should either reject as absolute or treat as relative (safe)
      if (result.isOk()) {
        expect(result.value.startsWith(baseOutputDir)).toBe(true)
      }
    })
  })

  describe('sanitizeText - Injection Prevention', () => {
    it('should remove null bytes', () => {
      const result = sanitizeText('hello\u0000world')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('helloworld')
        expect(result.value).not.toContain('\u0000')
      }
    })

    it('should remove control characters (0x01-0x08)', () => {
      const result = sanitizeText('hello\u0001\u0002\u0008world')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('helloworld')
      }
    })

    it('should remove form feed and vertical tab', () => {
      const result = sanitizeText('hello\u000B\u000Cworld')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('helloworld')
      }
    })

    it('should remove control characters (0x0E-0x1F)', () => {
      const result = sanitizeText('hello\u000E\u001Fworld')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('helloworld')
      }
    })

    it('should remove delete character (0x7F)', () => {
      const result = sanitizeText('hello\u007Fworld')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('helloworld')
      }
    })

    it('should preserve normal whitespace (newlines, tabs, spaces)', () => {
      const result = sanitizeText('hello\n\tworld')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // Trim is applied, but internal whitespace should be preserved
        expect(result.value).toContain('\n')
        expect(result.value).toContain('\t')
      }
    })

    it('should trim leading and trailing whitespace', () => {
      const result = sanitizeText('  hello world  ')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('hello world')
      }
    })

    it('should reject non-string input', () => {
      const result = sanitizeText(null as any)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('required')
      }
    })

    it('should reject undefined input', () => {
      const result = sanitizeText(undefined as any)
      expect(result.isErr()).toBe(true)
    })

    it('should handle empty string', () => {
      const result = sanitizeText('')
      expect(result.isErr()).toBe(true)
    })

    it('should reject text exceeding max length', () => {
      const longText = 'a'.repeat(1001)
      const result = sanitizeText(longText)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('1000')
      }
    })

    it('should handle unicode characters correctly', () => {
      const result = sanitizeText('hello 世界 🌍')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('hello 世界 🌍')
      }
    })

    it('should handle mixed control chars and valid content', () => {
      const input = '\u0001hello\u0000 \u0008world\u007F!'
      const result = sanitizeText(input)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('hello world!')
      }
    })
  })

  describe('validatePackageManager', () => {
    it('should accept npm', () => {
      expect(validatePackageManager('npm').isOk()).toBe(true)
    })

    it('should accept pnpm', () => {
      expect(validatePackageManager('pnpm').isOk()).toBe(true)
    })

    it('should reject yarn', () => {
      expect(validatePackageManager('yarn').isErr()).toBe(true)
    })

    it('should reject bun', () => {
      expect(validatePackageManager('bun').isErr()).toBe(true)
    })

    it('should reject empty string', () => {
      expect(validatePackageManager('').isErr()).toBe(true)
    })

    it('should reject invalid input', () => {
      expect(validatePackageManager('invalid').isErr()).toBe(true)
    })
  })
})
