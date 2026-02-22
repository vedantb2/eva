# Plan: Local Convex Backend in Daytona Sandboxes

## Context

Currently, all Daytona sandboxes connect to the shared cloud Convex instance. This means sandbox work touches the production/staging database, creating data isolation concerns. The goal is to run a **local Convex backend** inside each session sandbox so the full app stack (Next.js + Convex) is self-contained, while orchestration callbacks (task progress, completion) still flow to cloud Convex.

**Key insight from Convex docs:** `npx convex dev --local` runs the entire backend as a subprocess — no Docker needed. State persists in `~/.convex/`. The `--once` flag deploys and exits.

## Files to Modify

1. **`Dockerfile`** — Add local Convex setup steps
2. **`packages/backend/convex/daytona.ts`** — Modify `startSessionSandbox` to start local Convex before `pnpm dev`
3. **`packages/backend/convex/seed.ts`** _(new)_ — Empty seed script infrastructure for future use

## Implementation

### Step 1: Create seed script infrastructure

Create `packages/backend/convex/seed.ts` with an empty/placeholder internal mutation that can be extended later:

```ts
import { internalMutation } from "./_generated/server";

export const seedData = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // TODO: Add seed data here
    // Example:
    // await ctx.db.insert("users", { ... });
    return null;
  },
});
```

### Step 2: Update Dockerfile

After the existing `pnpm install` step, add local Convex setup:

```dockerfile
# Pre-configure local Convex backend (deploys schema + functions, state persists in ~/.convex/)
WORKDIR /workspace/repo/packages/backend
RUN npx convex dev --local --once

# Run seed script (populates initial data into local Convex)
# Uncomment when seed.ts has data:
# RUN npx convex dev --local --run seed:seedData --once

# Return to web app directory
WORKDIR /workspace/repo/apps/web
```

**Why in the Dockerfile:** Baking the local deployment into the snapshot means every sandbox starts instantly with schema + functions already deployed. No startup latency for Convex setup.

### Step 3: Modify `startSessionSandbox` in `daytona.ts`

In `packages/backend/convex/daytona.ts`, the `startSessionSandbox` function currently starts `pnpm dev` immediately. We need to:

1. Start the local Convex backend first (`npx convex dev --local &`)
2. Wait for it to be ready
3. Start `pnpm dev` with `NEXT_PUBLIC_CONVEX_URL` overridden to point to local backend

The local backend URL is `http://127.0.0.1:3210` (Convex default local port).

**For both the existing sandbox path (lines 569-595) and new sandbox path (lines 597-629):**

Replace:

```ts
await sandbox.process.executeCommand(
  `cd ${WORKSPACE_DIR} && pnpm dev > /dev/null 2>&1 &`,
  "/",
  undefined,
  10,
);
```

With:

```ts
// Start local Convex backend (reads pre-deployed state from ~/.convex/)
await sandbox.process.executeCommand(
  `cd ${WORKSPACE_DIR}/packages/backend && npx convex dev --local > /tmp/convex-local.log 2>&1 &`,
  "/",
  undefined,
  10,
);

// Wait for local Convex to be ready
await sandbox.process.executeCommand(
  `for i in $(seq 1 15); do curl -s http://127.0.0.1:3210 > /dev/null 2>&1 && break; sleep 1; done`,
  "/",
  undefined,
  20,
);

// Start Next.js with local Convex URL (overrides the cloud URL from sandbox env vars)
await sandbox.process.executeCommand(
  `cd ${WORKSPACE_DIR}/apps/web && NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210 pnpm dev > /dev/null 2>&1 &`,
  "/",
  undefined,
  10,
);
```

**Why override via env prefix:** The sandbox's process env has `NEXT_PUBLIC_CONVEX_URL` set to the cloud URL (from `createSandbox`). The inline `NEXT_PUBLIC_CONVEX_URL=...` override ensures only the Next.js process uses the local URL. The orchestration callback scripts still use the cloud `CONVEX_URL`/`CONVEX_CLOUD_URL` for reporting progress — those are unaffected.

### Step 4: No changes to `createSandbox` or callback scripts

- `createSandbox` still sets `NEXT_PUBLIC_CONVEX_URL` to cloud URL — this is fine because:
  - Workflow sandboxes (tasks, designs) don't run `pnpm dev` and use callback scripts with `CONVEX_CLOUD_URL`
  - Session sandboxes override the URL when starting `pnpm dev` (Step 3)
- Callback scripts (`buildCallbackScript`) use `CONVEX_URL` (set to `CONVEX_CLOUD_URL` in `launchScript`) — completely separate from the app's data layer

## Architecture Summary

```
Session Sandbox
├── Local Convex Backend (port 3210)     ← app data (isolated per sandbox)
│   └── npx convex dev --local
├── Next.js (port 3000)                  ← connects to localhost:3210
│   └── NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
├── code-server (port 8080)              ← VS Code editor
└── Callback scripts                     ← still call cloud Convex for orchestration
    └── CONVEX_URL = cloud Convex URL
```

## Verification

1. Build the Docker image and verify `npx convex dev --local --once` succeeds in the build
2. Start a session sandbox and verify:
   - `npx convex dev --local` starts and listens on port 3210
   - `pnpm dev` starts Next.js connected to local Convex
   - The app loads in the sandbox iframe with empty (or seeded) data
   - Orchestration callbacks still reach cloud Convex
3. Type check: `npx tsc --noEmit` from `packages/backend/` (for seed.ts)

### Step 5: Clerk auth for local Convex

The Convex `auth.config.ts` reads `CLERK_FRONTEND_API_URL` to validate Clerk JWTs:

```ts
export default {
  providers: [
    { domain: process.env.CLERK_FRONTEND_API_URL, applicationID: "convex" },
  ],
};
```

On cloud Convex, this env var is set via the Convex dashboard. For the local backend, it needs to be set as a process env var.

In `startSessionSandbox`, when starting the local Convex backend:

```bash
CLERK_FRONTEND_API_URL=https://<clerk-instance>.clerk.accounts.dev npx convex dev --local > /tmp/convex-local.log 2>&1 &
```

This requires adding `CLERK_FRONTEND_API_URL` to the Convex env vars on the Convex cloud (it's already there) AND passing it to the sandbox. Two options:

1. Add it as a new env var in `createSandbox` (sourced from Convex process env)
2. Add it to `extraEnvVarNames` pattern

**Recommended**: Add `CLERK_FRONTEND_API_URL` to `createSandbox`'s env vars, then reference `$CLERK_FRONTEND_API_URL` when launching the local Convex process.

## Open Questions / Risks

- **Local Convex URL**: Assumed `http://127.0.0.1:3210` based on Convex self-hosted defaults. Need to verify this is correct for `--local` flag. If different, the URL in Step 3 gets updated.
- **Convex components**: The 4 extensions (workflow, presence, prosemirror-sync, timeline) need to work with local backend. Should work since `--once` deploys everything, but worth verifying.
- **Other Convex env vars**: If backend mutations/actions need env vars beyond Clerk (e.g., Resend API key), those would also need to be set when running `npx convex dev --local`. For now, only Clerk auth is critical for the app to function.
