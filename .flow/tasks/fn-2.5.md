# fn-2.5: Implement Convex functions for agent runs and log streaming

## Description

Create `backend/convex/agentRuns.ts` with queries and mutations for run management:

- `get` - Query single run by ID (for real-time log subscription)
- `listByTask` - Query all runs for a task (history)
- `create` - Internal mutation to create run (called by moveToColumn)
- `updateStatus` - Mutation to change run status
- `appendLog` - Mutation to add log entry (append-only)
- `complete` - Mutation to mark run as success/error with summary

## Files to Create

- `backend/convex/agentRuns.ts`

## Implementation Notes

- `appendLog` should atomically append to logs array:
  ```typescript
  await ctx.db.patch(runId, {
    logs: [...existingRun.logs, newLogEntry],
  });
  ```
- `complete` updates: status, finishedAt, resultSummary, prUrl (optional), error (optional)
- Consider using HTTP endpoints for Modal callbacks (separate from this task)
- Runs are immutable once completed

## Acceptance Criteria

- [ ] `agentRuns.get` returns run with full logs array
- [ ] `agentRuns.listByTask` returns runs ordered by startedAt desc
- [ ] `agentRuns.appendLog` atomically adds log entries
- [ ] `agentRuns.complete` sets final state with summary/error
- [ ] Real-time subscription works for log updates
