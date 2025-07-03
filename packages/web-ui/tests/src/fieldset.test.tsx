import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Fieldset,
  Legend,
  Field,
  FieldGroup,
  Label,
  Description,
  ErrorMessage,
} from '../../src/components/fieldset';

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
    );

    // Test accessibility
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });
});
