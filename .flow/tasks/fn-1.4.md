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
TBD

## Evidence
- Commits:
- Tests:
- PRs:
