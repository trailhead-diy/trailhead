/**
 * Import declaration processing for Catalyst prefix transformations
 *
 * Handles transformation of import statements to use Catalyst prefixes and
 * catalyst- path prefixes. Protects Headless UI imports from any modifications.
 */

import type { ASTContext } from './catalyst-prefix-core.js';

/**
 * Process import declarations and update paths to use catalyst- prefix
 */
export function processImportDeclarations(context: ASTContext): void {
  const { j, root, oldToNewMap, changes } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 6: Import Declaration Processing (NEVER modify Headless imports)
  // Finds:
  //        import { Link } from './link'
  //        (transforms to ./catalyst-link)
  //
  /////////////////////////////////////////////////////////////////////////////////
  root.find(j.ImportDeclaration).forEach((importDecl: any) => {
    const source = importDecl.node.source.value?.toString() || '';

    // Skip all @headlessui/react imports - never transform them
    if (source === '@headlessui/react') {
      return;
    }

    if (source.startsWith('./') && !source.startsWith('./catalyst-')) {
      const newSource = `./catalyst-${source.slice(2)}`;

      importDecl.node.specifiers?.forEach((specifier: any) => {
        if (j.ImportSpecifier.check(specifier) && j.Identifier.check(specifier.imported)) {
          if (!specifier.imported.name.startsWith('Catalyst')) {
            const oldName = specifier.imported.name;
            const newName = `Catalyst${oldName}`;
            specifier.imported.name = newName;
            oldToNewMap.set(oldName, newName);
          }
        }
      });
      importDecl.node.source.value = newSource;
      /////////////////////////////////////////////////////////////////////////////////
      //
      // From:  import { Link } from './link'
      // To:    import { CatalystLink } from './catalyst-link'
      //
      /////////////////////////////////////////////////////////////////////////////////
      changes.push(`Updated import from ${source} to ${newSource}`);
    }
  });
}
