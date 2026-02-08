"use client";

import { IconFileText } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";

export default function DocsPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <EmptyState icon={IconFileText} title="Select a document to view" />
    </div>
  );
}
