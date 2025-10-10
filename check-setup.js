#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

console.log('\n🛍️  Advanced Shop - Auto Setup\n');
console.log('━'.repeat(50));

if (envExists) {
  console.log('✅ .env file found!');
  console.log('\n🚀 Starting Vite dev server...\n');
  console.log('━'.repeat(50) + '\n');
  
  // Start only Vite
  const vite = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  vite.on('error', (error) => {
    console.error('❌ Failed to start Vite:', error);
    // eslint-disable-next-line no-undef
    process.exit(1);
  });

} else {
  console.log('⚠️  No .env file detected!');
  console.log('\n🚀 Starting both servers for first-time setup...\n');
  console.log('━'.repeat(50));
  console.log('\n📋 Starting services:\n');
  
  // Start Express server
  console.log('   1️⃣  Express onboarding server (port 3001)...');
  const expressServer = spawn('npm', ['run', 'server'], {
    stdio: 'pipe',
    shell: true,
    cwd: __dirname
  });

  // Capture Express output
  expressServer.stdout.on('data', (data) => {
    // eslint-disable-next-line no-undef
    process.stdout.write(`   [Express] ${data}`);
  });

  expressServer.stderr.on('data', (data) => {
    // eslint-disable-next-line no-undef
    process.stderr.write(`   [Express] ${data}`);
  });

  // Wait a moment, then start Vite
  setTimeout(() => {
    console.log('   2️⃣  Vite dev server (port 5173)...\n');
    console.log('━'.repeat(50) + '\n');
    
    const viteServer = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });

    viteServer.on('error', (error) => {
      console.error('\n❌ Failed to start Vite:', error);
      expressServer.kill();
      // eslint-disable-next-line no-undef
      process.exit(1);
    });

    // Handle Ctrl+C to kill both processes
    // eslint-disable-next-line no-undef
    process.on('SIGINT', () => {
      console.log('\n\n👋 Shutting down servers...');
      expressServer.kill();
      viteServer.kill();
      // eslint-disable-next-line no-undef
      process.exit(0);
    });
  }, 1500);

  expressServer.on('error', (error) => {
    console.error('\n❌ Failed to start Express:', error);
    // eslint-disable-next-line no-undef
    process.exit(1);
  });
}
