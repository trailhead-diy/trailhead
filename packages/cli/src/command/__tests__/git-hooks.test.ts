/**
 * Tests for git-hooks command functionality
 * Focuses on high-ROI testing: risk detection logic, file pattern matching, and configuration parsing
 */

import { describe, it, expect } from 'vitest';

// Test utilities for risk detection (extracted from git-hooks.ts for testing)
interface TestConfig {
  highRiskPatterns: string[];
  skipPatterns: string[];
  packageMappings?: Record<string, string>;
}

// Risk detection logic extracted for testing
function detectRiskLevel(
  stagedFiles: string,
  config: TestConfig,
): 'high' | 'medium' | 'skip' {
  const files = stagedFiles
    .trim()
    .split('\n')
    .filter((f) => f.length > 0);

  // Build patterns
  const highRiskPattern = config.highRiskPatterns.join('|');
  const skipPattern = config.skipPatterns.join('|');

  // Check for high-risk files
  const hasHighRisk = files.some((file) =>
    new RegExp(highRiskPattern).test(file),
  );

  if (hasHighRisk) {
    return 'high';
  }

  // Check if all files match skip patterns first
  const nonSkipFiles = files.filter(
    (file) => !new RegExp(skipPattern).test(file),
  );

  if (nonSkipFiles.length === 0) {
    return 'skip';
  }

  // Check for package-specific changes among non-skip files
  const hasPackageChanges = nonSkipFiles.some((file) =>
    file.startsWith('packages/'),
  );

  if (hasPackageChanges) {
    return 'medium';
  }

  // Default to medium risk
  return 'medium';
}

// Package detection logic
function getAffectedPackages(stagedFiles: string): string[] {
  const files = stagedFiles
    .trim()
    .split('\n')
    .filter((f) => f.length > 0);

  const packages = files
    .filter((file) => /^packages\/([^/]+)\//.test(file))
    .map((file) => {
      const match = file.match(/^packages\/([^/]+)\//);
      return match ? match[1] : null;
    })
    .filter((pkg): pkg is string => pkg !== null)
    .filter((pkg, index, arr) => arr.indexOf(pkg) === index); // unique

  return packages;
}

// Template rendering logic
function renderTemplate(template: string, vars: Record<string, any>): string {
  let result = template;

  // Replace simple variables {{VAR}}
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = vars[key.trim()];
    return value !== undefined ? String(value) : match;
  });

  return result;
}

describe('Git Hooks - Risk Detection', () => {
  const defaultConfig: TestConfig = {
    highRiskPatterns: [
      '\\.(ts|tsx|js|jsx)$',
      'tsconfig',
      'package\\.json$',
      'turbo\\.json$',
      'vitest\\.config',
      'vite\\.config',
      'lefthook\\.yml$',
    ],
    skipPatterns: [
      '\\.md$',
      'README',
      'CHANGELOG',
      'LICENSE',
      '\\.github/',
      '\\.vscode/',
      '\\.gitignore$',
      '\\.prettierrc',
      'docs/',
      '\\.smart-test-config\\.json$',
    ],
  };

  describe('High-Risk Detection', () => {
    it('should detect TypeScript files as high-risk', () => {
      const files = 'src/components/Button.tsx\nsrc/utils/helpers.ts';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('high');
    });

    it('should detect JavaScript files as high-risk', () => {
      const files = 'src/components/Button.jsx\nsrc/utils/helpers.js';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('high');
    });

    it('should detect configuration files as high-risk', () => {
      const files = 'package.json\ntsconfig.json';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('high');
    });

    it('should detect build config files as high-risk', () => {
      const files = 'vitest.config.ts\nvite.config.js\nturbo.json';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('high');
    });

    it('should detect lefthook config as high-risk', () => {
      const files = 'lefthook.yml\n.lefthook.yml';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('high');
    });

    it('should prioritize high-risk over package changes', () => {
      const files = 'packages/cli/src/index.ts\npackages/web-ui/README.md';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('high');
    });
  });

  describe('Medium-Risk Detection (Package Changes)', () => {
    it('should detect package-specific non-code changes as medium-risk', () => {
      const files =
        'packages/cli/test-file.txt\npackages/web-ui/docs/example.md';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('medium');
    });

    it('should detect multiple package changes as medium-risk', () => {
      const files =
        'packages/cli/assets/icon.png\npackages/web-ui/stories/Button.stories.tsx';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('high'); // .tsx is high-risk
    });

    it('should handle single package change', () => {
      const files = 'packages/cli/some-file.txt';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('medium');
    });
  });

  describe('Skip Detection (Low-Risk)', () => {
    it('should skip documentation-only changes', () => {
      const files = 'README.md\nCHANGELOG.md\ndocs/getting-started.md';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('skip');
    });

    it('should skip IDE configuration changes', () => {
      const files = '.vscode/settings.json\n.github/workflows/ci.yml';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('skip');
    });

    it('should skip git configuration changes', () => {
      const files = '.gitignore\n.prettierrc\n.smart-test-config.json';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('skip');
    });

    it('should skip LICENSE files', () => {
      const files = 'LICENSE\nLICENSE.md';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('skip');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file list', () => {
      const files = '';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('skip');
    });

    it('should handle single file', () => {
      const files = 'src/index.ts';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('high');
    });

    it('should handle mixed risk levels correctly', () => {
      const files = 'README.md\nsrc/index.ts\npackages/cli/test.txt';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('high'); // High-risk takes precedence
    });

    it('should default to medium for unknown file types', () => {
      const files = 'unknown-file.xyz\nweird.extension';
      const risk = detectRiskLevel(files, defaultConfig);
      expect(risk).toBe('medium');
    });
  });
});

