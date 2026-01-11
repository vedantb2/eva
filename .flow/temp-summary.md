- Added `projects` table with name, description, userId, createdAt fields and user index
- Added `tasks` table with projectId, title, description, status, order, timestamps and project indexes
- Status field uses union type for "todo", "in_progress", "done"

Why:
- Foundation for Kanban board data layer
- Follows existing schema patterns in the codebase

Verification:
- `npx convex codegen` passed without errors
