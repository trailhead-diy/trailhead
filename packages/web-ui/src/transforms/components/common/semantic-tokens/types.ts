/**
 * Semantic token types and definitions
 */

export type SemanticColorToken = 
  | 'primary'
  | 'secondary' 
  | 'destructive'
  | 'muted'
  | 'accent'
  | 'card'
  | 'popover'
  | 'border'

export const SEMANTIC_TOKENS: readonly SemanticColorToken[] = [
  'primary',
  'secondary',
  'destructive',
  'muted',
  'accent',
  'card',
  'popover',
  'border'
] as const