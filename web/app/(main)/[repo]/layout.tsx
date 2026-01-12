"use client";

import { use } from "react";
import { RepoProvider } from "@/lib/contexts/RepoContext";
import { RepoSwitcher } from "@/lib/components/repo/RepoSwitcher";

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
      <div className="mb-4 flex items-center">
        <RepoSwitcher />
      </div>
      {children}
    </RepoProvider>
  );
}
