"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "conductor-backend";

export function EnsureUser({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const ensureUserExists = useMutation(api.auth.ensureUserExists);
  const hasEnsured = useRef(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && !hasEnsured.current) {
      hasEnsured.current = true;
      ensureUserExists({}).catch((err) => {
        console.error("Failed to ensure user exists:", err);
      });
    }
  }, [isLoaded, isSignedIn, ensureUserExists]);

  return <>{children}</>;
}
