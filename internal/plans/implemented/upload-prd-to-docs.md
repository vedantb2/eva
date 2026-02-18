# Upload PRD to Docs Page

## Context

Users currently create docs manually (empty doc → interview to fill fields). They should be able to upload an existing PRD file (.md/.txt) and have it automatically parsed into the structured doc format (title, description, requirements, user flows) using Claude CLI in a Daytona sandbox with streaming activity feedback.

## Plan

### Step 1: Add `headerActions` prop to SidebarLayoutWrapper

**File:** `apps/web/lib/components/SidebarLayoutWrapper.tsx`

- Add optional `headerActions?: React.ReactNode` prop
- When provided, render it alongside (or instead of) the default `onAdd` "+" button
- This is backward-compatible — all 6 existing usages pass `onAdd` and won't be affected

### Step 2: Add upload button + file handling to DocsClient

**File:** `apps/web/app/(main)/[repo]/docs/DocsClient.tsx`

- Remove `onAdd` prop, use `headerActions` instead
- Render a DropdownMenu on a "+" button with two options: "New Document" and "Upload PRD"
- Add a hidden `<input type="file" accept=".md,.txt">` ref
- On file select:
  1. Read file content via `FileReader`
  2. Create a new doc (title = filename without extension, content = raw PRD text)
  3. Navigate to the new doc
  4. Send Inngest event `docs/prd-upload.parse` via `POST /api/inngest/send` with `{ docId, repoId, installationId, prdContent }`

### Step 3: Create Inngest function for PRD parsing

**File:** `apps/web/lib/inngest/functions/doc-prd-upload.ts` (NEW)

- Event name: `docs/prd-upload.parse`
- Receives: `docId`, `repoId`, `installationId`, `prdContent`, `clerkToken`
- Steps:
  1. **fetch-data**: Query Convex for doc + repo data
  2. **parse-prd**: Create/reuse Daytona sandbox (via `getOrCreateSandbox`), run Claude CLI with streaming
     - System prompt: instruct Claude to read the PRD content and the codebase, then output JSON with `{ description, requirements, userFlows }`
     - Reuse `GENERATE_PROMPT` pattern from `doc-interview.ts` (same output format)
     - Include PRD content directly in the prompt (uses `quote()` for shell escaping, same as existing pattern)
     - Stream activity steps via `api.streaming.set` (same as interview)
     - Tools: `["Read", "Glob", "Grep"]` (codebase access for context-aware parsing)
  3. **save-parsed**: Extract JSON from result via `extractJsonFromText`, update doc via `api.docs.update` with parsed fields, clear streaming via `api.streaming.clear`
- onFailure: clear streaming + log error

### Step 4: Register the new Inngest function

**Files:**

- `apps/web/lib/inngest/index.ts` — add export
- `apps/web/app/api/inngest/route.ts` — add to `functions` array

### Step 5: Add processing indicator to DocViewer

**File:** `apps/web/lib/components/docs/DocViewer.tsx`

- Subscribe to `useQuery(api.streaming.get, { entityId: doc._id })`
- When streaming data exists, show a banner/overlay at the top of the doc with:
  - "Processing PRD..." label with spinner
  - Activity steps rendered via `ActivitySteps` component (reuse from `packages/ui/src/ai-elements/activity-steps.tsx`)
- When streaming clears (returns null), the doc fields are already populated via Convex reactivity

## Key Files to Modify

1. `apps/web/lib/components/SidebarLayoutWrapper.tsx` — add `headerActions` prop
2. `apps/web/app/(main)/[repo]/docs/DocsClient.tsx` — dropdown + file upload
3. `apps/web/lib/inngest/functions/doc-prd-upload.ts` — NEW Inngest function
4. `apps/web/lib/inngest/index.ts` — export new function
5. `apps/web/app/api/inngest/route.ts` — register new function
6. `apps/web/lib/components/docs/DocViewer.tsx` — streaming indicator

## Reused Utilities

- `getOrCreateSandbox()` from `apps/web/lib/inngest/sandbox.ts`
- `runClaudeCLIStreaming()` from `apps/web/lib/inngest/sandbox.ts`
- `extractJsonFromText()` from `apps/web/lib/inngest/sandbox.ts`
- `getGitHubToken()` from `apps/web/lib/inngest/sandbox.ts`
- `WORKSPACE_DIR` from `apps/web/lib/inngest/sandbox.ts`
- `api.streaming.set/get/clear` from `packages/backend/convex/streaming.ts`
- `api.docs.create/update/updateDocSandbox` from `packages/backend/convex/docs.ts`
- `ActivitySteps` component from `packages/ui/src/ai-elements/activity-steps.tsx`
- `parseActivitySteps()` from `apps/web/lib/utils/parseActivitySteps.ts`
- `createConvex()` from `apps/web/lib/convex-auth.ts`

## Verification

1. Navigate to `/docs` page
2. Click "+" dropdown → "Upload PRD"
3. Select a `.md` file
4. Verify: new doc created with filename as title, raw content stored
5. Verify: streaming activity shows in DocViewer (spinner + activity steps)
6. Verify: after processing completes, description/requirements/userFlows fields are populated
7. Run `npx tsc` in `apps/web` for type checking
