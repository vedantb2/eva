"use client";

/**
 * App skeleton shown during auth loading.
 * Provides immediate visual feedback and improves LCP by rendering
 * a layout shell before auth completes.
 */
export function AppSkeleton() {
  return (
    <div className="min-h-screen w-full bg-background flex">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex w-64 flex-col bg-sidebar p-4 gap-4">
        <div className="h-8 w-32 bg-muted/50 rounded-lg animate-pulse" />
        <div className="flex-1 flex flex-col gap-2 mt-4">
          <div className="h-10 w-full bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-10 w-full bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-10 w-full bg-muted/30 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="h-14 flex items-center justify-between px-4 gap-4">
          <div className="h-8 w-48 bg-muted/40 rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-muted/40 rounded-full animate-pulse" />
        </div>

        {/* Content area skeleton */}
        <div className="flex-1 p-6 flex flex-col gap-4">
          <div className="h-6 w-64 bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-96 bg-muted/20 rounded animate-pulse" />
          <div className="flex-1 bg-muted/10 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
