// @ts-nocheck
/**
 * Type alias transformation for Catalyst prefix transformations
 *
 * Handles transformation of TypeScript type alias declarations to use Catalyst
 * prefixes and ensures prop types are properly exported.
 *
 * NOTE: This is a legacy jscodeshift-based implementation that is no longer used.
 * The functionality has been migrated to TypeScript AST in core.ts
 */

import type { TSASTContext } from './core.js';

/**
 * Update type alias declarations and ensure they are properly exported
 * @deprecated This function is no longer used - functionality moved to core.ts
 */
export function updateTypeAliasDeclarations(context: TSASTContext): void {
  const { j, root, changes } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 8: Update Type Alias Declarations and ensure prop types are exported
  // Finds:
  //        type ButtonProps = {...} to rename and export
  //
  /////////////////////////////////////////////////////////////////////////////////
  root.find(j.TSTypeAliasDeclaration).forEach((typeDecl: any) => {
    const typeName = typeDecl.node.id.name;
    if (typeof typeName === 'string') {
      // Rename to Catalyst prefix if not already present
      if (!typeName.startsWith('Catalyst')) {
        const newTypeName = `Catalyst${typeName}`;
        typeDecl.node.id.name = newTypeName;
        /////////////////////////////////////////////////////////////////////////////////
        //
        // From:  type ButtonProps = {...}
        // To:    type CatalystButtonProps = {...}
        //
        /////////////////////////////////////////////////////////////////////////////////
        changes.push(`Updated type alias from ${typeName} to ${newTypeName}`);
      }

      // Ensure component prop types are exported
      const finalTypeName = typeDecl.node.id.name;
      if (finalTypeName.includes('Props') && finalTypeName.startsWith('Catalyst')) {
        // Check if parent is already an export declaration
        const parentPath = typeDecl.parent;
        const isAlreadyExported =
          parentPath && parentPath.value && parentPath.value.type === 'ExportNamedDeclaration';

        if (!isAlreadyExported) {
          // Replace the type declaration with an export
          const exportDecl = j.exportNamedDeclaration(typeDecl.node);
          typeDecl.replace(exportDecl);
          /////////////////////////////////////////////////////////////////////////////////
          //
          // From:  type CatalystButtonProps = {...}
          // To:    export type CatalystButtonProps = {...}
          //
          /////////////////////////////////////////////////////////////////////////////////
          changes.push(`Exported prop type: export type ${finalTypeName}`);
        }
      }
    }
  });
}
