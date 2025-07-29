/**
 * Theme hooks for reading and modifying theme state
 */

import { useThemeStore } from './store'

/**
 * Individual selector hooks for optimal performance.
 * Components using these only re-render when their specific value changes.
 */
export const useMode = () => useThemeStore((state) => state.mode)
export const usePrimary = () => useThemeStore((state) => state.primary)
export const useSecondary = () => useThemeStore((state) => state.secondary)
export const useDestructive = () => useThemeStore((state) => state.destructive)
export const useBase = () => useThemeStore((state) => state.base)
export const useLayout = () => useThemeStore((state) => state.layout)

/**
 * Hook to access theme mutation actions.
 * Actions are stable and don't cause re-renders.
 * Selects only the actions to avoid re-renders on state changes.
 */
export const useThemeActions = () => {
  const setMode = useThemeStore((state) => state.setMode)
  const setPrimary = useThemeStore((state) => state.setPrimary)
  const setSecondary = useThemeStore((state) => state.setSecondary)
  const setDestructive = useThemeStore((state) => state.setDestructive)
  const setBase = useThemeStore((state) => state.setBase)
  const setLayout = useThemeStore((state) => state.setLayout)

  // Actions are stable references, no need to memoize
  return { setMode, setPrimary, setSecondary, setDestructive, setBase, setLayout }
}
