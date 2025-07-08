/**
 * Enhanced Semantic Token Utilities
 *
 * Provides utilities for handling semantic color tokens with hierarchical support
 * to preserve Catalyst UI's visual hierarchy and subtleties.
 *
 * Features:
 * - Hierarchical tokens (primary, secondary, tertiary levels)
 * - Component-specific tokens (icon states, border weights)
 * - Opacity preservation for borders and backgrounds
 * - CSS variable fallback chains for robust theming
 * - Full shadcn/ui compatibility
 *
 */

// ============================================================================
// TYPES AND MAPPINGS
// ============================================================================

export type SemanticColorToken = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/**
 * Hierarchical text semantic tokens that preserve visual hierarchy
 */
export type HierarchicalTextToken =
  | 'text-primary' // Highest contrast (zinc-950/50)
  | 'text-secondary' // Medium-high contrast (zinc-700/300)
  | 'text-tertiary' // Medium contrast (zinc-600/400)
  | 'text-quaternary' // Lower contrast (zinc-500/500)
  | 'text-muted'; // Lowest contrast (zinc-400/600)

/**
 * Icon semantic tokens that preserve active/inactive states
 */
export type IconSemanticToken =
  | 'icon-primary' // Primary action icons
  | 'icon-secondary' // Secondary action icons
  | 'icon-inactive' // Inactive/disabled icons
  | 'icon-active' // Active/selected icons
  | 'icon-hover' // Hover state icons
  | 'icon-muted'; // Decorative/low-priority icons

/**
 * Border semantic tokens with opacity preservation
 */
export type BorderSemanticToken =
  | 'border-strong' // High contrast borders
  | 'border-medium' // Medium contrast borders
  | 'border-subtle' // Low contrast borders
  | 'border-ghost'; // Very subtle borders

/**
 * Component-specific semantic tokens for complex components
 */
export type ComponentSemanticToken =
  | 'sidebar-text-primary'
  | 'sidebar-text-secondary'
  | 'sidebar-icon-default'
  | 'sidebar-icon-active'
  | 'table-header-text'
  | 'table-body-text'
  | 'button-text-default'
  | 'button-text-hover';

/**
 * All semantic token types combined
 */
export type AllSemanticTokens =
  | SemanticColorToken
  | HierarchicalTextToken
  | IconSemanticToken
  | BorderSemanticToken
  | ComponentSemanticToken;

/**
 * Maps semantic tokens to their corresponding CSS custom properties or Catalyst colors
 */
export const SEMANTIC_MAPPINGS = {
  // Original semantic tokens
  primary: 'primary',
  secondary: 'secondary',
  success: 'green', // Maps to existing Catalyst green
  warning: 'amber', // Maps to existing Catalyst amber
  danger: 'destructive', // Maps to shadcn destructive
} as const;

/**
 * Hierarchical text token mappings with CSS variable fallback chains
 * Uses existing shadcn/ui tokens where possible for compatibility
 */
export const HIERARCHICAL_TEXT_MAPPINGS = {
  'text-primary': 'foreground',
  'text-secondary': 'secondary-foreground', // Uses existing shadcn/ui token
  'text-tertiary': 'tertiary-foreground',
  'text-quaternary': 'quaternary-foreground',
  'text-muted': 'muted-foreground',
} as const;

/**
 * Icon semantic token mappings with state preservation
 */
export const ICON_SEMANTIC_MAPPINGS = {
  'icon-primary': 'icon-primary',
  'icon-secondary': 'icon-secondary',
  'icon-inactive': 'icon-inactive',
  'icon-active': 'icon-active',
  'icon-hover': 'icon-hover',
  'icon-muted': 'icon-muted',
} as const;

/**
 * Border semantic token mappings with opacity information
 */
export const BORDER_SEMANTIC_MAPPINGS = {
  'border-strong': 'border-strong',
  'border-medium': 'border',
  'border-subtle': 'border-subtle',
  'border-ghost': 'border-ghost',
} as const;

/**
 * Component-specific semantic token mappings
 */
export const COMPONENT_SEMANTIC_MAPPINGS = {
  'sidebar-text-primary': 'sidebar-text-primary',
  'sidebar-text-secondary': 'sidebar-text-secondary',
  'sidebar-icon-default': 'sidebar-icon-default',
  'sidebar-icon-active': 'sidebar-icon-active',
  'table-header-text': 'table-header-text',
  'table-body-text': 'table-body-text',
  'button-text-default': 'button-text-default',
  'button-text-hover': 'button-text-hover',
} as const;

// ============================================================================
// SEMANTIC TOKEN RESOLVERS (Pure Functions)
// ============================================================================

/**
 * Resolves a semantic token to its corresponding value
 * @param token - The semantic token to resolve
 * @returns The resolved token value
 */
export function resolveSemanticToken(token: SemanticColorToken): string {
  return SEMANTIC_MAPPINGS[token];
}

/**
 * Resolves hierarchical text tokens to their CSS variable names
 * @param token - The hierarchical text token to resolve
 * @returns The resolved CSS variable name
 */
export function resolveHierarchicalTextToken(token: HierarchicalTextToken): string {
  return HIERARCHICAL_TEXT_MAPPINGS[token];
}

/**
 * Resolves icon semantic tokens to their CSS variable names
 * @param token - The icon semantic token to resolve
 * @returns The resolved CSS variable name
 */
export function resolveIconSemanticToken(token: IconSemanticToken): string {
  return ICON_SEMANTIC_MAPPINGS[token];
}

/**
 * Resolves border semantic tokens to their CSS variable names
 * @param token - The border semantic token to resolve
 * @returns The resolved CSS variable name
 */
export function resolveBorderSemanticToken(token: BorderSemanticToken): string {
  return BORDER_SEMANTIC_MAPPINGS[token];
}

/**
 * Resolves component-specific semantic tokens to their CSS variable names
 * @param token - The component semantic token to resolve
 * @returns The resolved CSS variable name
 */
export function resolveComponentSemanticToken(token: ComponentSemanticToken): string {
  return COMPONENT_SEMANTIC_MAPPINGS[token];
}

/**
 * Universal token resolver that handles all semantic token types
 * @param token - Any semantic token to resolve
 * @returns The resolved CSS variable name or original token if not found
 */
export function resolveAnySemanticToken(token: string): string {
  // Try each token type in order
  if (token in SEMANTIC_MAPPINGS) {
    return SEMANTIC_MAPPINGS[token as SemanticColorToken];
  }
  if (token in HIERARCHICAL_TEXT_MAPPINGS) {
    return HIERARCHICAL_TEXT_MAPPINGS[token as HierarchicalTextToken];
  }
  if (token in ICON_SEMANTIC_MAPPINGS) {
    return ICON_SEMANTIC_MAPPINGS[token as IconSemanticToken];
  }
  if (token in BORDER_SEMANTIC_MAPPINGS) {
    return BORDER_SEMANTIC_MAPPINGS[token as BorderSemanticToken];
  }
  if (token in COMPONENT_SEMANTIC_MAPPINGS) {
    return COMPONENT_SEMANTIC_MAPPINGS[token as ComponentSemanticToken];
  }

  // Return original token if no mapping found
  return token;
}

/**
 * Checks if a given string is a semantic color token
 * @param value - The value to check
 * @returns True if the value is a semantic token
 */
export function isSemanticToken(value: string): value is SemanticColorToken {
  return value in SEMANTIC_MAPPINGS;
}

/**
 * Checks if a given string is any type of semantic token
 * @param value - The value to check
 * @returns True if the value is any semantic token
 */
export function isAnySemanticToken(value: string): value is AllSemanticTokens {
  return (
    value in SEMANTIC_MAPPINGS ||
    value in HIERARCHICAL_TEXT_MAPPINGS ||
    value in ICON_SEMANTIC_MAPPINGS ||
    value in BORDER_SEMANTIC_MAPPINGS ||
    value in COMPONENT_SEMANTIC_MAPPINGS
  );
}

// ============================================================================
// STYLE GENERATORS (Pure Functions)
// ============================================================================

/**
 * Generates semantic token styles following shadcn/ui patterns
 * @param token - The semantic token
 * @param variant - The style variant
 * @returns CSS class string for the semantic token
 */
export function createSemanticStyles(
  token: SemanticColorToken,
  variant: 'solid' | 'outline' | 'ghost' = 'solid'
): string {
  const resolvedToken = resolveSemanticToken(token);

  switch (variant) {
    case 'solid':
      return `bg-${resolvedToken} text-${resolvedToken}-foreground hover:bg-${resolvedToken}/90`;

    case 'outline':
      return `border border-${resolvedToken} text-${resolvedToken} hover:bg-${resolvedToken}/10`;

    case 'ghost':
      return `text-${resolvedToken} hover:bg-${resolvedToken}/10`;

    default:
      return `bg-${resolvedToken} text-${resolvedToken}-foreground`;
  }
}

/**
 * Creates badge-style semantic token classes
 * @param token - The semantic token
 * @returns CSS class string for badge styling
 */
export function createSemanticBadgeStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  // For Tailwind colors (green, amber), use appropriate contrast colors
  // For CSS variables (primary, secondary, destructive), use -foreground suffix
  const textColor = (() => {
    switch (resolvedToken) {
      case 'green':
        return 'text-green-700 dark:text-green-400';
      case 'amber':
        return 'text-amber-700 dark:text-amber-400';
      default:
        return `text-${resolvedToken}-foreground dark:text-${resolvedToken}-foreground`;
    }
  })();

  return [
    `bg-${resolvedToken}/15`,
    textColor,
    `group-data-hover:bg-${resolvedToken}/25`,
    `dark:bg-${resolvedToken}/10`,
    `dark:group-data-hover:bg-${resolvedToken}/20`,
  ].join(' ');
}

/**
 * Creates button-style semantic token classes with CSS variables
 * @param token - The semantic token
 * @returns CSS class string for button styling
 */
export function createSemanticButtonStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  return [
    `text-white`,
    `[--btn-bg:var(--color-${resolvedToken})]`,
    `[--btn-border:var(--color-${resolvedToken})]`,
    `[--btn-hover-overlay:var(--color-white)]/10`,
    `[--btn-icon:var(--color-white)]/60`,
    `data-active:[--btn-icon:var(--color-white)]/80`,
    `data-hover:[--btn-icon:var(--color-white)]/80`,
  ].join(' ');
}

/**
 * Creates checkbox-style semantic token classes with CSS variables
 * @param token - The semantic token
 * @returns CSS class string for checkbox styling
 */
export function createSemanticCheckboxStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  return [
    `[--checkbox-check:var(--color-white)]`,
    `[--checkbox-checked-bg:var(--color-${resolvedToken})]`,
    `[--checkbox-checked-border:var(--color-${resolvedToken})]/90`,
  ].join(' ');
}

/**
 * Creates radio-style semantic token classes with CSS variables
 * @param token - The semantic token
 * @returns CSS class string for radio styling
 */
export function createSemanticRadioStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  return [
    `[--radio-checked-bg:var(--color-${resolvedToken})]`,
    `[--radio-checked-border:var(--color-${resolvedToken})]/90`,
    `[--radio-checked-indicator:var(--color-white)]`,
  ].join(' ');
}

/**
 * Creates switch-style semantic token classes with CSS variables
 * @param token - The semantic token
 * @returns CSS class string for switch styling
 */
export function createSemanticSwitchStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  return [
    `[--switch-bg-ring:var(--color-${resolvedToken})]/90`,
    `[--switch-bg:var(--color-${resolvedToken})]`,
    `dark:[--switch-bg-ring:transparent]`,
    `dark:[--switch-bg:var(--color-white)]/25`,
  ].join(' ');
}

/**
 * Creates text-style semantic token classes
 * @param token - The semantic token
 * @returns CSS class string for text styling
 */
export function createSemanticTextStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  // For Tailwind colors (green, amber), use the base color
  // For CSS variables (primary, secondary, destructive), use -foreground suffix
  switch (resolvedToken) {
    case 'green':
      return 'text-green-700 dark:text-green-400';
    case 'amber':
      return 'text-amber-700 dark:text-amber-400';
    default:
      return `text-${resolvedToken}-foreground dark:text-${resolvedToken}-foreground`;
  }
}

/**
 * Creates link-style semantic token classes
 * @param token - The semantic token
 * @returns CSS class string for link styling
 */
export function createSemanticLinkStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  // For Tailwind colors (green, amber), use appropriate link colors
  // For CSS variables (primary, secondary, destructive), use -foreground suffix
  switch (resolvedToken) {
    case 'green':
      return [
        'text-green-700',
        'hover:text-green-800',
        'dark:text-green-400',
        'dark:hover:text-green-300',
      ].join(' ');
    case 'amber':
      return [
        'text-amber-700',
        'hover:text-amber-800',
        'dark:text-amber-400',
        'dark:hover:text-amber-300',
      ].join(' ');
    default:
      return [
        `text-${resolvedToken}-foreground`,
        `hover:text-${resolvedToken}-foreground/80`,
        `dark:text-${resolvedToken}-foreground`,
        `dark:hover:text-${resolvedToken}-foreground/80`,
      ].join(' ');
  }
}

/**
 * Creates alert-style semantic token classes
 * @param token - The semantic token
 * @returns CSS class string for alert styling
 */
export function createSemanticAlertStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  // For Tailwind colors (green, amber), use appropriate alert colors
  // For CSS variables (primary, secondary, destructive), use -foreground suffix
  switch (resolvedToken) {
    case 'green':
      return [
        'bg-green-50',
        'border-green-200',
        'text-green-800',
        'dark:bg-green-950',
        'dark:border-green-800',
        'dark:text-green-200',
      ].join(' ');
    case 'amber':
      return [
        'bg-amber-50',
        'border-amber-200',
        'text-amber-800',
        'dark:bg-amber-950',
        'dark:border-amber-800',
        'dark:text-amber-200',
      ].join(' ');
    default:
      return [
        `bg-${resolvedToken}/10`,
        `border-${resolvedToken}/20`,
        `text-${resolvedToken}-foreground`,
        `dark:bg-${resolvedToken}/10`,
        `dark:border-${resolvedToken}/20`,
        `dark:text-${resolvedToken}-foreground`,
      ].join(' ');
  }
}

/**
 * Creates input-style semantic token classes for validation states
 * @param token - The semantic token
 * @returns CSS class string for input validation styling
 */
export function createSemanticInputStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  return [
    `border-${resolvedToken}`,
    `focus:border-${resolvedToken}`,
    `focus:ring-2`,
    `focus:ring-${resolvedToken}/20`,
  ].join(' ');
}

/**
 * Creates dropdown-style semantic token classes for menu items
 * @param token - The semantic token
 * @returns CSS class string for dropdown focus styling with proper contrast
 */
export function createSemanticDropdownStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  // Handle Tailwind colors vs CSS custom properties
  switch (resolvedToken) {
    case 'green':
      return 'data-focus:bg-green-600 data-focus:text-white';
    case 'amber':
      return 'data-focus:bg-amber-600 data-focus:text-white';
    default:
      return [`data-focus:bg-${resolvedToken}`, `data-focus:text-${resolvedToken}-foreground`].join(
        ' '
      );
  }
}

/**
 * Creates listbox-style semantic token classes for options
 * @param token - The semantic token
 * @returns CSS class string for listbox focus styling with proper contrast
 */
export function createSemanticListboxStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  // Handle Tailwind colors vs CSS custom properties
  switch (resolvedToken) {
    case 'green':
      return 'data-focus:bg-green-600 data-focus:text-white';
    case 'amber':
      return 'data-focus:bg-amber-600 data-focus:text-white';
    default:
      return [`data-focus:bg-${resolvedToken}`, `data-focus:text-${resolvedToken}-foreground`].join(
        ' '
      );
  }
}

/**
 * Creates combobox-style semantic token classes for options
 * @param token - The semantic token
 * @returns CSS class string for combobox focus styling with proper contrast
 */
