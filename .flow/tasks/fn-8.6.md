# fn-8.6: Refactor Plan Page - Extract plan list to client

## Goal
Convert `app/(main)/[repo]/plan/page.tsx` to server with client component.

## Current State
- Uses `useQuery` for plans
- Uses `useState` for isCreating (though not used for modal currently)
- Uses `useRepo` context
- Renders plan list with links

## Approach
Same pattern - thin server wrapper with client component.

### 1. Create `PlansClient.tsx` (client component)
```tsx
"use client"

export function PlansClient() {
  const { repo, fullName } = useRepo();
  const plans = useQuery(api.plans.list, { repoId: repo._id });
  const [isCreating, setIsCreating] = useState(false);
  // ... rest of logic
}
```

### 2. Update `page.tsx` (server component)
```tsx
import { PlansClient } from "./PlansClient"

export default function PlanPage() {
  return <PlansClient />;
}
```

## Files to modify
- `web/app/(main)/[repo]/plan/page.tsx` - Thin server wrapper
- `web/app/(main)/[repo]/plan/PlansClient.tsx` - Client component

## Acceptance Criteria
- [ ] Page renders correctly
- [ ] Plans list displays
- [ ] Links work
- [ ] New Plan button works
- [ ] No "use client" in page.tsx
- [ ] TypeScript compiles without errors
