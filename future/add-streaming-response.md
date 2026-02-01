# Stream Claude CLI output to frontend via Convex

## Approach
Use Daytona's session-based execution with log streaming callbacks to capture Claude CLI stdout in real-time. Flush accumulated output to a `streamingOutput` field on the session every ~1 second via Convex mutation. Frontend subscribes reactively and renders it. No Inngest/Trigger.dev migration needed.

Start with `session-execute` (most user-facing). Same pattern extends to `execute-task` later.

---

## 1. `backend/convex/schema.ts`

Add to `sessions` table:
```
streamingOutput: v.optional(v.string()),
```

## 2. `backend/convex/sessions.ts`

Add mutation:
```ts
setStreamingOutput({ id: v.id("sessions"), output: v.string() })
  → ctx.db.patch(id, { streamingOutput: output })

clearStreamingOutput({ id: v.id("sessions") })
  → ctx.db.patch(id, { streamingOutput: undefined })
```

## 3. `web/lib/inngest/sandbox.ts`

Add `runClaudeCLIStreaming()` alongside existing `runClaudeCLI()`:

```ts
interface StreamingClaudeCLIOptions extends ClaudeCLIOptions {
  onOutput: (accumulated: string) => Promise<void>;
  flushIntervalMs?: number; // default 1000
}

async function runClaudeCLIStreaming(sandbox, prompt, options): Promise<ClaudeCLIResult>
```

Implementation:
1. `createSession(sessionId)` with unique ID
2. `executeSessionCommand(sessionId, { command: <claude cli>, runAsync: true })`
3. Start a `setInterval` that flushes accumulated stdout via `onOutput` every second
4. `getSessionCommandLogs(sessionId, cmdId, onStdout, onStderr)` — accumulate stdout in callback
5. When `getSessionCommandLogs` resolves (command done): clear interval, final flush
6. `deleteSession(sessionId)` cleanup
7. Parse final result same as current `runClaudeCLI`

Key detail: `getSessionCommandLogs` callbacks are synchronous, so accumulate in callback and flush via setInterval (which can run async).

## 4. `web/lib/inngest/functions/session-execute.ts`

For all modes that call `runClaudeCLI` (ask, plan, execute):
- Switch to `runClaudeCLIStreaming()`
- Pass `onOutput` that calls `convex.mutation(api.sessions.setStreamingOutput, { id: sessionId, output })`
- Before Claude runs: `convex.mutation(api.sessions.setStreamingOutput, { id: sessionId, output: "" })` to signal "streaming started"
- After Claude finishes: `convex.mutation(api.sessions.clearStreamingOutput, { id: sessionId })` then add final message as before
- In `onFailure`: also call `clearStreamingOutput`

## 5. `web/app/(main)/[repo]/sessions/[id]/ChatPanel.tsx`

The session object already comes from `useQuery(api.sessions.get)` which is reactive. Just add:
- If `session.streamingOutput !== undefined` (including empty string ""), show a streaming bubble at the bottom of messages
- Render `streamingOutput` as preformatted text (it's raw CLI stdout)
- Remove/replace the current `isSending` spinner — streaming output replaces it as the loading indicator
- When `streamingOutput` becomes undefined and new assistant message appears, display normally

---

## Verification

- `npx tsc` from `/web` after `pnpm api:web`
- Manual test: send a session message, observe streaming output appearing every ~1 second
- Verify final message still appears correctly after streaming ends
- Verify `streamingOutput` clears after completion and on error
