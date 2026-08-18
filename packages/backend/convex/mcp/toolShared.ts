import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";

// Leaf module shared by tools.ts and orchestratorTools.ts. Lives apart from
// tools.ts so the orchestrator registration does not close an import cycle
// (tools -> orchestratorTools -> tools), which would land in the "use node"
// action chunk and break the prod push.

export function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

export function textResult(data: Record<string, unknown> | Array<unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export interface McpCredentials {
  clerkUserId: string;
  scopedRepoId?: string;
  entityId?: string;
  entityKind?: "session" | "task" | "project";
  isOrchestrator?: boolean;
}

export interface RepoInfo {
  id: string;
  owner: string;
  name: string;
  rootDirectory: string | null;
  mcpRootPrompt: string | null;
}

/** Resolves the caller's Eva user id (creating the row on first contact). */
export async function mcpGetContext(
  ctx: ActionCtx,
  clerkUserId: string,
): Promise<{ deployKey: string; userId: string }> {
  return ctx.runAction(internal.mcp.nodeActions.getContext, { clerkUserId });
}

/** Lists every repo the user can reach (own + team). */
export async function mcpListUserRepos(
  ctx: ActionCtx,
  userId: string,
): Promise<RepoInfo[]> {
  return ctx.runAction(internal.mcp.nodeActions.listUserRepos, { userId });
}

/**
 * Picks one repo out of the user's repos by name, disambiguating monorepo apps
 * by `rootDirectory`. Pure so both the repo-scoped and orchestrator tools can
 * share it.
 */
export function matchRepoByName(
  repos: RepoInfo[],
  repoName: string,
  app: string | undefined,
): { repo: RepoInfo } | ReturnType<typeof errorResult> {
  const normalizedInput = repoName.toLowerCase();
  const normalizedApp = app?.toLowerCase();

  const nameMatches = repos.filter((r) => {
    const fullName = `${r.owner}/${r.name}`.toLowerCase();
    return (
      fullName === normalizedInput || r.name.toLowerCase() === normalizedInput
    );
  });

  let repo: RepoInfo | undefined;
  if (nameMatches.length === 0) {
    repo = undefined;
  } else if (nameMatches.length === 1) {
    repo = nameMatches[0];
  } else if (normalizedApp) {
    repo = nameMatches.find((r) => {
      if (!r.rootDirectory) return false;
      const rootDir = r.rootDirectory.toLowerCase();
      return rootDir === normalizedApp || rootDir.endsWith(`/${normalizedApp}`);
    });
    if (!repo) {
      const apps = nameMatches
        .map((r) => r.rootDirectory ?? "(root)")
        .join(", ");
      return errorResult(
        `Multiple apps found for "${repoName}" but none matched app "${app}". Available apps: ${apps}`,
      );
    }
  } else {
    const apps = nameMatches.map((r) => r.rootDirectory ?? "(root)").join(", ");
    return errorResult(
      `Multiple apps found for "${repoName}". Specify the "app" parameter to disambiguate. Available apps: ${apps}`,
    );
  }

  if (!repo) {
    const available = repos.map((r) => `${r.owner}/${r.name}`).join(", ");
    return errorResult(`Repo "${repoName}" not found. Your repos: ${available}`);
  }

  return { repo };
}
