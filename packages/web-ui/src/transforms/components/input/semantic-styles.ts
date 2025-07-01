/**
 * Input semantic styles
 * Creates border and focus ring colors for validation states
 */

import { createObjectLookupStyles } from '../common/semantic-tokens/utilities/semantic-styles-factory.js'

/**
 * Create semantic input styles
 * Created using semantic styles factory for consistent behavior
 */
export const createSemanticInputStyles = createObjectLookupStyles(
  {
    primary: 'border-primary focus:ring-primary/20',
    secondary: 'border-secondary focus:ring-secondary/20',
    destructive: 'border-destructive focus:ring-destructive/20',
    muted: 'border-muted focus:ring-muted/20',
    accent: 'border-accent focus:ring-accent/20',
    card: 'border-card focus:ring-card/20',
    popover: 'border-popover focus:ring-popover/20',
    border: 'border-border focus:ring-border/20',
  },
  'border'
)
