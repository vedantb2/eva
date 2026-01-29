"use client";

import { api } from "@/api";
import { Sidebar } from "@/lib/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";
import usePresence from "@convex-dev/presence/react";
import { useQuery } from "convex/react";
import { GenericId as Id } from "convex/values";

function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-all duration-200 ${collapsed ? "lg:pl-16" : "lg:pl-64"}`}>
      {children}
    </div>
  );
}

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
    <SidebarProvider>
      <div className="min-h-screen bg-white dark:bg-neutral-900">
        <Sidebar />
        <MainContent>{children}</MainContent>
        <PresenceHeartbeat />
      </div>
    </SidebarProvider>
  );
}
