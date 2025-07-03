/**
 * Color mapping transform for Avatar component
 * Maps component-specific color patterns to semantic tokens
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js';

const avatarColorMappings = makeProtected([
  // Outline colors
  {
    pattern: /\boutline-black\/10\b/g,
    replacement: 'outline-border',
    description: 'Convert black outline to semantic border',
  },
  {
    pattern: /\bdark:outline-white\/10\b/g,
    replacement: 'dark:outline-border',
    description: 'Convert dark mode white outline to semantic border',
  },
]);

/**
 * Avatar color mapping transform
 * Converts hardcoded colors to semantic tokens
 */
export const avatarColorMappingsTransform = createProtectedRegexTransform({
  name: 'avatar-color-mappings',
  description: 'Transform avatar outline colors to semantic tokens',
  mappings: avatarColorMappings,
  changeType: 'avatar-color-semantic',

  // Only apply to avatar component files
  contentFilter: content =>
    content.includes('export function Avatar') || content.includes('export const AvatarButton'),
});
