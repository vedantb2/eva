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
    <div className="relative min-h-screen bg-app-shell">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-56 bg-gradient-to-b from-background/90 via-background/45 to-transparent"
      />
      <div className="relative z-10">{children}</div>
      <PresenceHeartbeat />
    </div>
  );
}
