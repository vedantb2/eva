"use client";
import { lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const variations: Record<
  string,
  React.LazyExoticComponent<React.ComponentType>
> = {
  a: lazy(() => import("./variations/variation-a")),
  b: lazy(() => import("./variations/variation-b")),
  c: lazy(() => import("./variations/variation-c")),
};

export default function DesignPreview() {
  const params = useSearchParams();
  const v = params.get("v") || "a";
  const Component = variations[v] || variations.a;
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}
        >
          <p>Loading...</p>
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}
