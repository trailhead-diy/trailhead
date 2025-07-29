'use client'

import { useState } from 'react'
import {
  useMode,
  usePrimary,
  useSecondary,
  useDestructive,
  useBase,
  useLayout,
  useThemeActions,
} from '../hooks'
import { COLOR_NAMES, COLOR_MODES, GRAY_NAMES } from '../constants'
import type { ColorName, ColorMode } from '../types'
import { generateThemeCSS, copyToClipboard } from '../utils/export-theme'
import { Button } from '@/app/components/button'
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from '@/app/components/dialog'
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@/app/components/dropdown'
import { Divider } from '@/app/components/divider'
import { Subheading } from '@/app/components/heading'
import { Text } from '@/app/components/text'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import {
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from '@heroicons/react/16/solid'

// Helper to format option labels
const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

// Color dot component that uses CSS variables for accurate preview
function ColorDot({ color, shade = '500' }: { color: string; shade?: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full border border-border"
      style={{ backgroundColor: `var(--color-${color}-${shade})` }}
    />
  )
}

// Reusable dropdown component with optional color dot following Catalyst patterns
interface ThemeDropdownProps {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  ariaLabel: string
  showColorDot?: boolean
}

function ThemeDropdown({
  value,
  onChange,
  options,
  ariaLabel,
  showColorDot = true,
}: ThemeDropdownProps) {
  const showDot = showColorDot && value

  return (
    <div className="flex items-center">
      <Dropdown>
        <DropdownButton outline className="min-w-full" aria-label={ariaLabel}>
          <div className="flex items-center gap-2">
            {showDot && <ColorDot color={value} />}
            {formatLabel(value)}
          </div>
          <ChevronDownIcon className="h-5 w-5" />
        </DropdownButton>
        <DropdownMenu className="min-w-24">
          {options.map((option) => (
            <DropdownItem key={option} onClick={() => onChange(option)}>
              <div className="flex items-center gap-2">
                {showColorDot && <ColorDot color={option} />}
                <DropdownLabel>{formatLabel(option)}</DropdownLabel>
              </div>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

/**
 * Theme Configuration Dialog
 *
 * A comprehensive dialog for configuring all theme options.
 * Used by the CompactThemeControls to provide full theme controls.
 */
interface ThemeDialogProps {
  open: boolean
  onClose: () => void
}

export function ThemeDialog({ open, onClose }: ThemeDialogProps) {
  // Use individual hooks to prevent infinite re-renders
  const mode = useMode()
  const primary = usePrimary()
  const secondary = useSecondary()
  const destructive = useDestructive()
  const base = useBase()
  const layout = useLayout()
  const { setMode, setPrimary, setSecondary, setDestructive, setBase, setLayout } =
    useThemeActions()

  // Export state
  const [copied, setCopied] = useState(false)
  const Section = ({ children }: { children: React.ReactNode }) => (
    <>
      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">{children}</section>
      <Divider soft />
    </>
  )
  Section.Label = ({ children }: { children: React.ReactNode }) => (
    <div className="space-y-1 sm:col-span-2">{children}</div>
  )
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Theme Settings</DialogTitle>
      <DialogDescription>
        Customize your experience by selecting colors and appearance preferences.
      </DialogDescription>

      <DialogBody>
        <div className="space-y-10">
          <Section>
            <Section.Label>
              <Subheading>Primary Color</Subheading>
              <Text>The main accent color for buttons and interactive elements.</Text>
            </Section.Label>
            <ThemeDropdown
              value={primary}
              onChange={(value) => setPrimary(value as ColorName)}
              options={COLOR_NAMES}
              ariaLabel="Primary Color"
            />
          </Section>

          <Section>
            <Section.Label>
              <Subheading>Secondary Color</Subheading>
              <Text>Secondary accent color for complementary elements.</Text>
            </Section.Label>
            <ThemeDropdown
              value={secondary}
              onChange={(value) => setSecondary(value as ColorName)}
              options={COLOR_NAMES}
              ariaLabel="Secondary Color"
            />
          </Section>

          <Section>
            <Section.Label>
              <Subheading>Destructive Color</Subheading>
              <Text>Color for error states and destructive actions.</Text>
            </Section.Label>
            <ThemeDropdown
              value={destructive}
              onChange={(value) => setDestructive(value as ColorName)}
              options={COLOR_NAMES}
              ariaLabel="Destructive Color"
            />
          </Section>

          <Section>
            <Section.Label>
              <Subheading>Base Color</Subheading>
              <Text>The base color palette for backgrounds and borders.</Text>
            </Section.Label>
            <ThemeDropdown
              value={base}
              onChange={(value) => setBase(value as ColorName)}
              options={GRAY_NAMES}
              ariaLabel="Base Color"
            />
          </Section>

          <Section>
            <Section.Label>
              <Subheading>Layout Color</Subheading>
              <Text>Colors for sidebars, navigation, and layout elements.</Text>
            </Section.Label>
            <ThemeDropdown
              value={layout}
              onChange={(value) => setLayout(value as ColorName)}
              options={COLOR_NAMES}
              ariaLabel="Layout Color"
            />
          </Section>

          <Section>
            <Section.Label>
              <Subheading>Appearance Mode</Subheading>
              <Text>Choose between light, dark, or system preference.</Text>
            </Section.Label>
            <div className="flex flex-col gap-2">
              {COLOR_MODES.map((m) => {
                const Icon = m === 'light' ? SunIcon : m === 'dark' ? MoonIcon : ComputerDesktopIcon
                const isSelected = mode === m
                return (
                  <Button
                    key={m}
                    onClick={() => setMode(m as ColorMode)}
                    {...(isSelected ? { color: 'base' as const } : { outline: true })}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {formatLabel(m)}
                  </Button>
                )
              })}
            </div>
          </Section>
        </div>
      </DialogBody>

      <DialogActions>
        <Button
          plain
          onClick={() => {
            const themeState = { mode, primary, secondary, destructive, base, layout }
            const css = generateThemeCSS(themeState)
            copyToClipboard(css).then((success) => {
              if (success) {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }
            })
          }}
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <DocumentDuplicateIcon className="h-4 w-4" />
              Export CSS
            </>
          )}
        </Button>
        <Button plain onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  )
}
