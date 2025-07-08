/**
 * Atomic transform: Add parameter to function definitions
 */

import { createASTTransform } from '../../core/ast-factory';
import { type TransformChange } from '../../core/types';

export interface AddParameterOptions {
  parameterName: string;
  parameterType?: string;
  defaultValue?: string;
  functionNames?: string[];
  position?: 'first' | 'last' | 'before-rest';
}

export const addParameter = createASTTransform(
  'add-parameter',
  'Add parameter to function definitions',
  (fileInfo, api, options, changes: TransformChange[]) => {
    const {
      parameterName,
      parameterType,
      defaultValue,
      functionNames,
      position = 'before-rest',
    } = options as AddParameterOptions;
    const { j } = api;
    const root = j(fileInfo.source);

    // Helper to create parameter node
    const createParameter = () => {
      const param = j.identifier(parameterName);

      if (parameterType) {
        param.typeAnnotation = j.tsTypeAnnotation(j.tsTypeReference(j.identifier(parameterType)));
      }

      if (defaultValue) {
        return j.assignmentPattern(param, j.literal(defaultValue));
      }

      return param;
    };

    // Helper to find insertion position
    const findInsertionPosition = (params: any[]) => {
      switch (position) {
        case 'first':
          return 0;
        case 'last':
          return params.length;
        case 'before-rest':
          // Find position before rest parameter
          const restIndex = params.findIndex(p => p.type === 'RestElement');
          return restIndex === -1 ? params.length : restIndex;
        default:
          return params.length;
      }
    };

    // Add parameter to function declarations
    root
      .find(j.FunctionDeclaration)
      .filter(
        path =>
          !functionNames ||
          functionNames.includes(typeof path.value.id?.name === 'string' ? path.value.id.name : '')
      )
      .forEach(path => {
        const params = path.value.params;
        const insertIndex = findInsertionPosition(params);

        // Check if parameter already exists
        const exists = params.some(p => p.type === 'Identifier' && p.name === parameterName);

        if (!exists) {
          params.splice(insertIndex, 0, createParameter());
          changes.push({
            type: 'add-parameter-function-declaration',
            description: `Added parameter '${parameterName}' to function ${path.value.id?.name}`,
            location: `function ${path.value.id?.name}`,
          });
        }
      });

    // Add parameter to arrow functions
    root.find(j.ArrowFunctionExpression).forEach(path => {
      const params = path.value.params;
      const insertIndex = findInsertionPosition(params);

      // Check if parameter already exists
      const exists = params.some(p => p.type === 'Identifier' && p.name === parameterName);

      if (!exists) {
        params.splice(insertIndex, 0, createParameter());
        changes.push({
          type: 'add-parameter-arrow-function',
          description: `Added parameter '${parameterName}' to arrow function`,
          location: 'arrow function',
        });
      }
    });

    return changes.length > 0 ? root.toSource() : null;
  }
);
