/**
 * Fieldset color mapping transform
 *
 * Handles any remaining hardcoded color classes in fieldset components
 * that need to be converted to semantic tokens
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js'

const fieldsetColorMappings = makeProtected([
  // Error text colors - primary target
  {
    pattern: /text-red-600/g,
    replacement: 'text-destructive',
    description: 'Convert red error text to semantic destructive token',
  },
  {
    pattern: /dark:text-red-500/g,
    replacement: 'dark:text-destructive',
    description: 'Convert dark mode red error text to semantic destructive token',
  },

  // Error border colors (if any exist)
  {
    pattern: /border-red-600/g,
    replacement: 'border-destructive',
    description: 'Convert red error borders to semantic destructive token',
  },
  {
    pattern: /dark:border-red-500/g,
    replacement: 'dark:border-destructive',
    description: 'Convert dark mode red error borders to semantic destructive token',
  },

  // Error background colors (if any exist)
  {
    pattern: /bg-red-50/g,
    replacement: 'bg-destructive/10',
    description: 'Convert light red backgrounds to semantic destructive with opacity',
  },
  {
    pattern: /dark:bg-red-950/g,
    replacement: 'dark:bg-destructive/10',
    description: 'Convert dark mode red backgrounds to semantic destructive with opacity',
  },
])

/**
 * Fieldset color mapping transform
 * Converts hardcoded red colors to semantic destructive tokens
 */
export const fieldsetColorMappingsTransform = createProtectedRegexTransform({
  name: 'fieldset-color-mappings',
  description: 'Convert fieldset hardcoded colors to semantic tokens',
  mappings: fieldsetColorMappings,
  changeType: 'fieldset-color-semantic',

  // Only apply to fieldset files
  contentFilter: (content) =>
    content.includes('export function Fieldset') ||
    content.includes('export function ErrorMessage') ||
    content.includes('export function Legend') ||
    content.includes('export function Field'),
})
