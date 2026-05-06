"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Id } from "@conductor/backend";

interface FollowTarget {
  userId: Id<"users">;
  name: string;
}

interface FollowContextType {
  following: FollowTarget | null;
  startFollowing: (userId: Id<"users">, name: string) => void;
  stopFollowing: () => void;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const [following, setFollowing] = useState<FollowTarget | null>(null);

  const startFollowing = useCallback((userId: Id<"users">, name: string) => {
    setFollowing({ userId, name });
  }, []);

  const stopFollowing = useCallback(() => {
    setFollowing(null);
  }, []);

  const value = useMemo(
    () => ({ following, startFollowing, stopFollowing }),
    [following, startFollowing, stopFollowing],
  );

  return (
    <FollowContext.Provider value={value}>{children}</FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (context === undefined) {
    throw new Error("useFollow must be used within a FollowProvider");
  }
  return context;
}
