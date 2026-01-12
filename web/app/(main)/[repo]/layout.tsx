"use client";

import { use } from "react";
import { RepoProvider } from "@/lib/contexts/RepoContext";

export default function RepoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ repo: string }>;
}) {
  const { repo } = use(params);

  return <RepoProvider repoSlug={repo}>{children}</RepoProvider>;
}
