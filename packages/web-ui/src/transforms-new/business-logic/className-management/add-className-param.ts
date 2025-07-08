/**
 * Business logic transform: Add className parameter to React components
 */

import { addParameter } from '../../ast-operations/parameters/add-parameter';
import { type TransformResult, type AtomicTransform } from '../../core/types';

export interface AddClassNameParamOptions {
  functionNames?: string[];
  parameterType?: string;
  defaultValue?: string;
  position?: 'first' | 'last' | 'before-rest';
}

export const addClassNameParam: AtomicTransform<AddClassNameParamOptions> = {
  name: 'add-className-param',
  description: 'Add className parameter to React component functions',
  apply: (source: string, config: AddClassNameParamOptions = {}): TransformResult => {
    const {
      functionNames,
      parameterType = 'string',
      defaultValue,
      position = 'before-rest',
    } = config;

    return addParameter.apply(source, {
      parameterName: 'className',
      parameterType,
      defaultValue,
      functionNames,
      position,
    } as any);
  },
};
