"use client";

import { use } from "react";
import { RepoProvider } from "@/lib/contexts/RepoContext";
import { ReposSidebar } from "@/lib/components/sidebar/ReposSidebar";

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
        <ReposSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </RepoProvider>
  );
}
