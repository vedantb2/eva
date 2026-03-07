"use client";

import { Sidebar } from "@/lib/components/Sidebar";
import { SearchProvider } from "@/lib/contexts/SearchContext";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";

function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`relative h-screen flex flex-col overflow-hidden pt-14 transition-[padding] duration-300 lg:pt-0 ${collapsed ? "lg:pl-16" : "lg:pl-80"}`}
    >
      <div className="h-full overflow-hidden bg-background lg:m-3 lg:ml-0 lg:rounded-2xl lg:border lg:border-border/70 lg:bg-card/75 lg:shadow-md lg:">
        {children}
      </div>
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
      <SearchProvider>
        <Sidebar />
        <MainContent>{children}</MainContent>
      </SearchProvider>
    </SidebarProvider>
  );
}
