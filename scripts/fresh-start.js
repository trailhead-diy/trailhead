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
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
    return true;
  } else {
    logWarning('No changes to stash or stash failed');
    return false;
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
    }

    // Confirmation
    const confirmed = await askConfirmation(
      '\nThis will:\n' +
        '• Stash any uncommitted changes\n' +
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

    if (hasUncommittedChanges) {
      stashChanges();
    } else {
      logInfo('No uncommitted changes to stash');
    }

    resetToMain();
    cleanDependencies();
    freshInstall();
    buildPackages();
    validateEnvironment();
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
