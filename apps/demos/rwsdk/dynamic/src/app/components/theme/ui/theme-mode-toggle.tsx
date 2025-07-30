'use client'

import { useMode, useThemeActions } from '../hooks'
import { Button } from '@/app/components/button'
import { MoonIcon, SunIcon, ComputerDesktopIcon } from '@heroicons/react/16/solid'
import type { ColorMode } from '../types'

// Mode cycle order
const MODE_CYCLE: ColorMode[] = ['light', 'dark', 'system']

// Mode configuration
const MODE_CONFIG = {
  light: {
    icon: SunIcon,
    nextLabel: 'Switch to dark mode',
  },
  dark: {
    icon: MoonIcon,
    nextLabel: 'Switch to system mode',
  },
  system: {
    icon: ComputerDesktopIcon,
    nextLabel: 'Switch to light mode',
  },
} as const

/**
 * Mode toggle button that cycles through light → dark → system modes.
 *
 * @example
 * ```tsx
 * <ThemeModeToggle />
 * ```
 *
 * @remarks
 * No props, no configuration - just works.
 * Shows appropriate icon (sun/moon/computer) based on current mode.
 * Includes tooltip showing what mode will be activated on next click.
 *
 * @returns A button that cycles through theme modes
 */
export function ThemeModeToggle() {
  const mode = useMode()
  const { setMode } = useThemeActions()

  const handleClick = () => {
    const currentIndex = MODE_CYCLE.indexOf(mode)
    const nextMode = MODE_CYCLE[(currentIndex + 1) % MODE_CYCLE.length]
    setMode(nextMode)
  }

  const config = MODE_CONFIG[mode]
  const { icon: Icon, nextLabel } = config

  return (
    <Button plain onClick={handleClick} className="p-2" aria-label={nextLabel} title={nextLabel}>
      <Icon className="h-5 w-5" />
    </Button>
  )
}
