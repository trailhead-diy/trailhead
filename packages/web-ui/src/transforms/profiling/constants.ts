/**
 * Shared constants for profiling system
 */

import { join } from 'path'
import type { ProfilerConfig, ProgressIndicators } from './types.js'

// All 27 Catalyst components
export const CATALYST_COMPONENTS = [
  'alert.tsx',
  'auth-layout.tsx',
  'avatar.tsx',
  'badge.tsx',
  'button.tsx',
  'checkbox.tsx',
  'combobox.tsx',
  'description-list.tsx',
  'dialog.tsx',
  'divider.tsx',
  'dropdown.tsx',
  'fieldset.tsx',
  'heading.tsx',
  'input.tsx',
  'link.tsx',
  'listbox.tsx',
  'navbar.tsx',
  'pagination.tsx',
  'radio.tsx',
  'select.tsx',
  'sidebar-layout.tsx',
  'sidebar.tsx',
  'stacked-layout.tsx',
  'switch.tsx',
  'table.tsx',
  'text.tsx',
  'textarea.tsx',
] as const

// Directory configuration
export const PROFILER_CONFIG: ProfilerConfig = {
  tempBase: join(process.cwd(), 'temp/profile-transforms'),
  transforms2Dir: join(process.cwd(), 'temp/profile-transforms/transforms2'),
  traditionalDir: join(process.cwd(), 'temp/profile-transforms/traditional'),
  catalystSource: join(process.cwd(), 'catalyst-ui-kit/typescript'),
  reportPath: join(process.cwd(), 'docs'),
} as const

// Progress indicators
export const PROGRESS_MESSAGES: ProgressIndicators = {
  setup: 'Setting up test environment...',
  profile: 'Running performance profile...',
  cleanup: 'Cleaning up temporary files...',
  comparison: 'Comparing with traditional approach...',
} as const

// Default options
export const DEFAULT_OPTIONS = {
  iterations: 3,
  mode: 'full' as const,
  compare: false,
  verbose: false,
  interactive: false,
} as const

// CLI configuration
export const CLI_CONFIG = {
  name: 'profile-transforms',
  description: 'Profile transformation performance',
  version: '1.0.0',
} as const
// Transform categories for reference
export const TRANSFORM_CATEGORIES = {
  imports: ['clsx-to-cn', 'cleanup-unused'],
  classNames: ['add-parameter', 'wrap-static', 'ensure-in-cn', 'reorder-args', 'remove-unused'],
  colors: ['base-mappings', 'interactive-states', 'dark-mode', 'special-patterns'],
  edgeCases: ['text-colors', 'icon-fills', 'blue-to-primary', 'focus-states'],
  formatting: ['file-headers', 'post-process'],
} as const