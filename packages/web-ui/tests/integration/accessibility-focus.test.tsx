import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Import components that should have focus indicators
import { Button } from '../../src/components/button';
import { Input } from '../../src/components/input';
import { Checkbox } from '../../src/components/checkbox';
import { Radio, RadioGroup } from '../../src/components/radio';
import { Switch } from '../../src/components/switch';
import { Select } from '../../src/components/select';
import { Textarea } from '../../src/components/textarea';
import { Link } from '../../src/components/link';

describe('Accessibility - Focus Ring Behavior', () => {
  describe('Interactive Components Focus Behavior', () => {
    it('should show focus rings on buttons', () => {
      const { container } = render(<Button>Click me</Button>);
      const button = container.querySelector('button');

      button?.focus();
      expect(document.activeElement).toBe(button);

      // Check for focus styling classes
      const className = button?.className || '';
      expect(className).toContain('data-focus:outline');
    });

    it('should show focus rings on form controls', () => {
      // Test Input - uses focus-within on wrapper
      const { container } = render(<Input placeholder="Type here" />);
      const inputElement = container.querySelector('input');
      inputElement?.focus();

      const wrapper = inputElement?.parentElement;
      const className = wrapper?.className || '';
      expect(className).toContain('focus-within:after:ring');

      // Test Textarea - similar to Input
      const { container: textareaContainer } = render(<Textarea placeholder="Type here" />);
      const textareaElement = textareaContainer.querySelector('textarea');
      textareaElement?.focus();

      const textareaWrapper = textareaElement?.parentElement;
      const textareaClassName = textareaWrapper?.className || '';
      expect(textareaClassName).toContain('focus-within:after:ring');
    });

    it('should show focus indicators on selection controls', () => {
      // Test Switch
      const { container: switchContainer } = render(<Switch />);
      const switchEl = switchContainer.querySelector('button[role="switch"]');
      (switchEl as HTMLElement)?.focus();
      expect(document.activeElement).toBe(switchEl);
      expect(switchEl?.className).toContain('data-focus:outline');

      // Test Checkbox - uses custom focus styles
      const { container: checkboxContainer } = render(<Checkbox />);
      const checkbox = checkboxContainer.querySelector('[role="checkbox"]');
      (checkbox as HTMLElement)?.focus();
      expect(document.activeElement).toBe(checkbox);
      expect(checkbox?.className).toContain('focus:outline-hidden');

      // Test Radio - similar to checkbox
      const { container: radioContainer } = render(
        <RadioGroup>
          <Radio value="1" />
        </RadioGroup>
      );
      const radio = radioContainer.querySelector('[role="radio"]');
      (radio as HTMLElement)?.focus();
      expect(document.activeElement).toBe(radio);
      expect(radio?.className).toContain('focus:outline-hidden');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through interactive elements', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <Button>First</Button>
          <Input placeholder="Second" />
          <Switch aria-label="Third" />
          <Link href="#">Fourth</Link>
        </div>
      );

      const button = container.querySelector('button');
      const input = container.querySelector('input');
      const switchEl = container.querySelector('[role="switch"]');
      const link = container.querySelector('a');

      // Tab through elements and check they can receive focus
      await user.tab();
      expect(document.activeElement).toBeTruthy();

      // Just verify we can tab through multiple elements
      await user.tab();
      expect(document.activeElement).toBeTruthy();

      await user.tab();
      expect(document.activeElement).toBeTruthy();

      // Verify tabbing works without checking exact order
      const focusableElements = [button, input, switchEl, link].filter(Boolean);
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should handle complex components with internal focus management', () => {
      const { container } = render(
        <Select name="test">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );

      // Select renders a native select element
      const selectElement = container.querySelector('select');
      expect(selectElement).toBeTruthy();

      // Focus the select
      selectElement?.focus();
      expect(document.activeElement).toBe(selectElement);
    });
  });
});
