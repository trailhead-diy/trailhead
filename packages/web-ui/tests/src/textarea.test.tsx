import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../../src/components/textarea';

describe('Textarea', () => {
  describe('Form Input Behavior', () => {
    it('should handle text input and multiline content', async () => {
      const user = userEvent.setup();
      render(<Textarea placeholder="Test textarea" />);

      const textarea = screen.getByPlaceholderText('Test textarea');
      await user.type(textarea, 'Line 1{enter}Line 2{enter}Line 3');

      expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3');
    });

    it('should handle controlled and uncontrolled states', () => {
      render(
        <div>
          <Textarea value="Controlled value" onChange={() => {}} />
          <Textarea defaultValue="Default text" />
        </div>
      );

      const textAreas = screen.getAllByRole('textbox') as HTMLTextAreaElement[];
      expect(textAreas[0].value).toBe('Controlled value');
      expect(textAreas[1].value).toBe('Default text');
    });

    it('should respect form validation attributes', () => {
      render(<Textarea maxLength={100} rows={5} cols={50} placeholder="Validation test" />);

      const textarea = screen.getByPlaceholderText('Validation test');
      expect(textarea).toHaveAttribute('maxLength', '100');
      expect(textarea).toHaveAttribute('rows', '5');
      expect(textarea).toHaveAttribute('cols', '50');
    });

    it('should handle form name attribute', () => {
      render(<Textarea name="description" placeholder="Form test" />);
      const textarea = screen.getByPlaceholderText('Form test');
      expect(textarea).toHaveAttribute('name', 'description');
    });
  });

  describe('Validation States', () => {
    it('should handle readOnly state', () => {
      render(<Textarea readOnly value="Read only text" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('readOnly');
    });

    it('should handle required attribute', () => {
      render(<Textarea required placeholder="Required field" />);
      const textarea = screen.getByPlaceholderText('Required field');
      expect(textarea).toHaveAttribute('required');
    });
  });
});
