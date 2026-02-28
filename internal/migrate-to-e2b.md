# Fix E2B Migration Bugs

## Context

The Daytona → E2B migration is complete structurally (all references updated) but has **critical runtime bugs** causing `SandboxError: 2: [unknown] terminated` during sandbox creation. Root causes identified through cross-referencing the actual E2B SDK types at `node_modules/e2b/dist/index.d.ts` and `node_modules/@e2b/desktop/dist/index.d.ts`.

## Bugs Found

### CRITICAL — Causing Runtime Crashes

**Bug 1: `Sandbox.resume()` does not exist** (`sandbox.ts:50`)

- Our code: `const sandbox = await Sandbox.resume(sandboxId, { apiKey })`
- Reality: E2B SDK has NO `Sandbox.resume()` static method. `Sandbox.connect()` auto-resumes paused sandboxes.
- Impact: `ensureSandboxRunning()` catch block will throw `TypeError: Sandbox.resume is not a function`

**Bug 2: `sandbox.pause()` does not exist** (`sandbox.ts:983`)

- Our code: `await sandbox.pause()`
- Reality: E2B SDK method is `sandbox.betaPause()`
- Impact: `pauseSandbox` action will throw `TypeError: sandbox.pause is not a function`

**Bug 3: `@e2b/desktop` Sandbox.create() with custom templates fails** (`sandbox.ts:91`)

- The `@e2b/desktop` `Sandbox` extends base `e2b` `Sandbox` with xfce4 desktop
- `_start()` runs xfce4 session inside sandbox, `waitAndVerify()` checks it started
- Custom templates (built from `node:20-bullseye` in `rebuild-template.yml`) don't have xfce4/X11/VNC
- Using `DesktopSandbox.create(customTemplateName, ...)` → starts xfce4 on template without xfce4 → `SandboxError: 2: [unknown] terminated`
- **This is the exact error the user is seeing.** Tasks use `setupAndExecute` which goes through `createSandbox` with custom template name.

### HIGH — Functional Issues

**Bug 4: Stream has no authentication** (`sandbox.ts:680-681`)

- Our code: `sandbox.stream.start()` then `sandbox.stream.getUrl()`
- Docs show: `stream.start({ requireAuth: true })` then `stream.getUrl({ authKey })` with `stream.getAuthKey()`
- Impact: Anyone who discovers the stream URL can view the user's desktop

### MEDIUM — Future Failures

**Bug 5: `getDesktopStreamUrl` calls `stream.start()` on every frontend poll**

- Frontend polls this action. Re-calling `start()` when already started may cause issues.

---

## Fix Plan

### File: `packages/backend/package.json`

