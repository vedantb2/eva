"use node";

import type { Sandbox } from "@daytonaio/sdk";
import { LEGACY_WORKSPACE_DIR, WORKSPACE_DIR } from "../_daytona/helpers";

const DAYTONA_API_URL = "https://app.daytona.io/api";

const PTY_WORKSPACE_CANDIDATES = [WORKSPACE_DIR, LEGACY_WORKSPACE_DIR];

/** Creates a PTY session in the sandbox, trying workspace directory candidates in order. */
export async function createPtyInWorkspace(
  sandbox: Sandbox,
  ptyId: string,
  cols: number,
  rows: number,
) {
  for (const cwd of PTY_WORKSPACE_CANDIDATES) {
    try {
      return await sandbox.process.createPty({
        id: ptyId,
        cols,
        rows,
        cwd,
        envs: { TERM: "xterm-256color" },
        onData: () => {},
      });
    } catch (error) {
      if (cwd === LEGACY_WORKSPACE_DIR) {
        throw error;
      }
    }
  }
  throw new Error("Failed to create PTY");
}

/** Ensures a PTY session exists in the sandbox; creates one if missing and returns whether it's new. */
export async function ensurePtySessionReady(
  sandbox: Sandbox,
  ptyId: string,
  cols: number,
  rows: number,
): Promise<{ isNewPty: boolean }> {
  try {
    await sandbox.process.resizePtySession(ptyId, cols, rows);
    return { isNewPty: false };
  } catch {
    try {
      const handle = await createPtyInWorkspace(sandbox, ptyId, cols, rows);
      await handle.disconnect();
      return { isNewPty: true };
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errMsg.includes("already exists")) {
        await sandbox.process.resizePtySession(ptyId, cols, rows);
        return { isNewPty: false };
      }
      throw e;
    }
  }
}

/** Fetches the toolbox proxy base URL for a Daytona sandbox. */
export async function getToolboxBaseUrl(
  sandboxId: string,
  apiKey: string,
): Promise<string> {
  const response = await fetch(
    `${DAYTONA_API_URL}/sandbox/${sandboxId}/toolbox-proxy-url`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to get toolbox URL: ${response.status}`);
  }
  const data: { url: string } = await response.json();
  return data.url;
}
