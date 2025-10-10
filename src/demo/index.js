// src/demo/index.js
/**
 * Demo Mode Entry Point
 * This file serves as the entry point for the demo feature.
 * If this folder is removed, the app will gracefully handle its absence.
 */

export { DemoProvider } from './DemoProvider.jsx';
export { default as DemoModeToggle } from './DemoModeToggle.jsx';
export { default as DemoEntry } from './DemoEntry.jsx';
export { useDemo } from './useDemo.js';

// Flag to indicate demo mode is available
export const DEMO_AVAILABLE = true;
