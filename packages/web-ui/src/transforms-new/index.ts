/**
 * Atomic Transforms - Public API
 */

// Core utilities
export * from './core/types';
export * from './core/ast-factory';

// AST Operations (atomic)
export * from './ast-operations/identifiers/rename-identifier';
export * from './ast-operations/identifiers/add-prefix';
export * from './ast-operations/parameters/add-parameter';
export * from './ast-operations/parameters/reorder-parameters';
export * from './ast-operations/jsx/wrap-expression';
export * from './ast-operations/jsx/update-jsx-attribute';

// Business Logic Transforms
export * from './business-logic/catalyst-integration/catalyst-mappings';
export * from './business-logic/catalyst-integration/add-catalyst-prefix';
export * from './business-logic/className-management/add-className-param';
export * from './business-logic/className-management/forward-className';

// Pipelines
export * from './pipelines/main-pipeline';

// Backward compatibility - main entry points
export {
  MainTransformPipeline,
  createCompletePipeline,
  createCatalystPrefixPipeline,
  createClassNamePipeline,
  applyMainTransforms,
} from './pipelines/main-pipeline';
