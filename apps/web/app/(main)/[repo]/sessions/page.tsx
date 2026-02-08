"use client";

import { IconTerminal2 } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";

export default function SessionsPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <EmptyState
        icon={IconTerminal2}
        title="Select a session to view the conversation"
      />
    </div>
  );
}
