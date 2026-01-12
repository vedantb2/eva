# fn-8.5: Refactor Quick Tasks Page - Extract task list to client

## Goal
Convert `app/(main)/[repo]/quick-tasks/page.tsx` to server with client component.

## Current State
- Uses `useQuery` for tasks
- Uses `useState` for modal
- Uses `useRepo` context
- Renders task list and QuickTaskModal

## Approach
Same pattern as features page - thin server wrapper with client component.

### 1. Create `QuickTasksClient.tsx` (client component)
```tsx
"use client"

export function QuickTasksClient() {
  const { repo } = useRepo();
  const tasks = useQuery(api.agentTasks.getActiveTasks, { repoId: repo._id });
  const [isCreating, setIsCreating] = useState(false);
  // ... rest of logic
}
```

### 2. Update `page.tsx` (server component)
```tsx
import { QuickTasksClient } from "./QuickTasksClient"

export default function QuickTasksPage() {
  return <QuickTasksClient />;
}
```

## Files to modify
- `web/app/(main)/[repo]/quick-tasks/page.tsx` - Thin server wrapper
- `web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx` - Client component

## Acceptance Criteria
- [ ] Page renders correctly
- [ ] Task list displays
- [ ] Create task modal works
- [ ] No "use client" in page.tsx
- [ ] TypeScript compiles without errors
