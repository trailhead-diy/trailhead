#!/usr/bin/env node
/**
 * fresh-start.js - Complete development environment reset
 *
 * This script provides a comprehensive way to reset your development environment
 * to a clean, up-to-date state. Perfect for:
 * - Context switching between features
 * - Troubleshooting build/dependency issues
 * - Post-merge cleanup
 * - Starting fresh after complex changes
 *
 * Usage:
 *   node scripts/fresh-start.js          # Standard fresh start (stash changes)
 *   node scripts/fresh-start.js --pop    # Restore stashed changes after reset
 *   node scripts/fresh-start.js -p       # Short form of --pop
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldPopStash = args.includes('--pop') || args.includes('-p');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      `${colors.yellow}${question} (y/N): ${colors.reset}`,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      },
    );
  });
}

function execCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return { success: true, output: output?.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout?.trim(),
      stderr: error.stderr?.trim(),
    };
  }
}

function checkGitStatus() {
  const status = execCommand('git status --porcelain', { silent: true });
  if (!status.success) {
    throw new Error('Failed to check git status. Are you in a git repository?');
  }
  return status.output?.length > 0;
}

function getCurrentBranch() {
  const result = execCommand('git branch --show-current', { silent: true });
  if (!result.success) {
    throw new Error('Failed to get current branch');
  }
  return result.output;
}

function stashChanges() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const stashMessage = `fresh-start: auto-stash ${timestamp}`;

  const result = execCommand(`git stash push -m "${stashMessage}"`, {
    silent: true,
  });
  if (result.success) {
    logSuccess(`Stashed uncommitted changes: "${stashMessage}"`);
    return stashMessage;
  } else {
    logWarning('No changes to stash or stash failed');
    return null;
  }
}

function popStash(stashMessage) {
  if (!stashMessage) {
    logWarning('No stash to pop');
    return;
  }

  logStep('Final', 'Restoring stashed changes');

  // Find the stash entry by message
  const stashListResult = execCommand('git stash list', { silent: true });
  if (!stashListResult.success) {
    logWarning('Failed to list stashes');
    return;
  }

  // Look for our stash message in the list
  const stashLines = stashListResult.output.split('\n');
  const stashEntry = stashLines.find((line) => line.includes(stashMessage));

  if (!stashEntry) {
    logWarning(`Could not find stash with message: ${stashMessage}`);
    return;
  }

  // Extract stash ref (e.g., "stash@{0}")
  const stashRef = stashEntry.match(/stash@\{\d+\}/)?.[0];
  if (!stashRef) {
    logWarning('Could not parse stash reference');
    return;
  }

  // Pop the specific stash
  const popResult = execCommand(`git stash pop ${stashRef}`);
  if (popResult.success) {
    logSuccess('Stashed changes restored successfully');
  } else {
    logWarning(
      'Failed to restore stashed changes - you may need to resolve manually',
    );
    logInfo(`To restore manually, run: git stash pop ${stashRef}`);
  }
}

function resetToMain() {
  logStep(2, 'Resetting to latest main branch');

  // Checkout main
  logInfo('Switching to main branch...');
  let result = execCommand('git checkout main');
  if (!result.success) {
    throw new Error('Failed to checkout main branch. Does it exist?');
  }

  // Fetch latest
  logInfo('Fetching latest changes...');
  result = execCommand('git fetch origin');
  if (!result.success) {
    throw new Error('Failed to fetch from origin');
  }

  // Reset hard to origin/main
  logInfo('Resetting to origin/main...');
  result = execCommand('git reset --hard origin/main');
  if (!result.success) {
    throw new Error('Failed to reset to origin/main');
  }

  // Clean untracked files
  logInfo('Cleaning untracked files...');
  result = execCommand('git clean -fd');
  if (!result.success) {
    logWarning('Failed to clean untracked files');
  }

  logSuccess('Git state reset to latest main');
}

function cleanDependencies() {
  logStep(3, 'Cleaning dependencies and caches');

  const pathsToClean = [
    'node_modules',
    'packages/*/node_modules',
    '.turbo/cache',
    '.turbo/cookies',
    'packages/*/dist',
    'packages/*/.next',
    'packages/*/build',
  ];

  for (const pathPattern of pathsToClean) {
    if (pathPattern.includes('*')) {
      // Handle glob patterns
      const result = execCommand(
        `find . -path "./${pathPattern}" -type d -exec rm -rf {} + 2>/dev/null || true`,
        { silent: true },
      );
      if (result.success) {
        logInfo(`Cleaned: ${pathPattern}`);
      }
    } else {
      // Handle direct paths
      if (fs.existsSync(pathPattern)) {
        const result = execCommand(`rm -rf ${pathPattern}`, { silent: true });
        if (result.success) {
          logInfo(`Cleaned: ${pathPattern}`);
        }
      }
    }
  }

  logSuccess('Dependencies and caches cleaned');
}

