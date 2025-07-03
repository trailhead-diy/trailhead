/**
 * Component Detection Utilities
 * Provides consistent component detection across transforms
 */

/**
 * Detect if a file contains a specific component
 * Checks common React component patterns
 */
export function detectComponent(content: string, componentName: string): boolean {
  const patterns = [
    `export function ${componentName}`,
    `export const ${componentName}`,
    `const ${componentName} = React.forwardRef`,
    `const ${componentName} = forwardRef`,
    `export default function ${componentName}`,
    `export { ${componentName} }`,
    `export const ${componentName} =`,
  ];

  return patterns.some(pattern => content.includes(pattern));
}

/**
 * Detect if a component has specific props
 * Useful for components that require certain props like 'color'
 */
export function detectComponentWithProps(
  content: string,
  componentName: string,
  requiredProps: string[]
): boolean {
  // First check if component exists
  if (!detectComponent(content, componentName)) return false;

  // Check if all required props are present in the component's type definition
  return requiredProps.every(prop => {
    // Match prop in interface/type definitions
    const propPatterns = [
      new RegExp(`${prop}[?]?:\\s*\\w+`, 'g'), // prop: Type or prop?: Type
      new RegExp(`${prop}[?]?:\\s*['"]\\w+['"]`, 'g'), // prop: 'literal' or prop?: 'literal'
    ];

    return propPatterns.some(pattern => pattern.test(content));
  });
}

/**
 * Detect if a file is a component file (has JSX)
 */
export function isComponentFile(content: string): boolean {
  // Look for JSX syntax patterns
  const jsxPatterns = [
    /<[A-Z]\w+/, // JSX component tags
    /return\s*\(/, // return statements with JSX
    /React\.createElement/, // React.createElement calls
    /@headlessui\/react/, // Headless UI imports (common in Catalyst)
  ];

  return jsxPatterns.some(pattern => pattern.test(content));
}
