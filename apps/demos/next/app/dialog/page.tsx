'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import { Button } from '@/components/th/button';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from '@/components/th/dialog';
import { Field, Label } from '@/components/th/fieldset';
import { Input } from '@/components/th/input';
import { useState } from 'react';

export default function DialogPage(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DemoLayout>
      <List title="Dialog">
        <Item title="Default Dialog">
          <Button type="button" onClick={() => setIsOpen(true)}>
            Refund payment
          </Button>
          <Dialog open={isOpen} onClose={setIsOpen}>
            <DialogTitle>Refund payment</DialogTitle>
            <DialogDescription>
              The refund will be reflected in the customer’s bank account 2 to 3 business days after
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
        </Item>
      </List>
    </DemoLayout>
  );
}
