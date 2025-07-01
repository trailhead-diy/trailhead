import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { BadgeButton } from '../../src/components/badge'

describe('BadgeButton', () => {
  describe('Interactive Behavior', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(<BadgeButton onClick={handleClick}>Badge Button</BadgeButton>)
      await user.click(screen.getByText('Badge Button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should prevent clicks when disabled', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(
        <BadgeButton disabled onClick={handleClick}>
          Disabled Badge
        </BadgeButton>
      )

      const button = screen.getByRole('button')
      await user.click(button)
      expect(handleClick).not.toHaveBeenCalled()
      expect(button).toBeDisabled()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(<BadgeButton onClick={handleClick}>Keyboard Badge</BadgeButton>)
      const button = screen.getByRole('button')

      button.focus()
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)

      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })
  })
})
