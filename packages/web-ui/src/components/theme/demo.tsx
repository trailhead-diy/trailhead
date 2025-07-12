/**
 * Demo component showcasing the DefaultColorSelector
 * This file demonstrates how to use the default color selector system
 */

'use client';

import { DefaultColorProvider, DefaultColorSelector } from './index';
import { Button } from '../button';
import { Badge } from '../badge';

export function ThemeDemo() {
  return (
    <DefaultColorProvider>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Default Color Selector Demo</h2>
          <p className="text-sm text-zinc-600 mb-4">
            Use the dropdown below to change the default color for all components. Notice how the
            color circles provide a visual preview of each option.
          </p>

          <DefaultColorSelector label="Theme Color" className="mb-6" />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Buttons (using default color)</h3>
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
              <Button>Default Button (from context)</Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Badges (using default color)</h3>
            <div className="flex gap-2 flex-wrap">
              <Badge>Default Badge</Badge>
              <Badge color="green">Green Badge (prop override)</Badge>
              <Badge>Another Default Badge</Badge>
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          <p>
            💡 <strong>Tip:</strong> The color selector shows small colored circles next to each
            option for easy visual identification. The current color is also displayed in the
            button.
          </p>
        </div>
      </div>
    </DefaultColorProvider>
  );
}
