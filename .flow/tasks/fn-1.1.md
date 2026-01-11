# fn-1.1 Create Convex schema for projects and tasks

## Description

Add `projects` and `tasks` tables to the Convex schema in `backend/convex/schema.ts`.

**Projects table:**
- `_id` (auto)
- `name` (string)
- `description` (optional string)
- `userId` (string, from Clerk)
- `createdAt` (number, timestamp)

**Tasks table:**
- `_id` (auto)
- `projectId` (Id<"projects">)
- `title` (string)
- `description` (optional string)
- `status` (string: "todo" | "in_progress" | "done")
- `order` (number, for sorting within column)
- `createdAt` (number, timestamp)
- `updatedAt` (number, timestamp)

**Files to modify:**
- `backend/convex/schema.ts` - Add tables following existing patterns (see `users`, `lessons` tables)

**Reference:**
- Existing schema: `backend/convex/schema.ts:1-100`
## Acceptance
- [ ] `projects` table defined with name, description, userId, createdAt fields
- [ ] `tasks` table defined with projectId, title, description, status, order, timestamps
- [ ] Schema follows existing patterns in the file
- [ ] TypeScript types are inferred correctly (no explicit `any`)
## Done summary
- Added `projects` table with name, description, userId, createdAt fields and user index
- Added `tasks` table with projectId, title, description, status, order, timestamps and project indexes
- Status field uses union type for "todo", "in_progress", "done"

Why:
- Foundation for Kanban board data layer
- Follows existing schema patterns in the codebase

Verification:
- `npx convex codegen` passed without errors
## Evidence
- Commits: 2cb1b87edeb41d583ae3231fba911fc586d3ae05
- Tests: npx convex codegen
- PRs: