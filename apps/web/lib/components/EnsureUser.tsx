"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@conductor/backend";

export function EnsureUser({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const ensureUserExists = useMutation(api.auth.ensureUserExists);

  useEffect(() => {
    if (isSignedIn) {
      ensureUserExists({}).catch(console.error);
    }
  }, [isSignedIn, ensureUserExists]);

  return children;
}
