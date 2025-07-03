import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import {
  Combobox,
  ComboboxOption,
  ComboboxLabel,
  ComboboxDescription,
} from '../../src/components/combobox';

describe('Combobox Components', () => {
  const mockObjectOptions = [
    { id: 1, name: 'Apple', category: 'Fruit' },
    { id: 2, name: 'Cherry', category: 'Fruit' },
    { id: 3, name: 'Carrot', category: 'Vegetable' },
  ];

  describe('Core Functionality', () => {
    it('should handle object options with selection workflow', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      const { rerender } = render(
        <Combobox
          options={mockObjectOptions}
          value={null}
          onChange={mockOnChange}
          placeholder="Select a fruit..."
          displayValue={option => option?.name ?? ''}
        >
          {option => <ComboboxOption value={option}>{option?.name}</ComboboxOption>}
        </Combobox>
      );

      const combobox = screen.getByRole('combobox');

      // Test selection workflow
      await user.click(combobox);
      await user.type(combobox, 'App');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      expect(mockOnChange).toHaveBeenCalled();

      // Test with selected value persistence
      rerender(
        <Combobox
          options={mockObjectOptions}
          value={mockObjectOptions[0]}
          onChange={mockOnChange}
          displayValue={option => option?.name ?? ''}
        >
          {option => <ComboboxOption value={option}>{option?.name}</ComboboxOption>}
        </Combobox>
      );
    });

    it('should handle disabled and validation states', () => {
      const mockOnChange = vi.fn();

      const { rerender } = render(
        <Combobox
          options={['Apple', 'Cherry']}
          value={null}
          onChange={mockOnChange}
          disabled={true}
          displayValue={option => option || ''}
        >
          {option => <ComboboxOption value={option}>{option}</ComboboxOption>}
        </Combobox>
      );

      let combobox = screen.getByRole('combobox');
      expect(combobox).toBeDisabled();
      expect(combobox).toHaveAttribute('data-headlessui-state', 'disabled');

      // Test validation state
      rerender(
        <Combobox
          options={['Apple', 'Cherry']}
          value={null}
          onChange={mockOnChange}
          invalid={true}
          displayValue={option => option || ''}
        >
          {option => <ComboboxOption value={option}>{option}</ComboboxOption>}
        </Combobox>
      );

      combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('data-headlessui-state', 'invalid');
    });
  });

  describe('User Interactions', () => {
    it('should handle typing and filtering workflow', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <Combobox
          options={mockObjectOptions}
          value={null}
          onChange={mockOnChange}
          displayValue={option => option?.name ?? ''}
        >
          {option => <ComboboxOption value={option}>{option?.name}</ComboboxOption>}
        </Combobox>
      );

      const combobox = screen.getByRole('combobox');

      // Test typing and filtering behavior
      await user.click(combobox);
      await user.type(combobox, 'Car');
      expect(mockOnChange).not.toHaveBeenCalled(); // Only called on selection

      // Test keyboard navigation selection
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Component Composition', () => {
    it('should handle complex option structures with labels and descriptions', () => {
      const mockOnChange = vi.fn();

      render(
        <Combobox
          options={mockObjectOptions}
          value={null}
          onChange={mockOnChange}
          displayValue={option => (option ? `${option.name} (${option.category})` : '')}
          aria-label="Fruit and vegetable selector"
        >
          {option => (
            <ComboboxOption value={option}>
              <ComboboxLabel>{option?.name}</ComboboxLabel>
              <ComboboxDescription>Category: {option?.category}</ComboboxDescription>
            </ComboboxOption>
          )}
        </Combobox>
      );

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-label', 'Fruit and vegetable selector');
    });

    it('should handle edge cases and empty configurations', () => {
      render(
        <div>
          <ComboboxLabel>Standalone Label</ComboboxLabel>
          <ComboboxDescription>Standalone Description</ComboboxDescription>
          <Combobox
            options={[]}
            value={null}
            onChange={() => {}}
            displayValue={() => ''}
            placeholder="No options available"
          >
            {() => <></>}
          </Combobox>
        </div>
      );
    });
  });
});
