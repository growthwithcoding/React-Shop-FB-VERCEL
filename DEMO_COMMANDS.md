# Demo Mode Commands

This document describes the demo mode commands available for testing different user roles.

## Commands

### Basic Demo Mode (Role Selection)
```bash
npm run dev:demo
```
- Starts the application in demo mode
- **Always shows the role selection screen** when starting
- Clears any previously selected role from localStorage
- Use this for general demo testing where you want to choose a role each time

### Specific Role Commands
```bash
npm run dev:demo:customer
npm run dev:demo:agent
npm run dev:demo:admin
```
- Starts the application directly in the specified role
- Skips the role selection screen
- Useful for focused testing of specific user perspectives

## Behavior

### On Restart
- When you restart the server with `npm run dev:demo`, it **always returns to the role selection screen**
- This ensures a clean state for each demo session
- Previous role selections are automatically cleared

### Role Persistence
- Specific role commands (`dev:demo:customer`, etc.) set the role directly via environment variables
- The role persists during that session until the server is restarted
- Switching between different specific role commands will change the role appropriately

## Examples

```bash
# Start with role selection
npm run dev:demo

# Test customer experience
npm run dev:demo:customer

# Test agent dashboard
npm run dev:demo:agent

# Test admin panel
npm run dev:demo:admin

# Return to role selection (after stopping the server)
npm run dev:demo
```

## Technical Details

- Uses `VITE_DEMO_MODE=true` environment variable to enable demo mode
- Uses `VITE_DEMO_ROLE` environment variable to set specific roles
- Role data is stored in browser localStorage during a session
- localStorage is automatically cleared when restarting with base `dev:demo` command
