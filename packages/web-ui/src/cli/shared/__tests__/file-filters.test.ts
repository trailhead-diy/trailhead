import { describe, it, expect } from 'vitest';
import {
  isTsxFile,
  isTsFile,
  isJsFile,
  isJsxFile,
  isCatalystComponent,
  isWrapperComponent,
  isTestFile,
  isTestDirectory,
  isTestRelated,
  isNotTestRelated,
  combineFilters,
  anyFilter,
} from '../file-filters';

describe('file filters', () => {
  describe('basic file type filters', () => {
    describe('isTsxFile', () => {
      it('should identify TSX files correctly', () => {
        expect(isTsxFile('component.tsx')).toBe(true);
        expect(isTsxFile('Button.tsx')).toBe(true);
        expect(isTsxFile('nested/path/Component.tsx')).toBe(true);
      });

      it('should reject non-TSX files', () => {
        expect(isTsxFile('component.ts')).toBe(false);
        expect(isTsxFile('component.js')).toBe(false);
        expect(isTsxFile('component.jsx')).toBe(false);
        expect(isTsxFile('README.md')).toBe(false);
        expect(isTsxFile('package.json')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(isTsxFile('')).toBe(false);
        expect(isTsxFile('.tsx')).toBe(true);
        expect(isTsxFile('file.tsx.backup')).toBe(false);
        expect(isTsxFile('tsx')).toBe(false);
      });
    });

    describe('isTsFile', () => {
      it('should identify TS files correctly', () => {
        expect(isTsFile('utils.ts')).toBe(true);
        expect(isTsFile('types.ts')).toBe(true);
        expect(isTsFile('config/settings.ts')).toBe(true);
      });

      it('should reject non-TS files', () => {
        expect(isTsFile('component.tsx')).toBe(false);
        expect(isTsFile('script.js')).toBe(false);
        expect(isTsFile('component.jsx')).toBe(false);
        expect(isTsFile('styles.css')).toBe(false);
      });
    });

    describe('isJsFile', () => {
      it('should identify JS files correctly', () => {
        expect(isJsFile('script.js')).toBe(true);
        expect(isJsFile('config.js')).toBe(true);
        expect(isJsFile('legacy/old-script.js')).toBe(true);
      });

      it('should reject non-JS files', () => {
        expect(isJsFile('component.jsx')).toBe(false);
        expect(isJsFile('utils.ts')).toBe(false);
        expect(isJsFile('component.tsx')).toBe(false);
      });
    });

    describe('isJsxFile', () => {
      it('should identify JSX files correctly', () => {
        expect(isJsxFile('Component.jsx')).toBe(true);
        expect(isJsxFile('App.jsx')).toBe(true);
        expect(isJsxFile('components/Button.jsx')).toBe(true);
      });

      it('should reject non-JSX files', () => {
        expect(isJsxFile('Component.tsx')).toBe(false);
        expect(isJsxFile('script.js')).toBe(false);
        expect(isJsxFile('utils.ts')).toBe(false);
      });
    });
  });

  describe('component-specific filters', () => {
    describe('isCatalystComponent', () => {
      it('should identify Catalyst components correctly', () => {
        expect(isCatalystComponent('catalyst-button.tsx')).toBe(true);
        expect(isCatalystComponent('catalyst-input.tsx')).toBe(true);
        expect(isCatalystComponent('catalyst-dropdown.tsx')).toBe(true);
      });

      it('should reject non-Catalyst components', () => {
        expect(isCatalystComponent('button.tsx')).toBe(false);
        expect(isCatalystComponent('catalyst-button.ts')).toBe(false);
        expect(isCatalystComponent('not-catalyst-button.tsx')).toBe(false);
        expect(isCatalystComponent('catalystbutton.tsx')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(isCatalystComponent('catalyst-.tsx')).toBe(true);
        expect(isCatalystComponent('catalyst-')).toBe(false);
        expect(isCatalystComponent('catalyst-component-name.tsx')).toBe(true);
      });
    });

    describe('isWrapperComponent', () => {
      it('should identify wrapper components correctly', () => {
        expect(isWrapperComponent('button.tsx')).toBe(true);
        expect(isWrapperComponent('input.tsx')).toBe(true);
        expect(isWrapperComponent('dropdown.tsx')).toBe(true);
      });

      it('should reject theme components', () => {
        expect(isWrapperComponent('theme-colors.tsx')).toBe(false);
        expect(isWrapperComponent('theme-selector.tsx')).toBe(false);
        expect(isWrapperComponent('theme.tsx')).toBe(false);
      });

      it('should reject index files', () => {
        expect(isWrapperComponent('index.tsx')).toBe(false);
      });

      it('should reject nested files (with path separators)', () => {
        expect(isWrapperComponent('lib/button.tsx')).toBe(false);
        expect(isWrapperComponent('components/button.tsx')).toBe(false);
        expect(isWrapperComponent('theme/colors.tsx')).toBe(false);
      });

      it('should reject non-TSX files', () => {
        expect(isWrapperComponent('button.ts')).toBe(false);
        expect(isWrapperComponent('button.js')).toBe(false);
        expect(isWrapperComponent('button.jsx')).toBe(false);
      });
    });
  });

  describe('test-related filters', () => {
    describe('isTestFile', () => {
      it('should identify test files correctly', () => {
        expect(isTestFile('component.test.tsx')).toBe(true);
        expect(isTestFile('utils.test.ts')).toBe(true);
        expect(isTestFile('integration.spec.js')).toBe(true);
        expect(isTestFile('e2e.spec.ts')).toBe(true);
      });

      it('should reject non-test files', () => {
        expect(isTestFile('component.tsx')).toBe(false);
        expect(isTestFile('utils.ts')).toBe(false);
        expect(isTestFile('README.md')).toBe(false);
      });

      it('should handle nested test files', () => {
        expect(isTestFile('components/button.test.tsx')).toBe(true);
        expect(isTestFile('src/utils/helpers.spec.ts')).toBe(true);
      });
    });

    describe('isTestDirectory', () => {
      it('should identify test directories correctly', () => {
        expect(isTestDirectory('__tests__/component.tsx')).toBe(true);
        expect(isTestDirectory('src/__tests__/utils.ts')).toBe(true);
        expect(isTestDirectory('tests/integration.ts')).toBe(true);
        expect(isTestDirectory('src/tests/unit.ts')).toBe(true);
      });

      it('should reject non-test directories', () => {
        expect(isTestDirectory('src/components/button.tsx')).toBe(false);
        expect(isTestDirectory('lib/utils.ts')).toBe(false);
        expect(isTestDirectory('dist/index.js')).toBe(false);
      });

      it('should handle partial matches correctly', () => {
        expect(isTestDirectory('test-utils.ts')).toBe(false); // Not a directory
        expect(isTestDirectory('my-tests-file.ts')).toBe(false); // Not a directory path
      });
    });

    describe('isTestRelated', () => {
      it('should identify test-related files correctly', () => {
        expect(isTestRelated('component.test.tsx')).toBe(true);
        expect(isTestRelated('__tests__/component.tsx')).toBe(true);
        expect(isTestRelated('utils.spec.ts')).toBe(true);
        expect(isTestRelated('tests/integration.ts')).toBe(true);
      });

      it('should reject non-test-related files', () => {
        expect(isTestRelated('component.tsx')).toBe(false);
        expect(isTestRelated('src/utils.ts')).toBe(false);
        expect(isTestRelated('lib/components/button.tsx')).toBe(false);
      });
    });

    describe('isNotTestRelated', () => {
      it('should be inverse of isTestRelated', () => {
        const testFiles = [
          'component.test.tsx',
          '__tests__/component.tsx',
          'utils.spec.ts',
          'tests/integration.ts',
        ];

        const nonTestFiles = [
          'component.tsx',
          'src/utils.ts',
          'lib/components/button.tsx',
          'package.json',
        ];

        testFiles.forEach(file => {
          expect(isNotTestRelated(file)).toBe(false);
          expect(isTestRelated(file)).toBe(true);
        });

        nonTestFiles.forEach(file => {
          expect(isNotTestRelated(file)).toBe(true);
          expect(isTestRelated(file)).toBe(false);
        });
      });
    });
  });

  describe('utility functions', () => {
    describe('combineFilters', () => {
      it('should combine filters with AND logic', () => {
        const isTsxAndNotTest = combineFilters(isTsxFile, isNotTestRelated);

        expect(isTsxAndNotTest('component.tsx')).toBe(true);
        expect(isTsxAndNotTest('component.test.tsx')).toBe(false);
        expect(isTsxAndNotTest('utils.ts')).toBe(false);
      });

      it('should work with multiple filters', () => {
        const complexFilter = combineFilters(
          isTsxFile,
          isNotTestRelated,
          (file: string) => !file.includes('legacy')
        );

        expect(complexFilter('component.tsx')).toBe(true);
        expect(complexFilter('component.test.tsx')).toBe(false);
        expect(complexFilter('legacy/component.tsx')).toBe(false);
        expect(complexFilter('utils.ts')).toBe(false);
      });

      it('should handle empty filter list', () => {
        const noFilters = combineFilters();
        expect(noFilters('any-file.tsx')).toBe(true);
      });

      it('should handle single filter', () => {
        const singleFilter = combineFilters(isTsxFile);
        expect(singleFilter('component.tsx')).toBe(true);
        expect(singleFilter('component.ts')).toBe(false);
      });
    });

    describe('anyFilter', () => {
      it('should combine filters with OR logic', () => {
        const isTsxOrTest = anyFilter(isTsxFile, isTestRelated);

        expect(isTsxOrTest('component.tsx')).toBe(true);
        expect(isTsxOrTest('component.test.ts')).toBe(true);
        expect(isTsxOrTest('utils.js')).toBe(false);
      });

      it('should work with multiple filters', () => {
        const complexFilter = anyFilter(isTsxFile, isTestRelated, (file: string) =>
          file.includes('config')
        );

        expect(complexFilter('component.tsx')).toBe(true);
        expect(complexFilter('component.test.ts')).toBe(true);
        expect(complexFilter('config.js')).toBe(true);
        expect(complexFilter('utils.js')).toBe(false);
      });

      it('should handle empty filter list', () => {
        const noFilters = anyFilter();
        expect(noFilters('any-file.tsx')).toBe(false);
      });

      it('should handle single filter', () => {
        const singleFilter = anyFilter(isTsxFile);
        expect(singleFilter('component.tsx')).toBe(true);
        expect(singleFilter('component.ts')).toBe(false);
      });
    });
  });

  describe('real-world scenarios', () => {
    it('should filter Catalyst components for processing', () => {
      const files = [
        'catalyst-button.tsx',
        'catalyst-input.tsx',
        'button.tsx',
        'catalyst-button.test.tsx',
        'catalyst-dropdown.ts',
        'lib/catalyst-alert.tsx',
      ];

      const catalystComponents = files.filter(
        combineFilters(isCatalystComponent, isNotTestRelated)
      );
      expect(catalystComponents).toEqual(['catalyst-button.tsx', 'catalyst-input.tsx']);
    });

    it('should filter wrapper components excluding tests and themes', () => {
      const files = [
        'button.tsx',
        'input.tsx',
        'theme-colors.tsx',
        'theme-selector.tsx',
        'index.tsx',
        'button.test.tsx',
        'lib/catalyst-button.tsx',
        'components/custom-button.tsx',
      ];

      const wrapperComponents = files.filter(combineFilters(isWrapperComponent, isNotTestRelated));
      expect(wrapperComponents).toEqual(['button.tsx', 'input.tsx']);
    });

    it('should filter TypeScript files excluding tests', () => {
      const files = [
        'component.tsx',
        'utils.ts',
        'component.test.tsx',
        'utils.spec.ts',
        '__tests__/setup.ts',
        'script.js',
        'component.jsx',
      ];

      const tsFilesNoTests = files.filter(
        combineFilters(anyFilter(isTsxFile, isTsFile), isNotTestRelated)
      );

      expect(tsFilesNoTests).toEqual(['component.tsx', 'utils.ts']);
    });

    it('should handle complex project file structure', () => {
      const projectFiles = [
        'src/components/button.tsx',
        'src/components/button.test.tsx',
        'src/components/__tests__/input.test.tsx',
        'src/lib/catalyst-button.tsx',
        'src/lib/catalyst-input.tsx',
        'src/utils/helpers.ts',
        'src/utils/helpers.test.ts',
        'src/theme/theme-colors.tsx',
        'src/theme/theme-selector.tsx',
        'tests/integration/workflow.test.ts',
        'dist/index.js',
        'package.json',
        'README.md',
      ];

      // Filter for wrapper component files at root level (need actual root-level files)
      const rootLevelFiles = [
        'button.tsx',
        'input.tsx',
        'theme-colors.tsx',
        'theme-selector.tsx',
        'button.test.tsx',
        'index.tsx',
      ];

      const componentFiles = rootLevelFiles.filter(
        combineFilters(isTsxFile, isNotTestRelated, isWrapperComponent)
      );

      expect(componentFiles).toEqual(['button.tsx', 'input.tsx']);

      // Filter for Catalyst components (need full path for this)
      const catalystFiles = projectFiles
        .map(file => file.split('/').pop() || '')
        .filter(combineFilters(isCatalystComponent, isNotTestRelated));

      expect(catalystFiles).toEqual(['catalyst-button.tsx', 'catalyst-input.tsx']);

      // Filter for all TypeScript files excluding tests
      const tsFiles = projectFiles
        .map(file => file.split('/').pop() || '')
        .filter(combineFilters(anyFilter(isTsxFile, isTsFile), isNotTestRelated));

      expect(tsFiles).toEqual([
        'button.tsx',
        'catalyst-button.tsx',
        'catalyst-input.tsx',
        'helpers.ts',
        'theme-colors.tsx',
        'theme-selector.tsx',
      ]);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty strings', () => {
      expect(isTsxFile('')).toBe(false);
      expect(isTestFile('')).toBe(false);
      expect(isWrapperComponent('')).toBe(false);
      expect(isCatalystComponent('')).toBe(false);
    });

    it('should handle files with multiple dots', () => {
      expect(isTsxFile('component.spec.tsx')).toBe(true);
      expect(isTestFile('component.spec.tsx')).toBe(true);
      expect(isTsFile('types.d.ts')).toBe(true);
    });

    it('should handle files with no extension', () => {
      expect(isTsxFile('README')).toBe(false);
      expect(isTsFile('Dockerfile')).toBe(false);
      expect(isTestFile('test-script')).toBe(false);
    });

    it('should handle special characters in filenames', () => {
      expect(isTsxFile('component-with-dashes.tsx')).toBe(true);
      expect(isTsxFile('component_with_underscores.tsx')).toBe(true);
      expect(isTsxFile('component@special.tsx')).toBe(true);
      expect(isTestFile('test-file@special.test.tsx')).toBe(true);
    });

    it('should handle Unicode filenames', () => {
      expect(isTsxFile('컴포넌트.tsx')).toBe(true);
      expect(isTestFile('тест.test.ts')).toBe(true);
      expect(isCatalystComponent('catalyst-按钮.tsx')).toBe(true);
    });
  });

  describe('performance considerations', () => {
    it('should handle large file lists efficiently', () => {
      const largeFileList = Array.from({ length: 10000 }, (_, i) => `file${i}.tsx`);

      const start = performance.now();
      const tsxFiles = largeFileList.filter(isTsxFile);
      const end = performance.now();

      expect(tsxFiles).toHaveLength(10000);
      expect(end - start).toBeLessThan(100); // Should be very fast
    });

    it('should handle complex filter combinations efficiently', () => {
      const files = Array.from({ length: 1000 }, (_, i) => {
        const types = ['.tsx', '.ts', '.test.tsx', '.spec.ts'];
        const prefixes = ['', 'catalyst-', 'theme-'];
        const type = types[i % types.length];
        const prefix = prefixes[i % prefixes.length];
        return `${prefix}file${i}${type}`;
      });

      const complexFilter = combineFilters(
        anyFilter(isTsxFile, isTsFile),
        isNotTestRelated,
        (file: string) => !file.startsWith('theme-')
      );

      const start = performance.now();
      const filtered = files.filter(complexFilter);
      const end = performance.now();

      expect(filtered.length).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(100);
    });
  });
});
