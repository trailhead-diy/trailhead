'use client';

import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '../../components/description-list';
import { List, Item } from '../demo-ui';

export function DescriptionListExamples() {
  return (
    <List title="DescriptionList">
      <Item title="Default DescriptionList">
        <SimpleDescriptionList />
      </Item>
    </List>
  );
}

export const SimpleDescriptionList = () => (
  <DescriptionList>
    <DescriptionTerm>Customer</DescriptionTerm>
    <DescriptionDetails>Michael Foster</DescriptionDetails>

    <DescriptionTerm>Event</DescriptionTerm>
    <DescriptionDetails>Bear Hug: Live in Concert</DescriptionDetails>

    <DescriptionTerm>Amount</DescriptionTerm>
    <DescriptionDetails>$150.00 USD</DescriptionDetails>

    <DescriptionTerm>Amount after exchange rate</DescriptionTerm>
    <DescriptionDetails>US$150.00 &rarr; CA$199.79</DescriptionDetails>

    <DescriptionTerm>Fee</DescriptionTerm>
    <DescriptionDetails>$4.79 USD</DescriptionDetails>

    <DescriptionTerm>Net</DescriptionTerm>
    <DescriptionDetails>$1,955.00</DescriptionDetails>
  </DescriptionList>
);
