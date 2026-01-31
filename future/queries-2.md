# Saved Queries + Routines UI & Inngest Cron Scheduling

## Overview
Wire up the saved queries and routines pages (currently "coming soon" placeholders), and add an Inngest cron function that triggers routine execution via Convex internal actions.

## Architecture

```
Inngest cron (hourly)
  → calls Convex public action processRoutines (no auth)
    → finds due routines (internal query)
    → for each: creates research query + user message (internal mutations)
    → schedules executeRoutine (ctx.scheduler)
      → calls /api/routines/execute (sandbox + Claude, returns answer)
      → saves answer (internal mutation)
      → updates lastRunAt (internal mutation)
```

- **Schedule format**: `"daily"` | `"weekly"` | `"monthly"` (dropdown in UI)
- **Auth**: Convex internal mutations for system-level writes. No secrets needed.

---

## Files to Create

### 1. `backend/convex/routineExecution.ts`
- `processRoutines` (public action, no args) — finds due routines, creates research queries, schedules execution
- `listEnabled` (internalQuery) — returns all enabled routines with a schedule
- `createQueryForRoutine` (internalMutation) — inserts `researchQueries` row (no auth)
- `addMessageForRoutine` (internalMutation) — adds message to research query (no auth)
- `markRan` (internalMutation) — patches routine `lastRunAt` + `updatedAt`
- `executeRoutine` (internalAction) — adds "Analyzing..." message, POSTs to `SITE_URL/api/routines/execute`, saves answer, marks ran
- `isDue` helper — daily=24h, weekly=7d, monthly=30d gap check

### 2. `web/lib/inngest/functions/process-routines.ts`
Inngest cron function:
- `{ cron: "0 * * * *" }` (every hour)
- Creates `ConvexHttpClient`, calls `api.routineExecution.processRoutines`

### 3. `web/app/api/routines/execute/route.ts`
POST route (no auth):
- Receives `{ repoId, question }`
- Runs Daytona sandbox + Claude pipeline (reuses `sandbox-helpers.ts`)
- Returns `{ answer: string }`

### 4. `web/app/(main)/[repo]/analyse/saved-queries/SavedQueriesClient.tsx`
Client component:
- `useQuery(api.savedQueries.list, { repoId })` for list
- `useMutation` for create, update, remove
- List: title, truncated query text, created date, edit/delete/run actions
- Create/edit modal: title input + query textarea
- Delete confirmation modal
- "Run" button: creates researchQuery, adds user message, navigates to `/analyse/query/{id}`

### 5. `web/app/(main)/[repo]/analyse/routines/RoutinesClient.tsx`
Client component:
- `useQuery(api.routines.list, { repoId })` for list
- `useMutation` for create, update, remove
- List: title, description, schedule badge, enabled toggle, last run time
- Create/edit modal: title, query textarea, description textarea, schedule select
- Delete confirmation modal
- Inline enable/disable toggle

---

## Files to Modify

### 6. `web/app/(main)/[repo]/analyse/saved-queries/page.tsx`
Replace placeholder → `<SavedQueriesClient />`

### 7. `web/app/(main)/[repo]/analyse/routines/page.tsx`
Replace placeholder → `<RoutinesClient />`

### 8. `web/lib/inngest/index.ts`
Export `processRoutines`

### 9. `web/app/api/inngest/route.ts`
Add `processRoutines` to `functions` array

---

## Implementation Order
1. `backend/convex/routineExecution.ts`
2. `web/app/api/routines/execute/route.ts`
3. `web/lib/inngest/functions/process-routines.ts`
4. `web/lib/inngest/index.ts` + `web/app/api/inngest/route.ts`
5. `SavedQueriesClient.tsx` + update `page.tsx`
6. `RoutinesClient.tsx` + update `page.tsx`
7. `npx tsc` in `/web`

## Key Reference Files
- `backend/convex/routines.ts` — CRUD, data shape
- `backend/convex/savedQueries.ts` — CRUD
- `backend/convex/researchQueries.ts` — research query schema/mutations
- `backend/convex/agentExecution.ts` — pattern for action calling HTTP
- `web/app/(main)/[repo]/analyse/layout.tsx` — UI patterns, teal scheme
- `web/lib/inngest/functions/execute-research-query.ts` — sandbox logic to reuse
- `web/lib/inngest/sandbox-helpers.ts` — sandbox utilities

## Verification
- `npx tsc` in `/web`
- Saved queries: list, create, edit, delete, run
- Routines: list, create, edit, delete, toggle, schedule
- Cron: verify schedule math in `routineExecution.ts`
