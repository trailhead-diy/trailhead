'use client';

import { useEffect, useState } from 'react';
import { Button, Select } from '../';
import { cn } from '../utils/cn';
import { themePresets } from './presets';
import { useTheme } from './theme-provider';

interface ThemeSwitcherProps {
  className?: string;
  showDarkModeToggle?: boolean;
  showQuickSelect?: boolean;
  maxQuickSelectThemes?: number;
}

/**
 * Theme Switcher Component
 *
 * Allows users to switch between all available themes and toggle dark mode.
 * Demonstrates the power of the new theme system with 20+ built-in themes.
 */
export const ThemeSwitcher = ({
  className,
  showDarkModeToggle = true,
  showQuickSelect = true,
  maxQuickSelectThemes = 5,
}: ThemeSwitcherProps) => {
  const { currentTheme, isDark, themes, setTheme, toggleDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get theme display names from presets
  const getThemeDisplayName = (themeName: string): string => {
    // Check if it's a preset theme
    const presetName = Object.keys(themePresets).find(
      (key) => key === themeName,
    );
    if (presetName) {
      return presetName.charAt(0).toUpperCase() + presetName.slice(1);
    }
    // For custom themes, just capitalize the name
    return themeName.charAt(0).toUpperCase() + themeName.slice(1);
  };

  const themeOptions = themes.map((theme) => ({
    value: theme,
    label: getThemeDisplayName(theme),
  }));

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-card/95 backdrop-blur-sm border border-border shadow-lg p-3',
          className,
        )}
      >
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        {showDarkModeToggle && (
          <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-card/95 backdrop-blur-sm border border-border shadow-lg p-3',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Theme:</span>

        <Select
          value={currentTheme || 'zinc'}
          onChange={(e) => setTheme(e.target.value)}
          className="min-w-[120px]"
        >
          {themeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Dark mode toggle */}
      {showDarkModeToggle && (
        <Button
          onClick={toggleDarkMode}
          outline
          className="px-3 py-1.5 text-xs"
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </Button>
      )}
    </div>
  );
};

/**
 * Theme Preview Component
 *
 * Shows how different components look with the current theme
 */
export const ThemePreview = () => {
  const { currentTheme, isDark } = useTheme();

  return (
    <div className="z space-y-6 rounded-lg border border-border bg-card p-6">
      <div>
        <h3 className="mb-2 text-lg font-semibold">Theme Preview</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Current theme: <span className="font-medium">{currentTheme}</span> (
          {isDark ? 'dark' : 'light'} mode)
        </p>
        <p className="text-muted-foreground">
          All components automatically adapt to the selected theme without any
          code changes.
        </p>
      </div>

      {/* Button variations */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Buttons</h4>
        <div className="flex flex-wrap gap-2">
          <Button color="blue">Primary</Button>
          <Button color="zinc">Secondary</Button>
          <Button outline>Outline</Button>
          <Button plain>Plain</Button>
          <Button color="red">Destructive</Button>
        </div>
      </div>

      {/* Color system showcase */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Color System</h4>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded bg-primary p-3 text-primary-foreground">
            Primary
          </div>
          <div className="rounded bg-secondary p-3 text-secondary-foreground">
            Secondary
          </div>
          <div className="rounded bg-accent p-3 text-accent-foreground">
            Accent
          </div>
          <div className="rounded bg-muted p-3 text-muted-foreground">
            Muted
          </div>
          <div className="rounded border bg-card p-3 text-card-foreground">
            Card
          </div>
          <div className="rounded border bg-popover p-3 text-popover-foreground">
            Popover
          </div>
          <div className="rounded bg-destructive p-3 text-white">
            Destructive
          </div>
          <div className="rounded border-2 border-border p-3">Border</div>
        </div>
      </div>

      {/* Interactive elements */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Interactive Elements</h4>
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <label className="text-xs">Input</label>
            <input
              type="text"
              placeholder="Type here..."
              className="rounded-md border border-input px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs">Select</label>
            <select className="rounded-md border border-input px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none">
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart colors */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Chart Colors</h4>
        <div className="flex gap-2">
          <div
            className="h-8 w-8 rounded"
            style={{ backgroundColor: 'hsl(var(--chart-1))' }}
            title="Chart 1"
          />
          <div
            className="h-8 w-8 rounded"
            style={{ backgroundColor: 'hsl(var(--chart-2))' }}
            title="Chart 2"
          />
          <div
            className="h-8 w-8 rounded"
            style={{ backgroundColor: 'hsl(var(--chart-3))' }}
            title="Chart 3"
          />
          <div
            className="h-8 w-8 rounded"
            style={{ backgroundColor: 'hsl(var(--chart-4))' }}
            title="Chart 4"
          />
          <div
            className="h-8 w-8 rounded"
            style={{ backgroundColor: 'hsl(var(--chart-5))' }}
            title="Chart 5"
          />
        </div>
      </div>
    </div>
  );
};
