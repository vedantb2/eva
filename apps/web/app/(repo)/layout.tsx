"use client";

import { ClientProvider } from "@/lib/components/ClientProvider";
import { NotificationToastStream } from "@/lib/components/NotificationToastStream";

export default function RepoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProvider>
      <div className="relative min-h-screen bg-app-shell">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-0 h-56 bg-gradient-to-b from-background/90 via-background/45 to-transparent"
        />
        <div className="relative z-10">{children}</div>
        <NotificationToastStream />
      </div>
    </ClientProvider>
  );
}
