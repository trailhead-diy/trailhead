/**
 * Theme Builder Utility
 *
 * Provides a functional API for building custom themes with validation
 * and automatic color calculations using immutable operations and composition.
 */

import type {
  ShadcnTheme,
  TrailheadTheme,
  ComponentThemeOverrides,
  TrailheadThemeConfig,
} from './config';
import {
  parseOKLCHColor,
  formatOKLCHColor,
  getContrastingColor,
  invertForDarkMode,
  adjustLightness as adjustLightnessFunc,
  createColorTransformer,
} from './utils';

// ============================================================================
// TYPES
// ============================================================================

// Builder state type
type ThemeBuilderState = TrailheadThemeConfig;

// Builder function type that transforms state
type ThemeBuilderFn = (state: ThemeBuilderState) => ThemeBuilderState;

// ============================================================================
// PURE HELPER FUNCTIONS
// ============================================================================

/**
 * Extract lightness value from OKLCH color string
 * Using culori for accurate parsing
 */
const extractLightness = (color: string): number => {
  try {
    const parsed = parseOKLCHColor(color);
    return parsed.l;
  } catch {
    return 0.5;
  }
};

/**
 * Get contrast color (white or black) for a given background
 * Using culori's WCAG contrast calculations
 */
const getContrastColor = (backgroundColor: string): string => {
  try {
    const bgColor = parseOKLCHColor(backgroundColor);
    const contrasting = getContrastingColor(bgColor);
    return formatOKLCHColor(contrasting);
  } catch {
    // Fallback for invalid colors
    return 'oklch(0.145 0 0)';
  }
};

/**
 * Adjust color for dark mode by inverting lightness
 * Using culori for accurate color manipulation
 */
