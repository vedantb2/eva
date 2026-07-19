/** Path for the sourced env file written into Vercel sandboxes. */
export const EVA_ENV_FILE = "/vercel/sandbox/.eva-env.sh";

/** Renders env vars as sourceable `export K='V'` lines (single-quote-escaped). */
export function renderEvaEnvFile(env: Record<string, string>): string {
  return (
    Object.entries(env)
      .map(([k, v]) => `export ${k}='${v.replace(/'/g, "'\\''")}'`)
      .join("\n") + "\n"
  );
}
