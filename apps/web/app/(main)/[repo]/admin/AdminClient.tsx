"use client";

import { PageWrapper } from "@/lib/components/PageWrapper";
import { IconLayoutDashboard } from "@tabler/icons-react";

export function AdminClient() {
  return (
    <PageWrapper title="Admin Overview" fillHeight>
      <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
        <IconLayoutDashboard size={48} className="mb-3" />
        <p>Admin dashboard coming soon</p>
      </div>
    </PageWrapper>
  );
}