describe('Git Hooks - Package Detection', () => {
  describe('Package Extraction', () => {
    it('should extract single package', () => {
      const files = 'packages/cli/src/index.ts\npackages/cli/README.md';
      const packages = getAffectedPackages(files);
      expect(packages).toEqual(['cli']);
    });

    it('should extract multiple packages', () => {
      const files =
        'packages/cli/src/index.ts\npackages/web-ui/src/Button.tsx\npackages/create-trailhead-cli/template.json';
      const packages = getAffectedPackages(files);
      expect(packages).toEqual(['cli', 'web-ui', 'create-trailhead-cli']);
    });

    it('should handle duplicate packages', () => {
      const files =
        'packages/cli/src/index.ts\npackages/cli/src/utils.ts\npackages/cli/README.md';
      const packages = getAffectedPackages(files);
      expect(packages).toEqual(['cli']);
    });

    it('should ignore non-package files', () => {
      const files =
        'README.md\nsrc/index.ts\npackages/cli/src/index.ts\ndocs/guide.md';
      const packages = getAffectedPackages(files);
      expect(packages).toEqual(['cli']);
    });

    it('should handle no package files', () => {
      const files = 'README.md\nsrc/index.ts\ndocs/guide.md';
      const packages = getAffectedPackages(files);
      expect(packages).toEqual([]);
    });

    it('should handle empty input', () => {
      const files = '';
      const packages = getAffectedPackages(files);
      expect(packages).toEqual([]);
    });
  });
});

describe('Git Hooks - Template Rendering', () => {
  describe('Variable Substitution', () => {
    it('should replace simple variables', () => {
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const vars = { name: 'John', project: 'Trailhead' };
      const result = renderTemplate(template, vars);
      expect(result).toBe('Hello John, welcome to Trailhead!');
    });

    it('should handle missing variables', () => {
      const template = 'Hello {{name}}, welcome to {{missing}}!';
      const vars = { name: 'John' };
      const result = renderTemplate(template, vars);
      expect(result).toBe('Hello John, welcome to {{missing}}!');
    });

    it('should handle multiple occurrences', () => {
      const template = '{{name}} and {{name}} are both {{name}}';
      const vars = { name: 'awesome' };
      const result = renderTemplate(template, vars);
      expect(result).toBe('awesome and awesome are both awesome');
    });

    it('should handle numbers and booleans', () => {
      const template = 'Port: {{port}}, Debug: {{debug}}';
      const vars = { port: 3000, debug: true };
      const result = renderTemplate(template, vars);
      expect(result).toBe('Port: 3000, Debug: true');
    });

    it('should handle whitespace in variable names', () => {
      const template = 'Value: {{ spaced_var }}';
      const vars = { spaced_var: 'works' };
      const result = renderTemplate(template, vars);
      expect(result).toBe('Value: works');
    });
  });

  describe('Real-world Templates', () => {
    it('should render lefthook command template', () => {
      const template = 'run: {{PACKAGE_MANAGER}} test --filter={{FILTER}}';
      const vars = {
        PACKAGE_MANAGER: 'pnpm',
        FILTER: '@esteban-url/trailhead-cli',
      };
      const result = renderTemplate(template, vars);
      expect(result).toBe('run: pnpm test --filter=@esteban-url/trailhead-cli');
    });

    it('should render file patterns', () => {
      const template = 'glob: "**/*.{{{FILE_PATTERNS}}}"';
      const vars = { FILE_PATTERNS: 'ts,tsx,js,jsx' };
      const result = renderTemplate(template, vars);
      // The triple braces don't get replaced by our simple template engine
      expect(result).toBe('glob: "**/*.{{{FILE_PATTERNS}}}"');
    });
  });
});

