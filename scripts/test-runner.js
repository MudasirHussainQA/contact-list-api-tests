#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'production';
const testType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'all';
const parallel = args.includes('--parallel');

console.log(`🚀 Starting test execution...`);
console.log(`📍 Environment: ${environment}`);
console.log(`🧪 Test Type: ${testType}`);
console.log(`⚡ Parallel: ${parallel ? 'Yes' : 'No'}`);

// Load environment configuration
const envFile = path.join(__dirname, '..', 'environments', `${environment}.env`);
if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
  console.log(`✅ Loaded ${environment} environment configuration`);
} else {
  console.log(`⚠️ Environment file not found: ${envFile}`);
}

// Build test command
let command = 'npx playwright test';

switch (testType) {
  case 'api':
    command += ' --project=api-tests';
    break;
  case 'ui':
    command += ' --project=ui-tests-chromium';
    break;
  case 'smoke':
    command += ' --grep="@smoke"';
    break;
  case 'all':
  default:
    // Run all tests
    break;
}

if (parallel) {
  command += ' --workers=4';
}

// Add CI-specific flags
if (process.env.CI) {
  command += ' --reporter=github';
}

console.log(`🎯 Executing: ${command}`);

try {
  execSync(command, { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Tests completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Tests failed!');
  process.exit(1);
}
