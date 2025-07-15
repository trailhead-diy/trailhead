/**
 * Component-specific semantic color mappings for semantic colors transform
 *
 * Provides component detection logic and semantic color pattern generation
 * for different Catalyst UI component types. Each component has its own
 * color mapping strategy based on its styling patterns.
 */

/**
 * Component-specific semantic color patterns
 */
export function getSemanticColorsForComponent(content: string): string[] {
  /////////////////////////////////////////////////////////////////////////////////
  // Badge Detection First - Prevent misidentification as button
  // Finds:
  //        export function CatalystBadge + inline-flex items-center gap-x-1.5
  //
  /////////////////////////////////////////////////////////////////////////////////
  if (content.includes('export function CatalystBadge')) {
    return [
      "primary: 'bg-primary-500/15 text-primary-700 group-data-hover:bg-primary-500/25 dark:bg-primary-500/10 dark:text-primary-400 dark:group-data-hover:bg-primary-500/20',",
      "secondary: 'bg-secondary-500/15 text-secondary-700 group-data-hover:bg-secondary-500/25 dark:bg-secondary-500/10 dark:text-secondary-400 dark:group-data-hover:bg-secondary-500/20',",
      "destructive: 'bg-destructive-500/15 text-destructive-700 group-data-hover:bg-destructive-500/25 dark:bg-destructive-500/10 dark:text-destructive-400 dark:group-data-hover:bg-destructive-500/20',",
      "accent: 'bg-accent-500/15 text-accent-700 group-data-hover:bg-accent-500/25 dark:bg-accent-500/10 dark:text-accent-400 dark:group-data-hover:bg-accent-500/20',",
      "muted: 'bg-muted-500/15 text-muted-700 group-data-hover:bg-muted-500/25 dark:bg-muted-500/10 dark:text-muted-400 dark:group-data-hover:bg-muted-500/20',",
    ]
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Button Detection - Multiple export patterns
  // Finds:
  //        export const CatalystButton + --btn-
  //        export function CatalystButton + --btn-
  //
  /////////////////////////////////////////////////////////////////////////////////
  if (
    content.includes('export const CatalystButton =') ||
    content.includes('export function CatalystButton')
  ) {
    return [
      'primary: [',
      "  'text-white [--btn-hover-overlay:var(--color-white)]/10 [--btn-bg:var(--color-blue-600)] [--btn-border:var(--color-blue-700)]/90',",
      "  '[--btn-icon:var(--color-blue-300)] data-active:[--btn-icon:var(--color-blue-200)] data-hover:[--btn-icon:var(--color-blue-200)]',",
      '],',
      'secondary: [',
      "  'text-white [--btn-hover-overlay:var(--color-white)]/10 [--btn-bg:var(--color-zinc-600)] [--btn-border:var(--color-zinc-700)]/90',",
      "  '[--btn-icon:var(--color-zinc-300)] data-active:[--btn-icon:var(--color-zinc-200)] data-hover:[--btn-icon:var(--color-zinc-200)]',",
      '],',
      'destructive: [',
      "  'text-white [--btn-hover-overlay:var(--color-white)]/10 [--btn-bg:var(--color-red-600)] [--btn-border:var(--color-red-700)]/90',",
      "  '[--btn-icon:var(--color-red-300)] data-active:[--btn-icon:var(--color-red-200)] data-hover:[--btn-icon:var(--color-red-200)]',",
      '],',
      'accent: [',
      "  'text-white [--btn-hover-overlay:var(--color-white)]/10 [--btn-bg:var(--color-purple-600)] [--btn-border:var(--color-purple-700)]/90',",
      "  '[--btn-icon:var(--color-purple-300)] data-active:[--btn-icon:var(--color-purple-200)] data-hover:[--btn-icon:var(--color-purple-200)]',",
      '],',
      'muted: [',
      "  'text-white [--btn-hover-overlay:var(--color-white)]/10 [--btn-bg:var(--color-gray-600)] [--btn-border:var(--color-gray-700)]/90',",
      "  '[--btn-icon:var(--color-gray-300)] data-active:[--btn-icon:var(--color-gray-200)] data-hover:[--btn-icon:var(--color-gray-200)]',",
      '],',
    ]
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Switch Detection - Custom CSS properties
  // Finds:
  //        export function CatalystSwitch + --switch-
  //
  /////////////////////////////////////////////////////////////////////////////////
  if (content.includes('export function CatalystSwitch') && content.includes('--switch-')) {
    return [
      'primary: [',
      "  '[--switch-bg-ring:var(--color-blue-600)]/90 [--switch-bg:var(--color-blue-500)] dark:[--switch-bg-ring:transparent]',",
      "  '[--switch:white] [--switch-ring:var(--color-blue-600)]/90 [--switch-shadow:var(--color-blue-900)]/20',",
      '],',
      'secondary: [',
      "  '[--switch-bg-ring:var(--color-zinc-700)]/90 [--switch-bg:var(--color-zinc-600)] dark:[--switch-bg-ring:transparent]',",
      "  '[--switch-shadow:var(--color-black)]/10 [--switch:white] [--switch-ring:var(--color-zinc-700)]/90',",
      '],',
      'destructive: [',
      "  '[--switch-bg-ring:var(--color-red-700)]/90 [--switch-bg:var(--color-red-600)] dark:[--switch-bg-ring:transparent]',",
      "  '[--switch:white] [--switch-ring:var(--color-red-700)]/90 [--switch-shadow:var(--color-red-900)]/20',",
      '],',
      'accent: [',
      "  '[--switch-bg-ring:var(--color-purple-600)]/90 [--switch-bg:var(--color-purple-500)] dark:[--switch-bg-ring:transparent]',",
      "  '[--switch:white] [--switch-ring:var(--color-purple-600)]/90 [--switch-shadow:var(--color-purple-900)]/20',",
      '],',
      'muted: [',
      "  '[--switch-bg-ring:var(--color-gray-700)]/90 [--switch-bg:var(--color-gray-600)] dark:[--switch-bg-ring:transparent]',",
      "  '[--switch:white] [--switch-ring:var(--color-gray-700)]/90 [--switch-shadow:var(--color-gray-900)]/20',",
      '],',
    ]
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Radio Detection - Custom CSS properties
  // Finds:
  //        export function CatalystRadio + --radio-
  //
  /////////////////////////////////////////////////////////////////////////////////
  if (content.includes('export function CatalystRadio') && content.includes('--radio-')) {
    return [
      "primary: '[--radio-checked-indicator:var(--color-white)] [--radio-checked-bg:var(--color-blue-600)] [--radio-checked-border:var(--color-blue-700)]/90',",
      "secondary: '[--radio-checked-indicator:var(--color-white)] [--radio-checked-bg:var(--color-zinc-600)] [--radio-checked-border:var(--color-zinc-700)]/90',",
      "destructive: '[--radio-checked-indicator:var(--color-white)] [--radio-checked-bg:var(--color-red-600)] [--radio-checked-border:var(--color-red-700)]/90',",
      "accent: '[--radio-checked-indicator:var(--color-white)] [--radio-checked-bg:var(--color-purple-600)] [--radio-checked-border:var(--color-purple-700)]/90',",
      "muted: '[--radio-checked-indicator:var(--color-white)] [--radio-checked-bg:var(--color-gray-600)] [--radio-checked-border:var(--color-gray-700)]/90',",
    ]
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Checkbox Detection - Custom CSS properties
  // Finds:
  //        export function CatalystCheckbox + --checkbox-
  //
  /////////////////////////////////////////////////////////////////////////////////
  if (content.includes('export function CatalystCheckbox') && content.includes('--checkbox-')) {
    return [
      "primary: '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-blue-600)] [--checkbox-checked-border:var(--color-blue-700)]/90',",
      "secondary: '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-zinc-600)] [--checkbox-checked-border:var(--color-zinc-700)]/90',",
      "destructive: '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-red-600)] [--checkbox-checked-border:var(--color-red-700)]/90',",
      "accent: '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-purple-600)] [--checkbox-checked-border:var(--color-purple-700)]/90',",
      "muted: '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-gray-600)] [--checkbox-checked-border:var(--color-gray-700)]/90',",
    ]
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Alert Detection - Background and border styles
  // Finds:
  //        export function CatalystAlert
  //
  /////////////////////////////////////////////////////////////////////////////////
  if (content.includes('export function CatalystAlert')) {
    return [
      "primary: 'bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-900/50 dark:border-primary-800 dark:text-primary-200',",
      "secondary: 'bg-secondary-50 border-secondary-200 text-secondary-800 dark:bg-secondary-900/50 dark:border-secondary-800 dark:text-secondary-200',",
      "destructive: 'bg-destructive-50 border-destructive-200 text-destructive-800 dark:bg-destructive-900/50 dark:border-destructive-800 dark:text-destructive-200',",
      "accent: 'bg-accent-50 border-accent-200 text-accent-800 dark:bg-accent-900/50 dark:border-accent-800 dark:text-accent-200',",
      "muted: 'bg-muted-50 border-muted-200 text-muted-800 dark:bg-muted-900/50 dark:border-muted-800 dark:text-muted-200',",
    ]
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Default Fallback - No component matched
  //
  /////////////////////////////////////////////////////////////////////////////////
  return []
}