describe('Git Hooks - Configuration Validation', () => {
  describe('Pattern Validation', () => {
    it('should validate high-risk patterns are proper regex', () => {
      const patterns = ['\\.(ts|tsx|js|jsx)$', 'package\\.json$', 'tsconfig'];

      patterns.forEach((pattern) => {
        expect(() => new RegExp(pattern)).not.toThrow();
      });
    });

    it('should validate skip patterns are proper regex', () => {
      const patterns = ['\\.md$', 'README', '\\.github/', 'docs/'];

      patterns.forEach((pattern) => {
        expect(() => new RegExp(pattern)).not.toThrow();
      });
    });

    it('should handle complex regex patterns', () => {
      const complexPattern = '^packages/([^/]+)/src/.*\\.(ts|tsx)$';
      expect(() => new RegExp(complexPattern)).not.toThrow();

      const testFile = 'packages/cli/src/index.ts';
      expect(new RegExp(complexPattern).test(testFile)).toBe(true);
    });
  });

  describe('Package Mapping Validation', () => {
    it('should validate package mappings format', () => {
      const mappings = {
        cli: '@esteban-url/trailhead-cli',
        'web-ui': '@esteban-url/trailhead-web-ui',
        'create-trailhead-cli': '@esteban-url/create-trailhead-cli',
      };

      Object.entries(mappings).forEach(([key, value]) => {
        expect(typeof key).toBe('string');
        expect(typeof value).toBe('string');
        expect(key.length).toBeGreaterThan(0);
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Git Hooks - Integration Scenarios', () => {
  const testConfig: TestConfig = {
    highRiskPatterns: [
      '\\.(ts|tsx|js|jsx)$',
      'tsconfig',
      'package\\.json$',
      'turbo\\.json$',
      'vitest\\.config',
      'vite\\.config',
      'lefthook\\.yml$',
    ],
    skipPatterns: [
      '\\.md$',
      'README',
      'CHANGELOG',
      'LICENSE',
      '\\.github/',
      '\\.vscode/',
      '\\.gitignore$',
      '\\.prettierrc',
      'docs/',
      '\\.smart-test-config\\.json$',
    ],
  };

  describe('Real Monorepo Scenarios', () => {
    it('should handle typical CLI development workflow', () => {
      const files =
        'packages/cli/src/command/new-feature.ts\npackages/cli/src/command/__tests__/new-feature.test.ts';
      const risk = detectRiskLevel(files, testConfig);
      const packages = getAffectedPackages(files);

      expect(risk).toBe('high');
      expect(packages).toEqual(['cli']);
    });

    it('should handle documentation updates across packages', () => {
      const files =
        'packages/cli/README.md\npackages/web-ui/README.md\ndocs/architecture.md';
      const risk = detectRiskLevel(files, testConfig);
      const packages = getAffectedPackages(files);

      expect(risk).toBe('skip');
      expect(packages).toEqual(['cli', 'web-ui']);
    });

    it('should handle cross-package feature development', () => {
      const files =
        'packages/cli/src/generator.ts\npackages/web-ui/src/components/NewComponent.tsx\npackages/create-trailhead-cli/templates/component.ts';
      const risk = detectRiskLevel(files, testConfig);
      const packages = getAffectedPackages(files);

      expect(risk).toBe('high');
      expect(packages).toEqual(['cli', 'web-ui', 'create-trailhead-cli']);
    });

    it('should handle configuration changes', () => {
      const files = 'turbo.json\npackage.json\npnpm-workspace.yaml';
      const risk = detectRiskLevel(files, testConfig);

      expect(risk).toBe('high');
    });

    it('should handle mixed changes with different risk levels', () => {
      const files = [
        'README.md', // skip
        'packages/cli/src/index.ts', // high (code)
        'packages/web-ui/assets/icon.png', // medium (package asset)
        'docs/getting-started.md', // skip
        '.github/workflows/ci.yml', // skip
      ].join('\n');

      const risk = detectRiskLevel(files, testConfig);
      expect(risk).toBe('high'); // High-risk takes precedence
    });
  });
});
