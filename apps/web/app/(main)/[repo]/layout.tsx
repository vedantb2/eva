"use client";

import { use } from "react";
import { RepoProvider } from "@/lib/contexts/RepoContext";
import { SpotlightSearch } from "@/lib/components/SpotlightSearch";
import { Sidebar } from "@/lib/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";

function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`relative h-screen flex flex-col overflow-hidden transition-[padding] duration-300 ${collapsed ? "lg:pl-16" : "lg:pl-72"}`}
    >
      <div className="h-full overflow-hidden bg-background lg:m-3 lg:ml-0 lg:rounded-2xl lg:border lg:border-border/70 lg:bg-card/75 lg:shadow-md lg:backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}

export default function RepoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ repo: string }>;
}) {
  const { repo } = use(params);

  return (
    <SidebarProvider>
      <RepoProvider repoSlug={repo}>
        <Sidebar />
        <MainContent>{children}</MainContent>
        <SpotlightSearch />
      </RepoProvider>
    </SidebarProvider>
  );
}
