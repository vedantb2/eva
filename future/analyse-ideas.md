# Analyse Pages: 3 Features That MCP + Cowork Can't Do

## Summary

Build three features into `/analyse` that require server-side execution, persistence, and real-time updates — things Claude Desktop fundamentally cannot do.

1. **Proactive Insights** — Routines run on a schedule, surface findings automatically
2. **Analysis → Action** — Insight cards have action buttons (reassign, close, etc.)
3. **NL → Live Widgets** — Ask a question, get a persistent auto-updating chart

---

## Schema Changes

### New table: `routineRuns` in `backend/convex/schema.ts`

Stores results from each routine execution. Separate from `routines` because routines run repeatedly.

```
routineRuns:
  routineId: Id<"routines">
  repoId: Id<"githubRepos">
  status: "running" | "completed" | "error"
  result: string (optional - AI response text)
  actions: array of { label, type, payload } (optional - actionable items)
  createdAt: number
```

Indexes: `by_routine`, `by_repo`

### Modify `savedQueries` — add `chartType` field

```
chartType: optional string  // "bar" | "line" | "doughnut" | "stat" | "table"
```

---

## Feature 1: Proactive Insights (Routines)

### Flow
1. User creates routine: title + NL query + schedule (hourly/daily/weekly)
2. Inngest cron checks hourly for due routines
3. Each due routine triggers `execute-routine` (same Daytona sandbox pattern as `execute-research-query`)
4. AI result saved to `routineRuns`
5. Landing page shows recent insights via Convex real-time subscription

### New files
| File | What |
|------|------|
| `backend/convex/routineRuns.ts` | CRUD: `list`, `getLatestByRepo`, `create`, `updateNoAuth` |
| `web/lib/inngest/functions/execute-routine.ts` | Runs routine in Daytona sandbox (clone of execute-research-query pattern) |
| `web/lib/inngest/functions/routine-scheduler.ts` | Inngest cron (`0 * * * *`), finds due routines, sends events |
| `web/app/api/analyse/routine/route.ts` | POST to manually trigger a routine |

### Modified files
| File | Change |
|------|--------|
| `backend/convex/schema.ts` | Add `routineRuns` table |
| `backend/convex/routines.ts` | Add `listEnabledNoAuth` query + `updateLastRunAtNoAuth` mutation (for Inngest) |
| `web/lib/inngest/index.ts` | Export `executeRoutine`, `routineScheduler` |
| `web/app/api/inngest/route.ts` | Add both to `functions` array |
| `web/app/(main)/[repo]/analyse/routines/page.tsx` | Replace placeholder with routines management UI (list, create, edit, toggle, delete) |
| `web/app/(main)/[repo]/analyse/page.tsx` | Replace placeholder with insight cards from `routineRuns.getLatestByRepo` |

---

## Feature 2: Analysis → Action Workflows

Thin layer on Feature 1. No new files.

### Flow
1. The `execute-routine` prompt asks AI to return structured actions alongside text
2. AI response includes JSON: `{ "actions": [{ "label": "Close task X", "type": "updateTaskStatus", "payload": "{\"id\":\"...\",\"status\":\"done\"}" }] }`
3. Inngest function parses actions from AI response, stores in `routineRuns.actions`
4. Insight cards on landing page render action buttons
5. Each button calls the corresponding Convex mutation directly

### Pre-defined action types (keep it to 3)
| Type | Mutation | What |
|------|----------|------|
| `updateTaskStatus` | `agentTasks.updateStatus` | Change a task's status |
| `createTask` | `agentTasks.createQuickTask` | Create a new task |
| `closeSession` | `sessions.close` | Close a session |

### Modified files
| File | Change |
|------|--------|
| `web/lib/inngest/functions/execute-routine.ts` | Add action parsing from AI response |
| `web/app/(main)/[repo]/analyse/page.tsx` | Render action buttons on insight cards, handle mutation calls |

---

## Feature 3: NL → Live Dashboard Widgets

### Flow
1. Landing page has input: "Ask a question to create a widget..."
2. User types "Show me task completion by engineer this month"
3. Frontend calls `/api/analyse/widget` → uses ai-sdk (NOT Daytona sandbox) to generate a widget config JSON
4. Config saved to `savedQueries` table
5. Frontend renders widget using `useQuery(api.analytics.getWidgetData, { config })`
6. Widget auto-updates in real-time via Convex subscription

### Widget config (stored as JSON in `savedQueries.query`)
```json
{
  "chartType": "bar",
  "table": "agentTasks",
  "metric": "count",
  "groupBy": "status",
  "filters": {},
  "timeRange": "30d"
}
```

Supported: `table` = agentTasks | agentRuns | sessions | projects. `metric` = count | successRate. `groupBy` = status | date | none. `chartType` = bar | line | doughnut | stat | table.

### New files
| File | What |
|------|------|
| `web/app/api/analyse/widget/route.ts` | POST: NL question → AI generates widget config JSON → saves to `savedQueries` |
| `web/lib/components/analyse/Widget.tsx` | Generic widget renderer: parses config, calls `getWidgetData`, renders Chart.js chart |

### Modified files
| File | Change |
|------|--------|
| `backend/convex/schema.ts` | Add `chartType` to `savedQueries` |
| `backend/convex/analytics.ts` | Add `getWidgetData` query — generic query that interprets config and returns `{ labels, values }` |
| `web/app/(main)/[repo]/analyse/page.tsx` | Add widget grid alongside insight cards |
| `web/app/(main)/[repo]/analyse/saved-queries/page.tsx` | Replace placeholder with widget grid + delete |

**Key decision:** Widget creation uses `ai-sdk` directly (simple LLM call to generate JSON), NOT a Daytona sandbox. Much faster and cheaper than the research query approach.

---

## Build Order

**Phase 1 — Routines (Feature 1):** Foundation. Schema → backend → Inngest functions → API route → UI pages.

**Phase 2 — Actions (Feature 2):** Incremental on Phase 1. Update execute-routine prompt + parse actions + render buttons on insight cards.

**Phase 3 — Widgets (Feature 3):** Independent of 1-2. getWidgetData query → widget API route → Widget component → pages.

---

## Landing Page Layout (`/analyse`)

The currently-empty landing page becomes the hub:

```
┌─────────────────────────────────────────┐
│  [Create widget input: "Ask a question  │
│   to create a live widget..."]          │
├─────────────────────────────────────────┤
│  WIDGETS (grid of saved query widgets)  │
│  ┌──────────┐ ┌──────────┐             │
│  │ Bar chart│ │Doughnut  │             │
│  └──────────┘ └──────────┘             │
├─────────────────────────────────────────┤
│  RECENT INSIGHTS                        │
│  ┌──────────────────────────────────┐   │
│  │ Routine: "Sprint health check"   │   │
│  │ "5 tasks stale for >7 days..."   │   │
│  │ [Reassign] [Close]              │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Verification

1. **Routines:** Create a routine with schedule "hourly", manually trigger via API route, verify `routineRuns` entry appears on landing page
2. **Actions:** Verify AI returns structured actions, verify clicking action button calls Convex mutation and updates data
3. **Widgets:** Type a NL question, verify widget config is generated, verify chart renders with real-time data
4. **Type check:** Run `npx tsc` from `/web`
