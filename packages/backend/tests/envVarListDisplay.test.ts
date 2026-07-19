import { expect, test } from "vitest";
import {
  MASKED_ENV_VAR_VALUE,
  envVarListDisplayValue,
  isPlaintextEnvVarKey,
} from "../convex/_envVars/listDisplay";

test("isPlaintextEnvVarKey treats SANDBOX_PROVIDER as plaintext", () => {
  expect(isPlaintextEnvVarKey("SANDBOX_PROVIDER")).toBe(true);
  expect(isPlaintextEnvVarKey("VERCEL_TOKEN")).toBe(false);
});

test("envVarListDisplayValue returns plaintext SANDBOX_PROVIDER as stored", () => {
  // Isolate list queries cannot decrypt node ciphertext; toggles must store
  // plain values so the UI does not always fall back to Daytona.
  expect(envVarListDisplayValue("SANDBOX_PROVIDER", "vercel")).toBe("vercel");
  expect(envVarListDisplayValue("SANDBOX_PROVIDER", "daytona")).toBe("daytona");
});

test("envVarListDisplayValue masks legacy encrypted SANDBOX_PROVIDER until heal", () => {
  expect(envVarListDisplayValue("SANDBOX_PROVIDER", "enc:legacy-blob")).toBe(
    MASKED_ENV_VAR_VALUE,
  );
});

test("envVarListDisplayValue always masks secret env values", () => {
  expect(envVarListDisplayValue("VERCEL_TOKEN", "plain-but-secret")).toBe(
    MASKED_ENV_VAR_VALUE,
  );
  expect(envVarListDisplayValue("DAYTONA_API_KEY", "enc:abc")).toBe(
    MASKED_ENV_VAR_VALUE,
  );
});
