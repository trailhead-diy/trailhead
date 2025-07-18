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
    // Note: .hbs files in this project are TypeScript/JavaScript templates with Handlebars
    // variables, not HTML templates. The glimmer parser doesn't support this use case,
    // so we exclude .hbs files from formatting in package.json scripts.
  ],
}
