# 🚀 Onboarding System Documentation

## Overview

The Advanced Shop e-commerce platform now includes a first-run onboarding wizard that guides users through initial setup, similar to WordPress's famous 5-minute installation. This system ensures that new installations are properly configured before allowing access to the main application.

## Features

### ✨ What the Onboarding System Does

1. **Automatic Detection** - Checks if the app has been set up on every launch
2. **Admin Account Creation** - Creates the initial admin user (similar to WordPress)
3. **Store Configuration** - Sets up basic store information and settings
4. **Database Seeding** - Provides instructions for populating the database with sample products
5. **Security** - Ensures only authorized setup can occur via Firestore security rules

## Architecture

### Components

#### 1. Onboarding Service (`src/services/onboardingService.js`)

Core service that manages the onboarding state and operations:

- `isOnboardingComplete()` - Checks if setup has been completed
- `markOnboardingComplete()` - Marks onboarding as finished
- `createAdminUser()` - Creates the initial admin account
- `initializeStoreSettings()` - Sets up default store configuration
- `getOnboardingStatus()` - Returns detailed status of setup progress

#### 2. Onboarding Page (`src/pages/Onboarding.jsx`)

Multi-step wizard interface with the following steps:

**Step 1: Welcome**
- Overview of what will be set up
- Introduction to the setup process

**Step 2: Admin Account**
- Create the first admin user
- Email and password (min 6 characters)
- Name fields for personalization

**Step 3: Store Settings**
- Store name and support email
- Optional logo URL
- Optional support phone number
- Default settings for payments, shipping, taxes, and hours

**Step 4: Database Seeding**
- Instructions for running the store-seeder utility
- Option to skip and seed later
- References the existing `store-seeder` directory

**Step 5: Completion**
- Success message
- Next steps guidance
- Redirects to the main application

#### 3. App Integration (`src/App.jsx`)

The main app now includes:

- Onboarding status check on mount
- Loading screen while checking status
- Automatic redirect to `/onboarding` if setup is needed
- Normal app flow once onboarding is complete

## Database Schema

### System Collection

The onboarding system uses a `system` collection in Firestore:

```
system/
  setup/
    completed: boolean
    completedAt: string (ISO date)
    version: string
  settings/
    store: {...}
    payments: {...}
    shipping: {...}
    taxes: {...}
```

### User Document

The initial admin user is created with:

```
users/{uid}/
  firstName: string
  lastName: string
  email: string
  role: "admin"
  createdAt: string (ISO date)
  isInitialAdmin: true
```

## Security Rules

The Firestore security rules have been updated to allow onboarding:

```javascript
// Allow system collection access for onboarding
match /system/{docId} {
  allow read: if true;
  // Allow write during onboarding (when setup doesn't exist) or by admins
  allow create, update: if callerIsAdmin() || !exists(/databases/$(database)/documents/system/setup);
  allow delete: if callerIsAdmin();
}

// Allow initial admin user creation during onboarding
match /users/{uid} {
  allow create: if (isOwner(uid) && (!('role' in request.resource.data) || request.resource.data.role == 'customer'))
    || callerIsAdmin()
    || (isOwner(uid) && request.resource.data.role == 'admin' && !exists(/databases/$(database)/documents/system/setup));
}
```

This ensures that:
- Anyone can read the setup status
- Only unauthenticated users (during first run) or admins can create/update system docs
- Once setup is complete, only admins can modify system settings
- The first admin user can be created without existing admin permissions

## Installation Flow

### For New Installations

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd advanced-shop-FB-Edition
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Set up your Firebase project
   - Update `src/lib/firebase.js` with your credentials
   - Deploy Firestore security rules: `firebase deploy --only firestore:rules`

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Complete onboarding**
   - Open the app in your browser
   - You'll automatically be redirected to `/onboarding`
   - Follow the 5-step wizard to complete setup

6. **Optional: Seed the database**
   ```bash
   cd store-seeder
   npm install
   # Configure firebase-admin.json (see store-seeder/README.md)
   node seed-store.mjs
   ```

## Workflow

### First-Time Setup

```
User visits app
    ↓
App checks onboarding status
    ↓
No admin found / setup incomplete
    ↓
Redirect to /onboarding
    ↓
User completes wizard:
  - Creates admin account
  - Configures store
  - Gets seeding instructions
    ↓
Setup marked complete
    ↓
Redirect to main app
    ↓
User logs in with admin credentials
```

