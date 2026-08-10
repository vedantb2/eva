/**
 * Signals that the caller has no usable GitHub authorization on file.
 *
 * Lives in its own module so the web app can match on it without importing the
 * `"use node"` token code that throws it.
 */
export const GITHUB_AUTH_REQUIRED = "GitHub authorization required";
