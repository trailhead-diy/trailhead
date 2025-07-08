#!/usr/bin/env tsx
/**
 * Script to fix Windows path compatibility issues in test files
 *
 * This script finds and replaces hardcoded Unix paths with cross-platform
 * compatible path utilities throughout the test suite.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface PathReplacement {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  description: string;
}

const replacements: PathReplacement[] = [
  // Replace hardcoded project paths
  {
    pattern: /['"]\/project\/([^'"]*)['"]/g,
    replacement: (match, path) => `projectPath('${path.replace(/\//g, "', '")}')`,
    description: 'Replace /project/ paths with projectPath()',
  },
  {
    pattern: /['"]\/trailhead\/([^'"]*)['"]/g,
    replacement: (match, path) => `trailheadPath('${path.replace(/\//g, "', '")}')`,
    description: 'Replace /trailhead/ paths with trailheadPath()',
  },
  {
    pattern: /const projectRoot = ['"]\/project['"]/g,
    replacement: 'const projectRoot = testPaths.mockProject',
    description: 'Replace projectRoot assignments',
  },
  {
    pattern: /const trailheadRoot = ['"]\/trailhead['"]/g,
    replacement: "const trailheadRoot = isWindows ? 'C:\\\\trailhead' : '/trailhead'",
    description: 'Replace trailheadRoot assignments',
  },
  {
    pattern: /path === ['"]\/project\/([^'"]*)['"]/g,
    replacement: (match, path) => `path === projectPath('${path.replace(/\//g, "', '")}')`,
    description: 'Replace path comparisons',
  },
  {
    pattern: /path\.includes\(['"]\/project\/['"]\)/g,
    replacement: 'path.includes(testPaths.mockProject)',
    description: 'Replace path.includes checks',
  },
  {
    pattern: /path\.includes\(['"]\/trailhead\/['"]\)/g,
    replacement: "path.includes(trailheadPath(''))",
    description: 'Replace trailhead path.includes checks',
  },
];

function processFile(filePath: string): boolean {
  try {
    let content = readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if file already imports cross-platform utilities
    const hasCrossPlatformImport = content.includes('cross-platform-paths');

    // Apply replacements
    for (const { pattern, replacement, description } of replacements) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        console.log(`  Applying: ${description} (${matches.length} occurrences)`);
        content = content.replace(pattern, replacement as any);
        modified = true;
      }
    }

    // Add import if needed and file was modified
    if (modified && !hasCrossPlatformImport) {
      // Find the right place to add import (after other imports)
      const importMatch = content.match(/import.*from.*\n/g);
      if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1];
        const importStatement =
          "import { createTestPath, safeJoin, testPaths, isWindows } from '../../utils/cross-platform-paths.js'\n";
        content = content.replace(lastImport, lastImport + importStatement);
        console.log('  Added cross-platform-paths import');
      }
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

function findTestFiles(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && !entry.includes('node_modules') && !entry.includes('dist')) {
      findTestFiles(fullPath, files);
    } else if (stat.isFile() && entry.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
console.log('🔍 Finding test files with hardcoded paths...\n');

const testFiles = findTestFiles('packages');
let fixedCount = 0;

for (const file of testFiles) {
  // Check if file contains hardcoded paths
  const content = readFileSync(file, 'utf8');
  if (content.match(/['"]\/project\/|['"]\/trailhead\/|['"]\/test\//)) {
    console.log(`\n📄 Processing ${relative(process.cwd(), file)}:`);
    if (processFile(file)) {
      fixedCount++;
    }
  }
}

console.log(`\n✨ Fixed ${fixedCount} files with Windows path compatibility issues`);
console.log('\n📝 Next steps:');
console.log('1. Review the changes to ensure they look correct');
console.log('2. Run tests to verify everything still works');
console.log('3. Consider adding a lint rule to prevent hardcoded paths');
