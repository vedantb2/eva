# GitHub Webhook Integration for Eva

## Context

Eva is a platform that manages other repos. Users of those repos currently need GitHub Actions workflows (`claude-code-review.yml`, `claude.yml`) for automated code review and `@claude` mentions. Instead, Eva should provide this natively — when a PR is opened or someone mentions `@eva` in a connected repo, Eva handles it with richer context (docs, session history) than a standalone GitHub Action could.

The GitHub App already exists (Octokit + `@octokit/auth-app`). What's missing: webhook reception, event processing, and response posting.

## Architecture

```
GitHub webhook POST → Convex httpAction (verify HMAC, store event)
  → internalMutation starts workflow
    → workflow step: fetch PR diff via GitHub API
    → workflow step: query Eva context (docs + session summaries)
    → workflow step: run Claude in ephemeral sandbox (synchronous, no callback)
    → workflow step: post result to GitHub (PR review or comment)
    → workflow step: mark event completed
```

Key decision: **synchronous sandbox execution** via a new `runInEphemeralSandbox` action in `daytona.ts`. Creates sandbox, runs Claude Code blocking, returns result, deletes sandbox. Avoids the fire-and-forget callback pattern (which has auth issues since there's no Clerk JWT for webhook flows). Webhook events don't need live UI streaming anyway.

## New env var

- `GITHUB_WEBHOOK_SECRET` — HMAC secret configured in GitHub App settings

## Implementation

### 1. `packages/backend/convex/validators.ts` — add validator

```ts
export const webhookEventStatusValidator = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("skipped"),
);
```

### 2. `packages/backend/convex/schema.ts` — add table + field

Add to `githubRepos`:

```ts
webhookEnabled: v.optional(v.boolean()),
```

New table:

```ts
githubWebhookEvents: defineTable({
  repoId: v.id("githubRepos"),
  event: v.string(),           // "pull_request", "issue_comment", etc.
  action: v.string(),          // "opened", "synchronize", "created"
  status: webhookEventStatusValidator,
  payload: v.string(),         // JSON-stringified (too complex for structured values)
  pullNumber: v.optional(v.number()),
  issueNumber: v.optional(v.number()),
  commentBody: v.optional(v.string()),
  mentionMode: v.optional(v.union(v.literal("ask"), v.literal("execute"))),
  sandboxId: v.optional(v.string()),
  result: v.optional(v.string()),
  error: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  completedAt: v.optional(v.number()),
})
  .index("by_repo", ["repoId"])
  .index("by_status", ["status"]),
```

### 3. `packages/backend/convex/githubRepos.ts` — queries + mutations

- Add `webhookEnabled` to `githubRepoValidator`
- Add `findByOwnerName` internalQuery (lookup by owner+name, return first without rootDirectory)
- Add `toggleWebhook` authMutation

### 4. `packages/backend/convex/daytona.ts` — add `runInEphemeralSandbox`

New exported `internalAction` that:

1. Calls `resolveSandboxContext()` to get Daytona client + env vars + snapshot
2. Calls `createSandboxAndPrepareRepo()` to create sandbox with repo cloned
3. Uploads prompt to `/tmp/review-prompt.txt`
4. Runs `cat /tmp/review-prompt.txt | npx @anthropic-ai/claude-code -p --verbose --dangerously-skip-permissions --model {model} --allowedTools "{tools}" --output-format stream-json` synchronously via `exec()` with 300s timeout
5. Parses stream-json output to extract final `result` event
6. Deletes sandbox in `finally` block
7. Returns `{ success, result, error }`

All helper functions (`resolveSandboxContext`, `createSandboxAndPrepareRepo`, `exec`, `WORKSPACE_DIR`) are already in scope — this is just a new action in the same file.

### 5. `packages/backend/convex/githubWebhook.ts` — NEW file (V8 runtime)

Mutations/queries:

- `storeEvent` internalMutation — insert into `githubWebhookEvents` with status "pending"
- `getEvent` internalQuery — fetch by ID
- `updateEventStatus` internalMutation — patch status
- `completeEvent` internalMutation — set status + result/error + completedAt
- `getRepoContext` internalQuery — fetch docs (title, description, requirements) + last 5 sessions with summaries for a repoId
- `startPrReviewWorkflow` internalMutation — calls `workflow.start()` for PR review, patches event with workflowId
- `startMentionWorkflow` internalMutation — calls `workflow.start()` for mention response

Pure functions:

- `buildReviewPrompt(owner, name, pullNumber, diff, context)` — assembles PR review prompt with Eva context
- `buildMentionPrompt(owner, name, commentBody, prContext, context)` — assembles mention response prompt

### 6. `packages/backend/convex/githubWebhookActions.ts` — NEW file ("use node")

Actions:

- `routeEvent` internalAction — reads event from DB, determines type, calls the appropriate `start*Workflow` mutation. Called by httpAction via `ctx.scheduler.runAfter(0, ...)`
- `fetchPrDiff` internalAction — fetches diff via `getInstallationOctokit()` + `pulls.get()` with diff media type
- `postPrReview` internalAction — posts review via `pulls.createReview()` with event "COMMENT"
- `postIssueComment` internalAction — posts comment via `issues.createComment()`

### 7. `packages/backend/convex/githubWebhookWorkflow.ts` — NEW file (V8 runtime)

**PR Review Workflow:**

```
1. step.runQuery(getRepoContext) → context
2. step.runAction(fetchPrDiff) → diff
3. Build prompt from diff + context (pure function)
4. step.runAction(daytona.runInEphemeralSandbox, { prompt, model: "sonnet", allowedTools: "Read,Glob,Grep" }) → result
5. If success: step.runAction(postPrReview, { body: result })
6. step.runMutation(completeEvent)
```

**Mention Response Workflow:**

```
1. step.runQuery(getRepoContext) → context
2. Parse mentionMode from event (default "ask", "@eva execute"/"@eva fix" → "execute")
3. Build prompt from comment + context
4. step.runAction(daytona.runInEphemeralSandbox, {
     prompt,
     model: "sonnet",
     allowedTools: mode === "execute" ? "Read,Write,Edit,Bash,Glob,Grep" : "Read,Glob,Grep"
   }) → result
5. If success: step.runAction(postIssueComment, { body: result })
6. step.runMutation(completeEvent)
```

### 8. `packages/backend/convex/http.ts` — add webhook route

Add `POST /api/github/webhook`:

1. Read `X-Hub-Signature-256` and `X-GitHub-Event` headers
2. Read raw body as text
3. Verify HMAC-SHA256 using Web Crypto API (`crypto.subtle`) against `GITHUB_WEBHOOK_SECRET`
4. Parse payload, extract `repository.owner.login` + `repository.name`
5. Lookup repo via `ctx.runQuery(internal.githubRepos.findByOwnerName)`
6. Check `webhookEnabled === true`, return 200 if not
7. Filter events: only process `pull_request` (opened/synchronize) and comments containing `@eva`
8. Skip bot-authored comments (check `user.type === "Bot"`) to avoid loops
9. Store event via `ctx.runMutation(internal.githubWebhook.storeEvent)`
10. Schedule processing: `ctx.scheduler.runAfter(0, internal.githubWebhookActions.routeEvent, { eventId })`
11. Return 200

HMAC verification via Web Crypto:

```ts
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed =
    "sha256=" +
    Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  return computed === signature;
}
```

Type-safe payload parsing using `isRecord` + `getString`/`getNumber` helpers (no `any`/`unknown`/`as`).

## Edge cases to handle

- **Bot loop prevention**: Skip comments where `user.type === "Bot"` or `user.login` matches the GitHub App's bot name
- **Duplicate webhooks**: Check `event.status !== "pending"` before processing
- **Large diffs**: Truncate to 30,000 chars in the prompt
- **Action timeout**: 10min Convex limit. Claude reviews ~2-4 min. `exec` timeout set to 300s for safety
- **Sandbox cleanup**: Always delete in `finally` block, even on failure

## Verification

1. Deploy schema changes via `npx convex dev`
2. Configure `GITHUB_WEBHOOK_SECRET` env var in Convex dashboard
3. Set webhook URL in GitHub App settings to `{CONVEX_URL}/api/github/webhook`
4. Enable webhook events: `pull_request`, `issue_comment`, `pull_request_review_comment`
5. Enable `webhookEnabled` on a test repo via Convex dashboard
6. Open a test PR → verify Eva posts a review comment
7. Comment `@eva what does this PR do?` → verify Eva replies
8. Comment `@eva fix the linting issues` → verify Eva runs in execute mode

## Files summary

| File                       | Action | Purpose                                                            |
| -------------------------- | ------ | ------------------------------------------------------------------ |
| `validators.ts`            | Modify | Add `webhookEventStatusValidator`                                  |
| `schema.ts`                | Modify | Add `githubWebhookEvents` table, `webhookEnabled` field            |
| `githubRepos.ts`           | Modify | Add `findByOwnerName`, `toggleWebhook`, update validator           |
| `daytona.ts`               | Modify | Add `runInEphemeralSandbox` internalAction                         |
| `githubWebhook.ts`         | Create | Event storage, context queries, prompt builders, workflow starters |
| `githubWebhookActions.ts`  | Create | GitHub API actions, event routing ("use node")                     |
| `githubWebhookWorkflow.ts` | Create | PR review + mention response workflows                             |
| `http.ts`                  | Modify | Add `/api/github/webhook` route with HMAC verification             |
