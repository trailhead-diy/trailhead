# Real-World Command Testing

This directory contains infrastructure for testing actual command execution between shell scripts and TypeScript CLI, comparing real file changes and outputs.

## ⚠️ IMPORTANT: Test Safety

These tests make **real changes** to files and systems. Always:

1. Run in isolated environment only
2. Backup your work with git stash
3. Review test scenarios before execution
4. Use cleanup scripts after testing

## Structure

```
real-world/
├── workspace/           # Isolated test environment
│   ├── sample-monorepo/ # Mock monorepo structure for testing
│   └── temp/           # Temporary files during testing
├── snapshots/          # Before/after filesystem snapshots
├── outputs/            # Captured command outputs (stdout/stderr)
├── test-cases/         # Realistic test scenario definitions
├── scripts/            # Test execution framework
└── results/            # Comparison reports and analysis
```

## Usage

```bash
# 1. Setup (creates isolated environment)
./scripts/setup-test-environment.sh

# 2. Run specific command comparison
./scripts/compare-command.sh npm-auth

# 3. Run all comparisons
./scripts/run-all-comparisons.sh

# 4. Generate report
./scripts/generate-report.sh

# 5. Cleanup (restores original state)
./scripts/cleanup-test-environment.sh
```

## Test Philosophy

- **Real Execution**: No mocks, no dry-runs - actual command execution
- **Complete Comparison**: Files, outputs, exit codes, environment changes
- **Safety First**: Isolated environment with rollback mechanisms
- **Evidence-Based**: Detailed diffs and analysis for every difference found

## Safety Mechanisms

1. **Git Stash**: Automatic backup before any testing
2. **Isolated Workspace**: All tests run in temporary directories
3. **State Snapshots**: Before/after filesystem capture
4. **Rollback Scripts**: Automatic cleanup and restoration
5. **Read-Only Validation**: Verify test setup before execution
