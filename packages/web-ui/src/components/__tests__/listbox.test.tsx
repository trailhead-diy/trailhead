import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Listbox, ListboxOption, ListboxLabel, ListboxDescription } from '../listbox';

describe('Listbox Components', () => {
  it('should handle single value selection and display', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Listbox onChange={handleChange} placeholder="Select an option..." value="option2">
        <ListboxOption value="option1">
          <ListboxLabel>Option 1</ListboxLabel>
          <ListboxDescription>First option description</ListboxDescription>
        </ListboxOption>
        <ListboxOption value="option2">
          <ListboxLabel>Option 2</ListboxLabel>
          <ListboxDescription>Second option description</ListboxDescription>
        </ListboxOption>
        <ListboxOption value="option3" disabled>
          <ListboxLabel>Option 3 (Disabled)</ListboxLabel>
        </ListboxOption>
      </Listbox>
    );

    // Should display selected value
    expect(screen.getByText('Option 2')).toBeInTheDocument();

    // Should open and allow selection
    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('First option description')).toBeInTheDocument();
      expect(screen.getAllByText('Second option description')).toHaveLength(2); // One in selected display, one in dropdown
    });

    await user.click(screen.getByText('Option 1'));
    expect(handleChange).toHaveBeenCalledWith('option1');
  });

  it('should render options with labels and descriptions', async () => {
    const user = userEvent.setup();

    render(
      <Listbox>
        <ListboxOption value="simple">Simple Option</ListboxOption>
        <ListboxOption value="complex">
          <ListboxLabel>Complex Option</ListboxLabel>
          <ListboxDescription>This option has additional description text</ListboxDescription>
        </ListboxOption>
        <ListboxOption value="rich">
          <ListboxLabel>
            Rich <strong>Label</strong> Content
          </ListboxLabel>
          <ListboxDescription>
            <em>Rich</em> description with markup
          </ListboxDescription>
        </ListboxOption>
      </Listbox>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Simple Option')).toBeInTheDocument();
      expect(screen.getByText('Complex Option')).toBeInTheDocument();
      expect(screen.getByText('This option has additional description text')).toBeInTheDocument();
      expect(screen.getByText('Label')).toBeInTheDocument();
      expect(screen.getByText('Rich')).toBeInTheDocument();
    });
  });

  it('should handle disabled options and states', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { rerender } = render(
      <Listbox onChange={handleChange} value="enabled">
        <ListboxOption value="enabled">Enabled Option</ListboxOption>
        <ListboxOption value="disabled" disabled>
          Disabled Option
        </ListboxOption>
      </Listbox>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      const disabledOptionElement = screen.getByRole('option', { name: 'Disabled Option' });
      expect(disabledOptionElement).toHaveAttribute('aria-disabled', 'true');
    });

    // Should be able to click enabled option
    const enabledOptions = screen.getAllByText('Enabled Option');
    await user.click(enabledOptions[1]); // Click the one in the dropdown, not the selected display
    expect(handleChange).toHaveBeenCalledWith('enabled');

    // Test disabled listbox state
    rerender(
      <Listbox disabled>
        <ListboxOption value="test">Test Option</ListboxOption>
      </Listbox>
    );

    const disabledButton = screen.getByRole('button');
    expect(disabledButton).toHaveAttribute('data-disabled');
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Listbox onChange={handleChange}>
        <ListboxOption value="first">First Option</ListboxOption>
        <ListboxOption value="second">Second Option</ListboxOption>
        <ListboxOption value="third">Third Option</ListboxOption>
      </Listbox>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // Test basic keyboard navigation exists
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    // Should have triggered selection
    expect(handleChange).toHaveBeenCalled();
  });

  it('should handle invalid state and placeholder', async () => {
    render(
      <Listbox invalid placeholder="Invalid listbox">
        <ListboxOption value="test">Test Option</ListboxOption>
      </Listbox>
    );

    const button = screen.getByRole('button');
    expect(screen.getByText('Invalid listbox')).toBeInTheDocument();

    await waitFor(() => {
      expect(button).toHaveAttribute('data-invalid');
    });
  });
});
