import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import {
  createTemplateConfig,
  createTestTemplateConfig,
  createDevTemplateConfig,
  getTemplateConfigSummary,
} from '../lib/template-config.js';

describe('Template Configuration', () => {
  it('should create basic template config', () => {
    const config = createTemplateConfig({
      templatesDir: './my-templates',
    });

    expect(config.templatesDir).toBe(resolve('./my-templates'));
  });

  it('should create template config with variant overrides', () => {
    const config = createTemplateConfig({
      variantDirs: {
        advanced: './custom-advanced',
        enterprise: './custom-enterprise',
      },
    });

    expect(config.variantDirs?.advanced).toBe(resolve('./custom-advanced'));
    expect(config.variantDirs?.enterprise).toBe(resolve('./custom-enterprise'));
  });

  it('should create test template config', () => {
    const config = createTestTemplateConfig('/tmp/test-templates', {
      additionalDirs: ['/tmp/extra'],
    });

    expect(config.templatesDir).toBe(resolve('/tmp/test-templates'));
    expect(config.sharedDir).toBe(resolve('/tmp/test-templates/shared'));
    expect(config.additionalDirs).toEqual([resolve('/tmp/extra')]);
  });

  it('should create dev template config with overrides', () => {
    const config = createDevTemplateConfig({
      enterprise: './dev-enterprise',
    });

    expect(config.variantDirs?.enterprise).toBe(resolve('./dev-enterprise'));
    expect(config.variantDirs?.basic).toBeUndefined();
  });

  it('should generate config summary', () => {
    const config = createTemplateConfig({
      templatesDir: './templates',
      variantDirs: { advanced: './custom-advanced' },
    });

    const summary = getTemplateConfigSummary(config);

    expect(summary).toContain('Template Configuration:');
    expect(summary).toContain('Base Directory:');
    expect(summary).toContain('Variant Overrides:');
    expect(summary).toContain('advanced:');
  });

  it('should handle empty config', () => {
    const config = createTemplateConfig();
    const summary = getTemplateConfigSummary(config);

    expect(summary).toContain('(using built-in templates)');
  });
});
