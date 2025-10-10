/**
 * Advanced Shop - Version Information
 * Version 1.0.0 - Initial Production Release
 * 
 * This file contains version metadata for the application.
 * Last Updated: January 2025
 */

export const APP_VERSION = '1.0.0';
export const APP_BUILD = '1';
export const APP_NAME = 'Advanced Shop';
export const RELEASE_DATE = '2025-01-09';
export const RELEASE_TYPE = 'Production';

/**
 * Get full version string
 * @returns {string} Formatted version string
 */
export function getVersionString() {
  return `${APP_NAME} v${APP_VERSION} (Build ${APP_BUILD})`;
}

/**
 * Get version info object
 * @returns {object} Complete version information
 */
export function getVersionInfo() {
  return {
    name: APP_NAME,
    version: APP_VERSION,
    build: APP_BUILD,
    releaseDate: RELEASE_DATE,
    releaseType: RELEASE_TYPE,
  };
}

/**
 * Check if running a specific version
 * @param {string} version - Version to check against
 * @returns {boolean}
 */
export function isVersion(version) {
  return APP_VERSION === version;
}

/**
 * Get version from environment variables (if available)
 * Falls back to constants if env vars not set
 * @returns {string}
 */
export function getEnvVersion() {
  return import.meta.env.VITE_APP_VERSION || APP_VERSION;
}

/**
 * Get build number from environment variables (if available)
 * Falls back to constants if env vars not set
 * @returns {string}
 */
export function getEnvBuild() {
  return import.meta.env.VITE_APP_BUILD || APP_BUILD;
}
