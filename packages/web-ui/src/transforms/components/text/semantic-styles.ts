/**
 * Text semantic styles
 * Creates text color classes for semantic tokens
 */

import { createObjectLookupStyles } from '../common/semantic-tokens/utilities/semantic-styles-factory.js';

/**
 * Create semantic text styles
 * Created using semantic styles factory for consistent behavior
 */
export const createSemanticTextStyles = createObjectLookupStyles(
  {
    primary: 'text-primary dark:text-primary',
    secondary: 'text-secondary-foreground dark:text-secondary-foreground',
    destructive: 'text-destructive dark:text-destructive',
    muted: 'text-muted-foreground dark:text-muted-foreground',
    accent: 'text-accent-foreground dark:text-accent-foreground',
    card: 'text-card-foreground dark:text-card-foreground',
    popover: 'text-popover-foreground dark:text-popover-foreground',
    border: 'text-border dark:text-border',
  },
  'primary'
);
