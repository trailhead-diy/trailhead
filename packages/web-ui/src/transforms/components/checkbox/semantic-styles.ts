/**
 * Checkbox semantic styles
 * Creates CSS variables for semantic checkbox colors
 */

import { createCSSVariableStyles } from '../common/semantic-tokens/utilities/semantic-styles-factory.js';

/**
 * Create semantic checkbox styles
 * Created using semantic styles factory for consistent behavior
 */
export const createSemanticCheckboxStyles = createCSSVariableStyles((token: string) => [
  `[--checkbox-check:var(--color-white)]`,
  `[--checkbox-checked-bg:var(--color-${token})]`,
  `[--checkbox-checked-border:var(--color-${token})]/90`,
]);
