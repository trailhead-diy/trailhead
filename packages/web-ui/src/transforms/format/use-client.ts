/**
 * Transform to add "use client" directive to specific components
 *
 * Adds the "use client" directive at the top of files for components that
 * require client-side functionality in Next.js App Router.
 */

import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';
import { ok, err } from '@esteban-url/trailhead-cli/core';

/**
 * Component names that require "use client" directive
 */
const CLIENT_COMPONENTS = new Set([
  'alert',
  'button',
  'checkbox',
  'combobox',
  'dropdown',
  'input',
  'listbox',
  'navbar',
  'radio',
  'sidebar',
  'switch',
  'textarea',
]);

/**
 * Adds "use client" directive to specific component files
 *
 * @param content - The file content to transform
 * @param filename - The filename (used to determine if transform should apply)
 * @returns Result containing the transformed content and change status
 */
export function addUseClientDirective(
  content: string,
  filename?: string
): Result<{ content: string; changed: boolean; warnings: string[] }, CLIError> {
  try {
    // Only apply to specific component files
    if (!filename || !shouldAddUseClient(filename)) {
      return ok({ content, changed: false, warnings: [] });
    }

    // Check if "use client" already exists
    if (content.includes('"use client"') || content.includes("'use client'")) {
      return ok({ content, changed: false, warnings: [] });
    }

    // Add "use client" directive at the top
    const useClientDirective = '"use client";\n\n';
    const transformedContent = useClientDirective + content;

    return ok({
      content: transformedContent,
      changed: true,
      warnings: [],
    });
  } catch (error) {
    return err({
      code: 'TRANSFORM_ERROR',
      message: `Failed to add use client directive: ${error instanceof Error ? error.message : String(error)}`,
      recoverable: true,
    });
  }
}

/**
 * Determines if a file should have "use client" directive added
 *
 * @param filename - The filename to check
 * @returns True if the file should have "use client" added
 */
function shouldAddUseClient(filename: string): boolean {
  // Extract component name from filename
  const basename = filename.split('/').pop() || '';
  const componentName = basename.replace(/\.(tsx?|jsx?)$/, '');

  return CLIENT_COMPONENTS.has(componentName.toLowerCase());
}
