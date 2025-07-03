/**
 * Semantic enhancement transform for Textarea component
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js';

export const textareaSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Textarea',

  // Detection pattern - check for Textarea forwardRef
  detectPattern: (content: string) => {
    return (
      content.includes('export const Textarea = forwardRef') &&
      content.includes('function Textarea')
    );
  },

  // Default color fallback
  defaultColor: 'primary',

  // Textarea doesn't have a type alias or props interface for color
  typePattern: 'none',

  // Using forwardRef
  isForwardRef: true,

  // No colors object in this component
  hasColorsObject: false,

  // Variable name for resolved classes
  variableName: 'resolvedColorClasses',

  // Don't use IIFE pattern
  useIIFE: false,
});
