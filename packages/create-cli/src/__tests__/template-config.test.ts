import { describe, it, expect } from 'vitest'
import { resolve } from 'path'
import { createTemplateConfig, createTestTemplateConfig } from '../lib/template-config.js'

describe('Template Configuration', () => {
  it('should create basic template config', () => {
    const config = createTemplateConfig({
      templatesDir: './my-templates',
    })

    expect(config.templatesDir).toBe(resolve('./my-templates'))
  })

  it('should create template config with variant overrides', () => {
    const config = createTemplateConfig({
      variantDirs: {
        advanced: './custom-advanced',
        basic: './custom-basic',
      },
    })

    expect(config.variantDirs?.advanced).toBe(resolve('./custom-advanced'))
    expect(config.variantDirs?.basic).toBe(resolve('./custom-basic'))
  })

  it('should create test template config', () => {
    const config = createTestTemplateConfig('/tmp/test-templates', {
      additionalDirs: ['/tmp/extra'],
    })

    expect(config.templatesDir).toBe(resolve('/tmp/test-templates'))
    expect(config.sharedDir).toBe(resolve('/tmp/test-templates/shared'))
    expect(config.additionalDirs).toEqual([resolve('/tmp/extra')])
  })
})
