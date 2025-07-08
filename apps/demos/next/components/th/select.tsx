import { forwardRef, type ComponentProps } from 'react';
import { cn } from './utils/cn';
import { CatalystSelect } from './lib/catalyst-select';

export type SelectProps = ComponentProps<typeof CatalystSelect>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <CatalystSelect ref={ref} className={cn(className)} {...props}>
      {children}
    </CatalystSelect>
  )
);

Select.displayName = 'Select';
