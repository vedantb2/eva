/** Path for the sourced env file written into Vercel sandboxes. */
export const EVA_ENV_FILE = "/vercel/sandbox/.eva-env.sh";

/** Shell snippet that loads sandbox env when the file exists. */
export const EVA_ENV_SOURCE_CMD = `[ -f ${EVA_ENV_FILE} ] && . ${EVA_ENV_FILE}`;

/** Renders env vars as sourceable `export K='V'` lines (single-quote-escaped). */
export function renderEvaEnvFile(env: Record<string, string>): string {
  return (
    Object.entries(env)
      .map(([k, v]) => `export ${k}='${v.replace(/'/g, "'\\''")}'`)
      .join("\n") + "\n"
  );
}

/**
 * `tmux new-session` command that starts an interactive bash with sandbox env
 * already loaded (so Console typing matches agent/`exec` and launch scripts).
 */
export function tmuxNewSessionWithEvaEnv(
  sessionName: string,
  cwd: string,
): string {
  // Single-quoted -c body: EVA_ENV_SOURCE_CMD has no quotes.
  return `tmux new-session -d -s ${sessionName} -c ${cwd} -- bash -c '${EVA_ENV_SOURCE_CMD}; exec bash -i'`;
}

/**
 * Installs login + interactive hooks so new bash shells source sandbox env.
 * Idempotent (marker-guarded for bashrc).
 *
 * Must stay valid when vercel exec runs `bash -lc "${SOURCE_ENV} ${cmd}"` —
 * never split `for …; do` across `;` joins (`do;` is a bash syntax error).
 */
export function ensureEvaEnvInteractiveHookScript(): string {
  const marker = "# eva-sandbox-env";
  return [
    `printf '%s\\n' '${EVA_ENV_SOURCE_CMD}' | sudo tee /etc/profile.d/eva-sandbox-env.sh >/dev/null`,
    `sudo chmod 644 /etc/profile.d/eva-sandbox-env.sh`,
    // Entire for-loop is one statement so join("; ") cannot produce `do;`.
    `for rc in /home/eva/.bashrc /root/.bashrc; do grep -qF '${marker}' "$rc" 2>/dev/null || printf '%s\\n' '' '${marker}' '${EVA_ENV_SOURCE_CMD}' >> "$rc" 2>/dev/null || true; done`,
  ].join("; ");
}
