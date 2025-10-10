# Demo Mode Usage Guide

## Overview
The demo mode has been enhanced to support direct role selection via URL parameters, bypassing the role selection screen while using your real user account created during onboarding.

## Quick Start Scripts

Use these npm commands to launch the application with a specific role view:

```bash
# Launch as Customer
npm run dev:customer

# Launch as Agent  
npm run dev:agent

# Launch as Admin
npm run dev:admin
```

## How It Works


1. **localStorage Storage**: The role is stored in localStorage as `demoRole`
2. **Role Override**: AuthProvider checks for `demoRole` and overrides your account's actual role with the demo role
3. **Real Account**: You're still using your real authenticated user account from onboarding - only the VIEW changes

## Features

- ✅ Bypasses the demo role selection screen
- ✅ Uses your real user account (email, displayName, uid)
- ✅ Only changes the displayed role/permissions
- ✅ All data interactions use your real account
- ✅ Can switch roles on-the-fly using the demo mode toggle

## Switching Roles

- Use the floating demo mode button to switch between roles
- Or use the appropriate npm script to relaunch with a different role
- Role changes require a page reload to take effect
