import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Radio, RadioField, RadioGroup } from '../radio';
import { Label } from '../fieldset';
import { useState } from 'react';

describe('Radio Components', () => {
  const getRadio = (text: string) =>
    screen.getByText(text).closest('[data-slot="field"]')?.querySelector('[role="radio"]');

  it('handles selection behavior and disabled state', () => {
    render(
      <RadioGroup defaultValue="option1">
        <RadioField>
          <Radio value="option1" />
          <Label>Option 1</Label>
        </RadioField>
        <RadioField>
          <Radio value="option2" />
          <Label>Option 2</Label>
        </RadioField>
        <RadioField disabled>
          <Radio value="option3" />
          <Label>Disabled Option</Label>
        </RadioField>
      </RadioGroup>
    );

    // Initial state
    expect(getRadio('Option 1')).toHaveAttribute('aria-checked', 'true');
    expect(getRadio('Option 2')).toHaveAttribute('aria-checked', 'false');

    // Change selection
    fireEvent.click(screen.getByText('Option 2'));
    expect(getRadio('Option 1')).toHaveAttribute('aria-checked', 'false');
    expect(getRadio('Option 2')).toHaveAttribute('aria-checked', 'true');

    // Disabled option cannot be selected
    fireEvent.click(screen.getByText('Disabled Option'));
    expect(getRadio('Option 2')).toHaveAttribute('aria-checked', 'true');
    expect(getRadio('Disabled Option')).toHaveAttribute('aria-checked', 'false');
  });

  it('supports controlled state and onChange handler', () => {
    function ControlledRadio() {
      const [value, setValue] = useState('option1');
      const handleChange = vi.fn(setValue);
      return (
        <>
          <RadioGroup value={value} onChange={handleChange}>
            <RadioField>
              <Radio value="option1" />
              <Label>Option 1</Label>
            </RadioField>
            <RadioField>
              <Radio value="option2" />
              <Label>Option 2</Label>
            </RadioField>
          </RadioGroup>
          <div data-testid="value">{value}</div>
        </>
      );
    }

    render(<ControlledRadio />);
    expect(screen.getByTestId('value')).toHaveTextContent('option1');
    fireEvent.click(screen.getByText('Option 2'));
    expect(screen.getByTestId('value')).toHaveTextContent('option2');
  });

  it('provides accessibility features and keyboard navigation', () => {
    const { container } = render(
      <RadioGroup aria-label="Choose an option">
        {['Option 1', 'Option 2', 'Option 3'].map((label, i) => (
          <RadioField key={i}>
            <Radio value={`option${i + 1}`} />
            <Label>{label}</Label>
          </RadioField>
        ))}
      </RadioGroup>
    );

    // ARIA relationships
    expect(container.querySelector('[role="radiogroup"]')).toHaveAttribute(
      'aria-label',
      'Choose an option'
    );
    expect(container.querySelectorAll('[role="radio"]')).toHaveLength(3);

    // Keyboard navigation
    const radios = Array.from(container.querySelectorAll('[role="radio"]')) as HTMLElement[];
    radios[0].focus();

    fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(radios[1]);
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(radios[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(radios[0]);
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
  });
});
