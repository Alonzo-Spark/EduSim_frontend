/**
 * TEMP DEV AUTH BYPASS
 *
 * This module temporarily disables the login/signup flow for faster RAG development
 * and testing. ALL authentication code remains intact and functional.
 *
 * To re-enable auth:
 *   1. Set DEV_BYPASS_AUTH = false
 *   2. Rebuild the app
 *
 * NO auth files or logic were deleted or modified.
 */

// TEMP DEV AUTH BYPASS - Toggle this flag to enable/disable the bypass
export const DEV_BYPASS_AUTH = true;

/**
 * Mock development user for bypass mode
 */
export const DEV_USER = {
  id: "dev-user-temporary-bypass",
  email: "dev@edusim.local",
  user_metadata: {
    name: "Dev User",
  },
  app_metadata: {
    role: "student",
  },
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

/**
 * Check if auth bypass is active
 */
export function isAuthBypassActive(): boolean {
  return DEV_BYPASS_AUTH === true;
}
