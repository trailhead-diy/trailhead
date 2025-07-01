/**
 * Functional Theme Registry
 *
 * Pure functions for theme management.
 * Works with React state and next-themes for persistence.
 */

import { type TrailheadThemeConfig, applyTheme, validateTheme } from './config';
import { getPresetTheme, getPresetThemeNames } from './presets';

// Re-export types that consumers need
export type { TrailheadThemeConfig } from './config';

/**
 * Theme map type for immutable theme storage
 */
export type ThemeMap = ReadonlyMap<string, TrailheadThemeConfig>;

/**
 * Create initial theme map with preset themes
 * Pure function - no side effects
 */
export const createThemeMap = (): ThemeMap => {
  const themes = new Map<string, TrailheadThemeConfig>();

  // Add preset themes
  for (const name of getPresetThemeNames()) {
    try {
      const theme = getPresetTheme(name);
      themes.set(name, theme);
    } catch (error) {
      console.warn(`Failed to load preset theme "${name}":`, error);
    }
  }

  return themes;
};

/**
 * Add a theme to the map
 * Pure function - returns new map without mutating original
 */
export const addTheme = (
  themes: ThemeMap,
  name: string,
  config: TrailheadThemeConfig,
): ThemeMap => {
  const validation = validateTheme(config);
  if (!validation.isValid) {
    throw new Error(
      `Invalid theme configuration for "${name}": ${validation.errors.join(', ')}`,
    );
  }

  // Create new map with added theme
  const newThemes = new Map(themes);
  newThemes.set(name, config);
  return newThemes;
};

/**
 * Get a theme from the map
 * Pure function - no side effects
 */
export const getTheme = (
  themes: ThemeMap,
  name: string,
): TrailheadThemeConfig | undefined => {
  return themes.get(name);
};

/**
 * Get all theme names from the map
 * Pure function - returns new array
 */
export const getThemeNames = (themes: ThemeMap): string[] => {
  return Array.from(themes.keys());
};

/**
 * Apply theme CSS variables to the document
 * Side effect function - clearly marked and isolated
 */
export const applyThemeToDocument = (
  themes: ThemeMap,
  name: string,
  isDark: boolean,
): void => {
  const theme = getTheme(themes, name);
  if (!theme) {
    console.error(`Theme "${name}" is not registered`);
    return;
  }
  applyTheme(theme, isDark);
};
