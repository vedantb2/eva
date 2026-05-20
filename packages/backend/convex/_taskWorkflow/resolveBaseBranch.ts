import type { DatabaseReader } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";

type RepoBaseBranchSource = Pick<
  Doc<"githubRepos">,
  "defaultBaseBranch"
> | null;
type ProjectBaseBranchSource =
  | Pick<Doc<"projects">, "baseBranch">
  | null
  | undefined;

export function resolveTaskWorkflowBaseBranch(
  task: Pick<Doc<"agentTasks">, "baseBranch" | "projectId">,
  repo: RepoBaseBranchSource,
  project?: ProjectBaseBranchSource,
): string {
  if (task.projectId) {
    const fromProject = project?.baseBranch?.trim();
    if (fromProject) return fromProject;
  }
  const fromTask = task.baseBranch?.trim();
  if (fromTask) return fromTask;
  const fromRepo = repo?.defaultBaseBranch?.trim();
  if (fromRepo) return fromRepo;
  return FALLBACK_GIT_BASE_BRANCH;
}

export async function resolveTaskWorkflowBaseBranchForTask(
  db: DatabaseReader,
  task: Pick<Doc<"agentTasks">, "baseBranch" | "projectId">,
  repo: RepoBaseBranchSource,
): Promise<string> {
  if (task.projectId) {
    const project = await db.get(task.projectId);
    const fromProject = project?.baseBranch?.trim();
    if (fromProject) return fromProject;
  }
  const fromTask = task.baseBranch?.trim();
  if (fromTask) return fromTask;
  const fromRepo = repo?.defaultBaseBranch?.trim();
  if (fromRepo) return fromRepo;
  return FALLBACK_GIT_BASE_BRANCH;
}

export function resolveNewTaskBaseBranch(
  explicitBaseBranch: string | undefined,
  repo: RepoBaseBranchSource,
  project?: ProjectBaseBranchSource,
): string {
  const explicit = explicitBaseBranch?.trim();
  if (explicit) return explicit;
  const fromProject = project?.baseBranch?.trim();
  if (fromProject) return fromProject;
  const fromRepo = repo?.defaultBaseBranch?.trim();
  if (fromRepo) return fromRepo;
  return FALLBACK_GIT_BASE_BRANCH;
}
