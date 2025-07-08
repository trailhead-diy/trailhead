/**
 * Atomic transform: Rename any identifier in the AST
 */

import { createASTTransform } from '../../core/ast-factory';
import { type TransformChange } from '../../core/types';

export interface RenameIdentifierOptions {
  from: string;
  to: string;
  scope?: 'imports' | 'exports' | 'declarations' | 'usage' | 'all';
}

export const renameIdentifier = createASTTransform(
  'rename-identifier',
  'Rename any identifier in the AST',
  (fileInfo, api, options, changes: TransformChange[]) => {
    const { from, to, scope = 'all' } = options as RenameIdentifierOptions;
    const { j } = api;
    const root = j(fileInfo.source);

    if (scope === 'all' || scope === 'imports') {
      // Rename in import statements
      root.find(j.ImportSpecifier, { imported: { name: from } }).forEach(path => {
        path.value.imported.name = to;
        changes.push({
          type: 'rename-import',
          description: `Renamed import: ${from} → ${to}`,
          location: 'import statement',
        });
      });
    }

    if (scope === 'all' || scope === 'exports') {
      // Rename in export statements
      root.find(j.ExportSpecifier, { exported: { name: from } }).forEach(path => {
        path.value.exported.name = to;
        changes.push({
          type: 'rename-export',
          description: `Renamed export: ${from} → ${to}`,
          location: 'export statement',
        });
      });
    }

    if (scope === 'all' || scope === 'declarations') {
      // Rename function declarations
      root.find(j.FunctionDeclaration, { id: { name: from } }).forEach(path => {
        path.value.id!.name = to;
        changes.push({
          type: 'rename-function-declaration',
          description: `Renamed function declaration: ${from} → ${to}`,
        });
      });

      // Rename variable declarations
      root.find(j.VariableDeclarator, { id: { name: from } }).forEach(path => {
        (path.value.id as any).name = to;
        changes.push({
          type: 'rename-variable-declaration',
          description: `Renamed variable declaration: ${from} → ${to}`,
        });
      });
    }

    if (scope === 'all' || scope === 'usage') {
      // Rename identifier usage
      root.find(j.Identifier, { name: from }).forEach(path => {
        path.value.name = to;
        changes.push({
          type: 'rename-identifier-usage',
          description: `Renamed identifier usage: ${from} → ${to}`,
        });
      });
    }

    return changes.length > 0 ? root.toSource() : null;
  }
);
