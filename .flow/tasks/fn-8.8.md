# fn-8.8: Refactor Feature Detail Page - Extract task list to client

## Goal
Convert `app/(main)/[repo]/features/[featureId]/page.tsx` to server with client component.

## Current State
- Uses `use(params)` for featureId
- Uses `useQuery` for feature and tasks
- Uses `useRepo` context
- Renders feature details and task list

## Approach
Server component extracts featureId param, client component handles the rest.

### 1. Create `FeatureDetailClient.tsx` (client component)
```tsx
"use client"

interface FeatureDetailClientProps {
  featureId: string;
}

export function FeatureDetailClient({ featureId }: FeatureDetailClientProps) {
  const { fullName } = useRepo();
  const feature = useQuery(api.features.get, { id: featureId as Id<"features"> });
  const tasks = useQuery(api.agentTasks.listByFeature, 
    feature ? { featureId: feature._id } : "skip"
  );
  // ... rest of logic
}
```

### 2. Update `page.tsx` (server component)
```tsx
import { FeatureDetailClient } from "./FeatureDetailClient"

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ featureId: string }>;
}) {
  const { featureId } = await params;
  return <FeatureDetailClient featureId={featureId} />;
}
```

## Files to modify
- `web/app/(main)/[repo]/features/[featureId]/page.tsx` - Server with param extraction
- `web/app/(main)/[repo]/features/[featureId]/FeatureDetailClient.tsx` - Client component

## Acceptance Criteria
- [ ] Page renders correctly
- [ ] Feature details display
- [ ] Tasks list displays
- [ ] Back link works
- [ ] No "use client" in page.tsx
- [ ] TypeScript compiles without errors
