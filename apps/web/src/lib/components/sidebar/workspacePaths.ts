/**
 * Global routes that render the workspace sidebar (the second sidebar column
 * listing Codebases / Teams / Artifacts).
 *
 * Shared by `Sidebar` (which renders the panel) and the `/_global` layout
 * (which reserves the matching left padding), so the two cannot drift.
 */
const WORKSPACE_ROOTS = ["/home", "/teams", "/artifacts"] as const;

/** Whether `pathname` is one of the workspace routes or a child of one. */
export function isWorkspacePath(pathname: string): boolean {
  return WORKSPACE_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}
