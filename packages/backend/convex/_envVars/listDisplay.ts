import { decryptValue } from "../encryption";

/** Non-secret env keys returned in plaintext by list queries (for toggles). */
const PLAINTEXT_LIST_KEYS = new Set(["SANDBOX_PROVIDER"]);

/** Masked bullet string shown for secret env var values in the UI. */
export const MASKED_ENV_VAR_VALUE = "••••••";

export function envVarListDisplayValue(key: string, stored: string): string {
  if (PLAINTEXT_LIST_KEYS.has(key)) {
    return decryptValue(stored);
  }
  return MASKED_ENV_VAR_VALUE;
}
