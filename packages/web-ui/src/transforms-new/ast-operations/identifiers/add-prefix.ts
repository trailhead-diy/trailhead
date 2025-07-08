/**
 * Atomic transform: Add prefix to identifiers
 */

import { createASTTransform } from '../../core/ast-factory';
import { type TransformChange } from '../../core/types';

export interface AddPrefixOptions {
  prefix: string;
  targets: string[];
  scope?: 'imports' | 'exports' | 'declarations' | 'usage' | 'all';
}

export const addPrefix = createASTTransform(
  'add-prefix',
  'Add prefix to specified identifiers',
  (fileInfo, api, options, changes: TransformChange[]) => {
    const { prefix, targets, scope = 'all' } = options as AddPrefixOptions;
    const { j } = api;
    const root = j(fileInfo.source);

    targets.forEach(target => {
      const prefixedName = `${prefix}${target}`;

      if (scope === 'all' || scope === 'imports') {
        // Add prefix to imported identifiers
        root.find(j.ImportSpecifier, { imported: { name: target } }).forEach(path => {
          path.value.imported.name = prefixedName;
          changes.push({
            type: 'add-prefix-import',
            description: `Added prefix to import: ${target} → ${prefixedName}`,
            before: target,
            after: prefixedName,
          });
        });
      }

      if (scope === 'all' || scope === 'exports') {
        // Add prefix to exported identifiers
        root.find(j.ExportSpecifier, { exported: { name: target } }).forEach(path => {
          path.value.exported.name = prefixedName;
          changes.push({
            type: 'add-prefix-export',
            description: `Added prefix to export: ${target} → ${prefixedName}`,
            before: target,
            after: prefixedName,
          });
        });
      }

      if (scope === 'all' || scope === 'declarations') {
        // Add prefix to function declarations
        root.find(j.FunctionDeclaration, { id: { name: target } }).forEach(path => {
          path.value.id!.name = prefixedName;
          changes.push({
            type: 'add-prefix-function-declaration',
            description: `Added prefix to function declaration: ${target} → ${prefixedName}`,
            before: target,
            after: prefixedName,
          });
        });

        // Add prefix to variable declarations
        root.find(j.VariableDeclarator, { id: { name: target } }).forEach(path => {
          (path.value.id as any).name = prefixedName;
          changes.push({
            type: 'add-prefix-variable-declaration',
            description: `Added prefix to variable declaration: ${target} → ${prefixedName}`,
            before: target,
            after: prefixedName,
          });
        });
      }

      if (scope === 'all' || scope === 'usage') {
        // Add prefix to identifier usage
        root.find(j.Identifier, { name: target }).forEach(path => {
          path.value.name = prefixedName;
          changes.push({
            type: 'add-prefix-identifier-usage',
            description: `Added prefix to identifier usage: ${target} → ${prefixedName}`,
            before: target,
            after: prefixedName,
          });
        });
      }
    });

    return changes.length > 0 ? root.toSource() : null;
  }
);
