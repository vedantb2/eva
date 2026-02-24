"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@conductor/backend";

export function EnsureUser({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const ensureUserExists = useMutation(api.auth.ensureUserExists);
  const [isEnsuring, setIsEnsuring] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setIsEnsuring(false);
      return;
    }

    ensureUserExists({})
      .then(() => {
        setIsEnsuring(false);
      })
      .catch((err) => {
        console.error("Failed to ensure user exists:", err);
        setIsEnsuring(false);
      });
  }, [isLoaded, isSignedIn, ensureUserExists]);

  if (!isLoaded || (isSignedIn && isEnsuring)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
