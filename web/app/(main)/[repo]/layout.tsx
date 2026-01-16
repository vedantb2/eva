"use client";

import { use } from "react";
import { RepoProvider } from "@/lib/contexts/RepoContext";
import { RepoSwitcherSidebar } from "@/lib/components/sidebar/RepoSwitcherSidebar";

export default function RepoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ repo: string }>;
}) {
  const { repo } = use(params);

  return (
    <RepoProvider repoSlug={repo}>
      <RepoSwitcherSidebar />
      <div className="lg:pl-14">{children}</div>
    </RepoProvider>
  );
}
