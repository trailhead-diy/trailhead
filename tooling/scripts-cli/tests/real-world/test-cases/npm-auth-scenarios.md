# npm-auth Test Scenarios

Test cases for comparing `scripts/setup-npm-auth.sh` vs `scripts-cli npm-auth`.

## Scenario 1: Fresh System

**Setup**: No existing `.npmrc` file
**Expected**: Creates `.npmrc` with GitHub registry configuration

### Shell Script Expected Behavior:

```bash
# Creates ~/.npmrc with:
@esteban-url:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### TypeScript CLI Expected Behavior:

- Same file creation
- Same content format
- Same error handling for missing GITHUB_TOKEN

## Scenario 2: Existing .npmrc

**Setup**: Existing `.npmrc` with other registry configurations
**Expected**: Preserves existing config, adds GitHub registry

### Test Data:

```
# Existing .npmrc content
registry=https://registry.npmjs.org/
@company:registry=https://private-registry.company.com
//private-registry.company.com/:_authToken=company-token
```

### Expected Result:

- Preserves all existing lines
- Adds GitHub registry configuration
- No duplication if already exists

## Scenario 3: Permission Issues

**Setup**: Read-only `.npmrc` or no write permission to home directory
**Expected**: Appropriate error handling

### Test Setup:

```bash
chmod 444 ~/.npmrc  # Make read-only
```

### Expected Behavior:

- Clear error message
- Non-zero exit code
- No partial file corruption

## Scenario 4: Missing GITHUB_TOKEN

**Setup**: Environment variable not set
**Expected**: Error message and non-zero exit code

### Expected Error:

- Clear message about missing GITHUB_TOKEN
- Instructions for setting the variable
- Exit code 1

## Scenario 5: Different Token Values

**Setup**: Various GITHUB_TOKEN formats
**Expected**: Handles all valid GitHub token formats

### Test Tokens:

- `ghp_1234567890abcdef` (Personal access token)
- `github_pat_11ABCDEF_1234567890abcdef` (Fine-grained PAT)
- Empty string (should error)
- Token with special characters

## Files to Compare:

- `~/.npmrc` content before/after
- Command output (stdout/stderr)
- Exit codes
- File permissions after creation
