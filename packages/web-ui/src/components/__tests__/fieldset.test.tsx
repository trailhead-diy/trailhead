import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Fieldset, Legend, Field, FieldGroup, Label, Description, ErrorMessage } from '../fieldset'

describe('Fieldset Components', () => {
  it('should render accessible form structure with validation states', () => {
    render(
      <Fieldset>
        <Legend>User Information</Legend>
        <FieldGroup>
          <Field>
            <Label htmlFor="username">Username</Label>
            <Description>Enter your preferred username</Description>
            <input id="username" type="text" aria-describedby="username-error" />
            <ErrorMessage id="username-error">Username must be at least 3 characters</ErrorMessage>
          </Field>
          <Field>
            <Label htmlFor="email">Email</Label>
            <Description>We'll use this for notifications</Description>
            <input id="email" type="email" aria-invalid="true" />
            <ErrorMessage>Please enter a valid email address</ErrorMessage>
          </Field>
        </FieldGroup>
      </Fieldset>
    )

    // Test semantic structure
    expect(screen.getByRole('group')).toBeInTheDocument()
    expect(screen.getByText('User Information')).toBeInTheDocument()

    // Test form fields
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()

    // Test descriptions
    expect(screen.getByText('Enter your preferred username')).toBeInTheDocument()
    expect(screen.getByText("We'll use this for notifications")).toBeInTheDocument()

    // Test error messages
    expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument()
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()

    // Test accessibility
    const emailInput = screen.getByLabelText('Email')
    expect(emailInput).toHaveAttribute('aria-invalid', 'true')
  })
})
