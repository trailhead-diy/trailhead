import type {
  ShadcnTheme,
  TrailheadTheme,
  ComponentThemeOverrides,
  TrailheadThemeConfig,
} from './config'
import {
  parseOKLCHColor,
  formatOKLCHColor,
  getContrastingColor,
  invertForDarkMode,
  adjustLightness as adjustLightnessFunc,
  createColorTransformer,
} from './utils'

type ThemeBuilderState = TrailheadThemeConfig
type ThemeBuilderFn = (state: ThemeBuilderState) => ThemeBuilderState

const extractLightness = (color: string): number => {
  try {
    const parsed = parseOKLCHColor(color)
    return parsed.l
  } catch {
    return 0.5
  }
}
const getContrastColor = (backgroundColor: string): string => {
  try {
    const bgColor = parseOKLCHColor(backgroundColor)
    const contrasting = getContrastingColor(bgColor)
    return formatOKLCHColor(contrasting)
  } catch {
    return 'oklch(0.145 0 0)'
  }
}
const adjustColorForDarkMode = (color: string): string => {
  try {
    const parsed = parseOKLCHColor(color)
    const inverted = invertForDarkMode(parsed)
    return formatOKLCHColor(inverted)
  } catch {
    // Fallback: simple lightness inversion
    const lightness = extractLightness(color)
    const newLightness = 1 - lightness
    return color.replace(/oklch\(([0-9.]+)/, `oklch(${newLightness.toFixed(3)}`)
  }
}
const createBrightnessAdjuster = (amount: number) =>
  createColorTransformer((color) => adjustLightnessFunc(color, amount))
export const withPrimaryColor =
  (lightColor: string, darkColor?: string): ThemeBuilderFn =>
  (state) => ({
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
  })
export const withSecondaryColor =
  (lightColor: string, darkColor?: string): ThemeBuilderFn =>
  (state) => ({
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
  })
export const withAccentColor =
  (lightColor: string, darkColor?: string): ThemeBuilderFn =>
  (state) => ({
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
  })

export const withMutedColor =
  (lightColor: string, darkColor?: string): ThemeBuilderFn =>
  (state) => ({
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
  })

export const withBackgroundColors =
  (lightBg: string, lightFg: string, darkBg?: string, darkFg?: string): ThemeBuilderFn =>
  (state) => ({
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
  })

export const withCardColors =
  (lightCard: string, darkCard?: string): ThemeBuilderFn =>
  (state) => ({
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
  })

export const withDestructiveColor =
  (lightColor: string, darkColor?: string): ThemeBuilderFn =>
  (state) => ({
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
  })

export const withBorderColors =
  (lightBorder: string, darkBorder?: string): ThemeBuilderFn =>
  (state) => {
    const darkBorderColor = darkBorder || adjustColorForDarkMode(lightBorder)
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
    }
  }

export const withChartColors =
  (colors: [string, string, string, string, string]): ThemeBuilderFn =>
  (state) => ({
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
  })

export const withSidebarColors =
  (
    based_on: 'background' | 'card' | 'custom',
    customColors?: {
      light: { bg: string; fg: string }
      dark: { bg: string; fg: string }
    }
  ): ThemeBuilderFn =>
  (state) => {
    let light: Partial<ShadcnTheme> = {}
    let dark: Partial<ShadcnTheme> = {}

    if (based_on === 'custom' && customColors) {
      light = {
        sidebar: customColors.light.bg,
        'sidebar-foreground': customColors.light.fg,
      }
      dark = {
        sidebar: customColors.dark.bg,
        'sidebar-foreground': customColors.dark.fg,
      }
    } else if (based_on === 'card') {
      light = {
        sidebar: state.light.card,
        'sidebar-foreground': state.light['card-foreground'],
      }
      dark = {
        sidebar: state.dark.card,
        'sidebar-foreground': state.dark['card-foreground'],
      }
    } else {
      light = {
        sidebar: state.light.background,
        'sidebar-foreground': state.light.foreground,
      }
      dark = {
        sidebar: state.dark.background,
        'sidebar-foreground': state.dark.foreground,
      }
    }

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
    }
  }

