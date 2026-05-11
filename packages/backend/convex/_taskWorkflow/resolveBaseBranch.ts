import type { Doc } from "../_generated/dataModel";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";

export function resolveTaskWorkflowBaseBranch(
  task: Pick<Doc<"agentTasks">, "baseBranch">,
  repo: Pick<Doc<"githubRepos">, "defaultBaseBranch"> | null,
): string {
  const fromTask = task.baseBranch?.trim();
  if (fromTask) return fromTask;
  const fromRepo = repo?.defaultBaseBranch?.trim();
  if (fromRepo) return fromRepo;
  return FALLBACK_GIT_BASE_BRANCH;
}
