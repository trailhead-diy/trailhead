/**
 * Functional transform to add Catalyst prefix to component names, types, and imports
 *
 * Transforms React components to use consistent Catalyst naming conventions by:
 * 1. Adding "Catalyst" prefix to component function names
 * 2. Adding "Catalyst" prefix to TypeScript type definitions
 * 3. Updating import paths to use catalyst- prefix
 * 4. Ensuring prop types are properly exported
 * 5. Protecting Headless UI imports from transformation
 *
 * Examples of transformations:
 *
 * Function exports:
 * ```
 * export function Button(props: ButtonProps) { ... }
 * // becomes:
 * export function CatalystButton(props: CatalystButtonProps) { ... }
 * ```
 *
 * Type definitions:
 * ```
 * type ButtonProps = { color?: string; }
 * // becomes:
 * export type CatalystButtonProps = { color?: string; }
 * ```
 *
 * Import statements:
 * ```
 * import { Link } from './link'
 * // becomes:
 * import { CatalystLink } from './catalyst-link'
 * ```
 *
 * Component parameter types:
 * ```
 * export const CatalystButton = forwardRef(function CatalystButton(
 *   { color, ...props }: ButtonProps,
 *   ref: React.ForwardedRef<HTMLElement>
 * ) {
 * // becomes:
 * export const CatalystButton = forwardRef(function CatalystButton(
 *   { color, ...props }: CatalystButtonProps,
 *   ref: React.ForwardedRef<HTMLElement>
 * ) {
 * ```
 *
 * Headless UI protection (NEVER transforms these):
 * ```
 * import * as Headless from '@headlessui/react'
 *
 * // These are NEVER transformed:
 * Omit<Headless.ButtonProps, 'as' | 'className'>  // ← stays as-is
 * Headless.Dialog                                  // ← stays as-is
 * Headless.DialogTitle                             // ← stays as-is
 * ```
 */

import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';
import { createRequire } from 'module';
import { createTransformMetadata, executeTransform, type TransformResult } from '../utils.js';

// Create require function for ESM compatibility
const require = createRequire(import.meta.url);

/**
 * Transform metadata
 */
export const catalystPrefixTransform = createTransformMetadata(
  'catalyst-prefix',
  'Add Catalyst prefix to component names',
  'format'
);

/**
 * Add Catalyst prefix to component names, types, and imports using AST transformation
 *
 * Examples:
 * From:  export function Button(props: ButtonProps)
 * To:    export function CatalystButton(props: CatalystButtonProps)
 *
 * From:  type ButtonProps = {...}
 * To:    export type CatalystButtonProps = {...}
 *
 * From:  import { Link } from './link'
 * To:    import { CatalystLink } from './catalyst-link'
 */
