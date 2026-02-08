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
      className={`h-screen flex flex-col overflow-hidden transition-all duration-200 ${collapsed ? "lg:pl-16" : "lg:pl-64"}`}
    >
      {children}
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
