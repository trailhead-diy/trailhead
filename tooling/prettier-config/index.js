/** @type {import("prettier").Config} */
module.exports = {
  semi: false,
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    {
      files: '*.jsonc',
      options: {
        trailingComma: 'none',
      },
    },
  ],
};
