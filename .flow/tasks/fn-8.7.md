# fn-8.7: Refactor Plan Detail Page - Extract conversation to client

## Goal
Convert `app/(main)/[repo]/plan/[planId]/page.tsx` to server with client component.

## Current State
- Uses `useQuery` for plan
- Uses `useState` for generatedSpec and showFinalizationModal
- Uses `useParams` for planId
- Uses `useRepo` context
- Renders PlanConversation and PlanFinalizationModal

## Approach
Server component extracts planId param, client component handles the rest.

### 1. Create `PlanDetailClient.tsx` (client component)
```tsx
"use client"

interface PlanDetailClientProps {
  planId: string;
}

export function PlanDetailClient({ planId }: PlanDetailClientProps) {
  const { repo, fullName } = useRepo();
  const plan = useQuery(api.plans.get, { id: planId as Id<"plans"> });
  const [generatedSpec, setGeneratedSpec] = useState<string | null>(null);
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);
  // ... rest of logic
}
```

### 2. Update `page.tsx` (server component)
```tsx
import { PlanDetailClient } from "./PlanDetailClient"

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  return <PlanDetailClient planId={planId} />;
}
```

## Files to modify
- `web/app/(main)/[repo]/plan/[planId]/page.tsx` - Server with param extraction
- `web/app/(main)/[repo]/plan/[planId]/PlanDetailClient.tsx` - Client component

## Acceptance Criteria
- [ ] Page renders correctly
- [ ] Plan loads and displays
- [ ] Conversation works
- [ ] Finalization modal works
- [ ] No "use client" in page.tsx
- [ ] TypeScript compiles without errors
