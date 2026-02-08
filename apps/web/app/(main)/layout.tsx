"use client";

import { api } from "@conductor/backend";
import usePresence from "@convex-dev/presence/react";
import { useQuery } from "convex/react";
import type { Id } from "@conductor/backend";

function PresenceHeartbeat() {
  const userId = useQuery(api.auth.me);
  if (!userId) return null;
  return <PresenceInner userId={userId} />;
}

function PresenceInner({ userId }: { userId: Id<"users"> }) {
  usePresence(api.presence, "platform", userId);
  return null;
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
      <PresenceHeartbeat />
    </div>
  );
}
