"use client";

import { useQuery } from "convex/react";
import { api } from "@conductor/backend";

export function useSetupStatus() {
  return useQuery(api.systemEnvVars.getSetupStatus);
}
