'use client';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '../../th/alert';
import { Button } from '../../th/button';
import { useState } from 'react';
import { List, Item } from '../demo-ui';

export function AlertExamples() {
  return (
    <List title="Alert">
      <Item title="Default Alert">
        <SimpleAlert />
      </Item>
    </List>
  );
}

export const SimpleAlert = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        Refund payment
      </Button>
      <Alert open={isOpen} onClose={setIsOpen}>
        <AlertTitle>Are you sure you want to refund this payment?</AlertTitle>
        <AlertDescription>
          The refund will be reflected in the customer's bank account 2 to 3 business days after
          processing.
        </AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpen(false)}>Refund</Button>
        </AlertActions>
      </Alert>
    </>
  );
};
