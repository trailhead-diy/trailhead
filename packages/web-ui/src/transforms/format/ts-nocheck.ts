/**
 * Functional transform to add @ts-nocheck directive to specific component files
 *
 * Adds TypeScript @ts-nocheck directive to suppress type checking for specific
 * auto-generated component files that have complex HeadlessUI type interactions
 * that are difficult to resolve cleanly. Only applies to files with known
 * TypeScript errors.
 *
 * Target files:
 * - catalyst-combobox.tsx (binding element 'option' implicitly has 'any' type)
 * - catalyst-dropdown.tsx (Type 'string' is not assignable to type 'never')
 * - catalyst-listbox.tsx (binding element and type 'never' issues)
 *
 * Transform process:
 * 1. Checks if current file is in the target list (skip if not)
 * 2. Checks if file already has @ts-nocheck directive (skip if present)
 * 3. Detects 'use client' directive at file start
 * 4. Inserts @ts-nocheck at the very beginning of the file
 * 5. Preserves existing directives and file structure
 *
 * Examples of transformations:
 *
 * Regular component file:
 * ```
 * 'use client'
 * // WARNING: This file is auto-generated...
 * import React from 'react'
 * // becomes:
 * // @ts-nocheck
 * 'use client'
 * // WARNING: This file is auto-generated...
 * import React from 'react'
 * ```
 *
 * File without 'use client':
 * ```
 * // WARNING: This file is auto-generated...
 * import React from 'react'
 * // becomes:
 * // @ts-nocheck
 * // WARNING: This file is auto-generated...
 * import React from 'react'
 * ```
 *
 * Uses CLI framework Result types for consistent error handling.
 * Pure functional interface with no classes.
 */

import type { Result, CLIError } from '@esteban-url/cli/core'
import { createTransformMetadata, executeTransform, type TransformResult } from '../utils.js'

/**
 * Transform metadata
 */
export const tsNocheckTransform = createTransformMetadata(
  'ts-nocheck',
  'Add @ts-nocheck directive to generated files',
  'format'
)

/**
 * Add @ts-nocheck directive to suppress TypeScript checking in specific files
 *
 * Transform process:
 * 1. Check if current file is in the target list (skip if not)
 * 2. Check if file already has @ts-nocheck directive (skip if present)
 * 3. Detect file structure (with/without 'use client')
 * 4. Insert @ts-nocheck at the very beginning of the file
 * 5. Preserve existing directives and content structure
 *
 * Examples:
 * - Adds `// @ts-nocheck` as the first line of the file
 * - Preserves 'use client' directive placement
 * - Maintains existing file headers and imports
 * - Only applies to files with known TypeScript issues
 */
export function transformTsNocheck(
  input: string,
  filename?: string
): Result<TransformResult, CLIError> {
  return executeTransform(() => {
    let content = input
    const warnings: string[] = []
    let changed = false

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 1: Check if File Should Be Processed
    // Finds:
    //        catalyst-combobox.tsx, catalyst-dropdown.tsx, catalyst-listbox.tsx
    //        (only these files need @ts-nocheck due to complex Headless UI types)
    //
    /////////////////////////////////////////////////////////////////////////////////
    const targetFiles = ['catalyst-combobox.tsx', 'catalyst-dropdown.tsx', 'catalyst-listbox.tsx']

    const shouldProcess = filename && targetFiles.some((target) => filename.includes(target))

    if (!shouldProcess) {
      return { content, changed: false, warnings: [] }
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 2: Check for Existing @ts-nocheck Directive
    // Finds:
    //        '// @ts-nocheck' at the beginning of file
    //        to avoid adding duplicate directives
    //
    /////////////////////////////////////////////////////////////////////////////////
    const hasNocheckDirective = content.includes('// @ts-nocheck')

    if (hasNocheckDirective) {
      warnings.push('File already has @ts-nocheck directive')
      return { content, changed: false, warnings }
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 3: Add @ts-nocheck at Beginning of File
    //
    // From:  'use client'\n// WARNING: This file is auto-generated...
    // To:    // @ts-nocheck\n'use client'\n// WARNING: This file is auto-generated...
    //
    /////////////////////////////////////////////////////////////////////////////////
    content = `// @ts-nocheck\n${content}`
    changed = true

    return { content, changed, warnings }
  })
}