function freshInstall() {
  logStep(4, 'Fresh dependency installation');

  logInfo('Installing dependencies...');
  const result = execCommand('pnpm install --frozen-lockfile');
  if (!result.success) {
    throw new Error('Failed to install dependencies');
  }

  logSuccess('Dependencies installed');
}

function buildPackages() {
  logStep(5, 'Building all packages');

  const result = execCommand('pnpm build');
  if (!result.success) {
    throw new Error('Failed to build packages');
  }

  logSuccess('All packages built successfully');
}

function validateEnvironment() {
  logStep(6, 'Validating environment');

  // Check TypeScript
  logInfo('Checking TypeScript...');
  const tsResult = execCommand('pnpm types', { silent: true });
  if (!tsResult.success) {
    logWarning(
      'TypeScript validation failed - you may need to fix type errors',
    );
  } else {
    logSuccess('TypeScript validation passed');
  }

  // Show final git status
  logInfo('Final git status:');
  execCommand('git status');
}

function showSummary() {
  log('\n' + '='.repeat(60), 'bright');
  log('🎉 Fresh Start Complete!', 'green');
  log('='.repeat(60), 'bright');
  log(
    'Your development environment has been reset to a clean state:',
    'bright',
  );
  log('• Git: Reset to latest main branch', 'green');
  log('• Dependencies: Freshly installed', 'green');
  log('• Build: All packages rebuilt', 'green');
  log('• Cache: Cleaned and regenerated', 'green');
  log("\nYou're ready to start fresh development! 🚀", 'cyan');
  log('='.repeat(60), 'bright');
}

async function main() {
  try {
    log('🧹 Fresh Start - Complete Development Environment Reset', 'bright');
    log(
      'This will reset your environment to a clean, up-to-date state.\n',
      'yellow',
    );

    // Pre-flight checks
    const currentBranch = getCurrentBranch();
    const hasUncommittedChanges = checkGitStatus();

    log(`Current branch: ${currentBranch}`, 'blue');
    if (hasUncommittedChanges) {
      log('Uncommitted changes detected - will be stashed', 'yellow');
      if (shouldPopStash) {
        log('Changes will be restored after fresh start (--pop flag)', 'cyan');
      }
    }

    // Confirmation
    const stashAction =
      shouldPopStash && hasUncommittedChanges
        ? 'Stash changes and restore after reset'
        : 'Stash any uncommitted changes';

    const confirmed = await askConfirmation(
      '\nThis will:\n' +
        `• ${stashAction}\n` +
        '• Reset to main branch (origin/main)\n' +
        '• Clean all dependencies and caches\n' +
        '• Reinstall dependencies and rebuild\n' +
        '\nContinue?',
    );

    if (!confirmed) {
      log('\nFresh start cancelled.', 'yellow');
      process.exit(0);
    }

    // Execute fresh start
    logStep(1, 'Preparing environment');

    let stashMessage = null;
    if (hasUncommittedChanges) {
      stashMessage = stashChanges();
    } else {
      logInfo('No uncommitted changes to stash');
    }

    resetToMain();
    cleanDependencies();
    freshInstall();
    buildPackages();
    validateEnvironment();

    // Pop stash if requested and we have one
    if (shouldPopStash && stashMessage) {
      popStash(stashMessage);
    }

    showSummary();
  } catch (error) {
    logError(`Fresh start failed: ${error.message}`);
    log(
      '\nYou may need to manually resolve the issue and try again.',
      'yellow',
    );
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\nFresh start interrupted by user.', 'yellow');
  process.exit(0);
});

main();
