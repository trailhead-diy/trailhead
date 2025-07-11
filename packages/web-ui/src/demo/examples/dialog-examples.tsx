'use client';

import { Button } from '../../components/button';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from '../../components/dialog';
import { Field, Label } from '../../components/fieldset';
import { Input } from '../../components/input';
import { List, Item } from '../demo-ui';
import { useState } from 'react';

export function DialogExamples() {
  return (
    <List title="Dialog">
      <Item title="Default Dialog">
        <SimpleDialog />
      </Item>
    </List>
  );
}

export const SimpleDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        Refund payment
      </Button>
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Refund payment</DialogTitle>
        <DialogDescription>
          The refund will be reflected in the customer's bank account 2 to 3 business days after
          processing.
        </DialogDescription>
        <DialogBody>
          <Field>
            <Label>Amount</Label>
            <Input name="amount" placeholder="$0.00" />
          </Field>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpen(false)}>Refund</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
