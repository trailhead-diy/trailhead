/**
 * Link semantic styles
 * Creates text and hover color classes for semantic tokens
 */

import { createObjectLookupStyles } from '../common/semantic-tokens/utilities/semantic-styles-factory.js';

/**
 * Create semantic link styles
 * Created using semantic styles factory for consistent behavior
 */
export const createSemanticLinkStyles = createObjectLookupStyles(
  {
    primary: 'text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80',
    secondary:
      'text-secondary-foreground hover:text-secondary-foreground/80 dark:text-secondary-foreground dark:hover:text-secondary-foreground/80',
    destructive:
      'text-destructive hover:text-destructive/80 dark:text-destructive dark:hover:text-destructive/80',
    muted:
      'text-muted-foreground hover:text-muted-foreground/80 dark:text-muted-foreground dark:hover:text-muted-foreground/80',
    accent:
      'text-accent-foreground hover:text-accent-foreground/80 dark:text-accent-foreground dark:hover:text-accent-foreground/80',
    card: 'text-card-foreground hover:text-card-foreground/80 dark:text-card-foreground dark:hover:text-card-foreground/80',
    popover:
      'text-popover-foreground hover:text-popover-foreground/80 dark:text-popover-foreground dark:hover:text-popover-foreground/80',
    border: 'text-border hover:text-border/80 dark:text-border dark:hover:text-border/80',
  },
  'primary'
);
