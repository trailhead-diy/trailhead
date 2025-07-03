/**
 * Type definitions for semantic token resolution
 */

/**
 * Configuration for building semantic token resolution logic
 */
export interface ResolutionConfig {
  /** Component name (e.g., 'Button', 'Badge') */
  componentName: string;
  /** Variable name for resolved classes/styles */
  variableName: string;
  /** Default color if none provided */
  defaultColor: string;
  /** Whether to use IIFE pattern */
  useIIFE?: boolean;
  /** Whether component uses colors object */
  hasColorsObject?: boolean;
}

/**
 * Result of building resolution AST
 */
export interface ResolutionResult {
  /** The AST node representing the resolution */
  declaration: any;
  /** The variable name used */
  variableName: string;
}

/**
 * Pattern type for resolution building
 */
export type ResolutionPattern =
  | 'iife-with-colors'
  | 'conditional-with-colors'
  | 'simple-conditional';

/**
 * Context for AST building operations
 */
export interface ASTBuildContext {
  /** JSCodeshift API instance */
  j: any;
  /** Configuration for the resolution */
  config: ResolutionConfig;
}
