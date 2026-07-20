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
 */
export function ensureEvaEnvInteractiveHookScript(): string {
  return [
    `HOOK='${EVA_ENV_SOURCE_CMD}'`,
    `echo "$HOOK" | sudo tee /etc/profile.d/eva-sandbox-env.sh >/dev/null`,
    `sudo chmod 644 /etc/profile.d/eva-sandbox-env.sh`,
    `MARKER='# eva-sandbox-env'`,
    `for rc in /home/eva/.bashrc /root/.bashrc "$HOME/.bashrc"; do`,
    `  mkdir -p "$(dirname "$rc")" 2>/dev/null || true`,
    `  touch "$rc" 2>/dev/null || continue`,
    `  grep -qF "$MARKER" "$rc" 2>/dev/null || printf '\\n%s\\n%s\\n' "$MARKER" "$HOOK" >> "$rc"`,
    `done`,
  ].join("; ");
}