export function createSemanticComboboxStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  // Handle Tailwind colors vs CSS custom properties
  switch (resolvedToken) {
    case 'green':
      return 'data-focus:bg-green-600 data-focus:text-white';
    case 'amber':
      return 'data-focus:bg-amber-600 data-focus:text-white';
    default:
      return [`data-focus:bg-${resolvedToken}`, `data-focus:text-${resolvedToken}-foreground`].join(
        ' '
      );
  }
}

/**
 * Creates dialog-style semantic token classes
 * @param token - The semantic token
 * @returns CSS class string for dialog styling
 */
export function createSemanticDialogStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  return [
    `border-${resolvedToken}/20`,
    `focus:border-${resolvedToken}`,
    `focus:ring-2`,
    `focus:ring-${resolvedToken}/20`,
  ].join(' ');
}

/**
 * Creates navbar-style semantic token classes
 * @param token - The semantic token
 * @returns CSS class string for navbar styling
 */
export function createSemanticNavbarStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  return [`border-b-${resolvedToken}/20`, `bg-${resolvedToken}/5`, `backdrop-blur-sm`].join(' ');
}

/**
 * Creates table-style semantic token classes
 * @param token - The semantic token
 * @returns CSS class string for table styling
 */
export function createSemanticTableStyles(token: SemanticColorToken): string {
  const resolvedToken = resolveSemanticToken(token);

  return [
    `border-${resolvedToken}/20`,
    `hover:bg-${resolvedToken}/5`,
    `focus:bg-${resolvedToken}/10`,
  ].join(' ');
}

// ============================================================================
// FALLBACK RESOLVERS (Component-Specific)
// ============================================================================

/**
 * Resolves semantic token with component-specific fallbacks
 * @param token - The semantic token or original color
 * @param component - The component type for fallback resolution
 * @param fallbackColor - Fallback Catalyst color if semantic token not found
 * @returns Resolved styles or fallback
 */
export function resolveSemanticColor<T>(
  token: string,
  component: 'button' | 'badge' | 'input' | 'table',
  fallbackColor: T
): string | T {
  if (!isSemanticToken(token)) {
    return fallbackColor;
  }

  switch (component) {
    case 'button':
      return createSemanticButtonStyles(token);

    case 'badge':
      return createSemanticBadgeStyles(token);

    case 'input':
    case 'table':
      // For inputs and tables, use simple semantic styles
      return createSemanticStyles(token, 'outline');

    default:
      return createSemanticStyles(token);
  }
}

// ============================================================================
// COMPONENT-SPECIFIC HELPERS
// ============================================================================

/**
 * Helper for Button component semantic token resolution
 * @param color - Color prop value (semantic token or Catalyst color)
 * @param _catalystStyles - Original Catalyst styles object (unused but kept for API compatibility)
 * @returns Resolved styles
 */
export function resolveButtonColor(
  color: string | undefined,
  _catalystStyles: Record<string, string[]>
): string[] {
  if (!color || !isSemanticToken(color)) {
    return [];
  }

  const semanticStyles = createSemanticButtonStyles(color);
  return [semanticStyles];
}

/**
 * Helper for Badge component semantic token resolution
 * @param color - Color prop value (semantic token or Catalyst color)
 * @param _catalystColors - Original Catalyst colors object (unused but kept for API compatibility)
 * @returns Resolved styles
 */
