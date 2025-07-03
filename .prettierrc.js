module.exports = {
  ...require('./tooling/prettier-config'),
  // Explicitly disable organize-imports plugin to avoid the error
  // This plugin is deprecated anyway - use ESLint or oxlint for import sorting
  plugins: [],
}