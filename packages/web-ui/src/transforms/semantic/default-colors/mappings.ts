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
 * Helper function to create default color configuration
 */
function createColorConfig(
  componentType: string,
  stylePattern: 'colors' | 'styles.colors' = 'colors'
): DefaultColorComponentConfig {
  const colorPattern = `${stylePattern}[`;
  const hookCall = `useDefaultColor<keyof typeof ${stylePattern}>('${componentType}')`;

  return {
    hookCall,
    colorPattern,
    stylePattern,
    componentType,
  };
}

/**
 * Mapping of component names to their default color configurations
 */
export const DEFAULT_COLOR_COMPONENTS: Record<string, DefaultColorComponentConfig> = {
  Badge: createColorConfig('badge'),
  BadgeButton: createColorConfig('badge'),
  Button: createColorConfig('button', 'styles.colors'),
  Checkbox: createColorConfig('checkbox'),
  Radio: createColorConfig('radio'),
  Switch: createColorConfig('switch'),
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
