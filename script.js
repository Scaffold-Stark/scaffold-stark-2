const { execSync } = require('child_process');

// Capture command line arguments
const args = process.argv.slice(2);
const noReset = args.includes('--no-reset');

if (noReset) {
  console.log('Deploying without reset...');
  execSync('yarn deploy:normal', { stdio: 'inherit' });
} else {
  console.log('Deploying with reset...');
  execSync('yarn deploy:reset', { stdio: 'inherit' });
}