/**
 * Business logic transform: Forward className to JSX child elements
 */

import { type TransformChange, type AtomicTransform } from '../../core/types';

export interface ForwardClassNameOptions {
  wrapperFunction?: string;
  elementNames?: string[];
}

export const forwardClassName: AtomicTransform<ForwardClassNameOptions> = {
  name: 'forward-className',
  description: 'Forward className parameter to JSX child elements',
  apply: (source: string, _config?: ForwardClassNameOptions) => {
    const changes: TransformChange[] = [];

    const applyTransform = (source: string, changes: TransformChange[]): string => {
      // Pattern to detect JSX elements that need className forwarding
      const missingClassNamePattern =
        /(\breturn\s*<[A-Z][a-zA-Z.]*)\s+(as=\{[^}]+\})\s+(\{\.\.\.props\})\s*\/>/g;

      let fixedSource = source.replace(
        missingClassNamePattern,
        (match, element, asProps, spreadProps) => {
          // Check if className parameter exists in the component
          if (source.includes('className,') || source.includes('className }')) {
            changes.push({
              type: 'forward-className',
              description: `Added missing className forwarding to JSX element`,
              before: match,
              after: `${element} ${asProps} className={cn(className)} ${spreadProps} />`,
            });

            return `${element} ${asProps} className={cn(className)} ${spreadProps} />`;
          }
          return match;
        }
      );

      return fixedSource;
    };

    applyTransform(source, changes);

    return {
      hasChanges: changes.length > 0,
      changes,
    };
  },
};