export function transformCatalystPrefix(input: string): Result<TransformResult, CLIError> {
  return executeTransform(() => {
    // Initialize jscodeshift
    const jscodeshift = require('jscodeshift');
    const j = jscodeshift.withParser('tsx');
    const root = j(input);

    const changes: string[] = [];
    const warnings: string[] = [];

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

    const oldToNewMap = new Map<string, string>();

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

    const headlessPropsTypes = new Set<string>();

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

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 6: Import Declaration Processing (NEVER modify Headless imports)
    // Finds:
    //        import { Link } from './link'
    //        (transforms to ./catalyst-link)
    //
    /////////////////////////////////////////////////////////////////////////////////
    root.find(j.ImportDeclaration).forEach((importDecl: any) => {
      const source = importDecl.node.source.value?.toString() || '';

      // Skip all @headlessui/react imports - never transform them
      if (source === '@headlessui/react') {
        return;
      }

      if (source.startsWith('./') && !source.startsWith('./catalyst-')) {
        const newSource = `./catalyst-${source.slice(2)}`;

        importDecl.node.specifiers?.forEach((specifier: any) => {
          if (j.ImportSpecifier.check(specifier) && j.Identifier.check(specifier.imported)) {
            if (!specifier.imported.name.startsWith('Catalyst')) {
              const oldName = specifier.imported.name;
              const newName = `Catalyst${oldName}`;
              specifier.imported.name = newName;
              oldToNewMap.set(oldName, newName);
            }
          }
        });
        importDecl.node.source.value = newSource;
        /////////////////////////////////////////////////////////////////////////////////
        //
        // From:  import { Link } from './link'
        // To:    import { CatalystLink } from './catalyst-link'
        //
        /////////////////////////////////////////////////////////////////////////////////
        changes.push(`Updated import from ${source} to ${newSource}`);
      }
    });

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 7: Update Function Parameter Types
    // Handle function expressions and arrow functions in variable declarations
    // Finds:
    //        const CatalystButton = forwardRef(function Button({ color }: ButtonProps) {...})
    //
    /////////////////////////////////////////////////////////////////////////////////
    root.find(j.VariableDeclaration).forEach((varDecl: any) => {
      varDecl.node.declarations.forEach((declarator: any) => {
        if (j.Identifier.check(declarator.id) && declarator.id.name.startsWith('Catalyst')) {
          const funcName = declarator.id.name;
          let funcNode = null;

          if (j.ArrowFunctionExpression.check(declarator.init)) {
            funcNode = declarator.init;
          } else if (
            j.CallExpression.check(declarator.init) &&
            declarator.init.callee &&
            j.Identifier.check(declarator.init.callee) &&
            declarator.init.callee.name === 'forwardRef' &&
            declarator.init.arguments.length > 0
          ) {
            const firstArg = declarator.init.arguments[0];
            if (j.ArrowFunctionExpression.check(firstArg)) {
              funcNode = firstArg;
            } else if (j.FunctionExpression.check(firstArg)) {
              funcNode = firstArg;
            }
          }

          if (funcNode && funcNode.params && funcNode.params.length > 0) {
            const firstParam = funcNode.params[0];
            if (j.ObjectPattern.check(firstParam) && firstParam.typeAnnotation) {
              const typeAnnotation = firstParam.typeAnnotation;
              if (
                j.TSTypeAnnotation.check(typeAnnotation) &&
                j.TSTypeReference.check(typeAnnotation.typeAnnotation) &&
                j.Identifier.check(typeAnnotation.typeAnnotation.typeName)
              ) {
                const currentTypeName = typeAnnotation.typeAnnotation.typeName.name;
                const baseName = funcName.replace('Catalyst', '');
                const expectedTypeName = `Catalyst${baseName}Props`;

                // If using generic ButtonProps, etc., update to component-specific type
                // BUT NEVER add Headless types to the mapping!
                const shouldTransform =
                  (currentTypeName === 'ButtonProps' ||
                    currentTypeName === 'ComboboxProps' ||
                    currentTypeName === 'DropdownProps' ||
                    currentTypeName === 'ListboxProps' ||
                    (currentTypeName === `${baseName}Props` &&
                      !currentTypeName.startsWith('Catalyst')) ||
                    (currentTypeName.endsWith('Props') &&
                      !currentTypeName.startsWith('Catalyst'))) &&
                  !headlessPropsTypes.has(currentTypeName);

                if (shouldTransform) {
                  typeAnnotation.typeAnnotation.typeName.name = expectedTypeName;
                  /////////////////////////////////////////////////////////////////////////////////
                  //
                  // From:  function CatalystButton({ color }: ButtonProps)
                  // To:    function CatalystButton({ color }: CatalystButtonProps)
                  //
                  /////////////////////////////////////////////////////////////////////////////////
                  changes.push(
                    `Updated function parameter type from ${currentTypeName} to ${expectedTypeName} in ${funcName}`
                  );

                  // Only add to mapping if it's not a Headless type
                  if (!headlessPropsTypes.has(currentTypeName)) {
                    oldToNewMap.set(currentTypeName, expectedTypeName);
                  }
                }
              }
            }
          }
        }
      });
    });

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 7.5: Update typeof usages
    // Apply mapping transformations to typeof expressions
    // Finds:
    //        typeof Button in ComponentPropsWithoutRef<typeof Button>
    //
    /////////////////////////////////////////////////////////////////////////////////
    root.find(j.TSTypeQuery).forEach((typeQuery: any) => {
      if (j.Identifier.check(typeQuery.node.exprName)) {
        const oldName = typeQuery.node.exprName.name;
        const newName = oldToNewMap.get(oldName);
        if (newName) {
          typeQuery.node.exprName = j.identifier(newName);
          /////////////////////////////////////////////////////////////////////////////////
          //
          // From:  ComponentPropsWithoutRef<typeof Button>
          // To:    ComponentPropsWithoutRef<typeof CatalystButton>
          //
          /////////////////////////////////////////////////////////////////////////////////
          changes.push(`Updated typeof reference from typeof ${oldName} to typeof ${newName}`);
        }
      }
    });

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 7.6: Update JSX expressions (as={Component})
    // Finds:
    //        <Component as={Button} /> where Button is inside JSX expression
    //
    /////////////////////////////////////////////////////////////////////////////////
    root.find(j.JSXExpressionContainer).forEach((expression: any) => {
      if (j.Identifier.check(expression.node.expression)) {
        const oldName = expression.node.expression.name;
        const newName = oldToNewMap.get(oldName);
        if (newName) {
          expression.node.expression = j.identifier(newName);
          /////////////////////////////////////////////////////////////////////////////////
          //
          // From:  <Component as={Button} />
          // To:    <Component as={CatalystButton} />
          //
          /////////////////////////////////////////////////////////////////////////////////
          changes.push(`Updated JSX expression from as={${oldName}} to as={${newName}}`);
        }
      }
    });

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 7.7: Update JSX opening elements
    // Finds:
    //        <Button color="blue"> in JSX tags
    //
    /////////////////////////////////////////////////////////////////////////////////
    root.find(j.JSXOpeningElement).forEach((openingElement: any) => {
      const name = openingElement.node.name;
      if (j.JSXIdentifier.check(name)) {
        const oldName = name.name;
        const newName = oldToNewMap.get(oldName);
        if (newName) {
          openingElement.node.name = j.jsxIdentifier(newName);
          /////////////////////////////////////////////////////////////////////////////////
          //
          // From:  <Button color="blue">
          // To:    <CatalystButton color="blue">
          //
          /////////////////////////////////////////////////////////////////////////////////
          changes.push(`Updated JSX opening element from <${oldName}> to <${newName}>`);
        }
      }
    });

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 7.8: Update JSX closing elements
    // Finds:
    //        </Button> in JSX tags
    //
    /////////////////////////////////////////////////////////////////////////////////
    root.find(j.JSXClosingElement).forEach((closingElement: any) => {
      const name = closingElement.node.name;
      if (j.JSXIdentifier.check(name)) {
        const oldName = name.name;
        const newName = oldToNewMap.get(oldName);
        if (newName) {
          closingElement.node.name = j.jsxIdentifier(newName);
          /////////////////////////////////////////////////////////////////////////////////
          //
          // From:  </Button>
          // To:    </CatalystButton>
          //
          /////////////////////////////////////////////////////////////////////////////////
          changes.push(`Updated JSX closing element from </${oldName}> to </${newName}>`);
        }
      }
    });

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 7.9: Update type references (but NEVER modify Headless.* references)
    // Finds:
    //        React.ComponentProps<Button>
    //        ButtonProps in type annotations
    //
    /////////////////////////////////////////////////////////////////////////////////
    root.find(j.TSTypeReference).forEach((typeRef: any) => {
      if (j.Identifier.check(typeRef.node.typeName)) {
        const oldName = typeRef.node.typeName.name;
        const newName = oldToNewMap.get(oldName);
        if (newName) {
          typeRef.node.typeName.name = newName;
          /////////////////////////////////////////////////////////////////////////////////
          //
          // From:  React.ComponentProps<Button>
          // To:    React.ComponentProps<CatalystButton>
          //
          /////////////////////////////////////////////////////////////////////////////////
          changes.push(`Updated type reference from ${oldName} to ${newName}`);
        }
      } else if (j.TSQualifiedName.check(typeRef.node.typeName)) {
        const qualifiedName = typeRef.node.typeName;
        if (j.Identifier.check(qualifiedName.left) && j.Identifier.check(qualifiedName.right)) {
          if (qualifiedName.left.name === 'Headless') {
            // ABSOLUTELY NEVER transform anything in Headless namespace
            return;
          }
          const oldName = qualifiedName.right.name;
          const newName = oldToNewMap.get(oldName);
          if (newName) {
            qualifiedName.right.name = newName;
            /////////////////////////////////////////////////////////////////////////////////
            //
            // From:  React.ComponentProps<Button>
            // To:    React.ComponentProps<CatalystButton>
            //
            /////////////////////////////////////////////////////////////////////////////////
            changes.push(
              `Updated qualified type reference from ${qualifiedName.left.name}.${oldName} to ${qualifiedName.left.name}.${newName}`
            );
          }
        }
      }
    });

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 7.10: Update type annotations
    // Finds:
    //        const ref: React.Ref<Button>
    //        variable: ButtonProps
    //
    /////////////////////////////////////////////////////////////////////////////////
    root.find(j.TSTypeAnnotation).forEach((annotation: any) => {
      if (
        j.TSTypeReference.check(annotation.node.typeAnnotation) &&
        j.Identifier.check(annotation.node.typeAnnotation.typeName)
      ) {
        const oldName = annotation.node.typeAnnotation.typeName.name;
        const newName = oldToNewMap.get(oldName);
        if (newName) {
          annotation.node.typeAnnotation.typeName.name = newName;
          /////////////////////////////////////////////////////////////////////////////////
          //
          // From:  const ref: React.Ref<Button>
          // To:    const ref: React.Ref<CatalystButton>
          //
          /////////////////////////////////////////////////////////////////////////////////
          changes.push(`Updated type annotation from ${oldName} to ${newName}`);
        }
      }
    });

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 7.11: Update direct identifier references (with exclusions)
    // Finds:
    //        const MyButton = Button
    //        Button() calls
    //        other identifier references
    //
    /////////////////////////////////////////////////////////////////////////////////
    root.find(j.Identifier).forEach((identifier: any) => {
      const oldName = identifier.node.name;
      const newName = oldToNewMap.get(oldName);
      if (newName) {
        const parent = identifier.parent;

        // Skip Headless namespace member expressions
        if (parent && j.MemberExpression.check(parent.node)) {
          if (
            j.Identifier.check(parent.node.object) &&
            parent.node.object.name === 'Headless' &&
            parent.node.property === identifier.node
          ) {
            return;
          }
        }

        // Skip Headless namespace qualified names (TSQualifiedName)
        if (parent && j.TSQualifiedName.check(parent.node)) {
          if (
            j.Identifier.check(parent.node.left) &&
            parent.node.left.name === 'Headless' &&
            parent.node.right === identifier.node
          ) {
            return;
          }
        }

        // Apply comprehensive exclusions
        if (
          parent &&
          !j.ImportSpecifier.check(parent.node) &&
          !j.JSXOpeningElement.check(parent.node) &&
          !j.JSXClosingElement.check(parent.node) &&
          !j.JSXExpressionContainer.check(parent.node) &&
          !j.TSTypeQuery.check(parent.node) &&
          !j.TSTypeReference.check(parent.node) &&
          !j.TSTypeAnnotation.check(parent.node) &&
          !j.TSTypeAliasDeclaration.check(parent.node) &&
          !j.FunctionDeclaration.check(parent.node) &&
          !j.VariableDeclarator.check(parent.node) &&
          !j.MemberExpression.check(parent.node)
        ) {
          identifier.node.name = newName;
          /////////////////////////////////////////////////////////////////////////////////
          //
          // From:  const MyButton = Button
          // To:    const MyButton = CatalystButton
          //
          /////////////////////////////////////////////////////////////////////////////////
          changes.push(`Updated identifier reference from ${oldName} to ${newName}`);
        }
      }
    });

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

    // Generate transformed code
    const hasChanges = changes.length > 0;
    if (hasChanges) {
      const transformed = root.toSource({
        quote: 'single',
        lineTerminator: '\n',
        tabWidth: 2,
      });

      return { content: transformed, changed: true, warnings };
    }

    return { content: input, changed: false, warnings };
  });
}
