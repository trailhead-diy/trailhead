import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { Input, InputGroup } from '../input'

describe('Input', () => {
  it('should handle user input and disabled state', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Input placeholder="Type here" />)

    const input = screen.getByPlaceholderText('Type here')
    await user.type(input, 'Hello world')
    expect(input).toHaveValue('Hello world')

    rerender(<Input disabled placeholder="Type here" value="Hello world" />)
    expect(input).toBeDisabled()
  })

  it('should compose InputGroup for related inputs', () => {
    render(
      <InputGroup>
        <Input type="text" placeholder="First name" />
        <Input type="text" placeholder="Last name" />
        <Input type="email" placeholder="Email" />
      </InputGroup>
    )

    expect(screen.getByPlaceholderText('First name')).toHaveAttribute('type', 'text')
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')
  })
})
