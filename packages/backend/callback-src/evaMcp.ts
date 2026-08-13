export type HttpMcpServerConfig = {
  type: "http";
  url: string;
  headers: Record<string, string>;
};

export type HttpMcpServers = Record<string, HttpMcpServerConfig>;

type EvaMcpEnvironment = {
  EVA_MCP_AUTH?: string;
  EVA_MCP_BASE_URL?: string;
};

export function buildEvaMcpServers({
  auth,
  baseUrl,
}: {
  auth?: string;
  baseUrl?: string;
}): HttpMcpServers {
  if (!auth || !baseUrl) return {};
  return {
    eva: {
      type: "http",
      url: `${baseUrl}/mcp`,
      headers: { Authorization: `Bearer ${auth}` },
    },
  };
}

export function consumeEvaMcpEnvironment(
  env: EvaMcpEnvironment,
): HttpMcpServers {
  const servers = buildEvaMcpServers({
    auth: env.EVA_MCP_AUTH,
    baseUrl: env.EVA_MCP_BASE_URL,
  });
  // The callback keeps the MCP descriptor in memory. Removing the transport
  // variables stops agent tools and unrelated child processes inheriting the
  // bearer token through their environment.
  delete env.EVA_MCP_AUTH;
  delete env.EVA_MCP_BASE_URL;
  return servers;
}

export const evaMcpServers = consumeEvaMcpEnvironment(process.env);
export const hasEvaMcpConfig = Object.keys(evaMcpServers).length > 0;
