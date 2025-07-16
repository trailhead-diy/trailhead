'use client'
import { DemoLayout, Item, List } from '@/components/demo-layout'
import { Divider } from '@/components/th/divider'

export default function DividerPage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Divider">
        <Item title="Default Divider">
          <Divider />
        </Item>
      </List>
    </DemoLayout>
  )
}
