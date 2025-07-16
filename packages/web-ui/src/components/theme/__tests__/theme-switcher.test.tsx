import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { ThemeSwitcher, ThemePreview } from '../theme-switcher'
import { ThemeProvider } from '../theme-provider'

vi.mock('@/components/button', () => ({
  Button: ({
    children,
    onClick,
    outline,
    color,
    plain,
    className,
    ...props
  }: {
    children: React.ReactNode
    onClick?: () => void
    outline?: boolean
    color?: string
    plain?: boolean
    className?: string
    [key: string]: unknown
  }) => (
    <button
      onClick={onClick}
      className={className}
      data-testid="button"
      data-outline={outline}
      data-color={color}
      data-plain={plain}
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/select', () => ({
  Select: ({
    children,
    onChange,
    value,
    className,
    ...props
  }: {
    children: React.ReactNode
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
    value?: string
    className?: string
    [key: string]: unknown
  }) => (
    <select onChange={onChange} value={value} className={className} {...props}>
      {children}
    </select>
  ),
}))

describe('ThemeSwitcher Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should render theme switcher interface', () => {
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      )

      expect(screen.getByText('Theme:')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should show dark mode toggle by default', () => {
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      )

      // Look for either Light or Dark button
      const darkModeButton = screen.getByRole('button', { name: /Light|Dark/i })
      expect(darkModeButton).toBeInTheDocument()
    })

    it('should hide dark mode toggle when showDarkModeToggle is false', () => {
      render(
        <ThemeProvider>
          <ThemeSwitcher showDarkModeToggle={false} />
        </ThemeProvider>
      )

      // Should not find Light or Dark button
      expect(screen.queryByRole('button', { name: /Light|Dark/i })).not.toBeInTheDocument()
    })

    it('should apply custom className when provided', () => {
      const { container } = render(
        <ThemeProvider>
          <ThemeSwitcher className="custom-theme-switcher" />
        </ThemeProvider>
      )

      expect(container.querySelector('.custom-theme-switcher')).toBeInTheDocument()
    })
  })

  describe('ThemePreview Component', () => {
    it('should render theme preview without errors', () => {
      render(
        <ThemeProvider>
          <ThemePreview />
        </ThemeProvider>
      )

      expect(screen.getByText('Theme Preview')).toBeInTheDocument()
      expect(screen.getByText('Buttons')).toBeInTheDocument()
      expect(screen.getByText('Color System')).toBeInTheDocument()
      expect(screen.getByText('Interactive Elements')).toBeInTheDocument()
      expect(screen.getByText('Chart Colors')).toBeInTheDocument()
    })

    it('should show current theme information', () => {
      render(
        <ThemeProvider defaultTheme="purple">
          <ThemePreview />
        </ThemeProvider>
      )

      expect(screen.getByText(/Current theme:/)).toBeInTheDocument()
      expect(screen.getByText(/mode\)/)).toBeInTheDocument()
    })
  })
})
