#!/usr/bin/env node
/* eslint-disable no-undef */

/**
 * Setup/Onboarding Script
 * 
 * This script handles the initial project setup and onboarding process.
 * It should be run ONCE during initial project setup, NOT on every deploy or server start.
 * 
 * Usage: npm run onboard
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETUP_FLAG_FILE = '.onboarding-complete';
const setupFlagPath = path.join(__dirname, SETUP_FLAG_FILE);
const envPath = path.join(__dirname, '.env');

console.log('\n🛍️  React Shop - Initial Setup & Onboarding\n');
console.log('━'.repeat(60));
console.log('\nThis script will guide you through the initial project setup.');
console.log('It configures Firebase, creates admin users, and deploys rules.\n');
console.log('━'.repeat(60));

// Check if setup has already been completed
if (fs.existsSync(setupFlagPath)) {
  console.log('\n✅ Setup already completed!');
  console.log('\n📅 Completed at:', fs.readFileSync(setupFlagPath, 'utf8'));
  console.log('\nIf you need to run onboarding again:');
  console.log(`   1. Delete the ${SETUP_FLAG_FILE} file`);
  console.log('   2. Run: npm run onboard\n');
  console.log('⚠️  Warning: Re-running setup may overwrite existing configuration!\n');
  process.exit(0);
}

// Check current environment
const envExists = fs.existsSync(envPath);

console.log('\n📋 Pre-flight Check:\n');
if (envExists) {
  console.log('   ✅ .env file found');
} else {
  console.log('   ⚠️  No .env file detected (will be created during setup)');
}

console.log('\n🚀 Starting onboarding servers...\n');
console.log('━'.repeat(60));
console.log('\n📡 Starting services:\n');

// Start Express server for onboarding API
console.log('   1️⃣  Onboarding API server (port 3001)...');
const expressServer = spawn('npm', ['run', 'server'], {
  stdio: 'pipe',
  shell: true,
  cwd: __dirname
});

// Capture Express output
expressServer.stdout.on('data', (data) => {
  process.stdout.write(`   [API] ${data}`);
});

expressServer.stderr.on('data', (data) => {
  process.stderr.write(`   [API] ${data}`);
});

// Wait a moment, then start Vite
setTimeout(() => {
  console.log('   2️⃣  Vite dev server (port 5173)...\n');
  console.log('━'.repeat(60));
  console.log('\n💡 Open your browser to: http://localhost:5173/onboarding');
  console.log('   Follow the on-screen instructions to complete setup.\n');
  console.log('━'.repeat(60) + '\n');
  
  const viteServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  viteServer.on('error', (error) => {
    console.error('\n❌ Failed to start Vite dev server:', error);
    expressServer.kill();
    process.exit(1);
  });

  // Handle Ctrl+C to kill both processes
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down servers...');
    console.log('\n⚠️  Setup was interrupted and may not be complete.');
    console.log('   Run "npm run onboard" again to continue setup.\n');
    expressServer.kill();
    viteServer.kill();
    process.exit(0);
  });
}, 1500);

expressServer.on('error', (error) => {
  console.error('\n❌ Failed to start onboarding API server:', error);
  process.exit(1);
});

// Monitor for completion
console.log('💡 Tip: After completing onboarding in your browser,');
console.log('   the setup flag will be automatically created.\n');
