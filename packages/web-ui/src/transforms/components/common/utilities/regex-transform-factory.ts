import type { Transform, TransformResult } from '@/transforms/shared/types.js';

export interface ColorMapping {
  pattern: RegExp;
  replacement: string;
  description: string;
}

export interface RegexTransformConfig {
  name: string;
  description: string;
  mappings: ColorMapping[];
  changeType?: string;
  contentFilter?: (content: string) => boolean;
}

export function createRegexTransform(config: RegexTransformConfig): Transform {
  return {
    name: config.name,
    description: config.description || `Regex transform: ${config.name}`,
    type: 'regex',

    execute(content: string): TransformResult {
      if (config.contentFilter && !config.contentFilter(content)) {
        return {
          name: config.name,
          type: 'regex',
          phase: 'color',
          content,
          changes: [],
          hasChanges: false,
        };
      }

      let transformed = content;
      const changes: any[] = [];

      for (const mapping of config.mappings) {
        const pattern = mapping.pattern;
        const replacement = mapping.replacement;
        const description = mapping.description;

        const matches = content.match(pattern);
        if (matches) {
          transformed = transformed.replace(pattern, replacement);
          changes.push({
            type: config.changeType || 'color-mapping',
            description: String(description),
          });
        }
      }

      return {
        name: config.name,
        type: 'regex',
        phase: 'color',
        content: transformed,
        changes,
        hasChanges: changes.length > 0,
      };
    },
  };
}
