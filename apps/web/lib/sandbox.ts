import { Daytona, type Sandbox } from "@daytonaio/sdk";
import { serverEnv } from "@/env/server";

const daytona = new Daytona({ apiKey: serverEnv.DAYTONA_API_KEY });

export const WORKSPACE_DIR = "/workspace/repo";

export async function getSandbox(sandboxId: string): Promise<Sandbox> {
  return daytona.get(sandboxId);
}

const DAYTONA_API_URL = "https://app.daytona.io/api";

async function getToolboxBaseUrl(sandboxId: string): Promise<string> {
  const response = await fetch(
    `${DAYTONA_API_URL}/sandbox/${sandboxId}/toolbox-proxy-url`,
    {
      headers: {
        Authorization: `Bearer ${serverEnv.DAYTONA_API_KEY}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to get toolbox URL: ${response.status}`);
  }
  const data: { url: string } = await response.json();
  return data.url;
}

export async function getPtyWebSocketUrl(
  sandbox: Sandbox,
  ptySessionId: string,
): Promise<string> {
  const [toolboxUrl, previewLink] = await Promise.all([
    getToolboxBaseUrl(sandbox.id),
    sandbox.getPreviewLink(1),
  ]);
  let baseUrl = toolboxUrl;
  if (!baseUrl.endsWith("/")) baseUrl += "/";
  baseUrl += sandbox.id;
  return `${baseUrl.replace(/^http/, "ws")}/process/pty/${ptySessionId}/connect?DAYTONA_SANDBOX_AUTH_KEY=${previewLink.token}`;
}
