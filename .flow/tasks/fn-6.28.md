# fn-6.28 Create FeatureKanbanBoard component for feature tasks

## Description

Create the FeatureKanbanBoard component for displaying feature tasks in a Kanban layout.

### Implementation

Adapt existing AgentKanbanBoard pattern with 6 columns:

```typescript
// web/lib/components/features/FeatureKanbanBoard.tsx
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

const COLUMNS = [
  { id: "archived", title: "Archived" },
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "code_review", title: "Code Review" },
  { id: "done", title: "Done" },
];

export function FeatureKanbanBoard({ featureId }) {
  const tasks = useQuery(api.agentTasks.byFeature, { featureId });
  const moveTask = useMutation(api.agentTasks.updateStatus);
  
  // Group tasks by status
  // Handle drag and drop
  // Check dependencies before allowing status changes
}
```

### Key Points
- Use dnd-kit like existing AgentKanbanBoard
- 6 columns for the 6 task states
- Check dependencies before allowing drag to in_progress
- Show blocked indicator on tasks with unmet dependencies

### Files to Create
- `web/lib/components/features/FeatureKanbanBoard.tsx`
- `web/lib/components/features/FeatureColumn.tsx`
## Acceptance
- [ ] TBD

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
