# Encrypt Repo Environment Variables at Rest

## Context

Environment variables for sandboxes are stored as plaintext in Convex (`repoEnvVars` table). This means anyone with Convex dashboard access, data exports, or even the public `list` query can see raw secret values. The `list` query currently sends real values to the client and masking is done client-side only (cosmetic).

## Goal

Encrypt env var values at rest using AES-256-GCM. Values are encrypted before storage and only decrypted in Node.js actions when injecting into sandboxes. The `list` query never exposes real or encrypted values — it returns a fixed mask server-side.

## Prerequisites

Set a 32-byte encryption key as a Convex environment variable:

```bash
# Generate a random 64-char hex string (32 bytes)
openssl rand -hex 32

# Set it in Convex
npx convex env set ENCRYPTION_KEY <64-char-hex-string>
```

## Encryption Format

- Algorithm: AES-256-GCM
- IV: 12 bytes random
- Auth tag: 16 bytes
- Stored format: `enc:<base64(iv + ciphertext + authTag)>`
- Values without the `enc:` prefix are treated as plaintext (backward compatible with existing data that hasn't been re-saved yet)

## Part 1: Encryption Utility

**New file:** `packages/backend/convex/encryption.ts`

Plain utility file (not a Convex function file, no `"use node"` — gets bundled with whatever `"use node"` file imports it).

```
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

Constants: ALGORITHM = "aes-256-gcm", IV_LENGTH = 12, TAG_LENGTH = 16, PREFIX = "enc:"

getKey(): Buffer
  - Reads process.env.ENCRYPTION_KEY (hex-encoded 32 bytes)
  - Throws descriptive error if missing or wrong length

encryptValue(plaintext: string): string
  - Generates random IV
  - Encrypts with AES-256-GCM
  - Returns PREFIX + base64(iv + ciphertext + tag)

decryptValue(stored: string): string
  - If value doesn't start with PREFIX, returns as-is (backward compat with plaintext)
  - Decodes base64, splits iv/ciphertext/tag, decrypts
```

## Part 2: Backend Changes

### 2a. `packages/backend/convex/repoEnvVars.ts`

**Modify `list` query:**

- Instead of returning `doc.vars` directly, map to `{ key: v.key, value: "••••••" }` for each var
- Never sends real or encrypted values to the client

**Add `upsertVarInternal` internalMutation:**

- Same logic as current `upsertVar` but internal (not publicly callable)
- Accepts pre-encrypted value
- Auth is handled by the calling action

**Remove `upsertVar` mutation:**

- Replaced by action in new file (Part 2b)

**`getForSandbox` internalQuery — unchanged:**

- Returns encrypted values from DB as-is
- Callers (all in Node.js actions) handle decryption

**`removeVar` mutation — unchanged**

### 2b. New file: `packages/backend/convex/repoEnvVarsActions.ts`

```
"use node";
```

**`upsertVar` action:**

- Args: `{ repoId: v.id("githubRepos"), key: v.string(), value: v.string() }`
- Auth: `ctx.auth.getUserIdentity()` — throw if null
- Encrypt value with `encryptValue()` from `./encryption`
- Call `ctx.runMutation(internal.repoEnvVars.upsertVarInternal, { repoId, key, value: encrypted })`
- Returns null

## Part 3: Decrypt in Sandbox Injection

**File:** `packages/backend/convex/daytona.ts` (already `"use node"`)

Import `decryptValue` from `./encryption`.

There are 3 places where `getForSandbox` results are consumed (lines ~469, ~703, ~804). Each follows the same pattern:

```typescript
const vars = await ctx.runQuery(internal.repoEnvVars.getForSandbox, {
  repoId: args.repoId,
});
for (const v of vars) {
  repoEnvVars[v.key] = v.value; // ← currently plaintext
}
```

Change to:

```typescript
const vars = await ctx.runQuery(internal.repoEnvVars.getForSandbox, {
  repoId: args.repoId,
});
for (const v of vars) {
  repoEnvVars[v.key] = decryptValue(v.value);
}
```

`decryptValue` handles both encrypted (`enc:...`) and legacy plaintext values, so this is backward compatible.

## Part 4: Frontend Changes

**File:** `apps/web/app/(main)/[repo]/admin/env-variables/EnvVariablesClient.tsx`

1. **Change `useMutation` to `useAction`** for upsert:
   - `import { useAction } from "convex/react"` (add to existing import)
   - `const upsertVar = useAction(api.repoEnvVarsActions.upsertVar)`
   - Calling code stays the same (`await upsertVar({ repoId, key, value })`)

2. **Remove `maskValue` function** — server returns pre-masked values now

3. **Remove Copy button** — we no longer have access to real values on the client. Remove the `IconCopy` import and the copy button JSX from the actions column.

4. **Display `v.value` directly** — it's already `"••••••"` from the server

5. **Remove `startEdit` `currentValue` param** — the value passed is just the mask, not the real value. The edit field should always start empty with placeholder "Enter new value".

## File Summary

**New files (2):**

1. `packages/backend/convex/encryption.ts` — AES-256-GCM encrypt/decrypt helpers
2. `packages/backend/convex/repoEnvVarsActions.ts` — `"use node"` action for upsertVar

**Modified files (3):**

1. `packages/backend/convex/repoEnvVars.ts` — server-side masking in `list`, add `upsertVarInternal`, remove public `upsertVar`
2. `packages/backend/convex/daytona.ts` — decrypt values after fetching from `getForSandbox`
3. `apps/web/app/(main)/[repo]/admin/env-variables/EnvVariablesClient.tsx` — `useAction`, remove copy button, remove client masking

## Implementation Order

1. Create `encryption.ts` utility
2. Add `upsertVarInternal` to `repoEnvVars.ts`, modify `list` to return masked values, remove public `upsertVar`
3. Create `repoEnvVarsActions.ts` with the encrypted `upsertVar` action
4. Update `daytona.ts` to decrypt values
5. Update `EnvVariablesClient.tsx` frontend

## Backward Compatibility

- Existing plaintext values will still work: `decryptValue()` returns non-prefixed values as-is
- Once a user edits/re-saves a variable through the UI, it gets encrypted
- No migration needed — values encrypt naturally as users update them

## Verification

1. `npx convex env set ENCRYPTION_KEY $(openssl rand -hex 32)` — set the key
2. `npx tsc --noEmit` in `apps/web` — no type errors
3. Add a new env var via UI — stored as `enc:...` in Convex dashboard
4. Start a session sandbox — verify the decrypted value is in the sandbox environment
5. `list` query returns `"••••••"` for all values (check network tab)
6. Existing plaintext values still work until re-saved
