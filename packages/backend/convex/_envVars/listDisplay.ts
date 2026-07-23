/**
 * Non-secret env keys shown and stored in plaintext (toggles, not credentials).
 * Must not go through `"use node"` decrypt in isolate queries — store as plain
 * `vercel` (and legacy plaintext toggles) and return as-is from list.
 */
export const PLAINTEXT_ENV_VAR_KEYS: ReadonlySet<string> = new Set([
  "SANDBOX_PROVIDER",
]);

/** Masked bullet string shown for secret env var values in the UI. */
export const MASKED_ENV_VAR_VALUE = "••••••";

/** Whether this key should be stored/listed without encryption. */
export function isPlaintextEnvVarKey(key: string): boolean {
  return PLAINTEXT_ENV_VAR_KEYS.has(key);
}

/**
 * Value shown in env-var list queries. Plaintext keys are returned as stored
 * (new writes are unencrypted). Legacy `enc:` values for those keys stay masked
 * here — the toggle reveals once via the node action and re-saves as plaintext.
 */
export function envVarListDisplayValue(key: string, stored: string): string {
  if (isPlaintextEnvVarKey(key) && !stored.startsWith("enc:")) {
    return stored;
  }
  return MASKED_ENV_VAR_VALUE;
}