### Subsequent Visits

```
User visits app
    ↓
App checks onboarding status
    ↓
Setup complete
    ↓
Load normal app
    ↓
User logs in normally
```

## Default Settings

The onboarding wizard applies these defaults (can be changed in Admin Settings):

### Store Settings
- Support hours: Mon-Fri 9AM-5PM, Sat-Sun closed
- Logo: Empty (user can add later)
- Phone: Empty (user can add later)

### Payment Settings
- Credit cards: Enabled
- Cash on delivery: Disabled
- Accepted methods: Card, PayPal, Apple Pay, Google Pay
- Stripe: Not connected (requires configuration)

### Shipping Settings
- Base rate: $5.00
- Free shipping threshold: $50.00

### Tax Settings
- Default rate: 7.5%
- Origin state: UT

## Customization

### Modifying Default Settings

Edit `src/services/onboardingService.js` in the `initializeStoreSettings()` function:

```javascript
const defaultSettings = {
  store: {
    name: settings.storeName || "My Store",
    // ... customize defaults here
  },
  payments: {
    // ... customize defaults here
  },
  // ... etc
};
```

### Adding Onboarding Steps

To add a new step to the wizard:

1. Create a new step component in `src/pages/Onboarding.jsx`
2. Add it to the `steps` array in the main component
3. Add routing logic in the main component's render method

### Skipping Onboarding (Development Only)

⚠️ **Not recommended for production**

To bypass onboarding during development:

1. Manually create an admin user in Firebase Console
2. Create the setup document in Firestore:
   ```
   Collection: system
   Document: setup
   Fields:
     completed: true
     completedAt: <current ISO date>
     version: "1.0.0"
   ```

## Troubleshooting

### Onboarding Loop

If you're stuck in an onboarding loop:

1. Check Firebase Console → Firestore
2. Verify `system/setup` document exists with `completed: true`
3. Verify at least one user with `role: "admin"` exists in `users` collection

### Permission Denied Errors

If you get permission errors during onboarding:

1. Ensure Firestore rules are deployed: `firebase deploy --only firestore:rules`
2. Check that rules allow anonymous access to `system` collection
3. Verify rules allow admin user creation when setup doc doesn't exist

### Admin Account Not Working

If the admin account doesn't work after creation:

1. Check Firebase Console → Authentication for the user
2. Verify the user document in Firestore has `role: "admin"`
3. Try logging out and back in

### Database Seeding Issues

For seeding problems, see `store-seeder/README.md`:

1. Ensure `firebase-admin.json` is configured correctly
2. Run `npm install` in the `store-seeder` directory
3. Check that your service account has proper permissions

## Production Considerations

### Security

- ✅ Onboarding automatically disables after first run
- ✅ Security rules prevent unauthorized access
- ✅ Admin passwords must be 6+ characters
- ⚠️ Consider requiring stronger passwords in production
- ⚠️ Consider adding email verification

### Monitoring

Monitor these Firestore documents:

- `system/setup` - Ensures setup is marked complete
- First user in `users` collection - Verify initial admin

### Backup

Before deploying to production:

1. Test the onboarding flow thoroughly
2. Document your admin credentials securely
3. Have a recovery plan if onboarding data is corrupted

## Future Enhancements

Potential improvements to consider:

- [ ] Email verification for admin account
- [ ] Password strength meter
- [ ] Multi-language support
- [ ] Custom branding upload during setup
- [ ] Automated database seeding from the UI
- [ ] Setup wizard progress persistence (resume partially completed setup)
- [ ] Export/import configuration for multiple deployments
- [ ] Integration with external services (Stripe, Mailchimp, etc.)

## Support

For issues related to onboarding:

1. Check this documentation first
2. Review `store-seeder/README.md` for seeding issues
3. Check Firebase Console for data integrity
4. Review browser console for error messages

## Related Documentation

- [Store Seeder Documentation](store-seeder/README.md) - Database seeding guide
- [Admin Settings](src/pages/AdminSettings.jsx) - Post-setup configuration
- [Firebase Security Rules](firestore.rules) - Access control documentation

---

**Version:** 1.0.0  
**Last Updated:** January 2025
