import { useCallback } from "react";
import { useRepo } from "@/lib/contexts/RepoContext";

export function useGitHubToken() {
  const { installationId } = useRepo();

  const getToken = useCallback(async (): Promise<string> => {
    const response = await fetch("/api/github/installation-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installationId }),
    });

    if (!response.ok) {
      throw new Error("Failed to get GitHub token");
    }

    const { token } = await response.json();
    return token;
  }, [installationId]);

  return { getToken };
}
