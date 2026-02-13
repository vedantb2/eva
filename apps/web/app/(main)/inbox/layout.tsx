"use client";

import { Sidebar } from "@/lib/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";

function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`h-screen flex flex-col overflow-hidden transition-all duration-150 bg-card lg:rounded-l-xl ${collapsed ? "lg:pl-16" : "lg:pl-64"}`}
    >
      {children}
    </div>
  );
}

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar />
      <MainContent>{children}</MainContent>
    </SidebarProvider>
  );
}
