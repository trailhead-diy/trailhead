/**
 * Badge semantic styles
 * Creates Tailwind classes for semantic badge colors
 */

import { createObjectLookupStyles } from '../common/semantic-tokens/utilities/semantic-styles-factory.js';

/**
 * Create semantic badge styles
 * Created using semantic styles factory for consistent behavior
 */
export const createSemanticBadgeStyles = createObjectLookupStyles(
  {
    primary: 'bg-primary/10 text-primary-foreground dark:bg-primary/15',
    secondary: 'bg-secondary/10 text-secondary-foreground dark:bg-secondary/15',
    destructive: 'bg-destructive/10 text-destructive-foreground dark:bg-destructive/15',
    muted: 'bg-muted text-muted-foreground',
    accent: 'bg-accent text-accent-foreground',
    card: 'bg-card text-card-foreground',
    popover: 'bg-popover text-popover-foreground',
    border: 'border-border',
  },
  'primary'
);
