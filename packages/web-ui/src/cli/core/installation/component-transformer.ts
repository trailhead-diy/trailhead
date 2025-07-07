/**
 * Component transformation module for no-wrapper installation
 */

import type { Result, InstallError } from './types.js';
import { Ok, Err } from './types.js';
import { createError } from '@esteban-url/trailhead-cli/core';

// ============================================================================
// TYPES
// ============================================================================

interface TransformOptions {
  readonly removePrefix: string; // 'catalyst-'
  readonly updateExports: ReadonlyMap<string, string>; // CatalystButton -> Button
  readonly updateImports: ReadonlyMap<string, string>; // './catalyst-text' -> './text'
  readonly fixRelativePaths: ReadonlyMap<string, string>; // '../utils/cn' -> './utils/cn'
}

interface TransformResult {
  readonly content: string;
  readonly transformations: readonly string[];
}

type TransformPattern = {
  readonly regex: RegExp;
  readonly replacement: string | ((match: string) => string);
  readonly description: string;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const CATALYST_PREFIX = 'catalyst-';
const CATALYST_COMPONENT_PREFIX = 'Catalyst';

// Component name mappings - only store the base names
const COMPONENT_NAMES = [
  'Alert',
  'AlertTitle',
  'AlertDescription',
  'AlertBody',
  'AlertActions',
  'AuthLayout',
  'Avatar',
  'AvatarButton',
  'Badge',
  'BadgeButton',
  'Button',
  'TouchTarget',
  'Checkbox',
  'CheckboxGroup',
  'CheckboxField',
  'Combobox',
  'ComboboxInput',
  'ComboboxButton',
  'ComboboxOptions',
  'ComboboxOption',
  'ComboboxLabel',
  'DescriptionList',
  'DescriptionTerm',
  'DescriptionDetails',
  'Dialog',
  'DialogTitle',
  'DialogDescription',
  'DialogBody',
  'DialogActions',
  'Divider',
  'Dropdown',
  'DropdownButton',
  'DropdownMenu',
  'DropdownItem',
  'DropdownLabel',
  'DropdownHeader',
  'DropdownSection',
  'DropdownHeading',
  'DropdownDivider',
  'DropdownShortcut',
  'DropdownDescription',
  'Fieldset',
  'Legend',
  'FieldGroup',
  'Field',
  'Label',
  'Description',
  'ErrorMessage',
  'Heading',
  'Subheading',
  'Input',
  'InputGroup',
  'Link',
  'Listbox',
  'ListboxButton',
  'ListboxOptions',
  'ListboxOption',
  'ListboxLabel',
  'Navbar',
  'NavbarDivider',
  'NavbarSection',
  'NavbarSpacer',
  'NavbarItem',
  'NavbarLabel',
  'Pagination',
  'PaginationPrevious',
  'PaginationNext',
  'PaginationList',
  'PaginationPage',
  'PaginationGap',
  'Radio',
  'RadioGroup',
  'RadioField',
  'Select',
  'SidebarLayout',
  'Sidebar',
  'SidebarHeader',
  'SidebarBody',
  'SidebarFooter',
  'SidebarSection',
  'SidebarDivider',
  'SidebarSpacer',
  'SidebarHeading',
  'SidebarItem',
  'SidebarLabel',
  'StackedLayout',
  'Switch',
  'SwitchGroup',
  'SwitchField',
  'Table',
  'TableHead',
  'TableBody',
  'TableRow',
  'TableHeader',
  'TableCell',
  'Text',
  'TextLink',
  'Strong',
  'Code',
  'Textarea',
  // Common type patterns
  'ButtonProps',
  'AlertProps',
  'DialogProps',
  'BadgeProps',
] as const;

// Paths that need to be fixed when moving files up one level
const RELATIVE_PATH_FIXES = [
  ['../utils/cn', './utils/cn'],
  ['../theme/index', './theme/index'],
  ['../theme', './theme'],
] as const;

// ============================================================================
// PURE HELPER FUNCTIONS
// ============================================================================

/**
 * Convert component name to kebab-case
 */
const toKebabCase = (name: string): string => {
  return name
    .replace(/([A-Z])/g, (match, p1, offset) => (offset > 0 ? '-' : '') + p1.toLowerCase())
    .toLowerCase();
};

/**
 * Generate component export map from base names
 */
const generateComponentMap = (): ReadonlyMap<string, string> => {
  const entries = COMPONENT_NAMES.map(
    name => [`${CATALYST_COMPONENT_PREFIX}${name}`, name] as const
  );
  return Object.freeze(new Map(entries));
};

/**
 * Generate import path map from component names
 */
const generateImportMap = (): ReadonlyMap<string, string> => {
  const entries = COMPONENT_NAMES.map(name => {
    const kebabName = toKebabCase(name);
    return [`./${CATALYST_PREFIX}${kebabName}`, `./${kebabName}`] as const;
  });
  return Object.freeze(new Map(entries));
};

/**
 * Generate relative path fixes map
 */
const generatePathFixMap = (): ReadonlyMap<string, string> => {
  return Object.freeze(new Map(RELATIVE_PATH_FIXES));
};

/**
 * Apply a single transformation pattern
 */
const applyTransformation = (
  content: string,
  pattern: TransformPattern,
  transformations: string[]
): string => {
  const before = content;
  const after = typeof pattern.replacement === 'string' 
    ? content.replace(pattern.regex, pattern.replacement)
    : content.replace(pattern.regex, pattern.replacement);

  if (before !== after) {
    transformations.push(pattern.description);
  }

  return after;
};

/**
 * Create transformation patterns for exports
 */
const createExportPatterns = (oldName: string, newName: string): readonly TransformPattern[] => [
  {
    regex: new RegExp(`export\\s+function\\s+${oldName}`, 'g'),
    replacement: `export function ${newName}`,
    description: `Renamed export function ${oldName} to ${newName}`,
  },
  {
    regex: new RegExp(`export\\s+const\\s+${oldName}`, 'g'),
    replacement: `export const ${newName}`,
    description: `Renamed export const ${oldName} to ${newName}`,
  },
  {
    regex: new RegExp(`export\\s+type\\s+${oldName}`, 'g'),
    replacement: `export type ${newName}`,
    description: `Renamed export type ${oldName} to ${newName}`,
  },
];

/**
 * Create transformation pattern for imports
 */
const createImportPattern = (oldPath: string, newPath: string): TransformPattern => ({
  regex: new RegExp(`from\\s+['"]${oldPath}['"]`, 'g'),
  replacement: `from '${newPath}'`,
  description: `Updated import path ${oldPath} to ${newPath}`,
});

/**
 * Create transformation pattern for component references
 */
const createReferencePattern = (oldName: string, newName: string): TransformPattern => ({
  regex: new RegExp(`\\b${oldName}\\b`, 'g'),
  replacement: newName,
  description: `Updated references from ${oldName} to ${newName}`,
});

// ============================================================================
// MAIN TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transform component file content for no-wrapper installation
 * @returns Transformed content with applied transformations
 */
export const transformComponentContent = (
  content: string,
  fileName: string,
  options: TransformOptions
): TransformResult => {
  let transformed = content;
  const transformations: string[] = [];

  // Apply export transformations
  options.updateExports.forEach((newName, oldName) => {
    const patterns = createExportPatterns(oldName, newName);
    patterns.forEach(pattern => {
      transformed = applyTransformation(transformed, pattern, transformations);
    });
  });

  // Apply import path transformations
  options.updateImports.forEach((newPath, oldPath) => {
    const pattern = createImportPattern(oldPath, newPath);
    transformed = applyTransformation(transformed, pattern, transformations);
  });

  // Apply component reference transformations
  options.updateExports.forEach((newName, oldName) => {
    const pattern = createReferencePattern(oldName, newName);
    transformed = applyTransformation(transformed, pattern, transformations);
  });

  // Apply relative path fixes
  options.fixRelativePaths.forEach((newPath, oldPath) => {
    const pattern = createImportPattern(oldPath, newPath);
    transformed = applyTransformation(transformed, pattern, transformations);
  });

  return {
    content: transformed,
    transformations: Object.freeze(transformations),
  };
};

/**
 * Get transformation options for a component
 * Pure function that returns immutable transformation options
 */
export const getTransformOptions = (_componentName: string): TransformOptions => {
  return Object.freeze({
    removePrefix: CATALYST_PREFIX,
    updateExports: generateComponentMap(),
    updateImports: generateImportMap(),
    fixRelativePaths: generatePathFixMap(),
  });
};

/**
 * Transform lib/index.ts content for no-wrapper installation
 * @returns Transformed content with updated export paths
 */
export const transformLibIndexContent = (content: string): TransformResult => {
  const transformations: string[] = [];

  const pattern: TransformPattern = {
    regex: /from '\.\/catalyst-/g,
    replacement: "from './",
    description: 'Removed catalyst- prefix from all export paths',
  };

  const transformed = applyTransformation(content, pattern, transformations);

  return {
    content: transformed,
    transformations: Object.freeze(transformations),
  };
};

/**
 * Get the new filename without catalyst prefix
 * Pure function for filename transformation
 */
export const getTransformedFileName = (fileName: string): string => {
  return fileName.startsWith(CATALYST_PREFIX)
    ? fileName.substring(CATALYST_PREFIX.length)
    : fileName;
};

/**
 * Validate transformation result
 * Ensures transformed content is valid before writing
 */
export const validateTransformResult = (
  result: TransformResult,
  fileName: string
): Result<TransformResult, InstallError> => {
  // Check for empty content
  if (!result.content || result.content.trim().length === 0) {
    return Err(
      createError('VALIDATION_ERROR', `Transformation resulted in empty content for ${fileName}`, {
        details: `Empty content detected for file: ${fileName}`,
      })
    );
  }

  // Check for basic syntax integrity - only validate if it's not an index file
  // Index files might have different export patterns
  const exportCount = (result.content.match(/export/g) || []).length;
  if (exportCount === 0 && !fileName.includes('index')) {
    return Err(
      createError('VALIDATION_ERROR', `No exports found in transformed ${fileName}`, {
        details: `No exports detected in transformed file: ${fileName}`,
      })
    );
  }

  return Ok(result);
};
