"use node";

import { createHash } from "node:crypto";
import { CALLBACK_SCRIPT } from "./callbackScript";

/** Short hash uploaded to the sandbox so prewarm can detect stale daemon code. */
export const CALLBACK_SCRIPT_FINGERPRINT = createHash("sha256")
  .update(CALLBACK_SCRIPT)
  .digest("hex")
  .slice(0, 16);
