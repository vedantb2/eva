# fn-1.4 Build Kanban board page with columns

## Description

Build the Kanban board page at `web/app/(main)/projects/[id]/page.tsx`.

**Layout:**
- Page header with project name and back button
- Three columns: Todo, In Progress, Done
- Task cards displayed in each column sorted by `order`
- "Add Task" button at bottom of each column

**Components to create:**
- `web/app/(main)/projects/[id]/page.tsx` - Board page
- `web/lib/components/kanban/KanbanBoard.tsx` - Board container
- `web/lib/components/kanban/KanbanColumn.tsx` - Column component
- `web/lib/components/kanban/TaskCard.tsx` - Task card
- `web/lib/components/kanban/CreateTaskForm.tsx` - Inline task creation

**Reuse:**
- `Card`, `Button`, `Input` from `web/lib/components/ui/`
- `PageHeader` for navigation header
- `Container` for page wrapper

**Data:**
- Fetch project by ID, redirect to `/projects` if not found
- Subscribe to tasks via `useQuery` for real-time updates
## Acceptance
- [ ] Board page renders at `/projects/[id]`
- [ ] Shows three columns: Todo, In Progress, Done
- [ ] Tasks display in correct columns based on status
- [ ] Can add new task to any column
- [ ] Can edit task title/description
- [ ] Can delete task
- [ ] Real-time updates when data changes
## Done summary
- Created `projects/[id]/page.tsx` with project header, loading state, and board
- Created `KanbanBoard.tsx` organizing tasks into three columns by status
- Created `KanbanColumn.tsx` with task count badge and add task button
- Created `TaskCard.tsx` with inline edit mode and delete functionality
- Created `CreateTaskForm.tsx` for adding new tasks to columns

Why:
- Main Kanban board UI for managing project tasks
- Tasks organized by status (Todo, In Progress, Done)

Verification:
- TypeScript compiles without errors for new files
- Components follow existing codebase patterns
## Evidence
- Commits: e98186966e176e8c2db7550ae86318d5732fd1f3
- Tests: npx tsc --noEmit (new files only)
- PRs: