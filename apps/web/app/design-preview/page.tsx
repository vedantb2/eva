"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, lazy } from "react";

const VariationA = lazy(() => import("./variations/variation-a"));
const VariationB = lazy(() => import("./variations/variation-b"));
const VariationC = lazy(() => import("./variations/variation-c"));

function DesignPreviewContent() {
  const searchParams = useSearchParams();
  const v = searchParams.get("v");

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      {v === "b" ? <VariationB /> : v === "c" ? <VariationC /> : <VariationA />}
    </Suspense>
  );
}

export default function DesignPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <DesignPreviewContent />
    </Suspense>
  );
}
