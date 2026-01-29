# Plan: Eva auto-captures proof of completion screenshots

## Overview

After Eva completes a task in the sandbox, she takes a screenshot of the running app (if UI changes) and saves it to a known path. A subsequent Inngest step downloads the screenshot from the sandbox, uploads it to Convex storage, and links it to the task via the `taskProof` table (already exists).

## How it works

1. **Claude's prompt** gets new instructions at the end telling it to take a screenshot after completing the task
2. Claude installs Playwright, starts the dev server, navigates to the relevant page, takes a screenshot, saves to `/tmp/proof-screenshot.png`
3. A **new Inngest step** (`upload-proof`) runs after the agent finishes:
   - Uses `sandbox.fs.downloadFile('/tmp/proof-screenshot.png')` → `Buffer`
   - Calls `convex.mutation(api.taskProof.generateUploadUrl)` → upload URL
   - POSTs the buffer to the upload URL → gets `storageId`
   - Calls `convex.mutation(api.taskProof.save, { taskId, storageId, fileName, fileType })`
4. If the screenshot doesn't exist (backend-only task or failure), the step is silently skipped

## Files to modify

### 1. `web/lib/inngest/functions/execute-task.ts`

**A. Modify the Claude prompt** (inside the `run-autonomous-agent` step, ~line 154)

Append to the end of the `prompt` string:

```
## Proof of Completion (OPTIONAL - only if your changes affect the UI)
If your changes affect the frontend/UI:
1. Run: npx playwright install chromium --with-deps
2. Start the dev server in the background (use the correct package manager from the lockfile):
   e.g. pnpm dev &
3. Wait for it to be ready: sleep 10
4. Create /tmp/take-screenshot.js with this content:
   const { chromium } = require('playwright');
   (async () => {
     const browser = await chromium.launch();
     const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
     await page.goto('http://localhost:3000' + (process.argv[2] || ''));
     await page.waitForLoadState('networkidle');
     await page.screenshot({ path: '/tmp/proof-screenshot.png', fullPage: false });
     await browser.close();
   })();
5. Run: node /tmp/take-screenshot.js <route-that-shows-your-changes>
6. Kill the dev server after: kill %1
If your changes are backend-only, skip this section entirely.
Do this BEFORE outputting your final JSON.
```

**B. Add a new step** after `mark-subtasks-completed` (~line 277):

```ts
await step.run("upload-proof", async () => {
  try {
    const sandbox = await getSandbox(sandboxData.sandboxId);
    const fileBuffer = await sandbox.fs.downloadFile("/tmp/proof-screenshot.png");

    const uploadUrl = await convex.mutation(api.taskProof.generateUploadUrl, {});
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: fileBuffer,
    });
    const { storageId } = await uploadResponse.json();

    await convex.mutation(api.taskProof.save, {
      taskId: taskId as Id<"agentTasks">,
      storageId,
      fileName: "proof-screenshot.png",
      fileType: "image/png",
    });

    await convex.mutation(api.agentRuns.appendLog, {
      id: runId as Id<"agentRuns">,
      level: "info",
      message: "Proof of completion screenshot uploaded",
    });
  } catch {
    await convex.mutation(api.agentRuns.appendLog, {
      id: runId as Id<"agentRuns">,
      level: "info",
      message: "No proof screenshot found (likely backend-only task)",
    });
  }
});
```

### 2. `web/api.ts`

Needs the `generateUploadUrl` signature updated to accept `Record<string, never>` args (already done by linter — the current type already uses `Record<string, never>`). No changes needed.

### 3. Frontend (already done)

The `TaskDetailModal` already has a "Proof of Completion" section that queries `api.taskProof.listByTask` and displays images/videos. No frontend changes needed.

## Edge cases

- **Backend-only tasks**: Claude skips the screenshot section. The `upload-proof` step catches the "file not found" error and logs it gracefully.
- **Dev server doesn't start**: Playwright will fail, no screenshot file is created, step is skipped.
- **Playwright install fails**: Same — no screenshot, step is skipped.
- **Sandbox already stopped**: `getSandbox` or `downloadFile` throws, caught and logged.

## Verification

1. Run `npx tsc` from `web/` to ensure no type errors
2. Trigger a task execution on a repo with a frontend and confirm:
   - Claude installs Playwright and takes a screenshot
   - The screenshot appears in the "Proof of Completion" section of the task modal
3. Trigger a backend-only task and confirm:
   - The upload-proof step logs "No proof screenshot found" without erroring