export const withPopoverColors =
  (sameAsCard = true): ThemeBuilderFn =>
  (state) => {
    if (!sameAsCard) return state

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
    }
  }

export const withComponentOverrides =
  (overrides: ComponentThemeOverrides): ThemeBuilderFn =>
  (state) => {
    const mergedComponents: ComponentThemeOverrides = { ...state.components }

    Object.entries(overrides).forEach(([componentName, componentOverrides]) => {
      mergedComponents[componentName] = {
        ...mergedComponents[componentName],
        ...componentOverrides,
      }
    })

    return {
      ...state,
      components: mergedComponents,
    }
  }

export const autoComplete: ThemeBuilderFn = (state) => {
  let newState = { ...state }

  if (!newState.light.card) {
    newState = {
      ...newState,
      light: {
        ...newState.light,
        card: newState.light.background,
        'card-foreground': newState.light.foreground,
      },
    }
  }

  if (!newState.dark.card) {
    newState = {
      ...newState,
      dark: {
        ...newState.dark,
        card: newState.dark.background,
        'card-foreground': newState.dark.foreground,
      },
    }
  }

  newState = withPopoverColors(true)(newState)

  if (!newState.light.sidebar) {
    newState = withSidebarColors('background')(newState)
  }

  return newState
}

export const compose =
  (...fns: ThemeBuilderFn[]): ThemeBuilderFn =>
  (state) =>
    fns.reduce((acc, fn) => fn(acc), state)

export const pipe = (initial: ThemeBuilderState, ...fns: ThemeBuilderFn[]): ThemeBuilderState =>
  compose(...fns)(initial)

export const createThemeState = (name: string): ThemeBuilderState => ({
  name,
  light: {} as TrailheadTheme,
  dark: {} as TrailheadTheme,
  components: {},
})

export const buildTheme = (state: ThemeBuilderState): TrailheadThemeConfig => {
  return autoComplete(state)
}

export const createTheme = (name: string) => {
  let state = createThemeState(name)

  const builder = {
    withPrimaryColor: (lightColor: string, darkColor?: string) => {
      state = withPrimaryColor(lightColor, darkColor)(state)
      return builder
    },
    withSecondaryColor: (lightColor: string, darkColor?: string) => {
      state = withSecondaryColor(lightColor, darkColor)(state)
      return builder
    },
    withAccentColor: (lightColor: string, darkColor?: string) => {
      state = withAccentColor(lightColor, darkColor)(state)
      return builder
    },
    withMutedColor: (lightColor: string, darkColor?: string) => {
      state = withMutedColor(lightColor, darkColor)(state)
      return builder
    },
    withBackgroundColors: (lightBg: string, lightFg: string, darkBg?: string, darkFg?: string) => {
      state = withBackgroundColors(lightBg, lightFg, darkBg, darkFg)(state)
      return builder
    },
    withCardColors: (lightCard: string, darkCard?: string) => {
      state = withCardColors(lightCard, darkCard)(state)
      return builder
    },
    withDestructiveColor: (lightColor: string, darkColor?: string) => {
      state = withDestructiveColor(lightColor, darkColor)(state)
      return builder
    },
    withBorderColors: (lightBorder: string, darkBorder?: string) => {
      state = withBorderColors(lightBorder, darkBorder)(state)
      return builder
    },
    withChartColors: (colors: [string, string, string, string, string]) => {
      state = withChartColors(colors)(state)
      return builder
    },
    withSidebarColors: (
      based_on: 'background' | 'card' | 'custom',
      customColors?: { light: { bg: string; fg: string }; dark: { bg: string; fg: string } }
    ) => {
      state = withSidebarColors(based_on, customColors)(state)
      return builder
    },
    withPopoverColors: (sameAsCard = true) => {
      state = withPopoverColors(sameAsCard)(state)
      return builder
    },
    withComponentOverrides: (overrides: ComponentThemeOverrides) => {
      state = withComponentOverrides(overrides)(state)
      return builder
    },
    build: () => buildTheme(state),
  }

  return builder
}
