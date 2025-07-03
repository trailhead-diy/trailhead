'use client';

import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { Button, Select } from '../';
import { useTheme } from './theme-provider';
import { themePresets } from './presets';

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
    const presetName = Object.keys(themePresets).find(key => key === themeName);
    if (presetName) {
      return presetName.charAt(0).toUpperCase() + presetName.slice(1);
    }
    // For custom themes, just capitalize the name
    return themeName.charAt(0).toUpperCase() + themeName.slice(1);
  };

  const themeOptions = themes.map(theme => ({
    value: theme,
    label: getThemeDisplayName(theme),
  }));

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
        {showDarkModeToggle && <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Theme:</span>

        <Select
          value={currentTheme || 'zinc'}
          onChange={e => setTheme(e.target.value)}
          className="min-w-[120px]"
        >
          {themeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Dark mode toggle */}
      {showDarkModeToggle && (
        <Button onClick={toggleDarkMode} outline className="text-xs px-3 py-1.5">
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </Button>
      )}

      {/* Quick theme selection buttons */}
      {showQuickSelect && (
        <div className="hidden sm:flex gap-2 border-l border-border pl-4">
          {themes.slice(0, maxQuickSelectThemes).map(theme => (
            <Button
              key={theme}
              {...(currentTheme === theme
                ? { color: 'blue' as const }
                : { outline: true as const })}
              onClick={() => setTheme(theme)}
              className="text-xs px-2 py-1"
              title={getThemeDisplayName(theme)}
            >
              {getThemeDisplayName(theme).slice(0, 3)}
            </Button>
          ))}
        </div>
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
    <div className="space-y-6 p-6 border border-border rounded-lg bg-card">
      <div>
        <h3 className="text-lg font-semibold mb-2">Theme Preview</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Current theme: <span className="font-medium">{currentTheme}</span> (
          {isDark ? 'dark' : 'light'} mode)
        </p>
        <p className="text-muted-foreground">
          All components automatically adapt to the selected theme without any code changes.
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-3 bg-primary text-primary-foreground rounded">Primary</div>
          <div className="p-3 bg-secondary text-secondary-foreground rounded">Secondary</div>
          <div className="p-3 bg-accent text-accent-foreground rounded">Accent</div>
          <div className="p-3 bg-muted text-muted-foreground rounded">Muted</div>
          <div className="p-3 bg-card text-card-foreground rounded border">Card</div>
          <div className="p-3 bg-popover text-popover-foreground rounded border">Popover</div>
          <div className="p-3 bg-destructive text-white rounded">Destructive</div>
          <div className="p-3 border-2 border-border rounded">Border</div>
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
              className="px-3 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs">Select</label>
            <select className="px-3 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
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
            className="w-8 h-8 rounded"
            style={{ backgroundColor: 'hsl(var(--chart-1))' }}
            title="Chart 1"
          />
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: 'hsl(var(--chart-2))' }}
            title="Chart 2"
          />
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: 'hsl(var(--chart-3))' }}
            title="Chart 3"
          />
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: 'hsl(var(--chart-4))' }}
            title="Chart 4"
          />
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: 'hsl(var(--chart-5))' }}
            title="Chart 5"
          />
        </div>
      </div>
    </div>
  );
};
