/**
 * Types for semantic enhancement transform factory
 */

import { API } from 'jscodeshift';

export interface ComponentConfig {
  /** Component name (e.g., 'Button', 'Badge') */
  name: string;
  /** Pattern to detect if file contains this component */
  detectPattern: (content: string) => boolean;
  /** Default color fallback */
  defaultColor: string;
  /** How color type is defined */
  typePattern: 'alias' | 'prop' | 'none';
  /** Name of type alias if typePattern is 'alias' */
  typeAliasName?: string;
  /** Name of props interface if typePattern is 'prop' */
  propsInterfaceName?: string;
  /** Whether component uses forwardRef */
  isForwardRef?: boolean;
  /** Whether component has colors object */
  hasColorsObject?: boolean;
  /** Variable name for resolved classes */
  variableName?: string;
  /** Whether to use IIFE for resolution */
  useIIFE?: boolean;
  /** Custom resolution application logic */
  applyResolution?: (root: any, j: API['jscodeshift'], variableName: string) => void;
}

export interface TransformContext {
  root: any;
  j: API['jscodeshift'];
  config: ComponentConfig;
  changes: any[];
}
