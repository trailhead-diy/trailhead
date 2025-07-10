/**
 * Reference transformation for Catalyst prefix transformations
 *
 * Handles transformation of all component and type references throughout the code,
 * including function parameters, JSX elements, type references, and variable declarations.
 * Protects Headless UI qualified names from any modifications.
 */

import type { ASTContext } from './core.js';

/**
 * Update function parameter types in component definitions
 */
export function updateFunctionParameterTypes(context: ASTContext): void {
  const { j, root, oldToNewMap, headlessPropsTypes, changes } = context;

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
                  (currentTypeName.endsWith('Props') && !currentTypeName.startsWith('Catalyst'))) &&
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
}

/**
 * Update typeof expressions in type definitions
 */
export function updateTypeofUsages(context: ASTContext): void {
  const { j, root, oldToNewMap, changes } = context;

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
}

/**
 * Update JSX expressions and elements
 */
export function updateJSXReferences(context: ASTContext): void {
  const { j, root, oldToNewMap, changes } = context;

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
}

/**
 * Update type references and annotations
 */
export function updateTypeReferences(context: ASTContext): void {
  const { j, root, oldToNewMap, changes } = context;

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
}

/**
 * Update direct identifier references with comprehensive exclusions
 */
export function updateDirectIdentifiers(context: ASTContext): void {
  const { j, root, oldToNewMap, changes } = context;

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
}
