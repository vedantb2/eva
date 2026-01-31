# Saved Queries + Routines UI & Inngest Cron Scheduling

## Overview
Wire up the saved queries and routines pages (currently "coming soon" placeholders), and add an Inngest cron function that triggers routine execution via Convex.

## Architecture

```
Inngest cron (hourly)
  → calls Convex action (secret-validated)
    → finds due routines (internal query)
    → creates research query + user message (internal mutations)
    → schedules executeRoutine (ctx.scheduler)
      → calls /api/routines/execute (sandbox + Claude)
      → saves answer (internal mutation)
      → updates lastRunAt (internal mutation)
```

- **Schedule format**: `"daily"` | `"weekly"` | `"monthly"` (dropdown in UI)
- **Auth**: Convex internal mutations bypass Clerk auth. The API route uses a shared secret.

---

## Files to Create

### 1. `backend/convex/routineExecution.ts`
Public action + internal helpers:
- `processRoutines` (action) — validates secret arg, finds due routines via internal query, creates a research query per routine (internal mutation), adds user message (internal mutation), schedules `executeRoutine` via `ctx.scheduler.runAfter(0, ...)`
- `listEnabled` (internalQuery) — returns all enabled routines with a schedule
- `createQueryForRoutine` (internalMutation) — inserts `researchQueries` row without auth check
- `addMessageForRoutine` (internalMutation) — adds message to research query without auth check
- `markRan` (internalMutation) — patches `lastRunAt` + `updatedAt`
- `executeRoutine` (internalAction) — adds "Analyzing..." message, POSTs to `SITE_URL/api/routines/execute` with `{ repoId, question, secret }`, gets answer back, saves as assistant message, marks routine as ran
- `isDue` helper — compares `lastRunAt` + interval (daily=24h, weekly=7d, monthly=30d) against `Date.now()`

### 2. `web/lib/inngest/functions/process-routines.ts`
Inngest cron function:
- Runs every hour via `{ cron: "0 * * * *" }`
- Creates `ConvexHttpClient` (no auth), calls `api.routineExecution.processRoutines` with `{ secret: serverEnv.ROUTINE_SECRET }`

### 3. `web/app/api/routines/execute/route.ts`
POST route:
- Validates `x-routine-secret` header
- Runs Daytona sandbox + Claude pipeline (same logic as `execute-research-query.ts` "generate-answer" step — imports from `sandbox-helpers.ts`)
- Returns `{ answer: string }`

### 4. `web/app/(main)/[repo]/analyse/saved-queries/SavedQueriesClient.tsx`
Client component:
- `useQuery(api.savedQueries.list, { repoId })` for list
- `useMutation` for create, update, remove
- List view: title, truncated query text, created date, edit/delete/run actions
- Create/edit modal: title input + query textarea (HeroUI Modal pattern from `layout.tsx`)
- Delete confirmation modal
- "Run" button: creates a researchQuery via `api.researchQueries.create`, adds user message via `api.researchQueries.addMessage`, navigates to `/analyse/query/{id}`

### 5. `web/app/(main)/[repo]/analyse/routines/RoutinesClient.tsx`
Client component:
- `useQuery(api.routines.list, { repoId })` for list
- `useMutation` for create, update, remove
- List view: title, description, schedule badge (`Chip`), enabled toggle (`Switch`), last run time
- Create/edit modal: title input, query textarea, description textarea, schedule select (daily/weekly/monthly)
- Delete confirmation modal
- Inline enable/disable toggle calls `update` with `{ id, enabled: !routine.enabled }`

---

## Files to Modify

### 6. `web/app/(main)/[repo]/analyse/saved-queries/page.tsx`
Replace placeholder with `<SavedQueriesClient />`.

### 7. `web/app/(main)/[repo]/analyse/routines/page.tsx`
Replace placeholder with `<RoutinesClient />`.

### 8. `web/env/server.ts`
Add `ROUTINE_SECRET: z.string().min(1)`.

### 9. `web/lib/inngest/index.ts`
Add export for `processRoutines`.

### 10. `web/app/api/inngest/route.ts`
Add `processRoutines` to the `functions` array.

---

## Implementation Order
1. `backend/convex/routineExecution.ts` (internal queries/mutations/actions)
2. `web/env/server.ts` (add ROUTINE_SECRET)
3. `web/app/api/routines/execute/route.ts` (sandbox execution endpoint)
4. `web/lib/inngest/functions/process-routines.ts` (cron function)
5. `web/lib/inngest/index.ts` + `web/app/api/inngest/route.ts` (register function)
6. `SavedQueriesClient.tsx` + update `page.tsx`
7. `RoutinesClient.tsx` + update `page.tsx`
8. `npx tsc` in `/web`

## Key Reference Files
- `backend/convex/routines.ts` — existing CRUD, data shape
- `backend/convex/savedQueries.ts` — existing CRUD
- `backend/convex/researchQueries.ts` — research query schema and mutations
- `backend/convex/agentExecution.ts` — pattern for Convex action calling HTTP endpoint
- `web/app/(main)/[repo]/analyse/layout.tsx` — UI modal/list patterns, teal color scheme
- `web/lib/inngest/functions/execute-research-query.ts` — sandbox execution logic to reuse
- `web/lib/inngest/sandbox-helpers.ts` — sandbox utility functions

## Verification
- `npx tsc` in `/web` for type checking
- Saved queries: list, create, edit, delete, run (creates research query + navigates)
- Routines: list, create, edit, delete, toggle enabled, schedule selection
- Cron: verify `routineExecution.ts` schedule math logic