const adjustColorForDarkMode = (color: string): string => {
  try {
    const parsed = parseOKLCHColor(color);
    const inverted = invertForDarkMode(parsed);
    return formatOKLCHColor(inverted);
  } catch {
    // Fallback: simple lightness inversion
    const lightness = extractLightness(color);
    const newLightness = 1 - lightness;
    return color.replace(/oklch\(([0-9.]+)/, `oklch(${newLightness.toFixed(3)}`);
  }
};

/**
 * Create a brightness adjuster with a specific amount
 */
const createBrightnessAdjuster = (amount: number) =>
  createColorTransformer(color => adjustLightnessFunc(color, amount));

// ============================================================================
// BUILDER FUNCTIONS
// ============================================================================

/**
 * Set the primary color scale
 */
export const withPrimaryColor =
  (lightColor: string, darkColor?: string): ThemeBuilderFn =>
  state => ({
    ...state,
    light: {
      ...state.light,
      primary: lightColor,
      'primary-foreground': getContrastColor(lightColor),
    },
    dark: {
      ...state.dark,
      primary: darkColor || adjustColorForDarkMode(lightColor),
      'primary-foreground': getContrastColor(darkColor || adjustColorForDarkMode(lightColor)),
    },
  });

/**
 * Set the secondary color scale
 */
export const withSecondaryColor =
  (lightColor: string, darkColor?: string): ThemeBuilderFn =>
  state => ({
    ...state,
    light: {
      ...state.light,
      secondary: lightColor,
      'secondary-foreground': getContrastColor(lightColor),
    },
    dark: {
      ...state.dark,
      secondary: darkColor || adjustColorForDarkMode(lightColor),
      'secondary-foreground': getContrastColor(darkColor || adjustColorForDarkMode(lightColor)),
    },
  });

/**
 * Set the accent color scale
 */
export const withAccentColor =
  (lightColor: string, darkColor?: string): ThemeBuilderFn =>
  state => ({
    ...state,
    light: {
      ...state.light,
      accent: lightColor,
      'accent-foreground': getContrastColor(lightColor),
    },
    dark: {
      ...state.dark,
      accent: darkColor || adjustColorForDarkMode(lightColor),
      'accent-foreground': getContrastColor(darkColor || adjustColorForDarkMode(lightColor)),
    },
  });

/**
 * Set the muted color scale
 */
export const withMutedColor =
  (lightColor: string, darkColor?: string): ThemeBuilderFn =>
  state => ({
    ...state,
    light: {
      ...state.light,
      muted: lightColor,
      'muted-foreground': getContrastColor(lightColor),
    },
    dark: {
      ...state.dark,
      muted: darkColor || adjustColorForDarkMode(lightColor),
      'muted-foreground': getContrastColor(darkColor || adjustColorForDarkMode(lightColor)),
    },
  });

/**
 * Set background and foreground colors
 */
export const withBackgroundColors =
  (lightBg: string, lightFg: string, darkBg?: string, darkFg?: string): ThemeBuilderFn =>
  state => ({
    ...state,
    light: {
      ...state.light,
      background: lightBg,
      foreground: lightFg,
    },
    dark: {
      ...state.dark,
      background: darkBg || adjustColorForDarkMode(lightBg),
      foreground: darkFg || adjustColorForDarkMode(lightFg),
    },
  });

/**
 * Set card colors
 */
export const withCardColors =
  (lightCard: string, darkCard?: string): ThemeBuilderFn =>
  state => ({
    ...state,
    light: {
      ...state.light,
      card: lightCard,
      'card-foreground': getContrastColor(lightCard),
    },
    dark: {
      ...state.dark,
      card: darkCard || adjustColorForDarkMode(lightCard),
      'card-foreground': getContrastColor(darkCard || adjustColorForDarkMode(lightCard)),
    },
  });

/**
 * Set destructive color
 */
export const withDestructiveColor =
  (lightColor: string, darkColor?: string): ThemeBuilderFn =>
  state => ({
    ...state,
    light: {
      ...state.light,
      destructive: lightColor,
      'destructive-foreground': getContrastColor(lightColor),
    },
    dark: {
      ...state.dark,
      destructive: darkColor || lightColor,
      'destructive-foreground': getContrastColor(darkColor || lightColor),
    },
  });

/**
 * Set border and input colors
 */
export const withBorderColors =
  (lightBorder: string, darkBorder?: string): ThemeBuilderFn =>
  state => {
    const darkBorderColor = darkBorder || adjustColorForDarkMode(lightBorder);
    return {
      ...state,
      light: {
        ...state.light,
        border: lightBorder,
        input: lightBorder,
        ring: createBrightnessAdjuster(-0.1)(lightBorder),
      },
      dark: {
        ...state.dark,
        border: darkBorderColor,
        input: createBrightnessAdjuster(0.05)(darkBorderColor),
        ring: createBrightnessAdjuster(0.1)(darkBorderColor),
      },
    };
  };

/**
 * Set chart colors
 */
export const withChartColors =
  (colors: [string, string, string, string, string]): ThemeBuilderFn =>
  state => ({
    ...state,
    light: {
      ...state.light,
      'chart-1': colors[0],
      'chart-2': colors[1],
      'chart-3': colors[2],
      'chart-4': colors[3],
      'chart-5': colors[4],
    },
    dark: {
      ...state.dark,
      'chart-1': adjustColorForDarkMode(colors[0]),
      'chart-2': adjustColorForDarkMode(colors[1]),
      'chart-3': adjustColorForDarkMode(colors[2]),
      'chart-4': adjustColorForDarkMode(colors[3]),
      'chart-5': adjustColorForDarkMode(colors[4]),
    },
  });

/**
 * Set sidebar colors
 */
export const withSidebarColors =
  (
    based_on: 'background' | 'card' | 'custom',
    customColors?: {
      light: { bg: string; fg: string };
      dark: { bg: string; fg: string };
    }
  ): ThemeBuilderFn =>
  state => {
    let light: Partial<ShadcnTheme> = {};
    let dark: Partial<ShadcnTheme> = {};

    if (based_on === 'custom' && customColors) {
      light = {
        sidebar: customColors.light.bg,
        'sidebar-foreground': customColors.light.fg,
      };
      dark = {
        sidebar: customColors.dark.bg,
        'sidebar-foreground': customColors.dark.fg,
      };
    } else if (based_on === 'card') {
      light = {
        sidebar: state.light.card,
        'sidebar-foreground': state.light['card-foreground'],
      };
      dark = {
        sidebar: state.dark.card,
        'sidebar-foreground': state.dark['card-foreground'],
      };
    } else {
      light = {
        sidebar: state.light.background,
        'sidebar-foreground': state.light.foreground,
      };
      dark = {
        sidebar: state.dark.background,
        'sidebar-foreground': state.dark.foreground,
      };
    }

    // Auto-generate other sidebar colors
    return {
      ...state,
      light: {
        ...state.light,
        ...light,
        'sidebar-primary': state.light.primary,
        'sidebar-primary-foreground': state.light['primary-foreground'],
        'sidebar-accent': state.light.accent,
        'sidebar-accent-foreground': state.light['accent-foreground'],
        'sidebar-border': state.light.border,
        'sidebar-ring': state.light.ring,
      },
      dark: {
        ...state.dark,
        ...dark,
        'sidebar-primary': state.dark.primary,
        'sidebar-primary-foreground': state.dark['primary-foreground'],
        'sidebar-accent': state.dark.accent,
        'sidebar-accent-foreground': state.dark['accent-foreground'],
        'sidebar-border': state.dark.border,
        'sidebar-ring': state.dark.ring,
      },
    };
  };

/**
 * Set popover colors (usually same as card)
 */
export const withPopoverColors =
  (sameAsCard = true): ThemeBuilderFn =>
  state => {
    if (!sameAsCard) return state;

    return {
      ...state,
      light: {
        ...state.light,
        popover: state.light.card,
        'popover-foreground': state.light['card-foreground'],
      },
      dark: {
        ...state.dark,
        popover: state.dark.card,
        'popover-foreground': state.dark['card-foreground'],
      },
    };
  };

/**
 * Add component-specific overrides
 */
export const withComponentOverrides =
  (overrides: ComponentThemeOverrides): ThemeBuilderFn =>
  state => {
    const mergedComponents: ComponentThemeOverrides = { ...state.components };

    // Deep merge component overrides
    Object.entries(overrides).forEach(([componentName, componentOverrides]) => {
      mergedComponents[componentName] = {
        ...mergedComponents[componentName],
        ...componentOverrides,
      };
    });

    return {
      ...state,
      components: mergedComponents,
    };
  };

/**
 * Auto-complete missing colors based on existing ones
 */
export const autoComplete: ThemeBuilderFn = state => {
  let newState = { ...state };

  // Auto-complete card colors if missing
  if (!newState.light.card) {
    newState = {
      ...newState,
      light: {
        ...newState.light,
        card: newState.light.background,
        'card-foreground': newState.light.foreground,
      },
    };
  }

  if (!newState.dark.card) {
    newState = {
      ...newState,
      dark: {
        ...newState.dark,
        card: newState.dark.background,
        'card-foreground': newState.dark.foreground,
      },
    };
  }

  // Auto-complete popover colors
  newState = withPopoverColors(true)(newState);

  // Auto-complete sidebar if not set
  if (!newState.light.sidebar) {
    newState = withSidebarColors('background')(newState);
  }

  return newState;
};

// ============================================================================
// COMPOSITION UTILITIES
// ============================================================================

/**
 * Compose multiple builder functions into a single function
 */
export const compose =
  (...fns: ThemeBuilderFn[]): ThemeBuilderFn =>
  state =>
    fns.reduce((acc, fn) => fn(acc), state);

/**
 * Create a pipe function for more readable composition
 */
export const pipe = (initial: ThemeBuilderState, ...fns: ThemeBuilderFn[]): ThemeBuilderState =>
  compose(...fns)(initial);

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Create an initial theme state
 */
export const createThemeState = (name: string): ThemeBuilderState => ({
  name,
  light: {} as TrailheadTheme,
  dark: {} as TrailheadTheme,
  components: {},
});

/**
 * Build a theme using functional composition
 */
export const buildTheme = (state: ThemeBuilderState): TrailheadThemeConfig => {
  // Apply auto-completion before returning
  return autoComplete(state);
};

/**
 * Create a theme with a fluent-like API using function chaining
 * This provides a similar developer experience to the class-based version
 */
export const createTheme = (name: string) => {
  let state = createThemeState(name);

  const builder = {
    withPrimaryColor: (lightColor: string, darkColor?: string) => {
      state = withPrimaryColor(lightColor, darkColor)(state);
      return builder;
    },
    withSecondaryColor: (lightColor: string, darkColor?: string) => {
      state = withSecondaryColor(lightColor, darkColor)(state);
      return builder;
    },
    withAccentColor: (lightColor: string, darkColor?: string) => {
      state = withAccentColor(lightColor, darkColor)(state);
      return builder;
    },
    withMutedColor: (lightColor: string, darkColor?: string) => {
      state = withMutedColor(lightColor, darkColor)(state);
      return builder;
    },
    withBackgroundColors: (lightBg: string, lightFg: string, darkBg?: string, darkFg?: string) => {
      state = withBackgroundColors(lightBg, lightFg, darkBg, darkFg)(state);
      return builder;
    },
    withCardColors: (lightCard: string, darkCard?: string) => {
      state = withCardColors(lightCard, darkCard)(state);
      return builder;
    },
    withDestructiveColor: (lightColor: string, darkColor?: string) => {
      state = withDestructiveColor(lightColor, darkColor)(state);
      return builder;
    },
    withBorderColors: (lightBorder: string, darkBorder?: string) => {
      state = withBorderColors(lightBorder, darkBorder)(state);
      return builder;
    },
    withChartColors: (colors: [string, string, string, string, string]) => {
      state = withChartColors(colors)(state);
      return builder;
    },
    withSidebarColors: (
      based_on: 'background' | 'card' | 'custom',
      customColors?: {
        light: { bg: string; fg: string };
        dark: { bg: string; fg: string };
      }
    ) => {
      state = withSidebarColors(based_on, customColors)(state);
      return builder;
    },
    withPopoverColors: (sameAsCard = true) => {
      state = withPopoverColors(sameAsCard)(state);
      return builder;
    },
    withComponentOverrides: (overrides: ComponentThemeOverrides) => {
      state = withComponentOverrides(overrides)(state);
      return builder;
    },
    build: () => buildTheme(state),
  };

  return builder;
};

// ============================================================================
// THEME BUILDER API EXAMPLES
// ============================================================================

/**
 * The theme builder API supports multiple approaches for creating themes.
 * All actual themes are defined in `presets.ts` - these are educational examples.
 *
 * Example 1: Fluent API (Method Chaining)
 * This provides a readable, chainable interface similar to builder patterns:
 *
 * const blueTheme = createTheme('Blue')
 *   .withPrimaryColor('oklch(0.623 0.214 259.815)', 'oklch(0.546 0.245 262.881)')
 *   .withSecondaryColor('oklch(0.967 0.001 286.375)', 'oklch(0.274 0.006 286.033)')
 *   .withBackgroundColors('oklch(1 0 0)', 'oklch(0.141 0.005 285.823)')
 *   .withCardColors('oklch(1 0 0)', 'oklch(0.21 0.006 285.885)')
 *   .withBorderColors('oklch(0.92 0.004 286.32)', 'oklch(0.2 0 0 / 0.1)')
 *   .build()
 *
 * Example 2: Functional Composition with Pipe
 * This allows for more functional programming patterns:
 *
 * const greenTheme = pipe(
 *   createThemeState('Green'),
 *   withPrimaryColor('oklch(0.723 0.219 149.579)', 'oklch(0.696 0.17 162.48)'),
 *   withSecondaryColor('oklch(0.967 0.001 286.375)', 'oklch(0.274 0.006 286.033)'),
 *   withBackgroundColors('oklch(1 0 0)', 'oklch(0.141 0.005 285.823)'),
 *   buildTheme
 * )
 *
 * Example 3: Compose for Advanced Composition
 * This creates reusable theme transformation functions:
 *
 * const orangeTransform = compose(
 *   withPrimaryColor('oklch(0.705 0.213 47.604)', 'oklch(0.646 0.222 41.116)'),
 *   withSecondaryColor('oklch(0.967 0.001 286.375)', 'oklch(0.274 0.006 286.033)'),
 *   withBackgroundColors('oklch(1 0 0)', 'oklch(0.141 0.005 285.823)')
 * )
 * const orangeTheme = buildTheme(orangeTransform(createThemeState('Orange')))
 *
 * All approaches produce the same TrailheadThemeConfig result and can be used
 * interchangeably based on your preference and use case.
 */
