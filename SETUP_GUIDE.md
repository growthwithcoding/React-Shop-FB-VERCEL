# Setup Guide

This guide covers the initial setup process for the React Shop application.

## Overview

The onboarding process has been designed to run **only during initial project setup**, not during normal development or deployment. This ensures compatibility with modern CI/CD pipelines like GitHub Actions and Vercel.

## Prerequisites

Before you begin, ensure you have:

- Node.js (v16 or later)
- npm or yarn
- A Firebase project with Firestore enabled
- Firebase Admin SDK credentials (service account JSON)

## Initial Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Run Onboarding

This is a **one-time setup** that configures your Firebase credentials and creates the initial admin user:

```bash
npm run onboard
```

This command will:
1. Check if setup has already been completed
2. Start the onboarding API server (port 3001)
3. Start the Vite dev server (port 5173)
4. Open a browser to guide you through the setup wizard

### Step 3: Complete the Setup Wizard

The onboarding wizard will guide you through:

1. **Firebase Configuration**: Enter your Firebase project credentials
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - App ID
   - (Optional) Messaging Sender ID

2. **Firebase Admin SDK**: Upload or paste your service account JSON

3. **Deploy Firestore Rules**: Automatically deploy security rules to your Firebase project

4. **Create Admin User**: Set up the initial admin account
   - Email
   - Password
   - First Name
   - Last Name

5. **Store Settings**: Configure basic store information (optional, can be changed later)

### Step 4: Verify Setup

After completing the wizard, verify your setup:

```bash
npm run verify-setup
```

This will check:
- ✅ Setup completion flag
- ✅ .env file configuration
- ✅ Firebase Admin credentials
- ✅ .gitignore configuration

## Development Workflow

After initial setup is complete, use these commands for development:

### Start Development Server

```bash
npm run dev
```

This starts only the Vite dev server on port 5173. The onboarding server is NOT started.

### Start Both Servers (if needed)

If you need the Express server for some reason:

```bash
npm run dev:full
```

### Build for Production

```bash
npm run build
```

## Deployment

### Vercel Deployment

The application is configured for Vercel deployment. Onboarding will NOT run during Vercel builds or serverless function starts.

**Required Vercel Environment Variables:**

Add these in your Vercel project settings:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id (optional)
```

### GitHub Actions

The application works seamlessly with GitHub Actions. No onboarding logic will execute during CI/CD runs.

Example workflow:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      # Deploy step...
```

## Re-running Setup

If you need to run the onboarding process again:

1. Delete the setup flag file:
   ```bash
   rm .onboarding-complete
   ```

2. Run onboarding again:
   ```bash
   npm run onboard
   ```

⚠️ **Warning**: Re-running setup may overwrite existing configuration!

## Troubleshooting

### "Setup may not be complete" warning

If you see this warning in the browser console:
```
⚠️  Setup may not be complete. Run: npm run onboard
```

This means the `.onboarding-complete` flag file is missing. Run `npm run onboard` to complete setup.

### Firebase initialization errors

If Firebase fails to initialize:
1. Check that your `.env` file exists and contains all required variables
2. Verify your Firebase credentials are correct
3. Ensure your Firebase project is properly configured

### Firestore rules deployment fails

If rules deployment fails:
1. Verify `firebase-admin.json` exists and is valid
2. Check that the service account has proper permissions
3. Ensure Firestore is enabled in your Firebase project

## Files Created During Setup

The onboarding process creates these files:

- `.env` - Firebase configuration (gitignored)
- `firebase-admin.json` - Admin SDK credentials (gitignored)
- `.onboarding-complete` - Setup completion flag (gitignored)

All sensitive files are automatically added to `.gitignore` and should never be committed to version control.

## Security Notes

- Never commit `.env` or `firebase-admin.json` to version control
- The `.onboarding-complete` flag prevents accidental re-runs
- Firebase Admin credentials should have minimal required permissions
- Use Vercel environment variables for production deployment

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

If you encounter issues during setup, please:
1. Check the console logs for detailed error messages
2. Verify all prerequisites are met
3. Review the troubleshooting section above
4. Check the GitHub repository for known issues
