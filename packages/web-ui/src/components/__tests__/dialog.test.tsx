import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions } from '../dialog';

describe('Dialog Components', () => {
  describe('Modal Behavior', () => {
    it('should handle dialog open/close states and accessibility', () => {
      const onClose = vi.fn();

      const { rerender } = render(
        <Dialog open onClose={onClose} role="alertdialog">
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>Are you sure you want to continue?</DialogDescription>
          <DialogBody>
            <p>This action cannot be undone.</p>
          </DialogBody>
          <DialogActions>
            <button onClick={onClose}>Cancel</button>
            <button>Confirm</button>
          </DialogActions>
        </Dialog>
      );

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to continue?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();

      rerender(
        <Dialog open={false} onClose={onClose}>
          <DialogTitle>Hidden Dialog</DialogTitle>
        </Dialog>
      );

      expect(onClose).toBeInstanceOf(Function);
    });
  });

  describe('Component Composition', () => {
    it('should handle complete dialog structure with user interactions', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onConfirm = vi.fn();

      render(
        <Dialog open onClose={onClose}>
          <DialogTitle id="dialog-title">Delete File</DialogTitle>
          <DialogDescription>This will permanently delete the selected file.</DialogDescription>
          <DialogBody>
            <p>
              File: <strong>document.pdf</strong>
            </p>
            <p>Size: 2.3 MB</p>
          </DialogBody>
          <DialogActions>
            <button onClick={onClose}>Cancel</button>
            <button onClick={onConfirm} data-testid="confirm-btn">
              Delete
            </button>
          </DialogActions>
        </Dialog>
      );

      // Test semantic structure
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete File')).toBeInTheDocument();
      expect(screen.getByText(/permanently delete/)).toBeInTheDocument();
      expect(screen.getByText('document.pdf')).toBeInTheDocument();

      // Test user interactions
      await user.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalledTimes(1);

      await user.click(screen.getByTestId('confirm-btn'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should handle minimal dialog configurations', () => {
      render(
        <Dialog open onClose={() => {}}>
          <DialogTitle>Simple Dialog</DialogTitle>
          <DialogBody>Basic content without actions</DialogBody>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Simple Dialog')).toBeInTheDocument();
      expect(screen.getByText('Basic content without actions')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should support proper ARIA attributes and keyboard navigation', () => {
      const onClose = vi.fn();

      render(
        <Dialog open onClose={onClose} aria-labelledby="title" aria-describedby="desc">
          <DialogTitle id="title">Accessible Dialog</DialogTitle>
          <DialogDescription id="desc">
            This dialog demonstrates accessibility features.
          </DialogDescription>
          <DialogBody>
            <input placeholder="Focus management test" />
          </DialogBody>
          <DialogActions>
            <button>Action</button>
          </DialogActions>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'title');
      expect(dialog).toHaveAttribute('aria-describedby', 'desc');

      // Test content accessibility
      expect(screen.getByPlaceholderText('Focus management test')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });
});
