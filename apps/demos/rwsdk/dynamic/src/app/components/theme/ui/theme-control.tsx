'use client'

import { useState } from 'react'
import { Button } from '@/app/components/button'
import { PaintBrushIcon } from '@heroicons/react/16/solid'
import { ThemeDialog } from './theme-dialog'

/**
 * Theme control button that opens a dialog with all theme options.
 *
 * @example
 * ```tsx
 * <ThemeControl />
 * ```
 *
 * @remarks
 * No props, no configuration - just works.
 * Shows a button with paint brush icon that opens the theme dialog on click.
 *
 * @returns A button that opens the theme configuration dialog
 */
export function ThemeControl() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button outline onClick={() => setOpen(true)}>
        <PaintBrushIcon className="h-4 w-4" />
        Theme
      </Button>
      <ThemeDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}