- Add `"e2b": "^2.13.0"` alongside `"@e2b/desktop": "^2.0.1"`
- Need base `e2b` package for CLI-only sandboxes (tasks don't need desktop)

### File: `packages/backend/convex/sandbox.ts`

**1. Split imports — two Sandbox types:**

```typescript
import { Sandbox as DesktopSandbox } from "@e2b/desktop";
import { Sandbox as BaseSandbox } from "e2b";
```

- `DesktopSandbox` = extends BaseSandbox + xfce4 + VNC stream. For sessions/design that need desktop view.
- `BaseSandbox` = commands, files, pty. For tasks/workflows that only run CLI.

**2. Fix `exec()` type signature:**

```typescript
async function exec(
  sandbox: BaseSandbox,
  cmd: string,
  timeoutMs = 30_000,
): Promise<string>;
```

`DesktopSandbox extends BaseSandbox` so this accepts both types.

**3. Fix `ensureSandboxRunning()` — remove Sandbox.resume:**

```typescript
async function ensureSandboxRunning(
  sandboxId: string,
  apiKey: string,
): Promise<BaseSandbox> {
  const sandbox = await BaseSandbox.connect(sandboxId, { apiKey });
  await sandbox.commands.run("echo 1", { timeoutMs: 5_000 });
  return sandbox;
}
```

Add a desktop variant:

```typescript
async function ensureDesktopSandboxRunning(
  sandboxId: string,
  apiKey: string,
): Promise<DesktopSandbox> {
  const sandbox = await DesktopSandbox.connect(sandboxId, { apiKey });
  await sandbox.commands.run("echo 1", { timeoutMs: 5_000 });
  return sandbox;
}
```

**4. Split `createSandbox()` into two functions:**

`createDesktopSandbox()` — always uses "desktop" template (has xfce4):

```typescript
async function createDesktopSandbox(
  apiKey: string,
  installationId: number,
  sandboxEnvVars: Record<string, string>,
): Promise<DesktopSandbox> {
  const githubToken = await getInstallationToken(installationId);
  return DesktopSandbox.create("desktop", {
    apiKey,
    envs: {
      ...sandboxEnvVars,
      GITHUB_TOKEN: githubToken,
      INSTALLATION_ID: String(installationId),
    },
    timeout: SANDBOX_LIFETIME_SECONDS,
    resolution: [1920, 1080],
  });
}
```

`createCliSandbox()` — uses custom template when available:

```typescript
async function createCliSandbox(
  apiKey: string,
  installationId: number,
  sandboxEnvVars: Record<string, string>,
  templateName?: string,
): Promise<BaseSandbox> {
  const githubToken = await getInstallationToken(installationId);
  return BaseSandbox.create(templateName ?? "base", {
    apiKey,
    envs: {
      ...sandboxEnvVars,
      GITHUB_TOKEN: githubToken,
      INSTALLATION_ID: String(installationId),
    },
    timeout: SANDBOX_LIFETIME_SECONDS,
  });
}
```

Both followed by git config.

**5. Split `createSandboxAndPrepareRepo` → two variants:**

- `createDesktopSandboxAndPrepareRepo()` — uses `createDesktopSandbox()`, always clones fresh (no custom template)
- `createCliSandboxAndPrepareRepo()` — uses `createCliSandbox()`, supports custom templates + syncRepo

**6. Split `getOrCreateSandbox()` into two:**

- `getOrCreateDesktopSandbox` — connect with `DesktopSandbox`, create with desktop
- `getOrCreateCliSandbox` — connect with `BaseSandbox`, create with CLI

**7. Fix `pauseSandbox` — use `betaPause()`:**

```typescript
await sandbox.betaPause();
```

**8. Fix `getDesktopStreamUrl` — use auth + DesktopSandbox:**

```typescript
const sandbox = await DesktopSandbox.connect(args.sandboxId, {
  apiKey: e2bApiKey,
});
await sandbox.stream.start({ requireAuth: true });
const authKey = sandbox.stream.getAuthKey();
const streamUrl = sandbox.stream.getUrl({ authKey });
return { url: streamUrl };
```

**9. Fix `startDesktopStream` — use auth:**

```typescript
async function startDesktopStream(sandbox: DesktopSandbox): Promise<void> {
  await sandbox.stream.start({ requireAuth: true });
}
```

**10. Update `startSessionSandbox`:**

- Use `ensureDesktopSandboxRunning` for existing sandbox
- Use `createDesktopSandboxAndPrepareRepo` for new sandbox (always "desktop" template, no custom template)
- Remove `templateName` from this flow

**11. Update `startDesignSandbox`:**

- Same as sessions — always desktop template

**12. Update `setupAndExecute`:**

- Use `createCliSandboxAndPrepareRepo` (supports custom templates, no desktop needed)
- Use `BaseSandbox.connect` for existing sandboxes

**13. Update all `connect` calls in CLI-only actions:**

- `runSandboxCommand`: `BaseSandbox.connect(...)`
- `launchOnExistingSandbox`: `BaseSandbox.connect(...)`
- `launchAudit`: `BaseSandbox.connect(...)`
- `runSessionAudit`: `BaseSandbox.connect(...)`
- `killSandbox`: `BaseSandbox.connect(...)`
- `pauseSandbox`: `BaseSandbox.connect(...)` + `betaPause()`

### File: `apps/teams-bot/src/sandbox.ts`

- Replace `import { Sandbox } from "@e2b/desktop"` with `import { Sandbox } from "e2b"` (teams bot doesn't need desktop)
- Fix `sandbox.pause()` → `sandbox.betaPause()` if used
- Update `apps/teams-bot/package.json`: add `"e2b"`, remove `"@e2b/desktop"`

### Frontend files (SandboxPanel, DesignDetailClient)

- `getDesktopStreamUrl` now returns authenticated URL — no frontend change needed (URL already has authKey baked in via `getUrl({ authKey })`)

---

## Verification

1. `npx convex dev` in backend — verify all actions deploy
2. Create a session → verify desktop stream loads with auth
3. Run a task (setupAndExecute) → verify CLI sandbox creates without `SandboxError`
4. Stop session → verify `betaPause()` works
5. Restart session → verify `Sandbox.connect()` auto-resumes
6. Verify task streaming output in TaskDetailModal
