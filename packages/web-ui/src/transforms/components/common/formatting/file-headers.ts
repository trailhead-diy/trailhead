import type { Transform, TransformResult } from '@/transforms/shared/types.js'
function addFileHeader(content: string): string {
  const header =
    '// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.\n'

  if (content.includes('AUTO-GENERATED') || content.includes('auto-generated')) {
    return content
  }

  if (
    content.startsWith("'use client'") ||
    content.startsWith('"use client"') ||
    content.startsWith("'use server'") ||
    content.startsWith('"use server"')
  ) {
    const lines = content.split('\n')
    return lines[0] + '\n' + header + lines.slice(1).join('\n')
  }

  return header + content
}
export const fileHeadersTransform: Transform = {
  name: 'file-headers',
  description: 'Add auto-generated file headers',
  type: 'regex',

  execute(content: string): TransformResult {
    const transformed = addFileHeader(content)

    if (transformed !== content) {
      return {
        content: transformed,
        changes: [
          {
            type: 'file-header',
            description: 'Added AUTO-GENERATED header',
          },
        ],
        hasChanges: true,
      }
    }

    return {
      content,
      changes: [],
      hasChanges: false,
    }
  },
}
