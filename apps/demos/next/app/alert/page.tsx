'use client'
import { DemoLayout, Item, List } from '@/components/demo-layout'
import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/th/alert'
import { Button } from '@/components/th/button'
import { useState } from 'react'
export default function AlertPage(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <DemoLayout>
      <List title="Alert">
        <Item title="Default Alert">
          <Button type="button" onClick={() => setIsOpen(true)}>
            Refund payment
          </Button>
          <Alert open={isOpen} onClose={setIsOpen}>
            <AlertTitle>Are you sure you want to refund this payment?</AlertTitle>
            <AlertDescription>
              The refund will be reflected in the customer’s bank account 2 to 3 business days after
              processing.
            </AlertDescription>
            <AlertActions>
              <Button plain onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>Refund</Button>
            </AlertActions>
          </Alert>
        </Item>
      </List>
    </DemoLayout>
  )
}
