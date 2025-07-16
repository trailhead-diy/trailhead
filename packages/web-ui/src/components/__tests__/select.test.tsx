import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import userEvent from '@testing-library/user-event'
import { Select } from '../select'

describe('Select', () => {
  describe('Option Selection', () => {
    it('should handle option selection with controlled value', () => {
      render(
        <Select value="2">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Select>
      )

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('2')
    })

    it('should handle defaultValue for uncontrolled selection', () => {
      render(
        <Select defaultValue="3">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Select>
      )

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('3')
    })

    it('should handle multiple selection', () => {
      render(
        <Select multiple>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Select>
      )

      const select = screen.getByRole('listbox')
      expect(select).toHaveAttribute('multiple')
    })

    it('should render optgroups and options', () => {
      render(
        <Select>
          <optgroup label="Group 1">
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </optgroup>
          <optgroup label="Group 2">
            <option value="3">Option 3</option>
            <option value="4">Option 4</option>
          </optgroup>
        </Select>
      )

      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 4')).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should prevent interaction when disabled', async () => {
      const user = userEvent.setup()
      render(
        <Select disabled>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      )

      const select = screen.getByRole('combobox')
      expect(select).toBeDisabled()

      // Verify that disabled select cannot be interacted with
      await user.click(select)
      expect(select).toBeDisabled()
    })
  })
})
