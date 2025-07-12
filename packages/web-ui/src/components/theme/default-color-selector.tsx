'use client';

import { Dropdown, DropdownButton, DropdownMenu, DropdownItem } from '../dropdown';
import { ChevronDownIcon } from '@heroicons/react/16/solid';
import { useDefaultColors, AVAILABLE_COLORS } from './default-colors';

/**
 * Format color name for display
 */
function formatColorName(color: string): string {
  return color
    .split('/')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ');
}

/**
 * Get color preview styles for the color circle
 */
function getColorPreviewStyles(color: string): string {
  const colorMap: Record<string, string> = {
    // Semantic colors (use reasonable defaults)
    primary: 'bg-blue-600',
    secondary: 'bg-zinc-600',
    destructive: 'bg-red-600',
    accent: 'bg-purple-600',
    muted: 'bg-gray-600',
    // Basic colors
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-400',
    yellow: 'bg-yellow-300',
    lime: 'bg-lime-300',
    green: 'bg-green-600',
    emerald: 'bg-emerald-600',
    teal: 'bg-teal-600',
    cyan: 'bg-cyan-300',
    sky: 'bg-sky-500',
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    purple: 'bg-purple-500',
    fuchsia: 'bg-fuchsia-500',
    pink: 'bg-pink-500',
    rose: 'bg-rose-500',
    // Zinc variations
    zinc: 'bg-zinc-600',
    dark: 'bg-zinc-900',
    light: 'bg-zinc-100 border border-zinc-300',
    white: 'bg-white border border-zinc-300',
    'dark/zinc': 'bg-zinc-900',
    'dark/white': 'bg-white border border-zinc-300',
  };

  return colorMap[color] || 'bg-zinc-400';
}

/**
 * Props for DefaultColorSelector
 */
export interface DefaultColorSelectorProps {
  className?: string;
  label?: string;
}

/**
 * Default color selector component using dropdown
 * Changes the default color for all components when selection changes
 */
export function DefaultColorSelector({
  className,
  label = 'Default Color',
}: DefaultColorSelectorProps) {
  const { colors, setGlobalColor } = useDefaultColors();

  // Use button color as the representative global color
  const currentColor = colors.button;

  return (
    <Dropdown>
      <DropdownButton className={className}>
        <div className="flex items-center gap-2">
          <div
            className={`size-3 rounded-full flex-shrink-0 ${getColorPreviewStyles(currentColor)}`}
          />
          {label}: {formatColorName(currentColor)}
        </div>
        <ChevronDownIcon className="size-4" />
      </DropdownButton>
      <DropdownMenu>
        {AVAILABLE_COLORS.map(color => (
          <DropdownItem key={color} onClick={() => setGlobalColor(color)}>
            <div className="flex items-center gap-3">
              <div
                className={`size-3 rounded-full flex-shrink-0 ${getColorPreviewStyles(color)}`}
              />
              {formatColorName(color)}
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
