/**
 * Import Management Utilities
 * Provides consistent import handling across transforms
 */

import type { Collection, JSCodeshift } from 'jscodeshift';

/**
 * Check if an import exists from a specific source
 */
export function hasImport(root: Collection<any>, j: JSCodeshift, source: string): boolean {
  return root.find(j.ImportDeclaration, { source: { value: source } }).length > 0;
}

/**
 * Check if a specific named import exists
 */
export function hasNamedImport(
  root: Collection<any>,
  j: JSCodeshift,
  source: string,
  specifier: string
): boolean {
  return (
    root
      .find(j.ImportDeclaration, { source: { value: source } })
      .find(j.ImportSpecifier, { imported: { name: specifier } }).length > 0
  );
}

/**
 * Add an import declaration with named imports
 */
export function addImport(
  root: Collection<any>,
  j: JSCodeshift,
  source: string,
  specifiers: string[]
): void {
  // Don't add if already exists
  if (hasImport(root, j, source)) return;

  // Create import declaration
  const importDeclaration = j.importDeclaration(
    specifiers.map(s => j.importSpecifier(j.identifier(s))),
    j.literal(source)
  );

  // Find the best place to insert
  const firstImport = root.find(j.ImportDeclaration).at(0);
  if (firstImport.length) {
    // Add after the last import
    const lastImport = root.find(j.ImportDeclaration).at(-1);
    lastImport.insertAfter(importDeclaration);
  } else {
    // Add at the beginning of the file
    root.get().node.program.body.unshift(importDeclaration);
  }
}

/**
 * Remove an import declaration
 */
export function removeImport(root: Collection<any>, j: JSCodeshift, source: string): void {
  root.find(j.ImportDeclaration, { source: { value: source } }).remove();
}

/**
 * Replace one import source with another
 */
export function replaceImportSource(
  root: Collection<any>,
  j: JSCodeshift,
  oldSource: string,
  newSource: string
): boolean {
  const imports = root.find(j.ImportDeclaration, { source: { value: oldSource } });

  if (imports.length === 0) return false;

  imports.forEach(path => {
    path.node.source = j.literal(newSource);
  });

  return true;
}

/**
 * Add a named import to an existing import declaration
 */
export function addNamedImport(
  root: Collection<any>,
  j: JSCodeshift,
  source: string,
  specifier: string
): void {
  // Check if import already exists
  if (hasNamedImport(root, j, source, specifier)) return;

  const importDecl = root.find(j.ImportDeclaration, { source: { value: source } });

  if (importDecl.length > 0) {
    // Add to existing import
    const firstImport = importDecl.at(0);
    const newSpecifier = j.importSpecifier(j.identifier(specifier));
    firstImport.get().node.specifiers.push(newSpecifier);
  } else {
    // Create new import
    addImport(root, j, source, [specifier]);
  }
}

/**
 * Get all imports from a specific source
 */
export function getImportsFromSource(
  root: Collection<any>,
  j: JSCodeshift,
  source: string
): string[] {
  const imports: string[] = [];

  root
    .find(j.ImportDeclaration, { source: { value: source } })
    .find(j.ImportSpecifier)
    .forEach(path => {
      if (path.node.imported.type === 'Identifier') {
        imports.push(path.node.imported.name);
      }
    });

  return imports;
}
