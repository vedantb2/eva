/**
 * The one way script/file content reaches a sandbox.
 *
 * Deliberately a leaf module (types only, no runtime imports) so every delivery
 * path — including `swap.ts` and `attachments.ts`, which `helpers.ts` imports —
 * can route through it without forming an import cycle.
 */

import type { SandboxHandle } from "../_sandbox/provider";

/**
 * Linux caps a single `execve` argument at MAX_ARG_STRLEN — 128 KB, and not
 * tunable. Every sandbox command ships as one `bash -lc '<payload>'` argument,
 * so anything interpolated into a command shares that one budget.
 *
 * The preview proxy script crossed it when the vendored html2canvas bundle
 * (~200 KB) was piped through a heredoc: every launch died with "failed to
 * start process: fork/exec /usr/bin/bash: argument list too long", surfacing as
 * "preview proxy failed to start on port 3000" and naming no cause.
 *
 * This ceiling sits far under 128 KB on purpose. Content anywhere near the real
 * limit belongs in a file, not an argument; the margin leaves room for the shell
 * wrapper, the env preamble, and the rest of the command.
 */
export const MAX_INLINE_EXEC_CONTENT_BYTES = 8 * 1024;

/**
 * Delivers content into the sandbox filesystem.
 *
 * Built on `writeFile` (Vercel `writeFiles`), which has no argument-length
 * limit — the ~330 KB callback runner ships this way. Use this instead of
 * `cat > file <<'EOF'`, `echo <base64> | base64 -d > file`, or `printf` into a
 * file: those put the whole payload into one exec argument and fail hard once
 * it grows, usually long after whoever grew it has moved on.
 *
 * `executable` chmods in a separate, tiny exec — only the path is interpolated,
 * never the content.
 */
export async function writeSandboxFile(
  sandbox: SandboxHandle,
  path: string,
  content: string | Uint8Array,
  opts: { executable?: boolean } = {},
): Promise<void> {
  await sandbox.writeFile(path, content);
  if (opts.executable) {
    await sandbox.exec(`chmod +x ${JSON.stringify(path)}`, {
      timeoutSeconds: 10,
    });
  }
}
