import { z } from "zod";

/**
 * One linked repo clone for a multi-repo session: a full checkout at
 * `<workspaceRoot>/<name>` alongside the primary repo at `WORK_DIR`. Set by
 * the Convex launcher (`EVA_LINKED_REPOS`, a JSON array) for multi-repo
 * sessions only.
 */
export type LinkedRepo = {
  owner: string;
  name: string;
  path: string;
  branchName: string;
  baseBranch: string;
};

const linkedRepoSchema = z.object({
  owner: z.string(),
  name: z.string(),
  path: z.string(),
  branchName: z.string(),
  baseBranch: z.string(),
});

const linkedReposSchema = z.array(linkedRepoSchema);

/**
 * Parses `EVA_LINKED_REPOS`, the JSON array of linked-repo descriptors the
 * Convex launcher sets for multi-repo sessions only. Kept as a pure function
 * (no `process.env` read inside) so it is unit-testable without env side
 * effects — `config.ts` is the only caller that reads the actual env var.
 *
 * A missing value, invalid JSON, or a payload that does not match the
 * expected shape all degrade to an empty array (ordinary single-repo
 * behavior) rather than throwing — a bad launcher value must not crash the
 * daemon. Invalid JSON or shape is logged once, here, at parse time.
 */
export function parseLinkedReposEnv(raw: string | undefined): LinkedRepo[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(
      "EVA_LINKED_REPOS: invalid JSON — ignoring, running single-repo",
    );
    return [];
  }
  const result = linkedReposSchema.safeParse(parsed);
  if (!result.success) {
    console.error(
      "EVA_LINKED_REPOS: unexpected shape — ignoring, running single-repo",
    );
    return [];
  }
  return result.data;
}

/**
 * Decides the agent harness's working directory for multi-repo sessions.
 *
 * `useRoot` is `EVA_LINKED_REPOS_CWD_ROOT=1`, an env-only fallback (no
 * rebuild needed) for harnesses whose manual smoke test shows they cannot
 * edit outside their configured cwd even when told about the extra
 * directories another way. Rooting cwd at the workspace puts every linked
 * repo, and the primary (via its `<primaryName> -> WORK_DIR` symlink), inside
 * it. Falls back to `workDir` whenever there is no workspace root
 * (single-repo sessions) or the flag is off.
 */
export function resolveAgentCwd(
  workDir: string,
  workspaceRoot: string | null,
  useRoot: boolean,
): string {
  return useRoot && workspaceRoot ? workspaceRoot : workDir;
}
