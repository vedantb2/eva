# fn-8.9: Make PageHeader a Server Component

## Goal
Convert `lib/components/PageHeader.tsx` to a server component by extracting interactive back button.

## Current State
```tsx
import { useRouter, usePathname } from "next/navigation";

export function PageHeader({ title, headerRight, showBack = false, onBack }: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Uses router.back() and pathname check
}
```

## Problem
- Uses `useRouter` for back navigation
- Uses `usePathname` for conditional rendering

## Approach
Create a small BackButton client component, keep rest as server.

### 1. Create `BackButton.tsx` (client component)
```tsx
"use client"

import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";

interface BackButtonProps {
  onBack?: () => void;
}

export function BackButton({ onBack }: BackButtonProps) {
  const router = useRouter();
  
  return (
    <button
      onClick={onBack ?? (() => router.back())}
      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <IconArrowLeft size={18} className="text-neutral-600 dark:text-neutral-400" />
    </button>
  );
}
```

### 2. Update `PageHeader.tsx` (server component)
```tsx
import { BackButton } from "./BackButton";

interface PageHeaderProps {
  title?: string;
  headerRight?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function PageHeader({ title, headerRight, showBack = false, onBack }: PageHeaderProps) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      {showBack && <BackButton onBack={onBack} />}
      {title && <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h1>}
      {headerRight && <div className="ml-auto flex items-center gap-2">{headerRight}</div>}
    </div>
  );
}
```

Note: The pathname check for hiding header on certain routes can be removed or handled differently (e.g., don't render PageHeader on those routes).

## Files to modify
- `web/lib/components/PageHeader.tsx` - Convert to server
- `web/lib/components/BackButton.tsx` - New client component

## Acceptance Criteria
- [ ] Back button works
- [ ] Header renders correctly
- [ ] No "use client" in PageHeader.tsx (if applicable, or minimal)
- [ ] TypeScript compiles without errors
