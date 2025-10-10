# Demo Mode

A modular, removable feature that allows users to preview the application from different role perspectives without authentication.

## Overview

Demo Mode is completely self-contained within the `src/demo/` folder and can be removed entirely without breaking the main application. It provides a seamless way to demonstrate different user roles (Customer, Agent, Admin) to potential users or stakeholders.

## Usage

### Starting Demo Mode

Run the application with the demo flag:

```bash
npm run dev:demo
```

This sets the `VITE_DEMO_MODE=true` environment variable, which enables the demo feature.

### Without Demo Mode

Run the application normally:

```bash
npm run dev
```

Demo mode will not be available, and the app functions normally.

## Features

- **Role Switching**: Switch between Customer, Agent, and Admin roles
- **Entry Screen**: Beautiful modal for selecting initial demo role
- **Toggle Widget**: Floating button to switch roles or exit demo mode
- **Clean Exit**: Button disappears when exiting demo mode
- **Zero Impact**: When demo mode is disabled, no demo code runs

## Architecture

### File Structure

```
src/demo/
├── README.md              # This file
├── index.js              # Entry point, exports all demo features
├── DemoContext.js        # React context for demo state
├── DemoProvider.jsx      # Context provider component
├── useDemo.js            # Custom hook to access demo context
├── DemoEntry.jsx         # Initial role selection screen
└── DemoModeToggle.jsx    # Floating toggle widget
```

### How It Works

1. **Environment Variable**: `VITE_DEMO_MODE=true` enables demo mode
2. **Dynamic Import**: App.jsx dynamically imports demo module
3. **Conditional Rendering**: Demo components only render when enabled
4. **localStorage**: Selected role persists across page reloads
5. **AuthProvider Integration**: Demo role overrides actual user role

### Integration Points

**App.jsx** (lines 30-45):
```javascript
// Demo mode - conditionally imported
let DemoProvider = null;
let DemoModeToggle = null;
let DemoEntry = null;
let DEMO_AVAILABLE = false;

try {
  const demoModule = await import('./demo/index.js');
  DemoProvider = demoModule.DemoProvider;
  DemoModeToggle = demoModule.DemoModeToggle;
  DemoEntry = demoModule.DemoEntry;
  DEMO_AVAILABLE = demoModule.DEMO_AVAILABLE;
} catch {
  // Demo module not available - gracefully continue without it
  console.log('Demo mode is not available');
}
```

**AuthProvider.jsx** (demo role override):
```javascript
// DEMO MODE: Check if demo role is set in localStorage
const demoRole = localStorage.getItem('demoRole');
if (demoRole && ['customer', 'agent', 'admin'].includes(demoRole)) {
  role = demoRole;
}
```

## Removing Demo Mode

To completely remove demo mode from your application:

1. Delete the `src/demo/` folder
2. Remove the `dev:demo` script from `package.json`
3. The app will continue to work normally

The try-catch block in App.jsx ensures graceful handling:
- Import fails silently
- `DEMO_AVAILABLE` remains `false`
- No demo components render
- No errors thrown

## Future-Proof Design

### Graceful Degradation

If someone tries to run `npm run dev:demo` after demo is removed:

1. The script will run (environment variable set)
2. App.jsx import will fail silently
3. Application continues without demo features
4. Console logs: "Demo mode is not available"

### No Runtime Errors

- All demo imports are conditional
- All demo renders check `DEMO_AVAILABLE`
- Missing module doesn't crash the app
- TypeScript-ready (if migrating later)

## Development

### Adding New Roles

Edit `DemoEntry.jsx` and `DemoModeToggle.jsx` to add new roles to the `roles` array:

```javascript
{
  id: 'new-role',
  label: 'New Role',
  icon: IconComponent,
  color: '#hex-color',
  description: 'Role description'
}
```

### Customizing Appearance

Both `DemoEntry.jsx` and `DemoModeToggle.jsx` use inline styles for portability. Modify the style objects to customize appearance.

### Adding Features

1. Add new files to `src/demo/`
2. Export from `index.js`
3. Import conditionally in `App.jsx`
4. Check `DEMO_AVAILABLE` before using

## Notes

- **No Authentication Required**: Demo bypasses authentication
- **Read-Only Intent**: While you can make changes, they're not meant to persist
- **Performance**: Dynamic import slightly delays initial app load when demo is enabled
- **Security**: Demo mode should not be enabled in production builds

## Troubleshooting

### Demo button doesn't appear
- Ensure you ran `npm run dev:demo`
- Check console for "Demo mode is not available"
- Verify `VITE_DEMO_MODE` environment variable is set

### Role not changing
- Check localStorage has the role set
- Ensure AuthProvider reads from localStorage
- Clear browser cache and try again

### Can't exit demo mode
- Click "Exit Demo Mode" button in the panel
- Or click the same role button again
- Or clear localStorage manually

---

**Version**: 1.0.0  
**Last Updated**: January 2025
