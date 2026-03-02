import { Suspense } from "react";
import { AgentCallback } from "./AgentCallback";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">Signing in...</p>
        </div>
      }
    >
      <AgentCallback />
    </Suspense>
  );
}
