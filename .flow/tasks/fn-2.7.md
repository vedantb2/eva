# fn-2.7: Build enhanced Kanban board with columns and agent task cards

## Description

Create the enhanced board view with:

1. Board page at `/boards/[id]` with dynamic columns
2. Enhanced column component with settings
3. Agent task card with status badge
4. Drag-and-drop between columns (auto-triggers runs)

## Files to Create/Modify

- `web/app/(main)/boards/[id]/page.tsx` - board view page
- `web/lib/components/agent/AgentKanbanBoard.tsx` - main board component
- `web/lib/components/agent/AgentColumn.tsx` - column with header
- `web/lib/components/agent/AgentTaskCard.tsx` - task card with status
- `web/lib/components/agent/StatusBadge.tsx` - status indicator

## Patterns to Follow

Reference existing Kanban:
- `web/lib/components/kanban/KanbanBoard.tsx` for dnd-kit setup
- `web/lib/components/kanban/TaskCard.tsx` for card structure
- `web/lib/components/ui/StatusBadge.tsx` for badge styling

## Implementation Notes

- Use `useQuery(api.boards.getWithColumns)` for full board data
- Columns are dynamic (from API, not hardcoded)
- Status badge colors: idle=gray, queued=yellow, running=blue, completed=green, failed=red
- When dropping on isRunColumn, call `api.agentTasks.moveToColumn` which triggers run
- Disable dragging for tasks with status "queued" or "running"

## Acceptance Criteria

- [ ] Board page loads with dynamic columns
- [ ] Tasks display with status badges
- [ ] Drag-and-drop works between columns
- [ ] Dropping on "In Progress" column triggers agent run
- [ ] Running tasks cannot be dragged
- [ ] Column header shows task count
