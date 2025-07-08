/**
 * Business logic transform: Add Catalyst prefix to component names
 */

import { addPrefix } from '../../ast-operations/identifiers/add-prefix';
import { getAllOriginalNames, CATALYST_PREFIX } from './catalyst-mappings';
import { type TransformResult, type AtomicTransform } from '../../core/types';

export interface AddCatalystPrefixOptions {
  scope?: 'imports' | 'exports' | 'declarations' | 'usage' | 'all';
  components?: string[];
}

export const addCatalystPrefix: AtomicTransform<AddCatalystPrefixOptions> = {
  name: 'add-catalyst-prefix',
  description: 'Add Catalyst prefix to component names using mappings',
  apply: (source: string, config: AddCatalystPrefixOptions = {}): TransformResult => {
    const { scope = 'all', components } = config;

    // Use provided components or all mapped components
    const targets = components || getAllOriginalNames();

    // Create a temporary source to work with
    const astTransform = addPrefix;
    const astOptions = {
      prefix: CATALYST_PREFIX,
      targets,
      scope,
    };

    // Apply the AST transform (we need to call it differently since it expects ASTTransformOptions)
    return astTransform.apply(source, astOptions as any);
  },
};
