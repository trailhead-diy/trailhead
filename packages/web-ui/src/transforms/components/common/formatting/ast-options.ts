/**
 * Standard AST formatting options for consistent output
 */

// Standard AST formatting options - using inline type to avoid recast dependency
type Options = {
  quote?: 'single' | 'double';
  reuseParsers?: boolean;
  lineTerminator?: string;
  useTabs?: boolean;
  tabWidth?: number;
  wrapColumn?: number;
  trailingComma?: boolean;
  objectCurlySpacing?: boolean;
  arrayBracketSpacing?: boolean;
  flowObjectCommas?: boolean;
};

/**
 * Standard formatting options that match traditional output patterns
 */
export const STANDARD_AST_FORMAT_OPTIONS: Options = {
  quote: 'single',
  reuseParsers: true,
  lineTerminator: '\n',
  useTabs: false,
  tabWidth: 2,
  wrapColumn: 120,
  trailingComma: false,
  // Additional options to preserve traditional formatting
  objectCurlySpacing: true,
  arrayBracketSpacing: false,
  flowObjectCommas: true,
};
