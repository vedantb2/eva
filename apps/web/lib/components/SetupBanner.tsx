"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@conductor/ui";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";
import { useSetupStatus } from "@/lib/hooks/useSetupStatus";
import { useRepo } from "@/lib/contexts/RepoContext";

export function SetupBanner() {
  const status = useSetupStatus();
  const { repoSlug } = useRepo();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || status === undefined || status.isReady) return null;

  return (
    <div className="px-4 pt-4">
      <Alert variant="destructive" className="flex items-center gap-3">
        <IconAlertTriangle size={18} className="flex-shrink-0" />
        <AlertDescription className="flex-1">
          AI features are unavailable — no OAuth tokens configured.{" "}
          <Link
            href={`/${repoSlug}/admin/env-variables`}
            className="underline font-medium hover:opacity-80"
          >
            Configure in Admin &rarr; System Variables
          </Link>
        </AlertDescription>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded-md hover:bg-destructive/20"
        >
          <IconX size={14} />
        </button>
      </Alert>
    </div>
  );
}
