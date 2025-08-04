# Real-World Testing Framework - Usage Guide

Complete testing framework to compare shell scripts vs TypeScript CLI with **actual file changes and output**.

## ⚠️ IMPORTANT SAFETY NOTICE

This framework makes **REAL CHANGES** to files and systems. It's designed with safety mechanisms, but always:

1. **Backup your work**: Git stash or commit changes before testing
2. **Review test scenarios**: Understand what each test will do
3. **Use isolated environment**: Tests run in separate workspace
4. **Run cleanup**: Always clean up after testing

## Quick Start

```bash
# 1. Setup isolated test environment
./scripts/setup-test-environment.sh

# 2. Run all comparisons (SAFE - includes backups)
./scripts/run-all-tests.sh

# 3. View results
cat results/comprehensive-report.md

# 4. Cleanup when done
./scripts/cleanup-test-environment.sh
```

## Individual Command Testing

```bash
# Test specific commands
./scripts/compare-command.sh npm-auth
./scripts/compare-command.sh fix-imports
./scripts/compare-command.sh validate-deps
./scripts/compare-command.sh test-runner

# Generate report after individual tests
./scripts/generate-report.sh
```

## What Gets Tested

### 🔍 **Complete Comparison**

- **File Changes**: Before/after snapshots of entire filesystem
- **Command Output**: stdout, stderr, exit codes
- **Environment Changes**: Variables, working directory
- **Performance**: Execution time comparison
- **Error Handling**: How each handles edge cases

### 🧪 **Realistic Scenarios**

- **npm-auth**: Real .npmrc modification with various token formats
- **fix-imports**: Actual duplicate import removal from TypeScript files
- **validate-deps**: Real monorepo dependency validation
- **test-runner**: Actual test execution with risk detection

### 📊 **Evidence-Based Results**

- Detailed diff reports for every change
- Side-by-side output comparison
- Performance metrics
- Safety validation

## Directory Structure After Setup

```
tests/real-world/
├── workspace/              # Isolated test environment
│   ├── sample-monorepo/   # Mock project for testing
│   ├── npm-test/          # npm auth test environment
│   └── temp/              # Temporary files
├── snapshots/             # Before/after filesystem states
├── outputs/               # Command stdout/stderr capture
├── results/               # Comparison reports and analysis
├── test-cases/            # Detailed test scenario definitions
└── scripts/               # Test execution framework
```

## Test Scenarios

### npm-auth

- Fresh system (no .npmrc)
- Existing .npmrc with other registries
- Permission issues
- Missing GITHUB_TOKEN
- Various token formats

### fix-imports

- Basic duplicate imports
- Mixed import styles (default, named, namespace)
- Comments and strings with import-like text
- Multiple files processing
- Backup file creation

### validate-deps

- Valid monorepo structure
- Circular dependencies
- Missing build dependencies
- turbo.json validation
- --fix and --graph flags

### test-runner

- Files with high-risk patterns
- Long-running tests (timeout scenarios)
- Mixed risk levels
- Error handling

## Safety Mechanisms

### 🔒 **Pre-Test Safety**

- Git stash backup creation
- Clean working directory verification
- CLI build status check
- Permission validation

### 🏖️ **Isolated Environment**

- All tests run in `workspace/` subdirectory
- No modifications to real project files
- Temporary directories for each test
- Controlled environment variables

### 📸 **State Management**

- Complete filesystem snapshots before/after
- JSON-based state capture
- Rollback capability
- Change tracking

### 🧹 **Cleanup**

- Automatic workspace cleanup
- Optional results preservation
- Git stash restoration
- Environment variable cleanup

## Understanding Results

### 📊 **Comprehensive Report**

The main report (`results/comprehensive-report.md`) includes:

- Executive summary with pass/fail counts
- Detailed analysis for each command
- Performance comparison
- File system impact analysis
- Migration recommendations

### 📋 **Individual Reports**

Each command gets a dedicated report:

- Exit code comparison
- File changes diff
- Output comparison
- Specific recommendations

### 🔍 **Raw Data**

All raw data is preserved:

- `snapshots/`: Complete filesystem states
- `outputs/`: Command stdout/stderr
- `results/`: Analysis and diffs

## Example Output

```
🧪 Real-World Testing Suite
================================

✅ Safety checks passed
🏗️  Setting up test environment...
✅ Test environment setup complete!

🧪 Running Command Comparisons

🔍 Testing: npm-auth
✅ npm-auth comparison completed

🔍 Testing: fix-imports
✅ fix-imports comparison completed

📊 Test Results Summary
=====================
✅ npm-auth: PASSED
✅ fix-imports: PASSED
✅ validate-deps: PASSED
✅ test-runner: PASSED

🎉 ALL TESTS PASSED (4/4)
✅ TypeScript CLI is ready for production use!
```

## Troubleshooting

### Common Issues

**"CLI not built"**

```bash
cd ../../../  # Go to CLI directory
pnpm build
```

**"Permission denied"**

```bash
chmod +x scripts/*.sh
```

**"Git stash issues"**

```bash
git stash list  # Check existing stashes
git stash pop   # Restore if needed
```

### Manual Cleanup

If automated cleanup fails:

```bash
rm -rf workspace/
rm -rf snapshots/
rm -rf outputs/
# Keep results/ for analysis
```

## Advanced Usage

### Custom Test Scenarios

Add new scenarios in `test-cases/` directory with:

- Setup instructions
- Expected behavior
- Files to compare

### Extended Analysis

For deeper analysis:

```bash
# Compare specific snapshots
./scripts/state-capture.sh compare before-test after-test

# View raw command output
cat outputs/npm-auth-shell-stdout.txt
cat outputs/npm-auth-typescript-stdout.txt
```

### Performance Testing

Add timing measurements by modifying `compare-command.sh`:

```bash
start_time=$(date +%s.%N)
# ... run command ...
end_time=$(date +%s.%N)
duration=$(echo "$end_time - $start_time" | bc -l)
```

## Next Steps After Testing

### ✅ If All Tests Pass

1. Review comprehensive report
2. Update documentation
3. Archive shell scripts
4. Update CI/CD pipelines
5. Announce migration to team

### ⚠️ If Some Tests Fail

1. Review individual reports
2. Fix TypeScript CLI discrepancies
3. Re-run failed tests
4. Validate fixes

### ❌ If Many Tests Fail

1. Review fundamental implementation
2. Debug core issues
3. Consider incremental migration
4. Expand test coverage

This framework provides **definitive evidence** for migration decisions based on real behavior, not assumptions.
