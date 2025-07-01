/**
 * Textarea color mapping transform
 * 
 * Converts hardcoded red validation colors to semantic tokens in textarea components
 * Target: data-invalid:border-red-500 dark:data-invalid:border-red-600
 */

import { createProtectedRegexTransform, makeProtected } from '../common/utilities/protected-regex-transform-factory.js'

const textareaColorMappings = makeProtected([
  // Validation border colors - primary targets
  {
    pattern: /data-invalid:border-red-500/g,
    replacement: 'data-invalid:border-destructive',
    description: 'Convert red validation borders to semantic destructive token'
  },
  {
    pattern: /dark:data-invalid:border-red-600/g,
    replacement: 'dark:data-invalid:border-destructive',
    description: 'Convert dark mode red validation borders to semantic destructive token'
  },
  
  // Focus states with validation
  {
    pattern: /data-invalid:data-focus:border-red-500/g,
    replacement: 'data-invalid:data-focus:border-destructive',
    description: 'Convert focused red validation borders to semantic destructive token'
  },
  {
    pattern: /dark:data-invalid:data-focus:border-red-600/g,
    replacement: 'dark:data-invalid:data-focus:border-destructive',
    description: 'Convert dark mode focused red validation borders to semantic destructive token'
  },
  
  // Ring colors for validation
  {
    pattern: /data-invalid:ring-red-500/g,
    replacement: 'data-invalid:ring-destructive',
    description: 'Convert red validation rings to semantic destructive token'
  },
  {
    pattern: /dark:data-invalid:ring-red-600/g,
    replacement: 'dark:data-invalid:ring-destructive',
    description: 'Convert dark mode red validation rings to semantic destructive token'
  },
  
  // Background colors for validation states
  {
    pattern: /data-invalid:bg-red-50/g,
    replacement: 'data-invalid:bg-destructive/10',
    description: 'Convert red validation backgrounds to semantic destructive with opacity'
  },
  {
    pattern: /dark:data-invalid:bg-red-950/g,
    replacement: 'dark:data-invalid:bg-destructive/10',
    description: 'Convert dark mode red validation backgrounds to semantic destructive with opacity'
  }
])

/**
 * Textarea color mapping transform
 * Converts hardcoded red validation colors to semantic destructive tokens
 */
export const textareaColorMappingsTransform = createProtectedRegexTransform({
  name: 'textarea-color-mappings',
  description: 'Convert textarea hardcoded validation colors to semantic tokens',
  mappings: textareaColorMappings,
  changeType: 'textarea-color-semantic',
  
  // Only apply to textarea files
  contentFilter: (content) => 
    content.includes('export function Textarea') ||
    content.includes('data-invalid:border-red-')
})