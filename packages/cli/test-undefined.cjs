const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a test file
const testFile = path.join(__dirname, 'test-empty.txt');
fs.writeFileSync(testFile, '');

console.log('Testing with empty file...');
try {
  const result = execSync(`npx tsx "${path.join(__dirname, 'advanced-cli.ts')}" process "${testFile}"`, {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('Output:', result);
} catch (e) {
  console.log('Error:', e.message);
  console.log('Stdout:', e.stdout);
  console.log('Stderr:', e.stderr);
}

// Cleanup
fs.unlinkSync(testFile);
