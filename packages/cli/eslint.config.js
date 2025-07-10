import neverthrow from '@ninoseki/eslint-plugin-neverthrow';
import parser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: true,
      },
    },
    plugins: {
      neverthrow,
    },
    rules: {
      // Ensure Result types are explicitly handled (warn instead of error for gradual adoption)
      'neverthrow/must-use-result': 'warn',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Don't require project for test files since they're excluded from tsconfig
      },
    },
    rules: {
      // Allow unsafe unwrapping in tests for assertions
      'neverthrow/must-use-result': 'off',
    },
  },
];
