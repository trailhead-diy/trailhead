/**
 * Validator for semantic tokens
 */

import { SEMANTIC_TOKENS, SemanticColorToken } from './types.js'

export function isSemanticToken(color: string): color is SemanticColorToken {
  return SEMANTIC_TOKENS.includes(color as SemanticColorToken)
}
