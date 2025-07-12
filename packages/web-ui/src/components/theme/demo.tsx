/**
 * Demo component showcasing the ThemeSelector
 * This file demonstrates how to use the theme selector system
 */

'use client';

import { ThemeSelector } from './index';
import { Button } from '../button';
import { Badge } from '../badge';

export function ThemeDemo() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Theme Selector Demo</h2>
        <p className="text-sm text-zinc-600 mb-4">
          Use the dropdown below to change the theme color for all components. Notice how the color
          circles provide a visual preview of each option.
        </p>

        <ThemeSelector label="Theme Color" className="mb-6" />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Buttons (using theme color)</h3>
          <div className="flex gap-2 flex-wrap">
            <Button>Primary Button</Button>
            <Button outline>Outline Button</Button>
            <Button plain>Plain Button</Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Button with Color Override</h3>
          <div className="flex gap-2 flex-wrap">
            <Button color="red">Red Button (prop override)</Button>
            <Button>Theme Button (from context)</Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Badges (using theme color)</h3>
          <div className="flex gap-2 flex-wrap">
            <Badge>Theme Badge</Badge>
            <Badge color="green">Green Badge (prop override)</Badge>
            <Badge>Another Theme Badge</Badge>
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        <p>
          💡 <strong>Tip:</strong> The color selector shows small colored circles next to each
          option for easy visual identification. The current color is also displayed in the button.
        </p>
      </div>
    </div>
  );
}
