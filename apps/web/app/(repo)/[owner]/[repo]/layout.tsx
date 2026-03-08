"use client";

import { use } from "react";
import { RepoProvider } from "@/lib/contexts/RepoContext";
import { SpotlightSearch } from "@/lib/components/SpotlightSearch";
import { QuickTaskHotkey } from "@/lib/components/quick-tasks/QuickTaskHotkey";
import { Sidebar } from "@/lib/components/Sidebar";
import { SetupBanner } from "@/lib/components/SetupBanner";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";
import { SearchProvider } from "@/lib/contexts/SearchContext";

function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`relative flex h-screen flex-col overflow-hidden pt-14 transition-[padding] duration-300 lg:pt-0 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}
    >
      <div className="relative flex h-full flex-col overflow-hidden bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent"
        />
        <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
          <SetupBanner />
          {children}
        </div>
      </div>
    </div>
  );
}

export default function RepoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = use(params);

  return (
    <SidebarProvider>
      <SearchProvider>
        <RepoProvider owner={owner} repoParam={repo}>
          <Sidebar />
          <MainContent>{children}</MainContent>
          <SpotlightSearch />
          <QuickTaskHotkey />
        </RepoProvider>
      </SearchProvider>
    </SidebarProvider>
  );
}
