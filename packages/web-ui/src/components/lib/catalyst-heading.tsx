// WARNING: This file is auto-generated and will be overwritten.
// Auto generated on DEVELOPMENT

import { cn } from '../utils/cn';

export type CatalystHeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
} & React.ComponentPropsWithoutRef<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'>;

export function CatalystHeading({ className, level = 1, ...props }: CatalystHeadingProps) {
  let Element: `h${typeof level}` = `h${level}`;

  return (
    <Element
      {...props}
      className={cn(
        className,
        'text-2xl/8 font-semibold text-zinc-950 sm:text-xl/8 dark:text-white'
      )}
    />
  );
}

export function CatalystSubheading({ className, level = 2, ...props }: CatalystHeadingProps) {
  let Element: `h${typeof level}` = `h${level}`;

  return (
    <Element
      {...props}
      className={cn(
        className,
        'text-base/7 font-semibold text-zinc-950 sm:text-sm/6 dark:text-white'
      )}
    />
  );
}
