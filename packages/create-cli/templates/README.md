# Template Files

This directory contains Handlebars template files (.hbs) used for generating CLI projects.

## Template Formatting

These template files intentionally have minimal formatting. The proper formatting is applied **after** template compilation through the `formatGeneratedCode` function in `src/lib/transform-helpers.ts`.

This approach follows industry best practices for code generation:

1. **Templates focus on structure**, not formatting
2. **Generated code is formatted** using Prettier after compilation
3. **Consistent output** regardless of template formatting

## Why This Approach?

- Handlebars syntax conflicts with TypeScript/JavaScript parsers
- Mixed syntax ({{variables}} within code) cannot be properly parsed by formatters
- Post-generation formatting ensures output is always correctly formatted
- Separates concerns: templates handle logic, formatter handles style

## Manual Template Maintenance

If you need to improve template readability:

- Use the Python script: `pnpm format:templates` (legacy approach)
- Focus on logical structure, not perfect formatting
- Remember that output will be auto-formatted

## Adding New Templates

When adding new templates:

1. Focus on correct Handlebars logic and structure
2. Don't worry about perfect formatting
3. Test the generated output - it will be auto-formatted
4. Ensure file extensions match the content type (.ts.hbs for TypeScript, etc.)
