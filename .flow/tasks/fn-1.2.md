# fn-1.2 Create Convex queries and mutations for projects/tasks

## Description

Create Convex queries and mutations for projects and tasks CRUD operations.

**Create files:**
- `backend/convex/projects.ts` - Project queries/mutations
- `backend/convex/tasks.ts` - Task queries/mutations

**Projects API:**
- `query list` - Get all projects for current user
- `query get` - Get single project by ID
- `mutation create` - Create new project
- `mutation update` - Update project name/description
- `mutation remove` - Delete project and all its tasks

**Tasks API:**
- `query listByProject` - Get all tasks for a project
- `query get` - Get single task by ID
- `mutation create` - Create new task (default status: "todo")
- `mutation update` - Update task title/description
- `mutation updateStatus` - Move task to different column
- `mutation updateOrder` - Reorder task within column
- `mutation remove` - Delete task

**Reference patterns:**
- Existing queries: `backend/convex/lessons.ts`
- Auth pattern: `backend/convex/users.ts` (using `ctx.auth.getUserIdentity()`)
## Acceptance
- [ ] `projects.ts` has list, get, create, update, remove functions
- [ ] `tasks.ts` has listByProject, get, create, update, updateStatus, updateOrder, remove functions
- [ ] All mutations validate user ownership before modifying data
- [ ] TypeScript compiles without errors
## Done summary
- Created `projects.ts` with list, get, create, update, remove functions
- Created `tasks.ts` with listByProject, get, create, update, updateStatus, updateOrder, remove functions
- All mutations validate user ownership via Clerk identity.subject

Why:
- Provides API layer for frontend to interact with Convex database
- Follows existing auth patterns from auth.ts

Verification:
- `npx convex codegen` passed without errors
## Evidence
- Commits: 548d5d12c9c6ef8209864fd813196644794b7809
- Tests: npx convex codegen
- PRs: