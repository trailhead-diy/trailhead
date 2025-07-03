/**
 * Radio semantic styles
 * Creates CSS variables for semantic radio colors
 */

import { createCSSVariableStyles } from '../common/semantic-tokens/utilities/semantic-styles-factory.js';

/**
 * Create semantic radio styles
 * Created using semantic styles factory for consistent behavior
 */
export const createSemanticRadioStyles = createCSSVariableStyles((token: string) => [
  `[--radio-checked-bg:var(--color-${token})]`,
  `[--radio-checked-border:var(--color-${token})]/90`,
  `[--radio-checked-indicator:var(--color-${token})]`,
]);
