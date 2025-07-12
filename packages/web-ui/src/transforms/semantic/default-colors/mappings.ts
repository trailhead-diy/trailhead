/**
 * Component-specific configurations for default color transform
 *
 * Maps component types to their specific default color implementations,
 * including hook calls, color access patterns, and transformation rules.
 */

/**
 * Configuration for a component's default color transformation
 */
export interface DefaultColorComponentConfig {
  /** The useDefaultColor hook call with proper typing */
  hookCall: string;
  /** Pattern to match color array access (e.g., 'colors[', 'styles.colors[') */
  colorPattern: string;
  /** The style object name (e.g., 'colors', 'styles.colors') */
  stylePattern: string;
  /** Component type identifier for the hook */
  componentType: string;
}

/**
 * Mapping of component names to their default color configurations
 */
export const DEFAULT_COLOR_COMPONENTS: Record<string, DefaultColorComponentConfig> = {
  Badge: {
    hookCall: "useDefaultColor<keyof typeof colors>('badge')",
    colorPattern: 'colors[',
    stylePattern: 'colors',
    componentType: 'badge',
  },
  BadgeButton: {
    hookCall: "useDefaultColor<keyof typeof colors>('badge')",
    colorPattern: 'colors[',
    stylePattern: 'colors',
    componentType: 'badge',
  },
  Button: {
    hookCall: "useDefaultColor<keyof typeof styles.colors>('button')",
    colorPattern: 'styles.colors[',
    stylePattern: 'styles.colors',
    componentType: 'button',
  },
  Checkbox: {
    hookCall: "useDefaultColor<keyof typeof colors>('checkbox')",
    colorPattern: 'colors[',
    stylePattern: 'colors',
    componentType: 'checkbox',
  },
  Radio: {
    hookCall: "useDefaultColor<keyof typeof colors>('radio')",
    colorPattern: 'colors[',
    stylePattern: 'colors',
    componentType: 'radio',
  },
  Switch: {
    hookCall: "useDefaultColor<keyof typeof colors>('switch')",
    colorPattern: 'colors[',
    stylePattern: 'colors',
    componentType: 'switch',
  },
};

/**
 * Extract component type from function name
 *
 * @param functionName - The function name (e.g., 'CatalystBadge', 'CatalystButton')
 * @returns Component type or null if not supported
 */
export function getComponentType(functionName: string): string | null {
  // Remove 'Catalyst' prefix to get component type
  const componentType = functionName.replace(/^Catalyst/, '');

  return DEFAULT_COLOR_COMPONENTS[componentType] ? componentType : null;
}

/**
 * Get configuration for a specific component type
 *
 * @param componentType - The component type (e.g., 'Badge', 'Button')
 * @returns Configuration object or null if not supported
 */
export function getComponentConfig(componentType: string): DefaultColorComponentConfig | null {
  return DEFAULT_COLOR_COMPONENTS[componentType] || null;
}

/**
 * Check if a component supports default colors
 *
 * @param functionName - The function name to check
 * @returns True if component supports default colors
 */
export function supportsDefaultColors(functionName: string): boolean {
  const componentType = getComponentType(functionName);
  return componentType !== null;
}

/**
 * Get all supported component types
 *
 * @returns Array of supported component type names
 */
export function getSupportedComponents(): string[] {
  return Object.keys(DEFAULT_COLOR_COMPONENTS);
}
