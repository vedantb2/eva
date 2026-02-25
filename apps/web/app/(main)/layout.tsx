"use client";

import { api } from "@conductor/backend";
import usePresence from "@convex-dev/presence/react";
import { useQuery } from "convex/react";
import type { Id } from "@conductor/backend";
import { usePathname } from "next/navigation";
import { TopNavBar } from "@/lib/components/TopNavBar";
import { ClientProvider } from "@/lib/components/ClientProvider";

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
  const pathname = usePathname();

  const showTopNavBar =
    pathname === "/home" ||
    pathname.startsWith("/teams") ||
    pathname.startsWith("/setup");

  return (
    <ClientProvider>
      <div className="relative min-h-screen bg-app-shell">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-0 h-56 bg-gradient-to-b from-background/90 via-background/45 to-transparent"
        />
        {showTopNavBar && <TopNavBar />}
        <div
          className={
            showTopNavBar
              ? "relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
              : "relative z-10"
          }
        >
          {children}
        </div>
        <PresenceHeartbeat />
      </div>
    </ClientProvider>
  );
}
