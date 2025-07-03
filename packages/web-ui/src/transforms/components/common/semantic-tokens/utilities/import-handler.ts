/**
 * Import handler utility for semantic token enhancements
 * Provides reusable functions for managing semantic imports
 */

import type { API, Collection } from 'jscodeshift';

export interface ImportToAdd {
  imported: string;
  source: string;
}

export interface ImportHandlerResult {
  hasChanges: boolean;
  changes: any[];
}

/**
 * Components that don't have semantic styling functions available
 */
const NOOP_COMPONENTS = new Set([
  'DescriptionList', // No styling function defined
  'Divider', // No styling function defined
  'Heading', // No styling function defined
  'Pagination', // No styling function defined
  'Select', // No styling function defined
  'Sidebar', // No styling function defined
  'SidebarLayout', // No styling function defined
  'StackedLayout', // No styling function defined
  'AuthLayout', // No styling function defined
  'Fieldset', // No styling function defined
  'Avatar', // No styling function defined
]);

/**
 * Special case mappings for components that use different semantic functions
 */
const SPECIAL_MAPPINGS: Record<string, string> = {
  Textarea: 'createSemanticTextStyles', // Textarea uses Text styles
};

/**
 * Get semantic function name using pure convention
 * TypeScript will catch missing functions at compile time
 */
function getSemanticFunction(componentName: string): string | null {
  // Skip noop components that don't need semantic styling
  if (NOOP_COMPONENTS.has(componentName)) {
    return null;
  }

  // Handle special cases
  if (SPECIAL_MAPPINGS[componentName]) {
    return SPECIAL_MAPPINGS[componentName];
  }

  // Pure convention: Alert -> createSemanticAlertStyles
  return `createSemantic${componentName}Styles`;
}

/**
 * Helper function to add basic semantic imports (without component-specific functions)
 */
function addBasicSemanticImports(
  root: Collection<any>,
  j: API['jscodeshift'],
  importsToAdd: ImportToAdd[],
  changes: any[]
): ImportHandlerResult {
  // Check for existing semantic token imports (correct path)
  const correctSemanticImport = root.find(j.ImportDeclaration, {
    source: { value: '../theme/semantic-tokens.js' },
  });

  // Check for incorrect path imports that need to be cleaned up
  const incorrectSemanticImport = root.find(j.ImportDeclaration, {
    source: { value: '../../theme/semantic-tokens.js' },
  });

  // Check for legacy imports from '../theme/index' that contain semantic tokens
  const legacyThemeImport = root.find(j.ImportDeclaration, {
    source: { value: '../theme/index' },
  });

  // Remove incorrect imports if they exist
  if (incorrectSemanticImport.length > 0) {
    incorrectSemanticImport.remove();
    changes.push({
      type: 'import',
      description: 'Removed incorrect semantic tokens import path',
    });
  }

  // Check if all imports already exist in any semantic import source
  const allImportsExist = importsToAdd.every(({ imported }) => {
    // Check correct semantic import
    const existsInCorrect = correctSemanticImport.some(path => {
      const importSpecifiers = path.node.specifiers || [];
      return importSpecifiers.some(
        spec => spec.type === 'ImportSpecifier' && spec.imported.name === imported
      );
    });

    // Check legacy theme import
    const existsInLegacy = legacyThemeImport.some(path => {
      const importSpecifiers = path.node.specifiers || [];
      return importSpecifiers.some(
        spec => spec.type === 'ImportSpecifier' && spec.imported.name === imported
      );
    });

    return existsInCorrect || existsInLegacy;
  });

  if (allImportsExist) {
    return { hasChanges: changes.length > 0, changes };
  }

  if (correctSemanticImport.length > 0) {
    // Add to existing correct import
    correctSemanticImport.forEach(path => {
      const importSpecifiers = path.node.specifiers || [];
      let added = false;

      importsToAdd.forEach(({ imported }) => {
        const exists = importSpecifiers.some(
          spec => spec.type === 'ImportSpecifier' && spec.imported.name === imported
        );

        // Also check if it exists in legacy theme import
        const existsInLegacy = legacyThemeImport.some(legacyPath => {
          const legacySpecifiers = legacyPath.node.specifiers || [];
          return legacySpecifiers.some(
            spec => spec.type === 'ImportSpecifier' && spec.imported.name === imported
          );
        });

        if (!exists && !existsInLegacy) {
          importSpecifiers.push(j.importSpecifier(j.identifier(imported)));
          added = true;
          changes.push({
            type: 'import',
            description: `Added ${imported} to semantic tokens import`,
          });
        }
      });

      if (added) {
        path.node.specifiers = importSpecifiers;
      }
    });
  } else {
    // Filter out imports that already exist in legacy theme import
    const importsToActuallyAdd = importsToAdd.filter(({ imported }) => {
      const existsInLegacy = legacyThemeImport.some(legacyPath => {
        const legacySpecifiers = legacyPath.node.specifiers || [];
        return legacySpecifiers.some(
          spec => spec.type === 'ImportSpecifier' && spec.imported.name === imported
        );
      });
      return !existsInLegacy;
    });

    // Add new import after the last import only if there are imports to add
    if (importsToActuallyAdd.length > 0) {
      const lastImport = root.find(j.ImportDeclaration).at(-1);
      if (lastImport.length > 0) {
        lastImport.insertAfter(
          j.importDeclaration(
            importsToActuallyAdd.map(({ imported }) => j.importSpecifier(j.identifier(imported))),
            j.stringLiteral('../theme/semantic-tokens.js')
          )
        );
        changes.push({
          type: 'import',
          description: 'Added basic semantic token imports',
        });
      }
    }
  }

  return {
    hasChanges: changes.length > 0,
    changes,
  };
}

/**
 * Add semantic imports to a file
 * Handles both adding to existing imports and creating new import declarations
 */
export function addSemanticImports(
  root: Collection<any>,
  j: API['jscodeshift'],
  componentName: string
): ImportHandlerResult {
  const changes: any[] = [];

  // Get semantic function name using simple convention
  const semanticFunction = getSemanticFunction(componentName);

  // If this is a noop component, skip semantic imports entirely
  if (!semanticFunction) {
    return { hasChanges: false, changes: [] };
  }

  // Standard imports for semantic enhancements
  const importsToAdd: ImportToAdd[] = [
    { imported: 'SemanticColorToken', source: '../theme/semantic-tokens.js' },
    { imported: 'isSemanticToken', source: '../theme/semantic-tokens.js' },
    { imported: semanticFunction, source: '../theme/semantic-tokens.js' },
  ];

  // Use the helper function to add all imports
  return addBasicSemanticImports(root, j, importsToAdd, changes);
}
