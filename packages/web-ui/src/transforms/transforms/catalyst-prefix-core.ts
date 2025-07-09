/**
 * Core AST utilities and mapping system for Catalyst prefix transformations
 *
 * Provides the foundational AST parsing, component detection, and name mapping
 * system used by the Catalyst prefix transform. Handles the complex jscodeshift
 * operations and maintains the old-to-new name mapping system.
 */

import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';
import { createRequire } from 'module';

// Create require function for ESM compatibility
const require = createRequire(import.meta.url);

/**
 * AST utilities and core transformation setup
 */
export interface ASTContext {
  jscodeshift: any;
  j: any;
  root: any;
  oldToNewMap: Map<string, string>;
  headlessPropsTypes: Set<string>;
  changes: string[];
  warnings: string[];
}

/**
 * Initialize jscodeshift and create AST context
 */
export function createASTContext(input: string): Result<ASTContext, CLIError> {
  try {
    const jscodeshift = require('jscodeshift');
    const j = jscodeshift.withParser('tsx');
    const root = j(input);

    return {
      success: true,
      value: {
        jscodeshift,
        j,
        root,
        oldToNewMap: new Map<string, string>(),
        headlessPropsTypes: new Set<string>(),
        changes: [],
        warnings: [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'AST_INIT_ERROR',
        message: `Failed to initialize AST: ${error instanceof Error ? error.message : String(error)}`,
        recoverable: false,
      },
    };
  }
}

/**
 * Process export declarations and build initial function name mappings
 */
export function processExportDeclarations(context: ASTContext): void {
  const { j, root, changes } = context;

  //////////////////////////////////////////////////////////////////////////////////
  // Phase 1: Export Declaration Processing
  // Finds:
  //        export function Button() {...}
  //        export const Button = ...
  //
  //////////////////////////////////////////////////////////////////////////////////
  root.find(j.ExportNamedDeclaration).forEach((exportDecl: any) => {
    if (exportDecl.node.declaration) {
      let funcName: string | undefined;

      if (j.FunctionDeclaration.check(exportDecl.node.declaration)) {
        funcName = exportDecl.node.declaration.id?.name.toString();
      } else if (j.VariableDeclaration.check(exportDecl.node.declaration)) {
        const firstDeclarator = exportDecl.node.declaration.declarations[0];
        if (
          firstDeclarator &&
          j.VariableDeclarator.check(firstDeclarator) &&
          j.Identifier.check(firstDeclarator.id)
        ) {
          funcName = firstDeclarator.id.name.toString();
        }
      }

      if (funcName && !funcName.startsWith('Catalyst')) {
        if (j.FunctionDeclaration.check(exportDecl.node.declaration)) {
          exportDecl.node.declaration.id!.name = `Catalyst${funcName}`;
        } else if (j.VariableDeclaration.check(exportDecl.node.declaration)) {
          const firstDeclarator = exportDecl.node.declaration.declarations[0];
          if (
            firstDeclarator &&
            j.VariableDeclarator.check(firstDeclarator) &&
            j.Identifier.check(firstDeclarator.id)
          ) {
            firstDeclarator.id.name = `Catalyst${funcName}`;
          }
        }
        /////////////////////////////////////////////////////////////////////////////////
        //
        // From:  export function Button()
        // To:    export function CatalystButton()
        //
        /////////////////////////////////////////////////////////////////////////////////
        changes.push(`Updated function name from ${funcName} to Catalyst${funcName}`);
      }
    }
  });
}

/**
 * Build comprehensive mapping system for all component names and types
 */
export function buildComprehensiveMapping(context: ASTContext): void {
  const { j, root, oldToNewMap } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 2: Build Comprehensive Mapping System
  // Collect all exported function names and type definitions
  // Finds:
  //        export function Button() {...}
  //        export const Button = forwardRef(...)
  //
  /////////////////////////////////////////////////////////////////////////////////
  root.find(j.ExportNamedDeclaration).forEach((exportDecl: any) => {
    if (exportDecl.node.declaration) {
      let funcName: string | undefined;

      if (j.FunctionDeclaration.check(exportDecl.node.declaration)) {
        funcName = exportDecl.node.declaration.id?.name.toString();
      } else if (j.VariableDeclaration.check(exportDecl.node.declaration)) {
        const firstDeclarator = exportDecl.node.declaration.declarations[0];
        if (
          firstDeclarator &&
          j.VariableDeclarator.check(firstDeclarator) &&
          j.Identifier.check(firstDeclarator.id)
        ) {
          funcName = firstDeclarator.id.name.toString();
        }
      }

      if (funcName) {
        if (!funcName.startsWith('Catalyst')) {
          oldToNewMap.set(funcName, `Catalyst${funcName}`);
        } else {
          const baseName = funcName.replace('Catalyst', '');
          if (baseName && !oldToNewMap.has(baseName)) {
            oldToNewMap.set(baseName, funcName);
          }
        }
      }
    }
  });
}

/**
 * Detect and protect Headless UI references from transformation
 */
export function detectHeadlessReferences(context: ASTContext): void {
  const { j, root, headlessPropsTypes } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 3: Headless Props Detection - Find ALL Headless references to protect them
  // Finds:
  //        import { Button, ButtonProps } from '@headlessui/react'
  //        import * as Headless from '@headlessui/react'
  //
  /////////////////////////////////////////////////////////////////////////////////
  root.find(j.ImportDeclaration).forEach((importDecl: any) => {
    const source = importDecl.node.source.value?.toString() || '';
    if (source === '@headlessui/react') {
      importDecl.node.specifiers?.forEach((specifier: any) => {
        // Handle named imports: import { Button, ButtonProps } from '@headlessui/react'
        if (j.ImportSpecifier.check(specifier) && j.Identifier.check(specifier.imported)) {
          headlessPropsTypes.add(specifier.imported.name);
        }
        // Handle namespace imports: import * as Headless from '@headlessui/react'
        // For namespace imports, qualified names like Headless.ButtonProps are protected
        // by the AST structure in the qualified name transformation logic
        else if (j.ImportNamespaceSpecifier.check(specifier)) {
          // Namespace imports are protected by qualified name logic in Phase 7.9
          // No individual type names need to be added to protection set
        }
      });
    }
  });
}

/**
 * Map type aliases and ensure they follow Catalyst naming
 */
export function mapTypeAliases(context: ASTContext): void {
  const { j, root, oldToNewMap, headlessPropsTypes } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 4: Type Alias Mapping
  // Finds:
  //        type ButtonProps = {...}
  //        type CatalystButtonProps = {...}
  //
  /////////////////////////////////////////////////////////////////////////////////
  root.find(j.TSTypeAliasDeclaration).forEach((typeDecl: any) => {
    const typeName = typeDecl.node.id.name;
    if (typeof typeName === 'string') {
      if (!typeName.startsWith('Catalyst')) {
        if (!headlessPropsTypes.has(typeName)) {
          oldToNewMap.set(typeName, `Catalyst${typeName}`);
        }
      } else {
        const baseName = typeName.replace('Catalyst', '');
        if (baseName && !oldToNewMap.has(baseName) && !headlessPropsTypes.has(baseName)) {
          oldToNewMap.set(baseName, typeName);
        }
      }
    }
  });

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 5: Props Suffix Handling
  // Automatically generate Props mappings for discovered Catalyst components
  // Finds:
  //        CatalystButton → ButtonProps should map to CatalystButtonProps
  //        CatalystInput → InputProps should map to CatalystInputProps
  //
  /////////////////////////////////////////////////////////////////////////////////
  const catalystFunctions = Array.from(oldToNewMap.values()).filter(name =>
    name.startsWith('Catalyst')
  );

  catalystFunctions.forEach(catalystName => {
    const baseName = catalystName.replace('Catalyst', '');
    if (baseName) {
      const basePropsName = `${baseName}Props`;
      const catalystPropsName = `Catalyst${baseName}Props`;
      if (!oldToNewMap.has(basePropsName) && !headlessPropsTypes.has(basePropsName)) {
        oldToNewMap.set(basePropsName, catalystPropsName);
      }
    }
  });
}

/**
 * Generate final transformed code from AST
 */
export function generateTransformedCode(context: ASTContext): string {
  const { root } = context;

  return root.toSource({
    quote: 'single',
    lineTerminator: '\n',
    tabWidth: 2,
  });
}
