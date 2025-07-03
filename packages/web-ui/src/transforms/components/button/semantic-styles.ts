/**
 * Button semantic style functions
 * Creates button-specific semantic token classes with CSS variables
 */

import { createCSSVariableStyles } from '../common/semantic-tokens/utilities/semantic-styles-factory.js';

/**
 * Creates button-style semantic token classes with CSS variables
 * Created using semantic styles factory for consistent behavior
 */
export const createSemanticButtonStyles = createCSSVariableStyles((token: string) => [
  `text-white`,
  `[--btn-bg:var(--color-${token})]`,
  `[--btn-border:var(--color-${token})]`,
  `[--btn-hover-overlay:var(--color-white)]/10`,
  `[--btn-icon:var(--color-white)]/60`,
  `data-active:[--btn-icon:var(--color-white)]/80`,
  `data-hover:[--btn-icon:var(--color-white)]/80`,
]);
