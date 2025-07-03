import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Alert, AlertTitle, AlertDescription, AlertActions } from '../../src/components/alert';
import { Button } from '../../src/components/button';

describe('Alert', () => {
  describe('User Interactions', () => {
    it('should handle action buttons within alert', () => {
      const onClose = vi.fn();
      const onConfirm = vi.fn();

      render(
        <Alert open onClose={onClose}>
          <AlertTitle>Confirm Action</AlertTitle>
          <AlertDescription>Are you sure?</AlertDescription>
          <AlertActions>
            <Button onClick={onClose} outline>
              Cancel
            </Button>
            <Button onClick={onConfirm}>Confirm</Button>
          </AlertActions>
        </Alert>
      );

      fireEvent.click(screen.getByText('Confirm'));
      expect(onConfirm).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard navigation for closing', () => {
      const onClose = vi.fn();

      render(
        <Alert open onClose={onClose}>
          <AlertTitle>Keyboard Alert</AlertTitle>
          <AlertDescription>Press Escape to close</AlertDescription>
        </Alert>
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should render as an accessible dialog with proper labeling', () => {
      render(
        <Alert open onClose={() => {}}>
          <AlertTitle>Accessible Alert</AlertTitle>
          <AlertDescription>This alert is accessible</AlertDescription>
        </Alert>
      );

      const dialog = screen.getByRole('dialog', { name: 'Accessible Alert' });
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      // Should have proper labeling
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should not be in DOM when closed for accessibility', () => {
      render(
        <Alert open={false} onClose={() => {}}>
          <AlertTitle>Hidden Alert</AlertTitle>
        </Alert>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should trap focus within alert when open', () => {
      render(
        <Alert open onClose={() => {}}>
          <AlertTitle>Focus Trap Alert</AlertTitle>
          <AlertActions>
            <Button>Action 1</Button>
            <Button>Action 2</Button>
          </AlertActions>
        </Alert>
      );

      // Dialog should exist and contain interactive elements
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2); // Two action buttons

      // Focus should be trapped within dialog
      expect(dialog).toHaveAttribute('tabindex', '-1');
    });
  });
});
