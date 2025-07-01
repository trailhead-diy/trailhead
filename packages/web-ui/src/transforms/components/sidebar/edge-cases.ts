/**
 * Sidebar-specific edge case transformations
 * Handles sidebar background and other sidebar-specific patterns
 */

import { createProtectedRegexTransform } from '../common/utilities/protected-regex-transform-factory.js'

/**
 * Sidebar edge cases transform
 * Created using regex transform factory for DRY implementation
 */
export const sidebarEdgeCasesTransform = createProtectedRegexTransform({
  name: 'sidebar-edge-cases',
  description: 'Transform sidebar-specific edge cases',
  mappings: [
    {
      pattern: /bg-white\/5(?![0-9])/g,
      replacement: 'bg-sidebar',
      description: 'sidebar background white/5 → sidebar',
    },
    {
      pattern: /bg-zinc-900\/10(?![0-9])/g,
      replacement: 'bg-sidebar',
      description: 'sidebar background zinc-900/10 → sidebar',
    },
    // Fix missing background on desktop sidebar wrapper (from traditional system)
    {
      pattern: /<div className="fixed inset-y-0 left-0 w-64 max-lg:hidden">/g,
      replacement: '<div className="fixed inset-y-0 left-0 w-64 max-lg:hidden bg-white dark:bg-zinc-900">',
      description: 'Add background to desktop sidebar wrapper',
    },
  ],
  changeType: 'edge-case',
  // Only process sidebar-related files
  contentFilter: (content) => content.includes('sidebar') || content.includes('Sidebar'),
})