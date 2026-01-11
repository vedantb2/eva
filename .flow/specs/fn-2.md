# LLM Agent Orchestration Platform

## Overview

Extend the existing Kanban board into a full LLM Agent Orchestration platform. This involves enhancing the Convex data model to support boards, columns, agent tasks, agent runs, and GitHub repo metadata. The frontend will gain real-time log streaming, agent run controls, and execution history tracking.

## Scope

**In Scope:**
- Enhanced Convex schema: boards, columns, tasks with agent fields, agentRuns, githubRepos
- Convex functions for board/column management, task lifecycle, agent run control
- Frontend real-time subscriptions for agent runs and logs
- Trigger agent runs when tasks move to "Run" column
- Agent run UI with status badges, expandable log panels, PR links
- Real-time log streaming with auto-scroll
- Board ownership enforcement (auth)

**Out of Scope:**
- Modal agent execution implementation (external)
- GitHub App installation flow (metadata only)
- Multi-user collaboration (single owner per board)

## Technical Approach

### 1. Convex Data Model

Extend `backend/convex/schema.ts` with:

```typescript
boards: defineTable({
  name: v.string(),
  ownerId: v.string(), // Clerk user ID
  createdAt: v.number(),
})
  .index("by_owner", ["ownerId"]),

columns: defineTable({
  boardId: v.id("boards"),
  name: v.string(),
  order: v.number(),
  isRunColumn: v.optional(v.boolean()), // triggers agent on drop
})
  .index("by_board", ["boardId"]),

// Rename existing tasks -> agentTasks with additional fields
agentTasks: defineTable({
  boardId: v.id("boards"),
  columnId: v.id("columns"),
  title: v.string(),
  description: v.optional(v.string()), // agent goal
  repoId: v.optional(v.id("githubRepos")),
  status: v.union(
    v.literal("idle"),
    v.literal("queued"),
    v.literal("running"),
    v.literal("reviewing"),
    v.literal("completed"),
    v.literal("failed")
  ),
  order: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_board", ["boardId"])
  .index("by_column", ["columnId"]),

agentRuns: defineTable({
  taskId: v.id("agentTasks"),
  status: v.union(
    v.literal("queued"),
    v.literal("running"),
    v.literal("success"),
    v.literal("error")
  ),
  logs: v.array(v.object({
    timestamp: v.number(),
    level: v.union(v.literal("info"), v.literal("warn"), v.literal("error")),
    message: v.string(),
  })),
  startedAt: v.optional(v.number()),
  finishedAt: v.optional(v.number()),
  resultSummary: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  error: v.optional(v.string()),
})
  .index("by_task", ["taskId"]),

githubRepos: defineTable({
  owner: v.string(),
  name: v.string(),
  installationId: v.number(),
})
  .index("by_owner_name", ["owner", "name"]),
```

### 2. Convex Functions Structure

Create new files in `backend/convex/`:

- `boards.ts` - CRUD for boards
- `columns.ts` - CRUD + reorder for columns
- `agentTasks.ts` - enhanced tasks with agent lifecycle
- `agentRuns.ts` - run management + log appending
- `githubRepos.ts` - repo metadata CRUD

Key patterns:
- All queries/mutations verify `ownerId === identity.subject`
- Use `action` for external HTTP calls (triggering Modal agent)
- Log appending uses atomic patch with array spread

### 3. Frontend Architecture

**Route structure:**
- `/boards` - list user's boards
- `/boards/[id]` - full board view with columns
- `/boards/[id]/history` - execution history

**Components (in `web/lib/components/`):**
- `boards/BoardCard.tsx` - board list item
- `boards/CreateBoardModal.tsx` - board creation
- `columns/ColumnHeader.tsx` - column with settings
- `agent/AgentTaskCard.tsx` - enhanced task card with status
- `agent/AgentRunPanel.tsx` - expandable log viewer
- `agent/StatusBadge.tsx` - status indicator
- `agent/LogViewer.tsx` - streaming log display

**Real-time subscriptions:**
```typescript
// Board + columns + tasks
const board = useQuery(api.boards.getWithTasks, { boardId });

// Single task's runs
const runs = useQuery(api.agentRuns.listByTask, { taskId });

// Live logs for active run
const currentRun = useQuery(api.agentRuns.get, { runId });
```

### 4. Agent Run Flow

1. User drags task to "Run" column
2. Frontend calls `api.agentTasks.moveToColumn({ taskId, columnId })`
3. Mutation checks if column `isRunColumn === true`
4. If yes, mutation creates `agentRun` with status "queued"
5. Mutation calls internal action to trigger Modal (HTTP POST)
6. Action returns, run status updated to "running"
7. Modal calls back via HTTP endpoint to append logs
8. Modal calls completion endpoint when done
9. Run marked "success" or "error", task status updated

### 5. Auth Enforcement

- All board queries filter by `ownerId === identity.subject`
- Board mutations verify ownership before modifying
- Task/run operations verify board ownership through relations
- Read-only viewer support: future scope (not implementing now)

## Quick Commands

```bash
# Dev server
cd web && pnpm dev

# Type check
cd web && npx tsc --noEmit

# Build
cd web && pnpm build
```

## Acceptance Criteria

- [ ] Boards can be created, listed, renamed, deleted
- [ ] Columns can be added, reordered, renamed, deleted within a board
- [ ] Tasks show agent status badges (idle, queued, running, etc.)
- [ ] Moving task to Run column creates an agent run
- [ ] Agent runs display in expandable panel with timestamps
- [ ] Logs stream in real-time via Convex subscription
- [ ] Log viewer auto-scrolls to bottom
- [ ] PR URL displays when agent completes with PR
- [ ] Error state UI shows when agent fails
- [ ] Only board owner can create/modify tasks and trigger runs
- [ ] TypeScript strict mode passes

## References

- Existing Kanban: `web/lib/components/kanban/`
- Existing schema: `backend/convex/schema.ts`
- Convex auth: `backend/convex/auth.ts`
- StatusBadge component: `web/lib/components/ui/StatusBadge.tsx`
