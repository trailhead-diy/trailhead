import { describe, it, expect } from 'vitest'
import { getAvailableTemplates, getTemplateInfo, isValidTemplate } from '../utils.js'

describe('Template Utilities', () => {
  describe('getAvailableTemplates', () => {
    it('should return array of built-in templates', () => {
      const templates = getAvailableTemplates()

      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThan(0)
    })

    it('should include basic template', () => {
      const templates = getAvailableTemplates()
      const basic = templates.find((t) => t.name === 'basic')

      expect(basic).toBeDefined()
      expect(basic!.type).toBe('basic')
      expect(basic!.builtin).toBe(true)
    })

    it('should include advanced template', () => {
      const templates = getAvailableTemplates()
      const advanced = templates.find((t) => t.name === 'advanced')

      expect(advanced).toBeDefined()
      expect(advanced!.type).toBe('advanced')
      expect(advanced!.features.length).toBeGreaterThan(3)
    })

    it('should include library template', () => {
      const templates = getAvailableTemplates()
      const library = templates.find((t) => t.name === 'library')

      expect(library).toBeDefined()
      expect(library!.description).toContain('library')
    })

    it('should include monorepo-package template', () => {
      const templates = getAvailableTemplates()
      const monorepoPkg = templates.find((t) => t.name === 'monorepo-package')

      expect(monorepoPkg).toBeDefined()
      expect(monorepoPkg!.features).toContain('Monorepo-optimized structure')
    })

    it('should return new array on each call (no mutations)', () => {
      const templates1 = getAvailableTemplates()
      const templates2 = getAvailableTemplates()

      expect(templates1).not.toBe(templates2)
      expect(templates1).toEqual(templates2)
    })

    it('should have required properties on each template', () => {
      const templates = getAvailableTemplates()

      for (const template of templates) {
        expect(template.name).toBeDefined()
        expect(typeof template.name).toBe('string')
        expect(template.description).toBeDefined()
        expect(typeof template.description).toBe('string')
        expect(Array.isArray(template.features)).toBe(true)
        expect(['basic', 'advanced', 'custom']).toContain(template.type)
        expect(typeof template.builtin).toBe('boolean')
      }
    })
  })

  describe('getTemplateInfo', () => {
    it('should return template info for valid template name', () => {
      const info = getTemplateInfo('basic')

      expect(info).toBeDefined()
      expect(info!.name).toBe('basic')
      expect(info!.description).toBeDefined()
    })

    it('should return undefined for invalid template name', () => {
      const info = getTemplateInfo('nonexistent-template')

      expect(info).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      const info = getTemplateInfo('')

      expect(info).toBeUndefined()
    })

    it('should be case-sensitive', () => {
      const info = getTemplateInfo('BASIC')

      expect(info).toBeUndefined() // Should not match 'basic'
    })

    it('should return correct info for each builtin template', () => {
      const templateNames = ['basic', 'advanced', 'library', 'monorepo-package']

      for (const name of templateNames) {
        const info = getTemplateInfo(name)
        expect(info).toBeDefined()
        expect(info!.name).toBe(name)
      }
    })
  })

  describe('isValidTemplate', () => {
    it('should return true for valid template names', () => {
      expect(isValidTemplate('basic')).toBe(true)
      expect(isValidTemplate('advanced')).toBe(true)
      expect(isValidTemplate('library')).toBe(true)
      expect(isValidTemplate('monorepo-package')).toBe(true)
    })

    it('should return false for invalid template names', () => {
      expect(isValidTemplate('invalid')).toBe(false)
      expect(isValidTemplate('')).toBe(false)
      expect(isValidTemplate('BASIC')).toBe(false) // Case-sensitive
    })

    it('should handle special characters', () => {
      expect(isValidTemplate('basic; rm -rf /')).toBe(false)
      expect(isValidTemplate('../../../etc/passwd')).toBe(false)
    })
  })
})
