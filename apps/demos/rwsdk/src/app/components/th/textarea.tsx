import { forwardRef, type ComponentProps } from 'react';
import { cn } from './utils/cn';
import { CatalystTextarea } from './lib/catalyst-textarea';

export type TextareaProps = ComponentProps<typeof CatalystTextarea>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, children, ...props }, ref) => (
    <CatalystTextarea ref={ref} className={cn(className)} {...props}>
      {children}
    </CatalystTextarea>
  ),
);

Textarea.displayName = 'Textarea';
