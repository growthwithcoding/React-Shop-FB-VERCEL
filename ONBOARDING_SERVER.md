# Onboarding Server Setup

This document explains the Express backend server that enables automatic `.env` file creation during the onboarding process.

## Overview

The onboarding server provides a REST API endpoint that allows the React frontend to automatically create the `.env` file with Firebase credentials, eliminating the need for manual file creation.

## Files

- `server.js` - Express server with API endpoints
- `package.json` - Updated with new scripts and dependencies

## Installation

The required dependencies are already installed:
- `express` - Web framework
- `cors` - CORS middleware
- `fs-extra` - Enhanced file system operations

## Running the Server

You need to run both servers:

```bash
# Terminal 1 - Start the Vite dev server
npm run dev

# Terminal 2 - Start the onboarding server
npm run server
# or
npm start
```

Alternatively, use a single command to run both:
```bash
npm run dev:full
```

**Note:** After creating the .env file, the page automatically reloads to pick up the new environment variables - no manual restart needed!

## API Endpoints

### POST /api/create-env
Creates a `.env` file in the project root with the provided Firebase credentials.

**Request Body:**
```json
{
  "apiKey": "your-firebase-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "optional-sender-id",
  "appId": "your-app-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": ".env file created successfully",
  "path": "/absolute/path/to/.env",
  "shouldReload": true
}
```

**Note:** The frontend automatically reloads the page after receiving this response to load the new environment variables.

### GET /api/check-env
Checks if a `.env` file exists in the project root.

**Response:**
```json
{
  "exists": true,
  "path": "/absolute/path/to/.env"
}
```

### GET /api/health
Health check endpoint to verify the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Onboarding server is running"
}
```

## How It Works

1. User starts both servers (Vite dev server and onboarding server)
2. User navigates to the onboarding page at `/onboarding`
3. If Firebase credentials are missing, the credential check step displays a form
4. User enters their Firebase credentials
5. User clicks "🚀 Create .env File" button
6. React makes a POST request to `http://localhost:3001/api/create-env`
7. Server creates the `.env` file in the project root
8. **Page automatically reloads** to pick up new environment variables
9. Validation runs automatically and proceeds if successful
10. Application is now ready to use with Firebase credentials loaded

## Frontend Integration

The React component (`src/pages/Onboarding.jsx`) includes the `handleCreateEnvFile` function:

```javascript
const handleCreateEnvFile = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/create-env', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: configData.apiKey,
        authDomain: configData.authDomain,
        projectId: configData.projectId,
        storageBucket: configData.storageBucket,
        messagingSenderId: configData.messagingSenderId,
        appId: configData.appId,
      }),
    });

    const result = await response.json();
    // Handle response...
  } catch (error) {
    // Handle error...
  }
};
```

## User Experience

The onboarding flow now offers three options for creating the `.env` file:

1. **🚀 Create .env File** - Automatically creates the file via the API and reloads the page (RECOMMENDED)
2. **📥 Download .env** - Downloads the file to the user's downloads folder
3. **📋 Copy to Clipboard** - Copies the content for manual creation

**Key Benefits:**
- ✅ No manual file creation needed
- ✅ Automatic page reload to load new environment variables
- ✅ Immediate feedback and validation
- ✅ Seamless onboarding experience

## Security Considerations

- The server runs locally on `localhost:3001` and is not exposed to the internet
- CORS is enabled for the Vite dev server on port 5173
- The server should only be used during initial setup and can be stopped afterward
- Consider adding the server to `.gitignore` if deploying to production

## Troubleshooting

**Server not running error:**
- Make sure you've started the server with `npm run server` or `npm run dev:full`
- Check that port 3001 is not already in use
- Verify the server is accessible at `http://localhost:3001/api/health`

**File not created:**
- Check server logs for error messages
- Verify write permissions in the project directory
- Ensure all required Firebase credentials are provided

**CORS errors:**
- Ensure the Vite dev server is running on port 5173
- Check that CORS middleware is properly configured in `server.js`

## Development Notes

- The server uses ES modules (`type: "module"` in package.json)
- File operations use `fs-extra` for better error handling
- The generated `.env` file includes timestamps and comments
- Empty messagingSenderId values are handled gracefully
- Frontend automatically reloads after .env creation using `window.location.reload()`
- Page reload ensures Vite picks up new environment variables without manual restart

## Server Architecture

### Process Management
Two independent processes run simultaneously:
1. **Express Server** (port 3001) - Handles API requests for .env file creation
2. **Vite Dev Server** (port 5173) - Serves the React application

### Automatic Reload Flow
When `.env` is created:
1. Express server writes the .env file to disk
2. Server responds to frontend with success message
3. Frontend displays success alert (2 second countdown)
4. Frontend automatically reloads the page using `window.location.reload()`
5. Vite picks up the new environment variables on page reload
6. Application is ready with new configuration

## Future Enhancements

Possible improvements:
- Add validation for Firebase credentials before file creation
- Support for environment-specific configurations
- Backup existing `.env` files before overwriting
- Integration with Firebase Admin SDK for credential validation
- Replace alert with a more elegant UI notification
- Add progress indicator during page reload
