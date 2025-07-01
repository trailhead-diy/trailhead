/**
 * Theme Presets
 *
 * A collection of pre-built themes using the theme builder system
 */

import { createTheme } from './builder';
import { type TrailheadThemeConfig } from './config';
import { createCatalystTheme } from './catalyst-theme';

/**
 * Theme presets collection using the theme builder system
 */
export const themePresets = {
  // Modern color themes with consistent light/dark primary colors
  red: () =>
    createTheme('Red')
      .withPrimaryColor(
        'oklch(0.637 0.237 25.331)',
        'oklch(0.637 0.237 25.331)',
      )
      .withSecondaryColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withAccentColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withMutedColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withBackgroundColors(
        'oklch(1 0 0)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.985 0 0)',
      )
      .withCardColors('oklch(1 0 0)', 'oklch(0.21 0.006 285.885)')
      .withBorderColors('oklch(0.92 0.004 286.32)', 'oklch(0.2 0 0 / 0.1)')
      .withDestructiveColor(
        'oklch(0.577 0.245 27.325)',
        'oklch(0.704 0.191 22.216)',
      )
      .withChartColors([
        'oklch(0.646 0.222 41.116)',
        'oklch(0.6 0.118 184.704)',
        'oklch(0.398 0.07 227.392)',
        'oklch(0.828 0.189 84.429)',
        'oklch(0.769 0.188 70.08)',
      ])
      .withSidebarColors('custom', {
        light: { bg: 'oklch(0.985 0 0)', fg: 'oklch(0.141 0.005 285.823)' },
        dark: { bg: 'oklch(0.21 0.006 285.885)', fg: 'oklch(0.985 0 0)' },
      })
      .build(),

  rose: () =>
    createTheme('Rose')
      .withPrimaryColor(
        'oklch(0.637 0.237 25.331)',
        'oklch(0.637 0.237 25.331)',
      )
      .withSecondaryColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withAccentColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withMutedColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withBackgroundColors(
        'oklch(1 0 0)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.985 0 0)',
      )
      .withCardColors('oklch(1 0 0)', 'oklch(0.21 0.006 285.885)')
      .withBorderColors('oklch(0.92 0.004 286.32)', 'oklch(0.2 0 0 / 0.1)')
      .withDestructiveColor(
        'oklch(0.577 0.245 27.325)',
        'oklch(0.704 0.191 22.216)',
      )
      .withChartColors([
        'oklch(0.646 0.222 41.116)',
        'oklch(0.6 0.118 184.704)',
        'oklch(0.398 0.07 227.392)',
        'oklch(0.828 0.189 84.429)',
        'oklch(0.769 0.188 70.08)',
      ])
      .withSidebarColors('custom', {
        light: { bg: 'oklch(0.985 0 0)', fg: 'oklch(0.141 0.005 285.823)' },
        dark: { bg: 'oklch(0.21 0.006 285.885)', fg: 'oklch(0.985 0 0)' },
      })
      .build(),

  orange: () =>
    createTheme('Orange')
      .withPrimaryColor(
        'oklch(0.705 0.213 47.604)',
        'oklch(0.646 0.222 41.116)',
      )
      .withSecondaryColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withAccentColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withMutedColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withBackgroundColors(
        'oklch(1 0 0)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.985 0 0)',
      )
      .withCardColors('oklch(1 0 0)', 'oklch(0.21 0.006 285.885)')
      .withBorderColors('oklch(0.92 0.004 286.32)', 'oklch(0.2 0 0 / 0.1)')
      .withDestructiveColor(
        'oklch(0.577 0.245 27.325)',
        'oklch(0.704 0.191 22.216)',
      )
      .withChartColors([
        'oklch(0.646 0.222 41.116)',
        'oklch(0.6 0.118 184.704)',
        'oklch(0.398 0.07 227.392)',
        'oklch(0.828 0.189 84.429)',
        'oklch(0.769 0.188 70.08)',
      ])
      .withSidebarColors('custom', {
        light: { bg: 'oklch(0.985 0 0)', fg: 'oklch(0.141 0.005 285.823)' },
        dark: { bg: 'oklch(0.21 0.006 285.885)', fg: 'oklch(0.985 0 0)' },
      })
      .build(),

  green: () =>
    createTheme('Green')
      .withPrimaryColor(
        'oklch(0.723 0.219 149.579)',
        'oklch(0.696 0.17 162.48)',
      )
      .withSecondaryColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withAccentColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withMutedColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withBackgroundColors(
        'oklch(1 0 0)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.985 0 0)',
      )
      .withCardColors('oklch(1 0 0)', 'oklch(0.21 0.006 285.885)')
      .withBorderColors('oklch(0.92 0.004 286.32)', 'oklch(0.2 0 0 / 0.1)')
      .withDestructiveColor(
        'oklch(0.577 0.245 27.325)',
        'oklch(0.704 0.191 22.216)',
      )
      .withChartColors([
        'oklch(0.646 0.222 41.116)',
        'oklch(0.6 0.118 184.704)',
        'oklch(0.398 0.07 227.392)',
        'oklch(0.828 0.189 84.429)',
        'oklch(0.769 0.188 70.08)',
      ])
      .withSidebarColors('custom', {
        light: { bg: 'oklch(0.985 0 0)', fg: 'oklch(0.141 0.005 285.823)' },
        dark: { bg: 'oklch(0.21 0.006 285.885)', fg: 'oklch(0.985 0 0)' },
      })
      .build(),

  blue: () =>
    createTheme('Blue')
      .withPrimaryColor(
        'oklch(0.623 0.214 259.815)',
        'oklch(0.546 0.245 262.881)',
      )
      .withSecondaryColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withAccentColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withMutedColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withBackgroundColors(
        'oklch(1 0 0)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.985 0 0)',
      )
      .withCardColors('oklch(1 0 0)', 'oklch(0.21 0.006 285.885)')
      .withBorderColors('oklch(0.92 0.004 286.32)', 'oklch(0.2 0 0 / 0.1)')
      .withDestructiveColor(
        'oklch(0.577 0.245 27.325)',
        'oklch(0.704 0.191 22.216)',
      )
      .withChartColors([
        'oklch(0.646 0.222 41.116)',
        'oklch(0.6 0.118 184.704)',
        'oklch(0.398 0.07 227.392)',
        'oklch(0.828 0.189 84.429)',
        'oklch(0.769 0.188 70.08)',
      ])
      .withSidebarColors('custom', {
        light: { bg: 'oklch(0.985 0 0)', fg: 'oklch(0.141 0.005 285.823)' },
        dark: { bg: 'oklch(0.21 0.006 285.885)', fg: 'oklch(0.985 0 0)' },
      })
      .build(),

  yellow: () =>
    createTheme('Yellow')
      .withPrimaryColor(
        'oklch(0.795 0.184 86.047)',
        'oklch(0.795 0.184 86.047)',
      )
      .withSecondaryColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withAccentColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withMutedColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withBackgroundColors(
        'oklch(1 0 0)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.985 0 0)',
      )
      .withCardColors('oklch(1 0 0)', 'oklch(0.21 0.006 285.885)')
      .withBorderColors('oklch(0.92 0.004 286.32)', 'oklch(0.2 0 0 / 0.1)')
      .withDestructiveColor(
        'oklch(0.577 0.245 27.325)',
        'oklch(0.704 0.191 22.216)',
      )
      .withChartColors([
        'oklch(0.646 0.222 41.116)',
        'oklch(0.6 0.118 184.704)',
        'oklch(0.398 0.07 227.392)',
        'oklch(0.828 0.189 84.429)',
        'oklch(0.769 0.188 70.08)',
      ])
      .withSidebarColors('custom', {
        light: { bg: 'oklch(0.985 0 0)', fg: 'oklch(0.141 0.005 285.823)' },
        dark: { bg: 'oklch(0.21 0.006 285.885)', fg: 'oklch(0.985 0 0)' },
      })
      .build(),

  violet: () =>
    createTheme('Violet')
      .withPrimaryColor(
        'oklch(0.606 0.25 292.717)',
        'oklch(0.541 0.281 293.009)',
      )
      .withSecondaryColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withAccentColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withMutedColor(
        'oklch(0.967 0.001 286.375)',
        'oklch(0.274 0.006 286.033)',
      )
      .withBackgroundColors(
        'oklch(1 0 0)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.141 0.005 285.823)',
        'oklch(0.985 0 0)',
      )
      .withCardColors('oklch(1 0 0)', 'oklch(0.21 0.006 285.885)')
      .withBorderColors('oklch(0.92 0.004 286.32)', 'oklch(0.2 0 0 / 0.1)')
      .withDestructiveColor(
        'oklch(0.577 0.245 27.325)',
        'oklch(0.704 0.191 22.216)',
      )
      .withChartColors([
        'oklch(0.646 0.222 41.116)',
        'oklch(0.6 0.118 184.704)',
        'oklch(0.398 0.07 227.392)',
        'oklch(0.828 0.189 84.429)',
        'oklch(0.769 0.188 70.08)',
      ])
      .withSidebarColors('custom', {
        light: { bg: 'oklch(0.985 0 0)', fg: 'oklch(0.141 0.005 285.823)' },
        dark: { bg: 'oklch(0.21 0.006 285.885)', fg: 'oklch(0.985 0 0)' },
      })
      .build(),

  // Catalyst UI official theme with full 1:1 parity
  catalyst: () => createCatalystTheme(),
} as const;

/**
 * Get a preset theme by name
 */
export function getPresetTheme(
  name: keyof typeof themePresets,
): TrailheadThemeConfig {
  const preset = themePresets[name];
  if (!preset) {
    throw new Error(`Theme preset "${name}" not found`);
  }

  return preset();
}

/**
 * Get all preset theme names
 */
export function getPresetThemeNames(): (keyof typeof themePresets)[] {
  return Object.keys(themePresets) as (keyof typeof themePresets)[];
}

/**
 * Generate themes for all presets
 */
export function generateAllPresetThemes(): Record<
  string,
  TrailheadThemeConfig
> {
  const themes: Record<string, TrailheadThemeConfig> = {};

  for (const name of getPresetThemeNames()) {
    themes[name] = getPresetTheme(name);
  }

  return themes;
}
