/**
 * Atomic transform: Update JSX attribute values
 */

import { createASTTransform } from '../../core/ast-factory';
import { type TransformChange } from '../../core/types';

export interface UpdateJSXAttributeOptions {
  attributeName: string;
  newValue?: string;
  newExpression?: string;
  elementNames?: string[];
  condition?: (currentValue: any) => boolean;
}

export const updateJSXAttribute = createASTTransform(
  'update-jsx-attribute',
  'Update JSX attribute values',
  (fileInfo, api, options, changes: TransformChange[]) => {
    const { attributeName, newValue, newExpression, elementNames, condition } =
      options as UpdateJSXAttributeOptions;
    const { j } = api;
    const root = j(fileInfo.source);

    // Find JSX elements
    let elementsToProcess = root.find(j.JSXElement);

    // Filter by element names if specified
    if (elementNames && elementNames.length > 0) {
      elementsToProcess = elementsToProcess.filter(path => {
        const openingElement = path.value.openingElement;
        if (openingElement.name.type === 'JSXIdentifier') {
          return elementNames.includes(openingElement.name.name);
        }
        return false;
      });
    }

    // Process each element
    elementsToProcess.forEach(path => {
      const openingElement = path.value.openingElement;

      // Find the attribute
      const attributeIndex =
        openingElement.attributes?.findIndex(
          attr =>
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === attributeName
        ) ?? -1;

      if (attributeIndex !== -1 && openingElement.attributes) {
        const attribute = openingElement.attributes[attributeIndex];
        const currentValue = attribute.type === 'JSXAttribute' ? attribute.value : undefined;

        // Apply condition if provided
        if (condition && !condition(currentValue)) {
          return;
        }

        let newValueNode;

        if (newValue !== undefined) {
          // Set as string literal
          newValueNode = j.literal(newValue);
        } else if (newExpression !== undefined) {
          // Set as expression
          newValueNode = j.jsxExpressionContainer(j.identifier(newExpression));
        } else {
          return; // No new value specified
        }

        // Update the attribute
        if (attribute.type === 'JSXAttribute') {
          attribute.value = newValueNode;
        }

        changes.push({
          type: 'update-jsx-attribute',
          description: `Updated ${attributeName} attribute`,
          location: `JSX element ${openingElement.name.type === 'JSXIdentifier' ? openingElement.name.name : 'unknown'}`,
          before: currentValue ? 'existing value' : 'no value',
          after: newValue || newExpression || 'new value',
        });
      } else {
        // Attribute doesn't exist, add it
        let newValueNode;

        if (newValue !== undefined) {
          newValueNode = j.literal(newValue);
        } else if (newExpression !== undefined) {
          newValueNode = j.jsxExpressionContainer(j.identifier(newExpression));
        } else {
          return;
        }

        const newAttribute = j.jsxAttribute(j.jsxIdentifier(attributeName), newValueNode);

        if (openingElement.attributes) {
          openingElement.attributes.push(newAttribute);
        }

        changes.push({
          type: 'add-jsx-attribute',
          description: `Added ${attributeName} attribute`,
          location: `JSX element ${openingElement.name.type === 'JSXIdentifier' ? openingElement.name.name : 'unknown'}`,
          after: newValue || newExpression || 'new value',
        });
      }
    });

    return changes.length > 0 ? root.toSource() : null;
  }
);
