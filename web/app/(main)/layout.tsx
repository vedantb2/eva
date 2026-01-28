"use client";

import { Sidebar } from "@/lib/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";

function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-all duration-200 ${collapsed ? "lg:pl-16" : "lg:pl-64"}`}>
      {children}
    </div>
  );
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
      </div>
    </SidebarProvider>
  );
}