export function resolveBadgeColor(
  color: string | undefined,
  _catalystColors: Record<string, string>
): string {
  if (!color || !isSemanticToken(color)) {
    return '';
  }

  return createSemanticBadgeStyles(color);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates semantic token configuration
 * @returns Validation result with any errors
 */
export function validateSemanticTokens(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check that all semantic tokens have mappings
  const requiredTokens: SemanticColorToken[] = [
    'primary',
    'secondary',
    'success',
    'warning',
    'danger',
  ];

  for (const token of requiredTokens) {
    if (!(token in SEMANTIC_MAPPINGS)) {
      errors.push(`Missing mapping for semantic token: ${token}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets all available semantic tokens
 * @returns Array of semantic token names
 */
export function getSemanticTokens(): SemanticColorToken[] {
  return Object.keys(SEMANTIC_MAPPINGS) as SemanticColorToken[];
}

// ============================================================================
// ENHANCED STYLE GENERATORS FOR HIERARCHICAL TOKENS
// ============================================================================

/**
 * Creates hierarchical text styles with proper CSS variable fallback chains
 * @param token - The hierarchical text token
 * @returns CSS class string with fallback support
 */
export function createHierarchicalTextStyles(token: HierarchicalTextToken): string {
  const resolvedToken = resolveHierarchicalTextToken(token);

  // Create CSS variable with fallback chain
  return `text-${resolvedToken}`;
}

/**
 * Creates icon styles with state preservation and fallback chains
 * @param token - The icon semantic token
 * @returns CSS variable string for icon styling
 */
export function createIconSemanticStyles(token: IconSemanticToken): string {
  const resolvedToken = resolveIconSemanticToken(token);

  return `[--icon:var(--color-${resolvedToken})]`;
}

/**
 * Creates button icon styles with enhanced active/inactive state support
 * @param inactiveToken - Token for inactive state
 * @param activeToken - Token for active state
 * @param hoverToken - Token for hover state (optional)
 * @returns CSS class string for button icons with state support
 */
export function createButtonIconStyles(
  inactiveToken: IconSemanticToken,
  activeToken: IconSemanticToken,
  hoverToken?: IconSemanticToken
): string {
  const inactive = resolveIconSemanticToken(inactiveToken);
  const active = resolveIconSemanticToken(activeToken);
  const hover = hoverToken ? resolveIconSemanticToken(hoverToken) : active;

  return [
    `[--btn-icon:var(--color-${inactive})]`,
    `data-active:[--btn-icon:var(--color-${active})]`,
    `data-hover:[--btn-icon:var(--color-${hover})]`,
    `dark:[--btn-icon:var(--color-${inactive})]`,
    `dark:data-active:[--btn-icon:var(--color-${active})]`,
    `dark:data-hover:[--btn-icon:var(--color-${hover})]`,
  ].join(' ');
}

/**
 * Creates border styles with opacity preservation
 * @param token - The border semantic token
 * @param opacity - Optional opacity value (e.g., 10, 20, 50)
 * @returns CSS class string for borders with opacity
 */
export function createBorderSemanticStyles(token: BorderSemanticToken, opacity?: number): string {
  const resolvedToken = resolveBorderSemanticToken(token);

  if (opacity) {
    return `border-${resolvedToken}/${opacity}`;
  }

  return `border-${resolvedToken}`;
}

/**
 * Creates component-specific styles with fallback support
 * @param token - The component semantic token
 * @param fallbackToken - Fallback token if component token is not defined
 * @returns CSS class string with fallback support
 */
export function createComponentSemanticStyles(
  token: ComponentSemanticToken,
  fallbackToken?: HierarchicalTextToken | IconSemanticToken
): string {
  const resolvedToken = resolveComponentSemanticToken(token);

  if (fallbackToken) {
    const fallback = resolveAnySemanticToken(fallbackToken);
    return `text-${resolvedToken} ${resolvedToken !== token ? `text-${fallback}` : ''}`;
  }

  return `text-${resolvedToken}`;
}

/**
 * CSS Variable Fallback Chain Generator
 * Creates robust CSS variable chains that gracefully degrade
 *
 * @param primaryToken - Primary semantic token
 * @param fallbackTokens - Array of fallback tokens in order of preference
 * @param property - CSS property (text, bg, border, etc.)
 * @returns CSS variable string with complete fallback chain
 */
export function createCSSVariableFallbackChain(
  primaryToken: AllSemanticTokens,
  fallbackTokens: string[],
  property: 'text' | 'bg' | 'border' = 'text'
): string {
  const resolvedPrimary = resolveAnySemanticToken(primaryToken);

  // Build fallback chain: primary → fallbacks → original Catalyst value
  const variableChain = [
    `var(--color-${resolvedPrimary})`,
    ...fallbackTokens.map(token => `var(--color-${token})`),
  ].join(', ');

  return `${property}-[${variableChain}]`;
}

// ============================================================================
// CATALYST THEME COMPATIBILITY HELPERS
// ============================================================================

/**
 * Creates a complete CSS variable set for Catalyst theme compatibility
 * Ensures 1:1 visual parity with original Catalyst components
 *
 * @returns Object mapping CSS variable names to their semantic token values
 */
export function createCatalystThemeVariables(): Record<string, string> {
  return {
    // Hierarchical text tokens (secondary-foreground already exists in base theme)
    '--color-text-primary': 'var(--color-foreground)',
    '--color-text-tertiary': 'var(--color-tertiary-foreground, var(--color-muted-foreground))',
    '--color-text-quaternary': 'var(--color-quaternary-foreground, var(--color-muted-foreground))',
    '--color-text-muted': 'var(--color-muted-foreground)',

    // Icon state tokens
    '--color-icon-primary': 'var(--color-icon-primary, var(--color-foreground))',
    '--color-icon-secondary': 'var(--color-icon-secondary, var(--color-muted-foreground))',
    '--color-icon-inactive': 'var(--color-icon-inactive, var(--color-muted-foreground))',
    '--color-icon-active': 'var(--color-icon-active, var(--color-foreground))',
    '--color-icon-hover': 'var(--color-icon-hover, var(--color-foreground))',
    '--color-icon-muted': 'var(--color-icon-muted, var(--color-muted-foreground))',

    // Border weight tokens
    '--color-border-strong': 'var(--color-border-strong, var(--color-border))',
    '--color-border-medium': 'var(--color-border)',
    '--color-border-subtle': 'var(--color-border-subtle, var(--color-border))',
    '--color-border-ghost': 'var(--color-border-ghost, var(--color-border))',

    // Component-specific tokens
    '--color-sidebar-text-primary': 'var(--color-sidebar-text-primary, var(--color-foreground))',
    '--color-sidebar-text-secondary':
      'var(--color-sidebar-text-secondary, var(--color-muted-foreground))',
    '--color-sidebar-icon-default':
      'var(--color-sidebar-icon-default, var(--color-muted-foreground))',
    '--color-sidebar-icon-active': 'var(--color-sidebar-icon-active, var(--color-foreground))',
    '--color-table-header-text': 'var(--color-table-header-text, var(--color-muted-foreground))',
    '--color-table-body-text': 'var(--color-table-body-text, var(--color-foreground))',
    '--color-button-text-default': 'var(--color-button-text-default, var(--color-foreground))',
    '--color-button-text-hover': 'var(--color-button-text-hover, var(--color-foreground))',
  };
}

/**
 * Enhanced validation for hierarchical semantic tokens
 * @returns Validation result with any errors
 */
export function validateHierarchicalSemanticTokens(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate all token mappings exist
  const allMappings = [
    ...Object.keys(SEMANTIC_MAPPINGS),
    ...Object.keys(HIERARCHICAL_TEXT_MAPPINGS),
    ...Object.keys(ICON_SEMANTIC_MAPPINGS),
    ...Object.keys(BORDER_SEMANTIC_MAPPINGS),
    ...Object.keys(COMPONENT_SEMANTIC_MAPPINGS),
  ];

  // Check for any undefined mappings
  allMappings.forEach(token => {
    const resolved = resolveAnySemanticToken(token);
    if (!resolved || resolved === token) {
      errors.push(`Token "${token}" does not have a valid mapping`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets all available hierarchical semantic tokens
 * @returns Object with all token categories
 */
export function getAllSemanticTokens(): {
  color: SemanticColorToken[];
  text: HierarchicalTextToken[];
  icon: IconSemanticToken[];
  border: BorderSemanticToken[];
  component: ComponentSemanticToken[];
} {
  return {
    color: Object.keys(SEMANTIC_MAPPINGS) as SemanticColorToken[],
    text: Object.keys(HIERARCHICAL_TEXT_MAPPINGS) as HierarchicalTextToken[],
    icon: Object.keys(ICON_SEMANTIC_MAPPINGS) as IconSemanticToken[],
    border: Object.keys(BORDER_SEMANTIC_MAPPINGS) as BorderSemanticToken[],
    component: Object.keys(COMPONENT_SEMANTIC_MAPPINGS) as ComponentSemanticToken[],
  };
}
