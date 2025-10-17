#!/usr/bin/env node
/* eslint-disable no-undef */

/**
 * Setup Verification Script
 * 
 * This script checks if initial project setup has been completed.
 * It can be run manually or as part of CI/CD pipelines to verify configuration.
 * 
 * Usage: npm run verify-setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETUP_FLAG_FILE = '.onboarding-complete';
const setupFlagPath = path.join(__dirname, SETUP_FLAG_FILE);
const envPath = path.join(__dirname, '.env');
const firebaseAdminPath = path.join(__dirname, 'firebase-admin.json');

console.log('\n🔍 React Shop - Setup Verification\n');
console.log('━'.repeat(60));

let allChecks = true;
let warnings = [];

// Check 1: Setup flag file
console.log('\n📋 Checking setup completion...\n');
if (fs.existsSync(setupFlagPath)) {
  const completedAt = fs.readFileSync(setupFlagPath, 'utf8');
  console.log('   ✅ Setup completed at:', completedAt);
} else {
  console.log('   ❌ Setup NOT completed');
  console.log('      Run: npm run onboard');
  allChecks = false;
}

// Check 2: .env file
console.log('\n📄 Checking .env configuration...\n');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file exists');
  
  // Read and validate env variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredVars.filter(v => !envContent.includes(v));
  
  if (missingVars.length > 0) {
    console.log('   ⚠️  Missing variables:', missingVars.join(', '));
    warnings.push('Some required environment variables may be missing');
  } else {
    console.log('   ✅ All required Firebase variables present');
  }
} else {
  console.log('   ❌ .env file NOT found');
  console.log('      Run: npm run onboard');
  allChecks = false;
}

// Check 3: Firebase Admin credentials (optional but recommended)
console.log('\n🔑 Checking Firebase Admin credentials...\n');
if (fs.existsSync(firebaseAdminPath)) {
  console.log('   ✅ firebase-admin.json exists');
} else {
  console.log('   ⚠️  firebase-admin.json NOT found');
  console.log('      (Optional: needed for admin features like rules deployment)');
  warnings.push('Firebase Admin SDK not configured');
}

// Check 4: Verify .gitignore includes sensitive files
console.log('\n🔒 Checking .gitignore...\n');
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const sensitiveFiles = ['.env', 'firebase-admin.json'];
  const missingFromGitignore = sensitiveFiles.filter(f => !gitignoreContent.includes(f));
  
  if (missingFromGitignore.length > 0) {
    console.log('   ⚠️  Sensitive files not in .gitignore:', missingFromGitignore.join(', '));
    warnings.push('Add sensitive files to .gitignore');
  } else {
    console.log('   ✅ Sensitive files properly ignored');
  }
} else {
  console.log('   ⚠️  .gitignore not found');
  warnings.push('Create .gitignore file');
}

// Summary
console.log('\n━'.repeat(60));
console.log('\n📊 Summary:\n');

if (allChecks && warnings.length === 0) {
  console.log('   🎉 All checks passed! Your project is ready for development.\n');
  console.log('   Next steps:');
  console.log('      • Run: npm run dev (start dev server)');
  console.log('      • Run: npm run build (build for production)');
  console.log('      • Deploy to Vercel/GitHub Actions\n');
  process.exit(0);
} else if (allChecks && warnings.length > 0) {
  console.log('   ✅ Setup is complete, but with warnings:\n');
  warnings.forEach(w => console.log(`      ⚠️  ${w}`));
  console.log('\n   You can proceed with development, but consider addressing warnings.\n');
  process.exit(0);
} else {
  console.log('   ❌ Setup is incomplete. Please run:\n');
  console.log('      npm run onboard\n');
  console.log('   This will guide you through the initial project setup.\n');
  process.exit(1);
}
