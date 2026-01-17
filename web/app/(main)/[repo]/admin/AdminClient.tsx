"use client";

import { PageWrapper } from "@/lib/components/PageWrapper";
import { IconLayoutDashboard } from "@tabler/icons-react";

export function AdminClient() {
  return (
    <PageWrapper title="Admin Overview">
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-neutral-400">
        <IconLayoutDashboard size={48} className="mb-3" />
        <p>Admin dashboard coming soon</p>
      </div>
    </PageWrapper>
  );
}
