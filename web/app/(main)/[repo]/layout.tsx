"use client";

import { use } from "react";
import { RepoProvider } from "@/lib/contexts/RepoContext";
import { RepoSidebar } from "@/lib/components/sidebar/RepoSidebar";

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
      <div className="flex h-full">
        <RepoSidebar currentRepoSlug={repo} />
        <div className="flex-1">{children}</div>
      </div>
    </RepoProvider>
  );
}
