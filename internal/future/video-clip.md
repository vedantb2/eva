# Plan: Eva auto-captures proof of completion (screenshot + video walkthrough)

## Overview

After Eva completes a task in the sandbox, she captures proof of completion:

- **Screenshot** — a static image of the most relevant page
- **Video walkthrough** — a short recording navigating through the changed pages

Both use Playwright's headless Chromium. A subsequent Inngest step downloads the files from the sandbox via `sandbox.fs.downloadFile()` and uploads them to Convex storage (the `taskProof` table already exists).

## How Playwright video recording works

```js
const context = await browser.newContext({
  recordVideo: { dir: "/tmp/videos/", size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
await page.goto("http://localhost:3000/some-page");
// ... navigate, scroll, interact — all gets recorded
await context.close(); // video is saved on close
const videoPath = await page.video().path(); // e.g. /tmp/videos/abc123.webm
```

Output is WebM format. Video is only finalized when the context is closed.

## Files to modify

### 1. `web/lib/inngest/functions/execute-task.ts`

**A. Modify the Claude prompt** (append to the `prompt` string, before the final JSON output instructions)

```
## Proof of Completion (OPTIONAL — only if your changes affect the UI)
If your changes affect the frontend/UI, capture proof BEFORE outputting the final JSON:

1. Run: npx playwright install chromium --with-deps
2. Start the dev server in the background using the repo's package manager:
   e.g. pnpm dev &
3. Wait for it to be ready: sleep 15
4. Create and run /tmp/proof-capture.js:

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();

  // Screenshot
  const screenshotPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await screenshotPage.goto('http://localhost:3000' + (process.argv[2] || ''));
  await screenshotPage.waitForLoadState('networkidle');
  await screenshotPage.screenshot({ path: '/tmp/proof-screenshot.png', fullPage: false });
  await screenshotPage.close();

  // Video walkthrough
  const context = await browser.newContext({
    recordVideo: { dir: '/tmp/videos/', size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  const routes = (process.argv[2] || '').split(',');
  for (const route of routes) {
    await page.goto('http://localhost:3000' + route.trim());
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 3000));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 1000));
  }
  await context.close();
  await browser.close();
})();

5. Run: node /tmp/proof-capture.js <comma-separated-routes-showing-your-changes>
   e.g. node /tmp/proof-capture.js /dashboard,/settings
6. Run: mv /tmp/videos/*.webm /tmp/proof-walkthrough.webm
7. Kill the dev server: kill %1

If your changes are backend-only, skip this section entirely.
```

**B. Add a new Inngest step** after `mark-subtasks-completed`:

```ts
await step.run("upload-proof", async () => {
  const sandbox = await getSandbox(sandboxData.sandboxId);
  const files = [
    {
      path: "/tmp/proof-screenshot.png",
      name: "proof-screenshot.png",
      type: "image/png",
    },
    {
      path: "/tmp/proof-walkthrough.webm",
      name: "proof-walkthrough.webm",
      type: "video/webm",
    },
  ];

  let uploaded = 0;
  for (const file of files) {
    try {
      const fileBuffer = await sandbox.fs.downloadFile(file.path);
      const uploadUrl = await convex.mutation(
        api.taskProof.generateUploadUrl,
        {},
      );
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: fileBuffer,
      });
      const { storageId } = await uploadResponse.json();
      await convex.mutation(api.taskProof.save, {
        taskId: taskId as Id<"agentTasks">,
        storageId,
        fileName: file.name,
        fileType: file.type,
      });
      uploaded++;
    } catch {
      // File doesn't exist — skip silently
    }
  }

  await convex.mutation(api.agentRuns.appendLog, {
    id: runId as Id<"agentRuns">,
    level: "info",
    message:
      uploaded > 0
        ? `Uploaded ${uploaded} proof file(s)`
        : "No proof files found (likely backend-only task)",
  });
});
```

### 2. Frontend (already done)

The `TaskDetailModal` already displays images via `<img>` and videos via `<video controls>` in the "Proof of Completion" section. WebM videos will play natively in the browser. No changes needed.

## Edge cases

- **Backend-only tasks**: Claude skips the proof section. The step finds no files and logs accordingly.
- **Dev server doesn't start**: No screenshot/video created, step skips.
- **Playwright install fails**: Same — no files, step skips.
- **Only screenshot succeeds** (video fails or vice versa): Each file is uploaded independently; partial success is fine.
- **Sandbox already stopped**: `getSandbox` or `downloadFile` throws, caught per-file.

## Verification

1. Run `npx tsc` from `web/` to ensure no type errors
2. Trigger a frontend task and confirm both proof files appear in the modal
3. Trigger a backend-only task and confirm the log says "No proof files found"
