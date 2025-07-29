import { describe, it, expect } from 'vitest'
import { resolve } from 'path'
import { createTestTemplateConfig } from '../config.js'

describe('Template Configuration', () => {
  it('should create test template config with default directories', () => {
    const config = createTestTemplateConfig('/tmp/test-templates')

    expect(config.templatesDir).toBe(resolve('/tmp/test-templates'))
    expect(config.sharedDir).toBe(resolve('/tmp/test-templates/shared'))
  })

  it('should create test template config with additional directories', () => {
    const config = createTestTemplateConfig('/tmp/test-templates', {
      additionalDirs: ['/tmp/extra'],
    })

    expect(config.templatesDir).toBe(resolve('/tmp/test-templates'))
    expect(config.sharedDir).toBe(resolve('/tmp/test-templates/shared'))
    expect(config.additionalDirs).toEqual([resolve('/tmp/extra')])
  })

  it('should allow overriding directories in test config', () => {
    const config = createTestTemplateConfig('/tmp/test-templates', {
      templatesDir: '/custom/templates',
      sharedDir: '/custom/shared',
    })

    expect(config.templatesDir).toBe(resolve('/custom/templates'))
    expect(config.sharedDir).toBe(resolve('/custom/shared'))
  })
})
