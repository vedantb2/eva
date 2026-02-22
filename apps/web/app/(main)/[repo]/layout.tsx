"use client";

import { use } from "react";
import { RepoProvider } from "@/lib/contexts/RepoContext";
import { SpotlightSearch } from "@/lib/components/SpotlightSearch";
import { Sidebar } from "@/lib/components/Sidebar";
import { SetupBanner } from "@/lib/components/SetupBanner";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";

function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`relative flex h-screen flex-col overflow-hidden pt-14 transition-[padding] duration-300 lg:pt-0 ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}
    >
      <div className="relative flex h-full flex-col overflow-hidden bg-background/85 lg:m-3 lg:ml-0 lg:rounded-2xl lg:border lg:border-border/55 lg:bg-card/80 lg:shadow-sm lg:">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent"
        />
        <SetupBanner />
        <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
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
