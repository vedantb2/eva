"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Spinner } from "@conductor/ui";
import { AutomationClient } from "./AutomationClient";

export default function AutomationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const automation = useQuery(api.automations.get, {
    id: id as Id<"automations">,
  });

  if (automation === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (automation === null) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <p>Automation not found</p>
      </div>
    );
  }

  return <AutomationClient automation={automation} />;
}
